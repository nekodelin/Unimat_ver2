import { buildWsUrl, debugLog, envConfig } from '../config/env'
import type { ScenarioId } from '../types/app'
import { mapBackendStateToUiState, createEmptyUiSnapshot } from './backendStateAdapter'
import { fetchMqttHealthRaw, fetchSystemStateRaw } from './api'
import type { DataTransport, SnapshotListener } from './transport'
import { WsClient } from './wsClient'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function hasStateData(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  const raw = isRecord(value.raw) ? value.raw : null
  const hasRawState =
    raw !== null &&
    (typeof raw.in === 'number' ||
      typeof raw.inversed === 'number' ||
      typeof raw.out === 'number' ||
      typeof raw.other === 'number')

  return Boolean(
    hasRawState ||
      value.channels ||
      value.decodedChannels ||
      value.zones ||
      value.modules ||
      value.journal ||
      value.summary ||
      value.actions ||
      typeof value.faultCount === 'number' ||
      typeof value.warningCount === 'number' ||
      typeof value.normalCount === 'number',
  )
}

function extractStatePayload(message: unknown): unknown {
  if (!isRecord(message)) {
    return message
  }

  const type = typeof message.type === 'string' ? message.type.toLowerCase() : ''
  if (type === 'state_update' || type === 'state' || type === 'snapshot') {
    return message.payload ?? message.state ?? message.data ?? message
  }

  if (hasStateData(message)) {
    return message
  }

  if (isRecord(message.payload) && hasStateData(message.payload)) {
    return message.payload
  }

  return message
}

class BackendTransport implements DataTransport {
  private listeners = new Set<SnapshotListener>()
  private wsClient = new WsClient()
  private started = false
  private wsConnected = false
  private pollingTimer: number | null = null
  private latestSnapshot = createEmptyUiSnapshot('one-fault', 'offline')
  private scenarioId: ScenarioId = 'one-fault'

  connect(): void {
    if (this.started) {
      return
    }

    this.started = true
    void this.bootstrap()
  }

  disconnect(): void {
    if (!this.started) {
      return
    }

    this.started = false
    this.wsConnected = false
    this.wsClient.disconnect()
    this.stopPolling()
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener)
    listener(this.latestSnapshot)

    return () => {
      this.listeners.delete(listener)
    }
  }

  setScenario(scenarioId: ScenarioId): void {
    this.scenarioId = scenarioId
  }

  getScenario(): ScenarioId {
    return this.scenarioId
  }

  private async bootstrap(): Promise<void> {
    this.updateConnection('reconnecting', null)

    try {
      const rawState = await fetchSystemStateRaw()
      const snapshot = mapBackendStateToUiState(rawState, {
        scenarioId: this.scenarioId,
        connectionState: 'reconnecting',
        previousSnapshot: this.latestSnapshot,
      })

      this.publish(snapshot)
    } catch (error) {
      const message = this.toErrorMessage(error)
      debugLog('Initial /api/state failed', error)
      this.publish(createEmptyUiSnapshot(this.scenarioId, 'offline', message))
    }

    if (envConfig.debugApi) {
      try {
        const health = await fetchMqttHealthRaw()
        debugLog('/api/health/mqtt', health)
      } catch (error) {
        debugLog('/api/health/mqtt failed', error)
      }
    }

    this.connectWebSocket()
    this.startPolling()
  }

  private connectWebSocket(): void {
    this.wsClient.connect(buildWsUrl('/state'), this.handleWsPayload, {
      reconnectDelayMs: envConfig.wsReconnectDelayMs,
      onOpen: () => {
        this.wsConnected = true
        this.updateConnection('connected', null)
        this.stopPolling()
      },
      onClose: () => {
        this.wsConnected = false
        this.updateConnection('reconnecting', this.latestSnapshot.error)
        this.startPolling()
      },
      onError: (error) => {
        this.wsConnected = false
        const message = this.toErrorMessage(error)
        this.updateConnection('reconnecting', message)
        debugLog('WS transport error', error)
        this.startPolling()
      },
    })
  }

  private handleWsPayload = (payload: unknown): void => {
    const statePayload = extractStatePayload(payload)

    if (!hasStateData(statePayload)) {
      debugLog('WS payload ignored', payload)
      return
    }

    try {
      const snapshot = mapBackendStateToUiState(statePayload, {
        scenarioId: this.scenarioId,
        connectionState: 'connected',
        error: null,
        previousSnapshot: this.latestSnapshot,
      })

      this.publish(snapshot)
    } catch (error) {
      debugLog('WS payload adaptation failed', error)
    }
  }

  private startPolling(): void {
    if (!this.started || this.pollingTimer !== null || this.wsConnected) {
      return
    }

    this.pollingTimer = window.setInterval(() => {
      if (this.wsConnected) {
        this.stopPolling()
        return
      }

      void this.pollOnce()
    }, envConfig.pollFallbackMs)

    void this.pollOnce()
  }

  private stopPolling(): void {
    if (this.pollingTimer !== null) {
      window.clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  private async pollOnce(): Promise<void> {
    if (!this.started) {
      return
    }

    try {
      const rawState = await fetchSystemStateRaw()
      const snapshot = mapBackendStateToUiState(rawState, {
        scenarioId: this.scenarioId,
        connectionState: this.wsConnected ? 'connected' : 'reconnecting',
        error: null,
        previousSnapshot: this.latestSnapshot,
      })
      this.publish(snapshot)
    } catch (error) {
      const message = this.toErrorMessage(error)
      this.updateConnection('offline', message)
      debugLog('Polling /api/state failed', error)
    }
  }

  private updateConnection(connectionState: 'connected' | 'reconnecting' | 'offline', error: string | null): void {
    this.latestSnapshot = {
      ...this.latestSnapshot,
      connectionState,
      error,
    }

    this.emit()
  }

  private publish(snapshot: ReturnType<typeof mapBackendStateToUiState>): void {
    this.latestSnapshot = snapshot
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.latestSnapshot))
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }

    return 'Backend unavailable'
  }
}

export const backendTransport = new BackendTransport()

