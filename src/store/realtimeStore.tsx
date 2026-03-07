import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from 'react'
import { channelMappings, zoneMappings } from '@/config/mappings'
import { createDemoSnapshot } from '@/data/demoState'
import { fetchConfig, fetchInitialState, fetchJournal } from '@/services/api'
import { connectRealtimeWs } from '@/services/ws'
import { RealtimeContext, type RealtimeContextValue } from './realtimeContext'
import type {
  ChannelEntity,
  ChannelStatus,
  JournalEntry,
  ModuleEntity,
  RealtimeConnectionStatus,
  RealtimeState,
  Severity,
  SnapshotSummary,
  ZoneEntity,
} from '@/types/realtime'

const DEMO_MODE_FORCED = String(import.meta.env.VITE_DEMO_MODE ?? '').toLowerCase() === 'true'
const WS_ENABLED = String(import.meta.env.VITE_WS_ENABLED ?? 'true').toLowerCase() !== 'false'
const MAX_JOURNAL_LENGTH = 400

function parsePollInterval(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 1500
  }

  return Math.max(1000, Math.min(2000, Math.round(numeric)))
}

const STATE_POLL_INTERVAL_MS = parsePollInterval(import.meta.env.VITE_STATE_POLL_INTERVAL_MS)

type RealtimeAction =
  | { type: 'set_loading'; payload: boolean }
  | { type: 'set_error'; payload: string | null }
  | { type: 'set_demo_mode'; payload: boolean }
  | { type: 'set_connection_status'; payload: RealtimeConnectionStatus }
  | { type: 'ingest_payload'; payload: { data: unknown; receivedAt: number } }
  | { type: 'append_journal'; payload: JournalEntry[] }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeStatus(rawStatus: unknown): ChannelStatus {
  const status = asString(rawStatus).trim().toLowerCase()

  if (status === 'normal' || status === 'ok' || status === 'ready' || status === 'healthy') {
    return 'normal'
  }

  if (status === 'active' || status === 'normal_on') {
    return 'active'
  }

  if (
    status === 'breakage' ||
    status === 'open_circuit' ||
    status === 'open' ||
    status === 'obryv' ||
    status === 'error' ||
    status === 'fault' ||
    status === 'alarm'
  ) {
    return 'breakage'
  }

  if (status === 'short_circuit' || status === 'short') {
    return 'short_circuit'
  }

  if (status === 'warning' || status === 'warn') {
    return 'unknown'
  }

  if (status === 'inactive' || status === 'offline') {
    return 'inactive'
  }

  return status ? 'unknown' : 'inactive'
}

function statusLabel(status: ChannelStatus): string {
  if (status === 'normal') {
    return 'Normal'
  }

  if (status === 'active') {
    return 'Active'
  }

  if (status === 'breakage') {
    return 'Breakage'
  }

  if (status === 'short_circuit') {
    return 'Short circuit'
  }

  if (status === 'inactive') {
    return 'Inactive'
  }

  return 'Unknown'
}

function statusSeverity(status: ChannelStatus): Severity {
  if (status === 'breakage' || status === 'short_circuit') {
    return 'error'
  }

  if (status === 'unknown') {
    return 'warning'
  }

  return 'info'
}

