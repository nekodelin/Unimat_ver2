import { MODULE_PATHS } from '../data/modulePaths.generated'
import {
  getChannelBindingByChannelKey,
  getChannelBindingByModuleAndIndex,
  getChannelBindingBySignalId,
  normalizeChannelIndex,
  normalizeModuleKey,
  normalizeSignalId as normalizeMappedSignalId,
} from '../data/channelMapping'
import {
  NODE_WINDOW_ELEMENTS,
  NODE_WINDOW_ELEMENTS_BY_SIGNAL_ID,
} from '../data/nodeWindowElements'
import { TECHNICAL_SIGNAL_DEFS } from '../data/mockSignals'
import { TRAIN_ZONE_DEFS } from '../data/zones'
import type { DataSnapshot, ScenarioId, UiActions, UiSummary } from '../types/app'
import type {
  BackendChannel,
  BackendJournalEvent,
  BackendModule,
  BackendStatePayload,
} from '../types/backend'
import type { ChannelBackendStatus, ChannelState } from '../types/channel'
import type { JournalEntry, JournalLevel } from '../types/journal'
import type { ModuleFaultInfo } from '../types/module'
import type { TechnicalSignalState } from '../types/signal'
import type { ConnectionState, ZoneStatus } from '../types/status'
import type { ModuleZoneState, TrainZoneState } from '../types/zone'
import {
  getChannelsByModule,
  getFaultChannels,
  getUnknownChannels,
  moduleComputedStatusToZoneStatus,
  resolveModuleComputedStatus,
} from './channelSelectors'

type UnknownRecord = Record<string, unknown>

interface AdapterOptions {
  scenarioId?: ScenarioId
  connectionState?: ConnectionState
  error?: string | null
  previousSnapshot?: DataSnapshot
}

interface ChannelIdentity {
  id: string
  zoneId: string
  moduleKey: string
  channelIndex: string
  channelKey: string
  signalId: string
  channel: string
  titleFallback: string
  zoneKey: string
  board: string
  unit: string
  topic: string
}

const FALLBACK_EVENT = 'Канал'
const FALLBACK_ACTION = 'Проверить цепь исполнительного механизма'

const SIGNAL_ALIASES: Record<string, string> = {
  '1s202a': '1s202b',
}

const SIGNAL_BY_INTERNAL_ID = new Map(TECHNICAL_SIGNAL_DEFS.map((signal) => [signal.id, signal]))
const INTERNAL_ID_BY_SIGNAL_ID = new Map(
  TECHNICAL_SIGNAL_DEFS.map((signal) => [normalizeSignalId(signal.signalId), signal.id]),
)
const INTERNAL_ID_BY_CHANNEL_INDEX = new Map(
  TECHNICAL_SIGNAL_DEFS.map((signal) => [signal.channel.trim().toUpperCase(), signal.id]),
)

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = normalizeKey(value)
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true
    }

    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false
    }
  }

  return undefined
}

function toIsoTimestamp(value: unknown): string {
  const raw = asString(value)
  const parsed = Date.parse(raw)

  if (Number.isNaN(parsed)) {
    return new Date().toISOString()
  }

  return new Date(parsed).toISOString()
}

function toCollection<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord) as T[]
  }

  if (isRecord(value)) {
    return Object.values(value).filter(isRecord) as T[]
  }

  return []
}

function normalizeSignalId(rawSignalId: string): string {
  const normalized = normalizeMappedSignalId(rawSignalId)
  return SIGNAL_ALIASES[normalized] ?? normalized
}

function extractPayload(input: unknown): BackendStatePayload {
  if (!isRecord(input)) {
    return {}
  }

  const type = normalizeKey(asString(input.type))

  if (type === 'state_update' || type === 'snapshot' || type === 'state') {
    return asRecord(input.payload) as BackendStatePayload
  }

  return input as BackendStatePayload
}

