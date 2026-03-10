import type { ChannelState } from './channel'

export type TrainZonesState = 'normal' | 'warning' | 'fault'

export type DecodedChannelStatus = 'normal' | 'open_circuit' | 'short_circuit' | 'unknown'

export type ModuleRowVisualState = 'normal' | 'fault' | 'inactive'

export interface UnimatTechRowConfig {
  id: string
  moduleKey: string
  channelIndex: string
  signalId: string | null
  title: string
}

export interface UnimatModuleRowState {
  id: string
  moduleKey: string
  channelIndex: string
  channelLabel: string
  signalId: string | null
  title: string
  visualState: ModuleRowVisualState
  decodedStatus: DecodedChannelStatus | 'no_data'
  faultText: string
  channel: ChannelState | null
}
