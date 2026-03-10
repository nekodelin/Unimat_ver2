import { buildWsUrl, envConfig } from '../config/env'
import type { JournalEntry } from '../types/journal'
import { normalizeJournalEntryRecord } from './journalApi'
import { WsClient } from './wsClient'

type UnknownRecord = Record<string, unknown>

export type JournalRealtimeStatus = 'connected' | 'connecting' | 'disconnected'

interface JournalRealtimeConnectParams {
  token: string
  onAppend: (entry: JournalEntry) => void
  onStatusChange?: (status: JournalRealtimeStatus) => void
  onError?: (error: unknown) => void
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

function normalizeEventType(value: unknown): string {
  return asString(value).toLowerCase().replace(/\s+/g, '_')
}

function buildJournalWsUrl(token: string): string {
  const url = new URL(buildWsUrl('/journal'))
  url.searchParams.set('access_token', token)
  url.searchParams.set('token', token)
  return url.toString()
}

function extractAppendPayload(message: unknown): unknown {
  if (!isRecord(message)) {
    return null
  }

  const eventType = normalizeEventType(message.type ?? message.event ?? message.kind)
  if (eventType !== 'journal_append' && eventType !== 'journal.append') {
    return null
  }

  return message.payload ?? message.data ?? message.entry ?? message.record ?? null
}

function normalizeAppendEntries(payload: unknown): JournalEntry[] {
  if (Array.isArray(payload)) {
    return payload
      .map((entry, index) => normalizeJournalEntryRecord(entry, index))
      .filter((entry): entry is JournalEntry => entry !== null)
  }

  const singleEntry = normalizeJournalEntryRecord(payload)
  return singleEntry ? [singleEntry] : []
}

export class JournalRealtimeClient {
  private wsClient = new WsClient()
  private params: JournalRealtimeConnectParams | null = null
  private disconnectedByUser = false

  connect(params: JournalRealtimeConnectParams): void {
    this.disconnect()

    if (!params.token.trim()) {
      return
    }

    this.params = params
    this.disconnectedByUser = false
    params.onStatusChange?.('connecting')

    this.wsClient.connect(buildJournalWsUrl(params.token), this.handleMessage, {
      reconnectDelayMs: envConfig.wsReconnectDelayMs,
      onOpen: () => {
        this.params?.onStatusChange?.('connected')
      },
      onClose: () => {
        if (this.disconnectedByUser) {
          return
        }

        this.params?.onStatusChange?.('disconnected')
      },
      onError: (error) => {
        if (this.disconnectedByUser) {
          return
        }

        this.params?.onStatusChange?.('disconnected')
        this.params?.onError?.(error)
      },
    })
  }

  disconnect(): void {
    this.disconnectedByUser = true
    this.wsClient.disconnect()

    if (this.params) {
      this.params.onStatusChange?.('disconnected')
    }
  }

  private handleMessage = (message: unknown): void => {
    const appendPayload = extractAppendPayload(message)
    if (!appendPayload) {
      return
    }

    const entries = normalizeAppendEntries(appendPayload)
    if (entries.length === 0) {
      return
    }

    entries.forEach((entry) => {
      this.params?.onAppend(entry)
    })
  }
}