function resolveBackendStatus(statusValue: unknown): ChannelBackendStatus {
  const token = normalizeKey(asString(statusValue))

  if (!token) {
    return 'unknown'
  }

  if (
    token === 'short_circuit' ||
    token === 'short' ||
    token === 'sc' ||
    token.includes('short')
  ) {
    return 'short_circuit'
  }

  if (
    token === 'open_circuit' ||
    token === 'open' ||
    token === 'break' ||
    token === 'wire_break' ||
    token.includes('open')
  ) {
    return 'open_circuit'
  }

  if (
    token === 'unknown' ||
    token === 'no_data' ||
    token === 'inactive' ||
    token === 'offline' ||
    token === 'n/a'
  ) {
    return 'unknown'
  }

  if (
    token === 'normal' ||
    token === 'ok' ||
    token === 'active' ||
    token === 'running' ||
    token === 'on'
  ) {
    return 'normal'
  }

  if (token === 'fault' || token === 'error' || token === 'alarm') {
    return 'open_circuit'
  }

  return 'unknown'
}

function resolveUiStatus(status: ChannelBackendStatus, isFault: boolean): ZoneStatus {
  if (isFault) {
    return 'fault'
  }

  if (status === 'unknown') {
    return 'inactive'
  }

  return 'normal'
}

function resolveStateLabel(status: ChannelBackendStatus, stateLabel: string): string {
  if (stateLabel.trim().length > 0) {
    return stateLabel
  }

  if (status === 'short_circuit') {
    return 'КЗ'
  }

  if (status === 'open_circuit') {
    return 'Обрыв'
  }

  if (status === 'unknown') {
    return 'Неизвестно'
  }

  return 'Норма'
}

function resolvePriority(channel: ChannelState): number {
  if (channel.isFault) {
    return 3
  }

  if (channel.backendStatus === 'unknown') {
    return 2
  }

  return 1
}

function choosePreferredChannel(current: ChannelState, candidate: ChannelState): ChannelState {
  const currentTimestamp = Date.parse(current.lastUpdated)
  const candidateTimestamp = Date.parse(candidate.lastUpdated)

  if (!Number.isNaN(candidateTimestamp) && !Number.isNaN(currentTimestamp)) {
    if (candidateTimestamp > currentTimestamp) {
      return candidate
    }

    if (candidateTimestamp < currentTimestamp) {
      return current
    }
  }

  const currentPriority = resolvePriority(current)
  const candidatePriority = resolvePriority(candidate)

  if (candidatePriority > currentPriority) {
    return candidate
  }

  if (candidatePriority < currentPriority) {
    return current
  }

  return candidate
}

function createNeutralInfo(params: {
  title: string
  techNumber: string
  signalId: string
  stateLabel: string
  message: string
  reason: string
  action: string
  severity: string
  isFault: boolean
  isActive: boolean
}): ModuleFaultInfo {
  return {
    event: params.title || FALLBACK_EVENT,
    cause: params.reason,
    fault: params.isFault ? params.message || params.reason || params.stateLabel : '',
    action: params.action || FALLBACK_ACTION,
    title: params.title || 'Канал',
    techNumber: params.techNumber || '-',
    signalId: params.signalId || '-',
    stateLabel: params.stateLabel,
    message: params.message,
    reason: params.reason,
    severity: params.severity,
    isFault: params.isFault,
    isActive: params.isActive,
  }
}

function resolveInternalId(channel: BackendChannel): string | null {
  const signalIdFromPayload = normalizeSignalId(asString(channel.signalId))
  if (signalIdFromPayload) {
    const bySignalId = INTERNAL_ID_BY_SIGNAL_ID.get(signalIdFromPayload)
    if (bySignalId) {
      return bySignalId
    }
  }

  const bindingBySignal = getChannelBindingBySignalId(signalIdFromPayload)
  if (bindingBySignal) {
    const byBindingSignal = INTERNAL_ID_BY_SIGNAL_ID.get(bindingBySignal.signalId)
    if (byBindingSignal) {
      return byBindingSignal
    }
  }

  const bindingByChannelKey = getChannelBindingByChannelKey(channel.channelKey)
  if (bindingByChannelKey) {
    const byBindingChannelKey = INTERNAL_ID_BY_SIGNAL_ID.get(bindingByChannelKey.signalId)
    if (byBindingChannelKey) {
      return byBindingChannelKey
    }
  }

  const moduleCandidate = normalizeModuleKey(channel.moduleKey || channel.module)
  const channelIndexCandidate = normalizeChannelIndex(
    channel.channelIndex ?? channel.techNumber ?? channel.channel,
  )
  const bindingByModuleAndIndex = getChannelBindingByModuleAndIndex(
    moduleCandidate,
    channelIndexCandidate,
  )

  if (bindingByModuleAndIndex) {
    const byBinding = INTERNAL_ID_BY_SIGNAL_ID.get(bindingByModuleAndIndex.signalId)
    if (byBinding) {
      return byBinding
    }
  }

  if (moduleCandidate === 'QL6C' && channelIndexCandidate) {
    return INTERNAL_ID_BY_CHANNEL_INDEX.get(channelIndexCandidate) ?? null
  }

  return null
}

