import type { JournalEntry, JournalLevel } from '../types/journal'
import { apiGet, apiGetBlob, apiPost } from './apiClient'

type UnknownRecord = Record<string, unknown>

interface JournalLoginPayload {
  login: string
  password: string
}

interface BackendLoginPayload {
  username: string
  password: string
}

export interface JournalUser {
  login: string
  displayName: string
}

export interface JournalLoginResult {
  token: string
  user: JournalUser
}

export interface JournalFilter {
  dateFrom?: string
  dateTo?: string
}

interface AuthorizedRequest {
  token: string
}

export interface ExportJournalResult {
  blob: Blob
  fileName: string | null
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
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

function pickString(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key])
    if (value) {
      return value
    }
  }

  return ''
}

function toIsoTimestamp(value: unknown): string {
  const normalized = asString(value)
  if (!normalized) {
    return new Date().toISOString()
  }

  const parsed = Date.parse(normalized)
  if (Number.isNaN(parsed)) {
    return new Date().toISOString()
  }

  return new Date(parsed).toISOString()
}

function normalizeLevel(value: unknown): JournalLevel {
  const token = asString(value).toLowerCase()

  if (
    token === 'error' ||
    token === 'critical' ||
    token === 'fault' ||
    token === 'alarm' ||
    token === 'fail'
  ) {
    return 'error'
  }

  if (token === 'warning' || token === 'warn') {
    return 'warning'
  }

  return 'info'
}

function getAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  }
}

function collectRecords(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord)
  }

  if (isRecord(value)) {
    return Object.values(value).filter(isRecord)
  }

  return []
}

function extractCollection(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord)
  }

  const root = asRecord(payload)
  const candidates = [
    root.items,
    root.records,
    root.results,
    root.data,
    root.journal,
    root.events,
    root.logs,
  ]

  for (const candidate of candidates) {
    const collection = collectRecords(candidate)
    if (collection.length > 0) {
      return collection
    }
  }

  return root && Object.keys(root).length > 0 ? [root] : []
}

function extractAuthToken(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload.trim()
  }

  const root = asRecord(payload)
  const directToken = pickString(root, ['token', 'access_token', 'accessToken', 'jwt'])
  if (directToken) {
    return directToken
  }

  const data = asRecord(root.data)
  return pickString(data, ['token', 'access_token', 'accessToken', 'jwt'])
}

function normalizeUser(payload: unknown, fallbackLogin: string): JournalUser {
  const root = asRecord(payload)
  const rootUser = asRecord(root.user)
  const data = asRecord(root.data)
  const dataUser = asRecord(data.user)

  const login =
    pickString(root, ['login', 'username']) ||
    pickString(rootUser, ['login', 'username']) ||
    pickString(data, ['login', 'username']) ||
    pickString(dataUser, ['login', 'username']) ||
    fallbackLogin

  const displayName =
    pickString(root, ['full_name', 'fullName', 'name', 'displayName']) ||
    pickString(rootUser, ['full_name', 'fullName', 'name', 'displayName']) ||
    pickString(data, ['full_name', 'fullName', 'name', 'displayName']) ||
    pickString(dataUser, ['full_name', 'fullName', 'name', 'displayName']) ||
    login

  return {
    login,
    displayName,
  }
}

function defaultTypeByLevel(level: JournalLevel): string {
  if (level === 'error') {
    return 'Ошибка'
  }

  if (level === 'warning') {
    return 'Предупреждение'
  }

  return 'Инфо'
}

function formatElement(record: UnknownRecord): string {
  const directElement = pickString(record, ['element', 'node', 'unit_name', 'name'])
  if (directElement) {
    return directElement
  }

  const board = pickString(record, ['board'])
  const module = pickString(record, ['module', 'module_key', 'moduleKey'])
  const channel = pickString(record, ['channel', 'channel_key', 'channelKey', 'signal_id', 'signalId'])
  const parts = [board, module, channel].filter((part) => part.length > 0)

  if (parts.length > 0) {
    return parts.join(' / ')
  }

  return '-'
}

