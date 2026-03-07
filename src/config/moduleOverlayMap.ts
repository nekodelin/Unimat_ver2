export type OverlayModuleId = 'QL6C' | 'QL6D'

export type OverlayPoint = {
  x: number
  y: number
}

export type OverlayZone = {
  id: number
  key: string
  title: string
  module: OverlayModuleId
  channelKey: string
  channelIndex: string
  signalIds: string[]
  polygonPercent: OverlayPoint[]
}

function rectPolygon(x: number, y: number, w: number, h: number): OverlayPoint[] {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ]
}

export const moduleSignalMap: Record<OverlayModuleId, Record<string, string[]>> = {
  QL6C: {
    '0': ['1s201a'],
    '1': ['1s201b'],
    '2': ['1s202a'],
    '3': ['1s202b', 's1202b'],
    '4': [],
    '5': [],
    '6': ['1s212b'],
    '7': ['1s212a'],
    '8': ['1s213b'],
    '9': ['1s213a'],
    A: ['1s247b'],
    B: ['1s247a'],
    C: ['1s248b'],
    D: ['1s248a'],
    E: [],
    F: [],
  },
  QL6D: {
    '0': ['1s250b'],
    '1': ['1s250a'],
    '2': ['1s251b'],
    '3': ['1s251a'],
  },
}

export const moduleOverlayZones: OverlayZone[] = [
  {
    id: 1,
    key: 'zone-1',
    title: 'Подъем ПРУ слева',
    module: 'QL6C',
    channelKey: 'QL6C0',
    channelIndex: '0',
    signalIds: moduleSignalMap.QL6C['0'],
    polygonPercent: rectPolygon(22.8, 76, 6.2, 9.6),
  },
  {
    id: 2,
    key: 'zone-2',
    title: 'Опускание ПРУ слева',
    module: 'QL6C',
    channelKey: 'QL6C1',
    channelIndex: '1',
    signalIds: moduleSignalMap.QL6C['1'],
    polygonPercent: rectPolygon(34.7, 76, 6.2, 9.6),
  },
  {
    id: 3,
    key: 'zone-3',
    title: 'Подъем ПРУ справа',
    module: 'QL6C',
    channelKey: 'QL6C2',
    channelIndex: '2',
    signalIds: moduleSignalMap.QL6C['2'],
    polygonPercent: rectPolygon(46.7, 76, 6.2, 9.6),
  },
  {
    id: 4,
    key: 'zone-4',
    title: 'Опускание ПРУ справа',
    module: 'QL6C',
    channelKey: 'QL6C3',
    channelIndex: '3',
    signalIds: moduleSignalMap.QL6C['3'],
    polygonPercent: rectPolygon(58.7, 76, 6.2, 9.6),
  },
  {
    id: 5,
    key: 'zone-5',
    title: 'Правый роликовый захват снаружи открыть',
    module: 'QL6C',
    channelKey: 'QL6C4',
    channelIndex: '4',
    signalIds: moduleSignalMap.QL6C['4'],
    polygonPercent: rectPolygon(22.8, 61.7, 6.2, 9.6),
  },
  {
    id: 6,
    key: 'zone-6',
    title: 'Правый роликовый захват снаружи закрыть',
    module: 'QL6C',
    channelKey: 'QL6C5',
    channelIndex: '5',
    signalIds: moduleSignalMap.QL6C['5'],
    polygonPercent: rectPolygon(34.7, 61.7, 6.2, 9.6),
  },
  {
    id: 7,
    key: 'zone-7',
    title: 'Крюк слева выдвинуть',
    module: 'QL6C',
    channelKey: 'QL6C6',
    channelIndex: '6',
    signalIds: moduleSignalMap.QL6C['6'],
    polygonPercent: rectPolygon(46.7, 61.7, 6.2, 9.6),
  },
  {
    id: 8,
    key: 'zone-8',
    title: 'Крюк слева задвинуть',
    module: 'QL6C',
    channelKey: 'QL6C7',
    channelIndex: '7',
    signalIds: moduleSignalMap.QL6C['7'],
    polygonPercent: rectPolygon(58.7, 61.7, 6.2, 9.6),
  },
  {
    id: 9,
    key: 'zone-9',
    title: 'Крюк справа выдвинуть',
    module: 'QL6C',
    channelKey: 'QL6C8',
    channelIndex: '8',
    signalIds: moduleSignalMap.QL6C['8'],
    polygonPercent: rectPolygon(22.8, 47.4, 6.2, 9.6),
  },
  {
    id: 10,
    key: 'zone-10',
    title: 'Крюк справа задвинуть',
    module: 'QL6C',
    channelKey: 'QL6C9',
    channelIndex: '9',
    signalIds: moduleSignalMap.QL6C['9'],
    polygonPercent: rectPolygon(34.7, 47.4, 6.2, 9.6),
  },
  {
    id: 11,
    key: 'zone-11',
    title: 'Левый роликовый захват снаружи открыть',
    module: 'QL6C',
    channelKey: 'QL6CA',
    channelIndex: 'A',
    signalIds: moduleSignalMap.QL6C.A,
    polygonPercent: rectPolygon(46.7, 47.4, 6.2, 9.6),
  },
  {
    id: 12,
    key: 'zone-12',
    title: 'Левый роликовый захват снаружи закрыть',
    module: 'QL6C',
    channelKey: 'QL6CB',
    channelIndex: 'B',
    signalIds: moduleSignalMap.QL6C.B,
    polygonPercent: rectPolygon(58.7, 47.4, 6.2, 9.6),
  },
  {
    id: 13,
    key: 'zone-13',
    title: 'Левый роликовый захват внутри открыть',
    module: 'QL6C',
    channelKey: 'QL6CC',
    channelIndex: 'C',
    signalIds: moduleSignalMap.QL6C.C,
    polygonPercent: rectPolygon(34.7, 33.6, 6.2, 9.2),
  },
  {
    id: 14,
    key: 'zone-14',
    title: 'Левый роликовый захват внутри закрыть',
    module: 'QL6C',
    channelKey: 'QL6CD',
    channelIndex: 'D',
    signalIds: moduleSignalMap.QL6C.D,
    polygonPercent: rectPolygon(46.7, 33.6, 6.2, 9.2),
  },
  {
    id: 15,
    key: 'zone-15',
    title: 'Резервный канал E',
    module: 'QL6C',
    channelKey: 'QL6CE',
    channelIndex: 'E',
    signalIds: moduleSignalMap.QL6C.E,
    polygonPercent: rectPolygon(39.9, 20.8, 4.8, 10.4),
  },
  {
    id: 16,
    key: 'zone-16',
    title: 'Резервный канал F',
    module: 'QL6C',
    channelKey: 'QL6CF',
    channelIndex: 'F',
    signalIds: moduleSignalMap.QL6C.F,
    polygonPercent: rectPolygon(47.9, 20.8, 4.8, 10.4),
  },
]