function resolveChannelIdentity(channel: BackendChannel): ChannelIdentity {
  const internalId = resolveInternalId(channel)
  const element = internalId ? NODE_WINDOW_ELEMENTS_BY_SIGNAL_ID.get(internalId) : undefined
  const signalDefinition = internalId ? SIGNAL_BY_INTERNAL_ID.get(internalId) : undefined

  const moduleFromPayload = normalizeModuleKey(channel.moduleKey || channel.module)
  const indexFromPayload = normalizeChannelIndex(
    channel.channelIndex ?? channel.techNumber ?? channel.channel,
  )
  const bindingBySignal = getChannelBindingBySignalId(channel.signalId)
  const bindingByChannelKey = getChannelBindingByChannelKey(channel.channelKey)
  const bindingByModuleAndIndex = getChannelBindingByModuleAndIndex(
    moduleFromPayload,
    indexFromPayload,
  )
  const resolvedBinding =
    bindingBySignal ?? bindingByChannelKey ?? bindingByModuleAndIndex

  const moduleKey = moduleFromPayload ?? resolvedBinding?.moduleKey ?? element?.moduleKey ?? 'QL6C'
  const channelIndex =
    indexFromPayload ??
    resolvedBinding?.channelIndex ??
    normalizeChannelIndex(element?.channelIndex) ??
    '0'

  const normalizedChannelKey = asString(channel.channelKey).trim().toUpperCase()
  const channelKey = normalizedChannelKey || `${moduleKey}${channelIndex}`
  const signalId =
    normalizeSignalId(asString(channel.signalId)) ||
    resolvedBinding?.signalId ||
    normalizeSignalId(element?.backendSignalId ?? '') ||
    '-'

  const techNumber = asString(channel.techNumber || channel.channel, channelIndex)
  const channelLabel = asString(channel.channel, element?.channel ?? techNumber)
  const titleFallback = signalDefinition?.title ?? element?.title ?? `Канал ${channelIndex}`
  const id = internalId ?? `decoded-${moduleKey.toLowerCase()}-${channelIndex.toLowerCase()}`

  return {
    id,
    zoneId: element?.zoneId ?? 'module-zone-0',
    moduleKey,
    channelIndex,
    channelKey,
    signalId,
    channel: channelLabel || channelIndex,
    titleFallback,
    zoneKey: asString(channel.zoneKey, element?.zoneId ?? ''),
    board: asString(channel.board),
    unit: asString(channel.unit),
    topic: asString(channel.topic),
  }
}

function collectBackendChannels(payload: BackendStatePayload): BackendChannel[] {
  const nestedPayload = asRecord((payload as UnknownRecord).payload)
  const nestedState = asRecord((payload as UnknownRecord).state)

  const decodedCandidates = [
    payload.decodedChannels,
    nestedPayload.decodedChannels,
    nestedState.decodedChannels,
  ]

  const legacyCandidates = [
    payload.channels,
    nestedPayload.channels,
    nestedState.channels,
  ]

  const decodedChannels = decodedCandidates
    .map((candidate) => toCollection<BackendChannel>(candidate))
    .find((candidate) => candidate.length > 0)

  if (decodedChannels && decodedChannels.length > 0) {
    return decodedChannels
  }

  return (
    legacyCandidates
      .map((candidate) => toCollection<BackendChannel>(candidate))
      .find((candidate) => candidate.length > 0) ?? []
  )
}

