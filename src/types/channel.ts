import type { ModuleFaultInfo } from './module'
import type { LedColor, RowColor, ZoneStatus } from './status'

export type ChannelBackendStatus = 'normal' | 'open_circuit' | 'short_circuit' | 'unknown'

export interface ChannelState {
  id: string
  channel: string
  channelIndex: string
  channelKey: string
  zoneId: string
  title: string
  status: ZoneStatus
  backendStatus: ChannelBackendStatus
  faultText: string
  lastUpdated: string
  info: ModuleFaultInfo
  signalId: string
  techNumber: string
  moduleKey: string
  zoneKey: string
  board: string
  unit: string
  topic: string
  stateLabel: string
  message: string
  cause: string
  reason: string
  action: string
  severity: string
  event: string
  input: string
  output: string
  diagnostic: string
  isFault: boolean
  isActive: boolean
  yellowLed: boolean
  redLed: boolean
  ledColor: LedColor
  rowColor: RowColor
}
