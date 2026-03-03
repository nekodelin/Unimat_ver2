export type ModuleHotspot = {
  id: string
  title: string
  status: 'ok' | 'fault' | 'inactive'
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
  event: '1s212b Крюк с лева не выдвинуть',
  reason: 'Не проходит сигнал',
  fault: 'Обрыв кабеля',
  action: 'Проверить подключение в блоке',
}

export const moduleHotspotsQl6c: ModuleHotspot[] = [
  {
    id: 'ql6c-hook-left',
    title: 'Крюк слева',
    status: 'fault',
    rect: { x: 12, y: 26, w: 24, h: 31 },
    info: defaultInfo,
  },
  {
    id: 'ql6c-sensor-a',
    title: 'Датчик A',
    status: 'ok',
    rect: { x: 43, y: 21, w: 19, h: 27 },
    info: defaultInfo,
  },
  {
    id: 'ql6c-sensor-b',
    title: 'Датчик B',
    status: 'inactive',
    rect: { x: 66, y: 44, w: 20, h: 32 },
    info: defaultInfo,
  },
]