function createFallbackChannelFromElement(
  element: (typeof NODE_WINDOW_ELEMENTS)[number],
  updatedAt: string,
): ChannelState {
  const signalDefinition = SIGNAL_BY_INTERNAL_ID.get(element.signalId)
  const signalId = normalizeSignalId(signalDefinition?.signalId ?? element.backendSignalId)
  const title = signalDefinition?.title ?? element.title

  const info = createNeutralInfo({
    title,
    techNumber: element.channel,
    signalId,
    stateLabel: 'Неизвестно',
    message: '',
    reason: '',
    action: FALLBACK_ACTION,
    severity: 'info',
    isFault: false,
    isActive: false,
  })

  return {
    id: element.signalId,
    channel: element.channel,
    channelIndex: element.channelIndex,
    channelKey: element.channelKey,
    zoneId: element.zoneId,
    title,
    status: 'inactive',
    backendStatus: 'unknown',
    faultText: '',
    lastUpdated: updatedAt,
    info,
    signalId,
    techNumber: element.channel,
    moduleKey: element.moduleKey,
    zoneKey: element.zoneId,
    board: '',
    unit: '',
    topic: '',
    stateLabel: 'Неизвестно',
    message: '',
    cause: '',
    reason: '',
    action: FALLBACK_ACTION,
    severity: 'info',
    event: title,
    input: '-',
    output: '-',
    diagnostic: '-',
    isFault: false,
    isActive: false,
    ledColor: 'dim',
    rowColor: 'muted',
  }
}

function normalizeDecodedChannels(
  payload: BackendStatePayload,
  updatedAt: string,
  previousDecodedChannels: ChannelState[],
): ChannelState[] {
  const backendChannels = collectBackendChannels(payload)
  const byId = new Map(previousDecodedChannels.map((channel) => [channel.id, channel]))

  backendChannels.forEach((channelRaw) => {
    const identity = resolveChannelIdentity(channelRaw)
    const backendStatus = resolveBackendStatus(channelRaw.status)
    const isFaultByStatus =
      backendStatus === 'open_circuit' || backendStatus === 'short_circuit'
    const isFaultByPayload = asBoolean(channelRaw.isFault)
    const severity = normalizeKey(asString(channelRaw.severity))
    const isFault =
      isFaultByPayload === true ||
      isFaultByStatus ||
      severity === 'error' ||
      severity === 'critical'

    const uiStatus = resolveUiStatus(backendStatus, isFault)
    const isActiveFromPayload = asBoolean(channelRaw.isActive)
    const isActive = isActiveFromPayload ?? (uiStatus === 'normal')
    const rowColor = isFault ? 'red' : uiStatus === 'inactive' ? 'muted' : 'normal'
    const ledColor = isFault ? 'red' : uiStatus === 'inactive' ? 'dim' : 'yellow'
    const message = asString(channelRaw.message)
    const cause = asString(channelRaw.cause)
    const reason = asString(channelRaw.reason, cause)
    const action = asString(channelRaw.action)
    const stateLabel = resolveStateLabel(backendStatus, asString(channelRaw.stateLabel))
    const title = asString(channelRaw.title, identity.titleFallback)
    const event = asString(channelRaw.event, title)
    const faultText = isFault ? message || reason || stateLabel : ''
    const channelUpdatedAt = toIsoTimestamp(channelRaw.updatedAt || channelRaw.timestamp || updatedAt)

    const info = createNeutralInfo({
      title,
      techNumber: asString(channelRaw.techNumber, identity.channelIndex),
      signalId: identity.signalId,
      stateLabel,
      message,
      reason,
      action,
      severity: asString(channelRaw.severity, isFault ? 'error' : uiStatus === 'inactive' ? 'warning' : 'info'),
      isFault,
      isActive,
    })

    const normalized: ChannelState = {
      id: identity.id,
      channel: identity.channel,
      channelIndex: identity.channelIndex,
      channelKey: identity.channelKey,
      zoneId: identity.zoneId,
      title,
      status: uiStatus,
      backendStatus,
      faultText,
      lastUpdated: channelUpdatedAt,
      info,
      signalId: identity.signalId,
      techNumber: asString(channelRaw.techNumber, identity.channelIndex),
      moduleKey: identity.moduleKey,
      zoneKey: identity.zoneKey,
      board: identity.board,
      unit: identity.unit,
      topic: identity.topic,
      stateLabel,
      message,
      cause,
      reason,
      action,
      severity: info.severity,
      event,
      input: asString(channelRaw.input, '-'),
      output: asString(channelRaw.output, '-'),
      diagnostic: asString(channelRaw.diagnostic, '-'),
      isFault,
      isActive,
      ledColor,
      rowColor,
    }

    const current = byId.get(identity.id)
    if (!current) {
      byId.set(identity.id, normalized)
      return
    }

    byId.set(identity.id, choosePreferredChannel(current, normalized))
  })

  return Array.from(byId.values())
}

