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

export type ConnectionIndicatorTone = 'green' | 'yellow' | 'red' | 'gray'

export type ConnectionDiagnosticSeverity = 'normal' | 'warning' | 'error' | 'unknown'

export interface ConnectionStatusItem {
  id: string
  label: string
  tone: ConnectionIndicatorTone
  details?: string
  lastSuccessAt?: string | null
}

export interface ConnectionDiagnostics {
  problemTitle: string
  recommendedAction: string
  severity: ConnectionDiagnosticSeverity
  statuses: ConnectionStatusItem[]
  lastUpdatedAt?: string | null
  lastSuccessfulExchangeAt?: string | null
  lastUpdatedAgo?: number | string | null
  lastSuccessfulExchangeAgo?: number | string | null
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
  connectionDiagnostics: ConnectionDiagnostics | null
  summary: UiSummary
  actions: UiActions
  connectionState: ConnectionState
  error: string | null
}

