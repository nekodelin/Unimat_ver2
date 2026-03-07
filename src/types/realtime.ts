export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'

export type ChannelStatus = 'normal' | 'active' | 'breakage' | 'short_circuit' | 'inactive' | 'unknown'

export type Severity = 'info' | 'warning' | 'error'

export type SnapshotSummary = {
  totalChannels: number
  faultCount: number
  warningCount: number
  normalCount: number
  moduleStatus: Record<string, ChannelStatus>
}

export type ChannelEntity = {
  id: string
  signalId: string
  channelKey: string
  module: string
  board: string
  purpose: string
  title: string
  photoIndex: number | null
  status: ChannelStatus
  stateLabel: string
  cause: string
  action: string
  severity: Severity
  isFault: boolean
  input: number | null
  output: number | null
  diagnostic: number | null
  updatedAt: number
}

export type ModuleEntity = {
  id: string
  title: string
  board: string
  channelIds: string[]
  status: ChannelStatus
  faultCount: number
}

export type ZoneEntity = {
  id: string
  title: string
  moduleId: string
  channelIds: string[]
  rect: {
    x: number
    y: number
    w: number
    h: number
  }
  status: ChannelStatus
}

export type JournalLevel = 'info' | 'warning' | 'error'

export type JournalEntry = {
  id: string
  ts: number
  level: JournalLevel
  module: string
  signalId: string
  title: string
  reason: string
  action: string
  text: string
  status?: ChannelStatus
}

export type RealtimeState = {
  channelsById: Record<string, ChannelEntity>
  modulesById: Record<string, ModuleEntity>
  zonesById: Record<string, ZoneEntity>
  journal: JournalEntry[]
  summary: SnapshotSummary
  connectionStatus: RealtimeConnectionStatus
  lastUpdateAt: number | null
  loading: boolean
  error: string | null
  demoMode: boolean
}