function buildUiChannels(
  decodedChannels: ChannelState[],
  updatedAt: string,
  previousUiChannels: ChannelState[],
): ChannelState[] {
  const decodedById = new Map(decodedChannels.map((channel) => [channel.id, channel]))
  const previousById = new Map(previousUiChannels.map((channel) => [channel.id, channel]))

  return NODE_WINDOW_ELEMENTS.map((element) => {
    const fromDecoded = decodedById.get(element.signalId)
    if (fromDecoded) {
      return fromDecoded
    }

    const fromPrevious = previousById.get(element.signalId)
    if (fromPrevious) {
      return fromPrevious
    }

    return createFallbackChannelFromElement(element, updatedAt)
  })
}

function buildBackendModuleStatusMap(payload: BackendStatePayload): Map<string, ZoneStatus> {
  const nestedPayload = asRecord((payload as UnknownRecord).payload)
  const nestedState = asRecord((payload as UnknownRecord).state)

  const modules = [
    ...toCollection<BackendModule>(payload.modules),
    ...toCollection<BackendModule>(nestedPayload.modules),
    ...toCollection<BackendModule>(nestedState.modules),
  ]

  const map = new Map<string, ZoneStatus>()

  modules.forEach((moduleData) => {
    const key = normalizeKey(asString(moduleData.moduleKey || moduleData.key || moduleData.id || moduleData.name))
    if (!key) {
      return
    }

    const statusToken = normalizeKey(asString(moduleData.status))
    const status: ZoneStatus =
      statusToken === 'fault' || statusToken === 'error' || statusToken === 'critical'
        ? 'fault'
        : statusToken === 'normal' || statusToken === 'ok'
          ? 'normal'
          : 'inactive'

    map.set(key, status)
  })

  return map
}

function describeZoneStatus(status: ZoneStatus): string {
  if (status === 'fault') {
    return 'Есть активная неисправность'
  }

  if (status === 'inactive') {
    return 'Нет данных по каналу'
  }

  return 'Работа в норме'
}

function buildTrainZones(
  decodedChannels: ChannelState[],
  updatedAt: string,
  backendModuleStatusMap: Map<string, ZoneStatus>,
  previousZones: TrainZoneState[],
): TrainZoneState[] {
  const previousMap = new Map(previousZones.map((zone) => [zone.id, zone]))

  const mainModuleChannels = getChannelsByModule(decodedChannels, 'QL6C')
  const secondaryModuleChannels = getChannelsByModule(decodedChannels, 'QL6D')

  const mainStatus =
    mainModuleChannels.length > 0
      ? moduleComputedStatusToZoneStatus(resolveModuleComputedStatus(mainModuleChannels))
      : (backendModuleStatusMap.get('ql6c') ?? previousMap.get('train-main-module')?.status ?? 'inactive')

  const secondaryStatus =
    secondaryModuleChannels.length > 0
      ? moduleComputedStatusToZoneStatus(resolveModuleComputedStatus(secondaryModuleChannels))
      : (backendModuleStatusMap.get('ql6d') ??
        previousMap.get('train-secondary-module')?.status ??
        'inactive')

  return TRAIN_ZONE_DEFS.map((zone) => {
    const status = zone.id === 'train-main-module' ? mainStatus : secondaryStatus

    return {
      id: zone.id,
      status,
      description: describeZoneStatus(status),
      lastUpdated: updatedAt,
    }
  })
}

function buildModuleZones(
  uiChannels: ChannelState[],
  updatedAt: string,
  previousZones: ModuleZoneState[],
): ModuleZoneState[] {
  const channelByZoneId = new Map(uiChannels.map((channel) => [channel.zoneId, channel]))
  const previousMap = new Map(previousZones.map((zone) => [zone.id, zone]))

  return MODULE_PATHS.map((zone) => {
    const channel = channelByZoneId.get(zone.id)
    const status = channel?.status ?? previousMap.get(zone.id)?.status ?? 'inactive'

    return {
      id: zone.id,
      status,
      description: describeZoneStatus(status),
      lastUpdated: channel?.lastUpdated ?? updatedAt,
    }
  })
}

