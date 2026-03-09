import type { ZoneStatus } from './status'

export type TrainZoneAction = 'open-module' | 'show-no-data'

export interface TrainZoneShape {
  path: string
  viewBoxWidth: number
  viewBoxHeight: number
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
}

export interface TrainZoneDefinition {
  id: string
  title: string
  description: string
  action: TrainZoneAction
  shape: TrainZoneShape
}

export interface TrainZoneState {
  id: string
  status: ZoneStatus
  description: string
  lastUpdated: string
}

export interface ModuleZoneDefinition {
  id: string
  title: string
  description: string
  path: string
}

export interface ModuleZoneState {
  id: string
  status: ZoneStatus
  description: string
  lastUpdated: string
}