function normalizeJournalEntry(record: UnknownRecord, index: number): JournalEntry {
  const timestamp = toIsoTimestamp(
    record.timestamp ??
      record.date_time ??
      record.datetime ??
      record.date ??
      record.created_at ??
      record.updated_at ??
      record.updatedAt,
  )

  const level = normalizeLevel(record.level ?? record.severity ?? record.type ?? record.event_type)
  const eventType =
    pickString(record, ['event_type', 'eventType', 'type', 'event', 'severity', 'level']) ||
    defaultTypeByLevel(level)
  const source =
    pickString(record, ['source', 'module', 'board', 'unit', 'system']) || 'Система'
  const element = formatElement(record)
  const oldState = pickString(record, [
    'old_state',
    'oldState',
    'prev_state',
    'prevState',
    'previous_state',
    'from_state',
    'state_from',
    'before',
  ])
  const newState = pickString(record, [
    'new_state',
    'newState',
    'next_state',
    'nextState',
    'current_state',
    'to_state',
    'state_to',
    'after',
    'state',
  ])
  const description =
    pickString(record, ['description', 'message', 'text', 'details', 'comment', 'reason']) ||
    'Без описания'
  const channel =
    pickString(record, [
      'channel',
      'channel_index',
      'channelIndex',
      'channel_key',
      'channelKey',
      'tech_number',
      'techNumber',
      'signal_id',
      'signalId',
    ]) || '-'
  const signalId = pickString(record, ['signal_id', 'signalId'])
  const reason = pickString(record, ['reason'])
  const action = pickString(record, ['action'])
  const severity = pickString(record, ['severity'])
  const id =
    pickString(record, ['id', 'event_id', 'eventId', 'uuid']) || `journal-${timestamp}-${index}`

  return {
    id,
    timestamp,
    level,
    type: eventType,
    source,
    element,
    oldState: oldState || '-',
    newState: newState || '-',
    description,
    channel,
    title: eventType,
    message: description,
    signalId,
    reason,
    action,
    severity,
  }
}

export function normalizeJournalEntryRecord(
  payload: unknown,
  fallbackIndex = 0,
): JournalEntry | null {
  if (!isRecord(payload)) {
    return null
  }

  return normalizeJournalEntry(payload, fallbackIndex)
}

function parseFileNameFromDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/"/g, '').trim()
    } catch {
      return utf8Match[1].replace(/"/g, '').trim()
    }
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1].trim()
  }

  return null
}

export async function loginJournal(payload: JournalLoginPayload): Promise<JournalLoginResult> {
  const requestBody: BackendLoginPayload = {
    username: payload.login,
    password: payload.password,
  }

  const response = await apiPost<unknown>('/auth/login', requestBody)
  const token = extractAuthToken(response)

  if (!token) {
    throw new Error('Backend did not return access token')
  }

  return {
    token,
    user: normalizeUser(response, payload.login),
  }
}

export async function fetchJournalMe({ token }: AuthorizedRequest): Promise<JournalUser> {
  const response = await apiGet<unknown>('/auth/me', {
    headers: getAuthHeaders(token),
  })

  return normalizeUser(response, 'admin')
}

export async function logoutJournal({ token }: AuthorizedRequest): Promise<void> {
  await apiPost<unknown>(
    '/auth/logout',
    undefined,
    {
      headers: getAuthHeaders(token),
    },
  )
}

export async function fetchJournalEntries(
  params: AuthorizedRequest & JournalFilter,
): Promise<JournalEntry[]> {
  const response = await apiGet<unknown>('/journal', {
    headers: getAuthHeaders(params.token),
    query: {
      date_from: params.dateFrom,
      date_to: params.dateTo,
    },
  })

  const entries = extractCollection(response)
    .map((record, index) => normalizeJournalEntryRecord(record, index))
    .filter((entry): entry is JournalEntry => entry !== null)

  return entries.sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
}

export async function exportJournalToTxt(
  params: AuthorizedRequest & JournalFilter,
): Promise<ExportJournalResult> {
  const response = await apiGetBlob('/journal/export', {
    headers: getAuthHeaders(params.token),
    query: {
      date_from: params.dateFrom,
      date_to: params.dateTo,
    },
  })

  return {
    blob: response.blob,
    fileName: parseFileNameFromDisposition(response.headers.get('content-disposition')),
  }
}