function buildTechnicalSignals(channels: ChannelState[], updatedAt: string): TechnicalSignalState[] {
  const byId = new Map(channels.map((channel) => [channel.id, channel]))

  return TECHNICAL_SIGNAL_DEFS.map((signal) => {
    const channel = byId.get(signal.id)

    if (!channel) {
      return {
        id: signal.id,
        status: 'inactive',
        faultText: '',
        lastUpdated: updatedAt,
        signalId: normalizeSignalId(signal.signalId),
        isFault: false,
      }
    }

    return {
      id: signal.id,
      status: channel.status,
      faultText: channel.faultText,
      lastUpdated: channel.lastUpdated,
      signalId: channel.signalId,
      isFault: channel.isFault,
    }
  })
}

function buildModuleInfoByZone(
  channels: ChannelState[],
  previous: Record<string, ModuleFaultInfo>,
): Record<string, ModuleFaultInfo> {
  const channelsByZone = new Map<string, ChannelState[]>()

  channels.forEach((channel) => {
    const bucket = channelsByZone.get(channel.zoneId)
    if (bucket) {
      bucket.push(channel)
      return
    }

    channelsByZone.set(channel.zoneId, [channel])
  })

  return Object.fromEntries(
    MODULE_PATHS.map((zone) => {
      const zoneChannels = channelsByZone.get(zone.id) ?? []

      if (zoneChannels.length === 0) {
        const previousInfo = previous[zone.id]
        if (previousInfo) {
          return [zone.id, previousInfo]
        }

        return [
          zone.id,
          createNeutralInfo({
            title: 'Канал',
            techNumber: '-',
            signalId: '-',
            stateLabel: 'Неизвестно',
            message: '',
            reason: '',
            action: FALLBACK_ACTION,
            severity: 'info',
            isFault: false,
            isActive: false,
          }),
        ]
      }

      const selected = zoneChannels
        .slice()
        .sort((left, right) => resolvePriority(right) - resolvePriority(left))[0]

      return [zone.id, selected.info]
    }),
  )
}

function normalizeLevel(value: unknown): JournalLevel {
  const normalized = normalizeKey(asString(value))

  if (normalized === 'error' || normalized === 'critical' || normalized === 'fault') {
    return 'error'
  }

  if (normalized === 'warning' || normalized === 'warn') {
    return 'warning'
  }

  return 'info'
}

function buildJournalEntries(
  payload: BackendStatePayload,
  error: string | null,
  decodedChannels: ChannelState[],
): JournalEntry[] {
  const nestedPayload = asRecord((payload as UnknownRecord).payload)
  const nestedState = asRecord((payload as UnknownRecord).state)

  const rawJournal = [
    ...toCollection<BackendJournalEvent>(payload.journal),
    ...toCollection<BackendJournalEvent>(nestedPayload.journal),
    ...toCollection<BackendJournalEvent>(nestedState.journal),
  ]

  if (rawJournal.length > 0) {
    return rawJournal
      .map((record, index) => {
        const timestamp = toIsoTimestamp(record.timestamp || record.updatedAt)
        const reason = asString(record.reason)
        const action = asString(record.action)
        const message =
          asString(record.message) ||
          [reason, action].filter((chunk) => chunk.length > 0).join(' | ') ||
          'Без сообщения'

        return {
          id: asString(record.id, `journal-${index}-${timestamp}`),
          timestamp,
          level: normalizeLevel(record.severity),
          source: asString(record.source, 'Система'),
          channel: asString(record.channel || record.signalId, '-'),
          title: asString(record.title, 'Событие'),
          message,
          signalId: asString(record.signalId),
          reason,
          action,
          severity: asString(record.severity),
        }
      })
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
  }

  const faultChannels = getFaultChannels(decodedChannels)
  if (faultChannels.length > 0) {
    return faultChannels.slice(0, 10).map((channel, index) => ({
      id: `journal-fault-${channel.id}-${index}`,
      timestamp: channel.lastUpdated,
      level: 'error',
      source: channel.moduleKey,
      channel: channel.channelKey,
      title: channel.title,
      message: channel.message || channel.reason || channel.stateLabel,
      signalId: channel.signalId,
      reason: channel.reason,
      action: channel.action,
      severity: channel.severity,
    }))
  }

  if (error) {
    return [
      {
        id: 'journal-backend-offline',
        timestamp: new Date().toISOString(),
        level: 'warning',
        source: 'Backend',
        channel: '-',
        title: 'Backend unavailable',
        message: error,
      },
    ]
  }

  return [
    {
      id: 'journal-empty',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'Система',
      channel: '-',
      title: 'Журнал пуст',
      message: 'События пока не поступали',
    },
  ]
}

