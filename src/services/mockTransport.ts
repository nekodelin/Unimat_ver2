import { SIGNAL_FAULT_CATALOG, getModuleFaultInfo } from '../data/faultCatalog'
import { MODULE_PATHS } from '../data/modulePaths.generated'
import { TECHNICAL_SIGNAL_DEFS } from '../data/mockSignals'
import { NODE_WINDOW_ELEMENTS } from '../data/nodeWindowElements'
import { TRAIN_ZONE_DEFS } from '../data/zones'
import type { DataSnapshot, ScenarioId } from '../types/app'
import type { ChannelState } from '../types/channel'
import type { JournalEntry } from '../types/journal'
import type { ModuleZoneState, TrainZoneState } from '../types/zone'
import type { ZoneStatus } from '../types/status'
import type { DataTransport, SnapshotListener } from './transport'
import { createEmptyUiSnapshot } from './backendStateAdapter'

interface ScenarioSpec {
  trainFault: string[]
  trainInactive: string[]
  moduleFault: string[]
  moduleInactive: string[]
  signalFault: string[]
  signalInactive: string[]
}

const SCENARIO_SPECS: Record<ScenarioId, ScenarioSpec> = {
  'all-normal': {
    trainFault: [],
    trainInactive: [],
    moduleFault: [],
    moduleInactive: MODULE_PATHS.filter((zone) => zone.defaultStatus === 'inactive').map(
      (zone) => zone.id,
    ),
    signalFault: [],
    signalInactive: [],
  },
  'one-fault': {
    trainFault: ['train-main-module'],
    trainInactive: [],
    moduleFault: ['module-zone-1', 'module-zone-5'],
    moduleInactive: MODULE_PATHS.filter((zone) => zone.defaultStatus === 'inactive').map(
      (zone) => zone.id,
    ),
    signalFault: ['signal-6'],
    signalInactive: ['signal-4', 'signal-5', 'signal-14', 'signal-15'],
  },
  'multi-fault': {
    trainFault: ['train-main-module'],
    trainInactive: ['train-secondary-module'],
    moduleFault: ['module-zone-1', 'module-zone-5', 'module-zone-8', 'module-zone-12'],
    moduleInactive: MODULE_PATHS.filter((zone) => zone.defaultStatus === 'inactive')
      .map((zone) => zone.id)
      .filter((id) => id !== 'module-zone-8'),
    signalFault: ['signal-6', 'signal-8', 'signal-11', 'signal-12'],
    signalInactive: ['signal-4', 'signal-5', 'signal-14', 'signal-15'],
  },
  'no-data': {
    trainFault: [],
    trainInactive: TRAIN_ZONE_DEFS.map((zone) => zone.id),
    moduleFault: [],
    moduleInactive: MODULE_PATHS.map((zone) => zone.id),
    signalFault: [],
    signalInactive: TECHNICAL_SIGNAL_DEFS.map((signal) => signal.id),
  },
}

const MOCK_RUNTIME_ENABLED = import.meta.env.DEV

function resolveStatus(id: string, faults: string[], inactive: string[]): ZoneStatus {
  if (faults.includes(id)) {
    return 'fault'
  }

  if (inactive.includes(id)) {
    return 'inactive'
  }

  return 'normal'
}

function buildTrainZones(scenario: ScenarioSpec, timestamp: string): TrainZoneState[] {
  return TRAIN_ZONE_DEFS.map((zone) => {
    const status = resolveStatus(zone.id, scenario.trainFault, scenario.trainInactive)

    return {
      id: zone.id,
      status,
      description:
        status === 'fault'
          ? 'Есть активная неисправность'
          : status === 'inactive'
            ? 'Нет данных по каналу'
            : 'Работа в норме',
      lastUpdated: timestamp,
    }
  })
}

function buildChannels(scenario: ScenarioSpec, timestamp: string): ChannelState[] {
  const signalByInternalId = new Map(TECHNICAL_SIGNAL_DEFS.map((signal) => [signal.id, signal]))

  return NODE_WINDOW_ELEMENTS.map((element) => {
    const status = resolveStatus(element.signalId, scenario.signalFault, scenario.signalInactive)
    const definition = signalByInternalId.get(element.signalId)
    const moduleInfo = getModuleFaultInfo(element.zoneId)
    const isFault = status === 'fault'
    const faultText = isFault ? SIGNAL_FAULT_CATALOG[element.signalId] ?? moduleInfo.fault : ''
    const backendStatus =
      status === 'fault'
        ? ('open_circuit' as const)
        : status === 'inactive'
          ? ('unknown' as const)
          : ('normal' as const)

    return {
      id: element.signalId,
      channel: element.channel,
      channelIndex: element.channelIndex,
      channelKey: element.channelKey,
      zoneId: element.zoneId,
      title: element.title,
      status,
      backendStatus,
      faultText,
      lastUpdated: timestamp,
      info: {
        ...moduleInfo,
        fault: faultText || moduleInfo.fault,
        signalId: definition?.signalId ?? element.backendSignalId,
        title: element.title,
        isFault,
        isActive: status === 'normal',
      },
      signalId: (definition?.signalId ?? element.backendSignalId).trim().toLowerCase(),
      techNumber: definition?.channel ?? element.channel,
      moduleKey: element.moduleKey,
      zoneKey: element.zoneId,
      board: '',
      unit: '',
      topic: '',
      stateLabel: isFault ? 'Обрыв' : status === 'inactive' ? 'Неизвестно' : 'Норма',
      message: faultText,
      cause: moduleInfo.cause || moduleInfo.reason,
      reason: moduleInfo.reason,
      action: moduleInfo.action,
      severity: isFault ? 'error' : status === 'inactive' ? 'warning' : 'info',
      event: moduleInfo.event,
      input: '-',
      output: '-',
      diagnostic: '-',
      isFault,
      isActive: status === 'normal',
      ledColor: isFault ? 'red' : status === 'inactive' ? 'dim' : 'yellow',
      rowColor: isFault ? 'red' : status === 'inactive' ? 'muted' : 'normal',
    }
  })
}

