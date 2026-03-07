export type ModuleHotspot = {
  id: string
  title: string
  photoIndex?: number
  status: 'ok' | 'fault' | 'warning' | 'inactive'
  rect: {
    x: number
    y: number
    w: number
    h: number
  }
  info: {
    event: string
    reason: string
    fault: string
    action: string
  }
}

const defaultInfo = {
  event: 'No event',
  reason: '',
  fault: '',
  action: '',
}

export const moduleHotspotsQl6c: ModuleHotspot[] = [
  {
    id: 'ql6c-hook-left',
    title: 'Hook left',
    photoIndex: 1,
    status: 'fault',
    rect: { x: 12, y: 26, w: 24, h: 31 },
    info: defaultInfo,
  },
  {
    id: 'ql6c-sensor-a',
    title: 'Sensor A',
    photoIndex: 2,
    status: 'ok',
    rect: { x: 43, y: 21, w: 19, h: 27 },
    info: defaultInfo,
  },
  {
    id: 'ql6c-sensor-b',
    title: 'Sensor B',
    photoIndex: 3,
    status: 'inactive',
    rect: { x: 66, y: 44, w: 20, h: 32 },
    info: defaultInfo,
  },
]

