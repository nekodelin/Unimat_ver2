import type { ZoneStatus } from './status'

export interface TechnicalSignalDefinition {
  id: string
  channel: string
  signalId: string
  title: string
}

export interface TechnicalSignalState {
  id: string
  status: ZoneStatus
  faultText: string
  lastUpdated: string
  signalId: string
  isFault: boolean
}