function buildSummary(payload: BackendStatePayload, decodedChannels: ChannelState[]): UiSummary {
  const summaryRecord = asRecord(payload.summary)
  const faultChannels = getFaultChannels(decodedChannels)
  const unknownChannels = getUnknownChannels(decodedChannels)

  const faults =
    typeof summaryRecord.faults === 'number'
      ? summaryRecord.faults
      : typeof payload.faultCount === 'number'
        ? payload.faultCount
        : faultChannels.length

  const warnings =
    typeof payload.warningCount === 'number' ? payload.warningCount : unknownChannels.length

  const modulesTotal =
    typeof summaryRecord.modulesTotal === 'number' ? summaryRecord.modulesTotal : 2
  const modulesOnline =
    typeof summaryRecord.modulesOnline === 'number'
      ? summaryRecord.modulesOnline
      : modulesTotal - (warnings > 0 && decodedChannels.length === 0 ? modulesTotal : 0)

  const status = asString(summaryRecord.status) || (faults > 0 ? 'error' : warnings > 0 ? 'warning' : 'normal')

  return {
    status,
    modulesOnline,
    modulesTotal,
    faults,
  }
}

function buildActions(payload: BackendStatePayload): UiActions {
  const actionsRecord = asRecord(payload.actions)
  const tifonValue = asBoolean(actionsRecord.tifon)

  return {
    tifon: tifonValue,
  }
}

export function createEmptyUiSnapshot(
  scenarioId: ScenarioId = 'one-fault',
  connectionState: ConnectionState = 'offline',
  error: string | null = null,
): DataSnapshot {
  const now = new Date().toISOString()
  const channels = NODE_WINDOW_ELEMENTS.map((element) => createFallbackChannelFromElement(element, now))

  return {
    scenarioId,
    decodedChannels: [],
    channels,
    journalEntries: buildJournalEntries({}, error, []),
    trainZones: TRAIN_ZONE_DEFS.map((zone) => ({
      id: zone.id,
      status: 'inactive',
      description: 'Нет данных по каналу',
      lastUpdated: now,
    })),
    moduleZones: MODULE_PATHS.map((zone) => ({
      id: zone.id,
      status: 'inactive',
      description: 'Нет данных по каналу',
      lastUpdated: now,
    })),
    technicalSignals: buildTechnicalSignals(channels, now),
    moduleInfoByZone: buildModuleInfoByZone(channels, {}),
    updatedAt: null,
    summary: {
      status: 'offline',
      modulesOnline: 0,
      modulesTotal: 0,
      faults: 0,
    },
    actions: {
      tifon: undefined,
    },
    connectionState,
    error,
  }
}

export function mapBackendStateToUiState(input: unknown, options: AdapterOptions = {}): DataSnapshot {
  const scenarioId = options.scenarioId ?? 'one-fault'
  const payload = extractPayload(input)
  const updatedAt = toIsoTimestamp(payload.updatedAt || payload.timestamp)
  const previous = options.previousSnapshot

  const decodedChannels = normalizeDecodedChannels(
    payload,
    updatedAt,
    previous?.decodedChannels ?? [],
  )
  const channels = buildUiChannels(decodedChannels, updatedAt, previous?.channels ?? [])
  const backendModuleStatusMap = buildBackendModuleStatusMap(payload)
  const moduleZones = buildModuleZones(channels, updatedAt, previous?.moduleZones ?? [])
  const trainZones = buildTrainZones(
    decodedChannels,
    updatedAt,
    backendModuleStatusMap,
    previous?.trainZones ?? [],
  )
  const technicalSignals = buildTechnicalSignals(channels, updatedAt)
  const moduleInfoByZone = buildModuleInfoByZone(channels, previous?.moduleInfoByZone ?? {})
  const journalEntries = buildJournalEntries(payload, options.error ?? null, decodedChannels)
  const summary = buildSummary(payload, decodedChannels)
  const actions = buildActions(payload)

  return {
    scenarioId,
    decodedChannels,
    channels,
    journalEntries,
    trainZones,
    moduleZones,
    technicalSignals,
    moduleInfoByZone,
    updatedAt,
    summary,
    actions,
    connectionState: options.connectionState ?? 'offline',
    error: options.error ?? null,
  }
}

export const adaptBackendStateToSnapshot = mapBackendStateToUiState

