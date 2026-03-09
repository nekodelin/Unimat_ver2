import type { TechnicalSignalDefinition } from '../types/signal'

export const TECHNICAL_SIGNAL_DEFS: TechnicalSignalDefinition[] = [
  { id: 'signal-0', channel: '0', signalId: '1s201a', title: '1s201a Подъем ПРУ слева' },
  { id: 'signal-1', channel: '1', signalId: '1s201b', title: '1s201b Опускание ПРУ слева' },
  { id: 'signal-2', channel: '2', signalId: '1s202b', title: '1s202b Подъем ПРУ справа' },
  { id: 'signal-3', channel: '3', signalId: 's1202b', title: 's1202b Опускание ПРУ справа' },
  { id: 'signal-4', channel: '4', signalId: '1s209a', title: '1s209a' },
  { id: 'signal-5', channel: '5', signalId: '1s209b', title: '1s209b' },
  { id: 'signal-6', channel: '6', signalId: '1s212b', title: '1s212b Крюк слева выдвинуть' },
  { id: 'signal-7', channel: '7', signalId: '1s212a', title: '1s212a Крюк слева задвинуть' },
  { id: 'signal-8', channel: '8', signalId: '1s213b', title: '1s213b Крюк справа выдвинуть' },
  { id: 'signal-9', channel: '9', signalId: '1s213a', title: '1s213a Крюк справа задвинуть' },
  {
    id: 'signal-10',
    channel: 'A',
    signalId: '1s247b',
    title: '1s247b Левый роликовый захват снаружи открыть',
  },
  {
    id: 'signal-11',
    channel: 'B',
    signalId: '1s247a',
    title: '1s247a Левый роликовый захват снаружи закрыть',
  },
  {
    id: 'signal-12',
    channel: 'C',
    signalId: '1s248b',
    title: '1s248b Левый роликовый захват внутри открыть',
  },
  {
    id: 'signal-13',
    channel: 'D',
    signalId: '1s248a',
    title: '1s248a Левый роликовый захват внутри закрыть',
  },
  { id: 'signal-14', channel: 'E', signalId: '1s210a', title: '1s210a' },
  { id: 'signal-15', channel: 'F', signalId: '1s210b', title: '1s210b' },
]

