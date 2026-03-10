export type BackendDecodedStatus = 'normal' | 'open_circuit' | 'short_circuit' | 'unknown'

export interface BackendChannel {
  channelKey?: string
  channel?: string
  channelIndex?: string | number
  topic?: string
  board?: string
  unit?: string
  module?: string
  moduleKey?: string
  zoneKey?: string
  signalId?: string
  title?: string
  techNumber?: string
  input?: string | number
  output?: string | number
  diagnostic?: string | number
  status?: string
  stateLabel?: string
  message?: string
  cause?: string | null
  reason?: string | null
  action?: string | null
  severity?: string
  isFault?: boolean
  ledColor?: string
  rowColor?: string
  yellow_led?: boolean | string | number
  red_led?: boolean | string | number
  yellowLed?: boolean | string | number
  redLed?: boolean | string | number
  isActive?: boolean
  event?: string
  timestamp?: string
  updatedAt?: string
}

export interface BackendZone {
  id?: string
  key?: string
  zoneKey?: string
  name?: string
  title?: string
  status?: string
  updatedAt?: string
  timestamp?: string
}

export interface BackendModule {
  id?: string
  key?: string
  moduleKey?: string
  name?: string
  status?: string
  updatedAt?: string
  timestamp?: string
}

export interface BackendJournalEvent {
  id?: string
  timestamp?: string
  updatedAt?: string
  signalId?: string
  channel?: string
  channelIndex?: string | number
  channelKey?: string
  title?: string
  message?: string
  reason?: string
  action?: string
  severity?: string
  source?: string
}

export interface BackendSummary {
  status?: string
  modulesOnline?: number
  modulesTotal?: number
  faults?: number
}

export interface BackendStatePayload {
  updatedAt?: string
  timestamp?: string
  source?: string
  raw?: {
    in?: number
    inversed?: number
    out?: number
    other?: number
  }
  channels?: BackendChannel[] | Record<string, BackendChannel>
  decodedChannels?: BackendChannel[] | Record<string, BackendChannel>
  modules?: BackendModule[] | Record<string, BackendModule>
  zones?: BackendZone[] | Record<string, BackendZone>
  journal?: BackendJournalEvent[]
  faultCount?: number
  warningCount?: number
  normalCount?: number
  summary?: BackendSummary
  actions?: {
    tifon?: boolean
  }
}
