export type TrainZoneAction = 'open-existing-modal' | 'show-no-data'
export type TrainZoneVisualState = 'normal' | 'fault' | 'inactive'

export type TrainZone = {
  id: string
  top: string
  left: string
  width: string
  height: string
  action: TrainZoneAction
  sourceZoneId?: string
  statusSourceZoneId?: string
  defaultStatus?: TrainZoneVisualState
  label?: string
}

export const trainZones: TrainZone[] = [
  {
    id: 'main-node',
    left: '58%',
    top: '60%',
    width: '11%',
    height: '8%',
    action: 'open-existing-modal',
    sourceZoneId: 'train-ql6c-left-hook',
    statusSourceZoneId: 'train-ql6c-left-hook',
    defaultStatus: 'inactive',
  },
  {
    id: 'secondary-node',
    left: '60.5%',
    top: '49%',
    width: '2.8%',
    height: '6.5%',
    action: 'show-no-data',
    statusSourceZoneId: 'train-ql1c-center',
    defaultStatus: 'inactive',
    label: 'Данных нет',
  },
]
