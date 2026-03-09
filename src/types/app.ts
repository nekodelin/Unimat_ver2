import type { ChannelState } from './channel'
import type { JournalEntry } from './journal'
import type { ModuleFaultInfo } from './module'
import type { TechnicalSignalState } from './signal'
import type { ConnectionState } from './status'
import type { ModuleZoneState, TrainZoneState } from './zone'

export type AppTab = 'train' | 'technical'

export type ScenarioId = 'all-normal' | 'one-fault' | 'multi-fault' | 'no-data'

export interface UiSummary {
  status: string
  modulesOnline: number
  modulesTotal: number
  faults: number
}

export interface UiActions {
  tifon?: boolean
}

export interface DataSnapshot {
  scenarioId: ScenarioId
  decodedChannels: ChannelState[]
  channels: ChannelState[]
  journalEntries: JournalEntry[]
  trainZones: TrainZoneState[]
  moduleZones: ModuleZoneState[]
  technicalSignals: TechnicalSignalState[]
  moduleInfoByZone: Record<string, ModuleFaultInfo>
  updatedAt: string | null
  summary: UiSummary
  actions: UiActions
  connectionState: ConnectionState
  error: string | null
}

