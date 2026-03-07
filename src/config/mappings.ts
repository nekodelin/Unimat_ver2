export type ChannelMapping = {
  id: string
  signalId: string
  channelKey: string
  module: string
  board: string
  purpose: string
  title: string
  photoIndex: number | null
}

export const channelMappings: ChannelMapping[] = [
  {
    id: '1s212a',
    signalId: '1s212a',
    channelKey: 'QL6C7',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Крюч слева задвинуть',
    title: '1s212a Крюч слева задвинуть',
    photoIndex: 1,
  },
  {
    id: '1s212b',
    signalId: '1s212b',
    channelKey: 'QL6C6',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Крюч слева выдвинуть',
    title: '1s212b Крюч слева выдвинуть',
    photoIndex: 2,
  },
  {
    id: '1s213a',
    signalId: '1s213a',
    channelKey: 'QL6C9',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Крюч справа задвинуть',
    title: '1s213a Крюч справа задвинуть',
    photoIndex: 3,
  },
  {
    id: '1s213b',
    signalId: '1s213b',
    channelKey: 'QL6C8',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Крюч справа выдвинуть',
    title: '1s213b Крюч справа выдвинуть',
    photoIndex: 4,
  },
  {
    id: '1s247a',
    signalId: '1s247a',
    channelKey: 'QL6CB',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Левый роликовый захват снаружи закрыть',
    title: '1s247a Левый роликовый захват снаружи закрыть',
    photoIndex: 5,
  },
  {
    id: '1s247b',
    signalId: '1s247b',
    channelKey: 'QL6CA',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Левый роликовый захват снаружи открыть',
    title: '1s247b Левый роликовый захват снаружи открыть',
    photoIndex: 6,
  },
  {
    id: '1s248a',
    signalId: '1s248a',
    channelKey: 'QL6CD',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Левый роликовый захват внутри закрыть',
    title: '1s248a Левый роликовый захват внутри закрыть',
    photoIndex: 7,
  },
  {
    id: '1s248b',
    signalId: '1s248b',
    channelKey: 'QL6CC',
    module: 'QL6C',
    board: 'B31/U15',
    purpose: 'Левый роликовый захват внутри открыть',
    title: '1s248b Левый роликовый захват внутри открыть',
    photoIndex: 8,
  },
]

export const zoneMappings: Array<{
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
}> = [
  {
    id: 'train-ql6c-left-hook',
    title: 'Модуль QL6C',
    moduleId: 'QL6C',
    channelIds: channelMappings.filter((item) => item.module === 'QL6C').map((item) => item.id),
    rect: { x: 22, y: 39, w: 11, h: 20 },
  },
  {
    id: 'train-ql1c-center',
    title: 'Модуль QL1C',
    moduleId: 'QL1C',
    channelIds: [],
    rect: { x: 47, y: 38, w: 10, h: 21 },
  },
  {
    id: 'train-a3-right-unit',
    title: 'Узел A3',
    moduleId: 'A3',
    channelIds: [],
    rect: { x: 69, y: 40, w: 12, h: 19 },
  },
]
