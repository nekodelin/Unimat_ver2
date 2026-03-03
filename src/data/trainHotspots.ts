export type HotspotStatus = 'ok' | 'fault' | 'inactive'

export type TrainHotspot = {
  id: string
  label: string
  rect: {
    x: number
    y: number
    w: number
    h: number
  }
  status: HotspotStatus
  moduleId: 'QL6C' | string
}

export const trainHotspots: TrainHotspot[] = [
  {
    id: 'train-ql6c-left-hook',
    label: 'Модуль QL6C',
    rect: { x: 22, y: 39, w: 11, h: 20 },
    status: 'ok',
    moduleId: 'QL6C',
  },
  {
    id: 'train-ql1c-center',
    label: 'Модуль QL1C',
    rect: { x: 47, y: 38, w: 10, h: 21 },
    status: 'inactive',
    moduleId: 'QL1C',
  },
  {
    id: 'train-a3-right-unit',
    label: 'Узел A3',
    rect: { x: 69, y: 40, w: 12, h: 19 },
    status: 'fault',
    moduleId: 'A3',
  },
]