function statusIsFault(status: ChannelStatus): boolean {
  return status === 'breakage' || status === 'short_circuit'
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

function createInitialChannels(): Record<string, ChannelEntity> {
  return Object.fromEntries(
    channelMappings.map((mapping) => [
      mapping.id,
      {
        id: mapping.id,
        signalId: mapping.signalId,
        channelKey: mapping.channelKey,
        module: mapping.module,
        board: mapping.board,
        purpose: mapping.purpose,
        title: mapping.title,
        photoIndex: mapping.photoIndex,
        status: 'inactive',
        stateLabel: 'No data',
        cause: '',
        action: '',
        severity: 'info',
        isFault: false,
        input: null,
        output: null,
        diagnostic: null,
        updatedAt: 0,
      },
    ]),
  )
}

function createSummaryFromChannels(
  channelsById: Record<string, ChannelEntity>,
  moduleStatus: Record<string, ChannelStatus> = {},
): SnapshotSummary {
  const channels = Object.values(channelsById)
  const faultCount = channels.filter((channel) => channel.isFault).length
  const warningCount = channels.filter((channel) => channel.status === 'unknown').length
  const normalCount = channels.filter((channel) => channel.status === 'normal' || channel.status === 'active').length

  return {
    totalChannels: channels.length,
    faultCount,
    warningCount,
    normalCount,
    moduleStatus,
  }
}

function deriveModuleStatus(channels: ChannelEntity[]): { status: ChannelStatus; faultCount: number } {
  if (channels.length === 0) {
    return { status: 'inactive', faultCount: 0 }
  }

  const faultCount = channels.filter((channel) => channel.isFault).length
  if (faultCount > 0) {
    return { status: 'breakage', faultCount }
  }

  if (channels.some((channel) => channel.status === 'unknown')) {
    return { status: 'unknown', faultCount: 0 }
  }

  if (channels.every((channel) => channel.status === 'inactive')) {
    return { status: 'inactive', faultCount: 0 }
  }

  return { status: 'normal', faultCount: 0 }
}

function deriveZoneStatus(channels: ChannelEntity[]): ChannelStatus {
  if (channels.length === 0) {
    return 'inactive'
  }

  if (channels.some((channel) => channel.isFault)) {
    return 'breakage'
  }

  if (channels.some((channel) => channel.status === 'unknown')) {
    return 'unknown'
  }

  if (channels.every((channel) => channel.status === 'inactive')) {
    return 'inactive'
  }

  return 'normal'
}

function createInitialModules(channelsById: Record<string, ChannelEntity>): Record<string, ModuleEntity> {
  const grouped = new Map<string, string[]>()

  Object.values(channelsById).forEach((channel) => {
    if (!channel.module) {
      return
    }

    const list = grouped.get(channel.module) ?? []
    list.push(channel.id)
    grouped.set(channel.module, list)
  })

  return Object.fromEntries(
    Array.from(grouped.entries()).map(([moduleId, channelIds]) => {
      const channels = channelIds.map((id) => channelsById[id]).filter(Boolean)
      const derived = deriveModuleStatus(channels)
      return [
        moduleId,
        {
          id: moduleId,
          title: `Module ${moduleId}`,
          board: channels[0]?.board ?? '',
          channelIds,
          status: derived.status,
          faultCount: derived.faultCount,
        },
      ]
    }),
  )
}

function createInitialZones(channelsById: Record<string, ChannelEntity>): Record<string, ZoneEntity> {
  return Object.fromEntries(
    zoneMappings.map((zone) => {
      const channels = zone.channelIds
        .map((channelId) => channelsById[channelId])
        .filter((channel): channel is ChannelEntity => Boolean(channel))

      return [
        zone.id,
        {
          id: zone.id,
          title: zone.title,
          moduleId: zone.moduleId,
          channelIds: zone.channelIds,
          rect: zone.rect,
          status: deriveZoneStatus(channels),
        },
      ]
    }),
  )
}

function createInitialState(): RealtimeState {
  const channelsById = createInitialChannels()
  return {
    channelsById,
    modulesById: createInitialModules(channelsById),
    zonesById: createInitialZones(channelsById),
    journal: [],
    summary: createSummaryFromChannels(channelsById),
    connectionStatus: 'connecting',
    lastUpdateAt: null,
    loading: true,
    error: null,
    demoMode: false,
  }
}

function inferSignalId(rawChannel: Record<string, unknown>, fallbackSignalId: string): string {
  const direct = asString(rawChannel.signalId)
  if (direct) {
    return direct
  }

  const candidate = asString(rawChannel.name)
  if (/^\d?s\d{3}[ab]$/i.test(candidate)) {
    return candidate
  }

  return fallbackSignalId
}

function findFallbackByChannelKey(channelsById: Record<string, ChannelEntity>, channelKey: string): ChannelEntity | null {
  if (!channelKey) {
    return null
  }

  return (
    Object.values(channelsById).find((channel) => normalizeKey(channel.channelKey) === normalizeKey(channelKey)) ??
    null
  )
}

function resolveFallbackChannel(
  channelsById: Record<string, ChannelEntity>,
  rawChannel: Record<string, unknown>,
  channelPosition: number,
): ChannelEntity {
  const rawSignalId = inferSignalId(rawChannel, '')
  const rawChannelKey = asString(rawChannel.channelKey)

  if (rawSignalId && channelsById[rawSignalId]) {
    return channelsById[rawSignalId]
  }

  const byChannelKey = findFallbackByChannelKey(channelsById, rawChannelKey)
  if (byChannelKey) {
    return byChannelKey
  }

  const chIndex = asNumber(rawChannel.channelIndex, asNumber(rawChannel.ch, channelPosition))
  const mappingFallback = channelMappings[chIndex] ?? channelMappings[channelPosition] ?? channelMappings[0]

  return channelsById[mappingFallback.id] ?? createInitialChannels()[mappingFallback.id]
}

function normalizeChannelRecord(
  rawChannel: Record<string, unknown>,
  fallback: ChannelEntity,
  receivedAt: number,
): ChannelEntity {
  const bits = isObject(rawChannel.bits) ? rawChannel.bits : null
  const status = normalizeStatus(rawChannel.status)
  const fallbackStatus = normalizeStatus(rawChannel.state)
  const resolvedStatus = status === 'inactive' && fallbackStatus !== 'inactive' ? fallbackStatus : status
  const displayRu = asString(rawChannel.displayRu)
  const signalId = inferSignalId(rawChannel, fallback.signalId)
  const channelKey = asString(rawChannel.channelKey, fallback.channelKey)

  const isFault =
    typeof rawChannel.isFault === 'boolean' ? rawChannel.isFault : statusIsFault(resolvedStatus)

  const cause = asString(rawChannel.cause) || asString(rawChannel.reason) || asString(rawChannel.faultKind)
  const action = asString(rawChannel.action)

  const fallbackId = fallback.signalId || fallback.channelKey || fallback.id
  const id = signalId || channelKey || fallbackId

  return {
    ...fallback,
    id,
    signalId: signalId || fallback.signalId,
    channelKey: channelKey || fallback.channelKey,
    module: asString(rawChannel.module, fallback.module),
    board: asString(rawChannel.board, fallback.board),
    purpose: asString(rawChannel.purpose, fallback.purpose) || asString(rawChannel.name, fallback.purpose),
    title: asString(rawChannel.title, fallback.title) || `${signalId || fallback.signalId} ${fallback.purpose}`,
    photoIndex:
      asNullableNumber(rawChannel.photoIndex) ??
      (asNullableNumber(rawChannel.photo_index) ??
        (asNullableNumber(rawChannel.channelIndex) ??
          (asNullableNumber(rawChannel.ch) ?? fallback.photoIndex))),
    status: resolvedStatus,
    stateLabel: displayRu || asString(rawChannel.stateLabel) || statusLabel(resolvedStatus),
    cause,
    action,
    severity: (asString(rawChannel.severity) as Severity) || statusSeverity(resolvedStatus),
    isFault,
    input: asNullableNumber(rawChannel.input) ?? asNullableNumber(bits?.inv_in),
    output: asNullableNumber(rawChannel.output) ?? asNullableNumber(bits?.out),
    diagnostic: asNullableNumber(rawChannel.diagnostic) ?? asNullableNumber(bits?.dg),
    updatedAt: asNumber(rawChannel.ts, receivedAt),
  }
}

function pickChannelRecords(payload: Record<string, unknown>): Array<Record<string, unknown>> {
  if (Array.isArray(payload.channels)) {
    return payload.channels.filter(isObject)
  }

  if (payload.type === 'puma_board_decoded' && Array.isArray(payload.channels)) {
    return payload.channels.filter(isObject)
  }

  if (isObject(payload.payload) && Array.isArray(payload.payload.channels)) {
    return payload.payload.channels.filter(isObject)
  }

  return []
}

function pickSummary(payload: Record<string, unknown>): Record<string, unknown> | null {
  if (isObject(payload.summary)) {
    return payload.summary
  }

  if (isObject(payload.payload) && isObject(payload.payload.summary)) {
    return payload.payload.summary
  }

  return null
}

function pickAggregates(payload: Record<string, unknown>): Record<string, unknown> | null {
  if (isObject(payload.aggregates)) {
    return payload.aggregates
  }

  if (isObject(payload.payload) && isObject(payload.payload.aggregates)) {
    return payload.payload.aggregates
  }

  return null
}

function pickJournal(payload: Record<string, unknown>): unknown {
  if (Array.isArray(payload.journal)) {
    return payload.journal
  }

  if (isObject(payload.payload) && Array.isArray(payload.payload.journal)) {
    return payload.payload.journal
  }

  return undefined
}

function normalizeStatusMap(raw: unknown): Record<string, ChannelStatus> {
  const map: Record<string, ChannelStatus> = {}

  if (Array.isArray(raw)) {
    raw.filter(isObject).forEach((item, index) => {
      const id =
        asString(item.id) ||
        asString(item.key) ||
        asString(item.module) ||
        asString(item.moduleId) ||
        asString(item.page) ||
        asString(item.pageId) ||
        asString(item.title) ||
        asString(item.name) ||
        `item-${index}`
      const statusRaw = item.status ?? item.state ?? item.level
      if (id) {
        map[id] = normalizeStatus(statusRaw)
      }
    })

    return map
  }

  if (!isObject(raw)) {
    return map
  }

  Object.entries(raw).forEach(([key, value]) => {
    if (!key) {
      return
    }

    if (isObject(value)) {
      const nestedId = asString(value.id) || asString(value.key) || key
      const statusRaw = value.status ?? value.state ?? value.level
      map[nestedId] = normalizeStatus(statusRaw)
      return
    }

    map[key] = normalizeStatus(value)
  })

  return map
}

function normalizeSummary(
  rawSummary: Record<string, unknown> | null,
  channelsById: Record<string, ChannelEntity>,
  moduleStatusFallback: Record<string, ChannelStatus>,
): SnapshotSummary {
  const byChannels = createSummaryFromChannels(channelsById, moduleStatusFallback)

  if (!rawSummary) {
    return byChannels
  }

  const moduleStatusRaw = normalizeStatusMap(rawSummary.moduleStatus)
  const moduleStatus = { ...moduleStatusFallback, ...moduleStatusRaw }

  return {
    totalChannels: asNumber(rawSummary.totalChannels, byChannels.totalChannels),
    faultCount: asNumber(rawSummary.faultCount, byChannels.faultCount),
    warningCount: asNumber(rawSummary.warningCount, byChannels.warningCount),
    normalCount: asNumber(rawSummary.normalCount, byChannels.normalCount),
    moduleStatus,
  }
}

function buildModules(
  channelsById: Record<string, ChannelEntity>,
  statusesByModule: Record<string, ChannelStatus>,
): Record<string, ModuleEntity> {
  const modulesById = createInitialModules(channelsById)

  Object.entries(statusesByModule).forEach(([moduleIdRaw, status]) => {
    const moduleId = moduleIdRaw.trim()
    if (!moduleId) {
      return
    }

    const existing = modulesById[moduleId]
    if (!existing) {
      const channels = Object.values(channelsById).filter(
        (channel) => normalizeKey(channel.module) === normalizeKey(moduleId),
      )

      modulesById[moduleId] = {
        id: moduleId,
        title: `Module ${moduleId}`,
        board: channels[0]?.board ?? '',
        channelIds: channels.map((channel) => channel.id),
        status,
        faultCount: channels.filter((channel) => channel.isFault).length,
      }
      return
    }

    modulesById[moduleId] = {
      ...existing,
      status,
    }
  })

  return modulesById
}

function resolveZoneStatusFromAggregate(
  zone: ZoneEntity,
  aggregateByKey: Record<string, ChannelStatus>,
): ChannelStatus | null {
  const candidates = [zone.id, zone.moduleId, zone.title]

  for (const candidate of candidates) {
    const normalized = normalizeKey(candidate)
    if (aggregateByKey[normalized]) {
      return aggregateByKey[normalized]
    }
  }

  return null
}

function buildZones(
  channelsById: Record<string, ChannelEntity>,
  pageStatuses: Record<string, ChannelStatus>,
): Record<string, ZoneEntity> {
  const zonesById = createInitialZones(channelsById)
  const indexedPageStatuses: Record<string, ChannelStatus> = Object.fromEntries(
    Object.entries(pageStatuses).map(([key, status]) => [normalizeKey(key), status]),
  )

  Object.values(zonesById).forEach((zone) => {
    const channels = zone.channelIds
      .map((channelId) => channelsById[channelId])
      .filter((channel): channel is ChannelEntity => Boolean(channel))

    if (channels.some((channel) => channel.isFault)) {
      zone.status = 'breakage'
      return
    }

    if (channels.some((channel) => channel.status === 'unknown')) {
      zone.status = 'unknown'
      return
    }

    const aggregateStatus = resolveZoneStatusFromAggregate(zone, indexedPageStatuses)
    if (aggregateStatus) {
      zone.status = aggregateStatus
      return
    }

    zone.status = deriveZoneStatus(channels)
  })

  return zonesById
}

function normalizeJournal(raw: unknown): JournalEntry[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(isObject)
    .map((item, index) => {
      const ts = asNumber(item.ts, Date.now())
      const levelRaw = asString(item.level).toLowerCase()
      const level = levelRaw === 'error' || levelRaw === 'warning' ? levelRaw : 'info'
      const moduleName = asString(item.module)
      const signalId = asString(item.signalId)
      const title = asString(item.title) || asString(item.message) || asString(item.text) || 'Event'
      const reason = asString(item.reason) || asString(item.cause)
      const action = asString(item.action)
      const status = normalizeStatus(item.status)
      return {
        id: asString(item.id, `${ts}-${index}-${title}`),
        ts,
        level,
        module: moduleName,
        signalId,
        title,
        reason,
        action,
        text: asString(item.text) || title,
        status,
      } satisfies JournalEntry
    })
}

function appendJournal(current: JournalEntry[], entries: JournalEntry[]): JournalEntry[] {
  if (entries.length === 0) {
    return current
  }

  const next = [...entries, ...current]
  next.sort((a, b) => b.ts - a.ts)
  return next.slice(0, MAX_JOURNAL_LENGTH)
}

function ingestPayload(state: RealtimeState, payload: unknown, receivedAt: number): RealtimeState {
  if (!isObject(payload)) {
    return state
  }

  const incomingChannels = pickChannelRecords(payload)
  const nextChannelsById = { ...state.channelsById }
  let touchedChannels = false

  if (incomingChannels.length > 0) {
    incomingChannels.forEach((rawChannel, index) => {
      const fallback = resolveFallbackChannel(state.channelsById, rawChannel, index)
      const normalized = normalizeChannelRecord(rawChannel, fallback, receivedAt)
      nextChannelsById[normalized.id] = normalized

      if (fallback.id !== normalized.id && nextChannelsById[fallback.id]) {
        delete nextChannelsById[fallback.id]
      }

      touchedChannels = true
    })
  }

  const baseChannelsById = touchedChannels ? nextChannelsById : state.channelsById
  const aggregates = pickAggregates(payload)
  const aggregateModules = normalizeStatusMap(aggregates?.modules)
  const aggregatePages = normalizeStatusMap(aggregates?.pages)
  const hasAggregateModules = Object.keys(aggregateModules).length > 0
  const hasAggregatePages = Object.keys(aggregatePages).length > 0

  const summaryRecord = pickSummary(payload)
  const hasSummary = summaryRecord !== null
  const summary =
    hasSummary || touchedChannels || hasAggregateModules
      ? normalizeSummary(summaryRecord, baseChannelsById, aggregateModules)
      : state.summary

  const mergedModuleStatuses = { ...aggregateModules, ...summary.moduleStatus }

  const shouldRebuildModulesAndZones =
    touchedChannels || hasAggregateModules || hasAggregatePages || hasSummary

  const modulesById = shouldRebuildModulesAndZones
    ? buildModules(baseChannelsById, mergedModuleStatuses)
    : state.modulesById

  const zonesById = shouldRebuildModulesAndZones
    ? buildZones(baseChannelsById, aggregatePages)
    : state.zonesById

  const journalEntries = normalizeJournal(pickJournal(payload))
  const shouldUpdateTimestamp =
    touchedChannels ||
    hasAggregateModules ||
    hasAggregatePages ||
    hasSummary ||
    journalEntries.length > 0

  return {
    ...state,
    channelsById: baseChannelsById,
    modulesById,
    zonesById,
    summary,
    journal: appendJournal(state.journal, journalEntries),
    lastUpdateAt: shouldUpdateTimestamp ? receivedAt : state.lastUpdateAt,
  }
}

function reducer(state: RealtimeState, action: RealtimeAction): RealtimeState {
  if (action.type === 'set_loading') {
    return { ...state, loading: action.payload }
  }

  if (action.type === 'set_error') {
    return { ...state, error: action.payload }
  }

  if (action.type === 'set_demo_mode') {
    return { ...state, demoMode: action.payload }
  }

  if (action.type === 'set_connection_status') {
    return { ...state, connectionStatus: action.payload }
  }

  if (action.type === 'ingest_payload') {
    return ingestPayload(state, action.payload.data, action.payload.receivedAt)
  }

  if (action.type === 'append_journal') {
    return { ...state, journal: appendJournal(state.journal, action.payload) }
  }

  return state
}

function serviceJournal(level: JournalEntry['level'], title: string): JournalEntry {
  const ts = Date.now()
  return {
    id: `service-${ts}-${title}`,
    ts,
    level,
    module: 'SYSTEM',
    signalId: '',
    title,
    reason: '',
    action: '',
    text: title,
  }
}

export function RealtimeProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const disconnectRef = useRef<(() => void) | null>(null)
  const pollTimerRef = useRef<number | null>(null)
  const pollInFlightRef = useRef(false)
  const statusRef = useRef<RealtimeConnectionStatus>('connecting')

  const bootstrap = useCallback(async () => {
    dispatch({ type: 'set_loading', payload: true })
    dispatch({ type: 'set_error', payload: null })

    if (DEMO_MODE_FORCED) {
      const demo = createDemoSnapshot()
      dispatch({ type: 'set_demo_mode', payload: true })
      dispatch({ type: 'ingest_payload', payload: { data: demo, receivedAt: Date.now() } })
      dispatch({
        type: 'append_journal',
        payload: [serviceJournal('warning', 'demo-mode enabled')],
      })
      dispatch({ type: 'set_loading', payload: false })
      return
    }

    const [stateResult, configResult, journalResult] = await Promise.allSettled([
      fetchInitialState(),
      fetchConfig(),
      fetchJournal(),
    ])

    if (stateResult.status === 'fulfilled') {
      dispatch({
        type: 'ingest_payload',
        payload: { data: stateResult.value, receivedAt: Date.now() },
      })
      dispatch({ type: 'set_error', payload: null })
    } else {
      dispatch({
        type: 'set_error',
        payload: `Failed to load /api/state: ${stateResult.reason instanceof Error ? stateResult.reason.message : 'unknown error'}`,
      })
    }

    if (configResult.status === 'fulfilled') {
      dispatch({
        type: 'ingest_payload',
        payload: { data: configResult.value, receivedAt: Date.now() },
      })
    }

    if (journalResult.status === 'fulfilled') {
      dispatch({
        type: 'append_journal',
        payload: normalizeJournal(journalResult.value),
      })
    }

    dispatch({ type: 'set_demo_mode', payload: false })
    dispatch({ type: 'set_loading', payload: false })
  }, [])

  const pollStateSnapshot = useCallback(async () => {
    if (DEMO_MODE_FORCED || pollInFlightRef.current) {
      return
    }

    pollInFlightRef.current = true

    try {
      const snapshot = await fetchInitialState()
      dispatch({ type: 'ingest_payload', payload: { data: snapshot, receivedAt: Date.now() } })
      dispatch({ type: 'set_error', payload: null })
    } catch (error) {
      dispatch({
        type: 'set_error',
        payload: error instanceof Error ? error.message : 'Failed to poll /api/state',
      })
    } finally {
      pollInFlightRef.current = false
    }
  }, [])

  const connectWs = useCallback(() => {
    if (DEMO_MODE_FORCED || !WS_ENABLED) {
      dispatch({ type: 'set_connection_status', payload: 'disconnected' })
      return
    }

    disconnectRef.current?.()
    disconnectRef.current = connectRealtimeWs({
      onStatus: (status) => {
        const prevStatus = statusRef.current
        statusRef.current = status
        dispatch({ type: 'set_connection_status', payload: status })

        if (status === 'connected' && prevStatus !== 'connected') {
          dispatch({
            type: 'append_journal',
            payload: [serviceJournal('info', prevStatus === 'reconnecting' ? 'websocket reconnected' : 'backend connected')],
          })
        }

        if (status === 'error') {
          dispatch({
            type: 'append_journal',
            payload: [serviceJournal('error', 'websocket error')],
          })
        }
      },
      onMessage: (payload) => {
        dispatch({ type: 'ingest_payload', payload: { data: payload, receivedAt: Date.now() } })
      },
      onError: (error) => {
        dispatch({
          type: 'set_error',
          payload: error instanceof Error ? error.message : 'WebSocket error',
        })
      },
    })
  }, [])

  useEffect(() => {
    void bootstrap()
    connectWs()

    if (!DEMO_MODE_FORCED) {
      pollTimerRef.current = window.setInterval(() => {
        void pollStateSnapshot()
      }, STATE_POLL_INTERVAL_MS)
    }

    return () => {
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }

      disconnectRef.current?.()
      disconnectRef.current = null
    }
  }, [bootstrap, connectWs, pollStateSnapshot])

  const reconnect = useCallback(() => {
    dispatch({ type: 'set_connection_status', payload: 'connecting' })
    dispatch({ type: 'append_journal', payload: [serviceJournal('info', 'manual reconnect requested')] })
    void bootstrap()
    connectWs()
    void pollStateSnapshot()
  }, [bootstrap, connectWs, pollStateSnapshot])

  const value = useMemo<RealtimeContextValue>(() => {
    const channels = Object.values(state.channelsById).sort((a, b) => {
      const photoA = a.photoIndex ?? Number.MAX_SAFE_INTEGER
      const photoB = b.photoIndex ?? Number.MAX_SAFE_INTEGER
      if (photoA !== photoB) {
        return photoA - photoB
      }

      return a.id.localeCompare(b.id)
    })

    const modules = Object.values(state.modulesById).sort((a, b) => a.id.localeCompare(b.id))
    const zones = Object.values(state.zonesById)

    return {
      ...state,
      channels,
      modules,
      zones,
      reconnect,
    }
  }, [state, reconnect])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