function buildModuleZones(
  scenario: ScenarioSpec,
  channels: ChannelState[],
  timestamp: string,
): ModuleZoneState[] {
  const statusByZoneId = new Map(channels.map((channel) => [channel.zoneId, channel.status]))

  return MODULE_PATHS.map((zone) => {
    const status =
      statusByZoneId.get(zone.id) ?? resolveStatus(zone.id, scenario.moduleFault, scenario.moduleInactive)

    return {
      id: zone.id,
      status,
      description:
        status === 'fault'
          ? getModuleFaultInfo(zone.id).fault
          : status === 'inactive'
            ? 'Элемент недоступен'
            : 'Элемент работает в штатном режиме',
      lastUpdated: timestamp,
    }
  })
}

function buildSignals(channels: ChannelState[], timestamp: string) {
  const channelBySignalId = new Map(channels.map((channel) => [channel.id, channel]))

  return TECHNICAL_SIGNAL_DEFS.map((signal) => {
    const channel = channelBySignalId.get(signal.id)
    const status = channel?.status ?? 'inactive'

    return {
      id: signal.id,
      status,
      faultText: status === 'fault' ? channel?.faultText ?? '' : '',
      lastUpdated: timestamp,
      signalId: signal.signalId,
      isFault: status === 'fault',
    }
  })
}

function buildModuleInfoByZone(channels: ChannelState[]) {
  const infoByZoneId = new Map(channels.map((channel) => [channel.zoneId, channel.info]))

  return Object.fromEntries(
    MODULE_PATHS.map((zone) => [zone.id, infoByZoneId.get(zone.id) ?? getModuleFaultInfo(zone.id)]),
  )
}

function buildJournalEntries(
  channels: ChannelState[],
  trainZones: TrainZoneState[],
  timestamp: string,
): JournalEntry[] {
  const entries: JournalEntry[] = []

  channels.forEach((channel) => {
    if (channel.status === 'normal') {
      return
    }

    entries.push({
      id: `journal-${channel.id}-${timestamp}`,
      timestamp,
      level: channel.status === 'fault' ? 'error' : 'warning',
      source: channel.moduleKey,
      channel: channel.channel,
      title: channel.title,
      message:
        channel.status === 'fault'
          ? channel.faultText || channel.info.fault
          : 'Канал неактивен или нет данных',
    })
  })

  trainZones.forEach((zone) => {
    if (zone.status === 'normal') {
      return
    }

    entries.push({
      id: `journal-train-${zone.id}-${timestamp}`,
      timestamp,
      level: zone.status === 'fault' ? 'error' : 'warning',
      source: 'Поезд',
      channel: '-',
      title: zone.id,
      message: zone.description,
    })
  })

  if (entries.length === 0) {
    entries.push({
      id: `journal-info-${timestamp}`,
      timestamp,
      level: 'info',
      source: 'Система',
      channel: '-',
      title: 'Состояние системы',
      message: 'Активных отказов не обнаружено',
    })
  }

  return entries
}

function buildSnapshot(scenarioId: ScenarioId): DataSnapshot {
  const timestamp = new Date().toISOString()
  const scenario = SCENARIO_SPECS[scenarioId]

  const trainZones = buildTrainZones(scenario, timestamp)
  const channels = buildChannels(scenario, timestamp)
  const moduleZones = buildModuleZones(scenario, channels, timestamp)
  const technicalSignals = buildSignals(channels, timestamp)
  const moduleInfoByZone = buildModuleInfoByZone(channels)
  const journalEntries = buildJournalEntries(channels, trainZones, timestamp)

  return {
    scenarioId,
    decodedChannels: channels,
    channels,
    journalEntries,
    trainZones,
    moduleZones,
    technicalSignals,
    moduleInfoByZone,
    updatedAt: timestamp,
    summary: {
      status: scenarioId === 'all-normal' ? 'normal' : 'warning',
      modulesOnline: 2,
      modulesTotal: 2,
      faults: channels.filter((channel) => channel.isFault).length,
    },
    actions: {
      tifon: false,
    },
    connectionState: 'connected',
    error: null,
  }
}

class MockTransport implements DataTransport {
  private listeners = new Set<SnapshotListener>()

  private scenarioId: ScenarioId = 'one-fault'

  private timer: number | undefined

  connect(): void {
    if (!MOCK_RUNTIME_ENABLED) {
      return
    }

    this.emitSnapshot()

    if (typeof window !== 'undefined') {
      this.timer = window.setInterval(() => this.emitSnapshot(), 5000)
    }
  }

  disconnect(): void {
    if (this.timer !== undefined && typeof window !== 'undefined') {
      window.clearInterval(this.timer)
      this.timer = undefined
    }
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener)
    listener(
      MOCK_RUNTIME_ENABLED
        ? buildSnapshot(this.scenarioId)
        : createEmptyUiSnapshot(this.scenarioId, 'offline', null),
    )

    return () => {
      this.listeners.delete(listener)
    }
  }

  setScenario(scenarioId: ScenarioId): void {
    if (!MOCK_RUNTIME_ENABLED) {
      return
    }

    this.scenarioId = scenarioId
    this.emitSnapshot()
  }

  getScenario(): ScenarioId {
    return this.scenarioId
  }

  private emitSnapshot(): void {
    if (!MOCK_RUNTIME_ENABLED) {
      return
    }

    const snapshot = buildSnapshot(this.scenarioId)
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

export const mockTransport = new MockTransport()

