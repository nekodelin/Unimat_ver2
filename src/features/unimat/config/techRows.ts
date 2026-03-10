import { getChannelBindingByModuleAndIndex } from '../../../data/channelMapping'
import type { UnimatTechRowConfig } from '../../../types/unimat'

const MODULE_KEY = 'QL6C'

function resolveSignalId(channelIndex: string): string | null {
  return getChannelBindingByModuleAndIndex(MODULE_KEY, channelIndex)?.signalId ?? null
}

export const UNIMAT_TECH_ROWS_QL6C: UnimatTechRowConfig[] = [
  { id: 'ql6c-0', moduleKey: 'QL6C', channelIndex: '0', signalId: null, title: '' },
  { id: 'ql6c-1', moduleKey: 'QL6C', channelIndex: '1', signalId: null, title: '' },
  { id: 'ql6c-2', moduleKey: 'QL6C', channelIndex: '2', signalId: null, title: '' },
  { id: 'ql6c-3', moduleKey: 'QL6C', channelIndex: '3', signalId: null, title: '' },
  { id: 'ql6c-4', moduleKey: 'QL6C', channelIndex: '4', signalId: null, title: '' },
  { id: 'ql6c-5', moduleKey: 'QL6C', channelIndex: '5', signalId: null, title: '' },
  { id: 'ql6c-6', moduleKey: 'QL6C', channelIndex: '6', signalId: resolveSignalId('6'), title: 'Крюк слева выдвинуть' },
  { id: 'ql6c-7', moduleKey: 'QL6C', channelIndex: '7', signalId: resolveSignalId('7'), title: 'Крюк слева задвинуть' },
  { id: 'ql6c-8', moduleKey: 'QL6C', channelIndex: '8', signalId: resolveSignalId('8'), title: 'Крюк справа выдвинуть' },
  { id: 'ql6c-9', moduleKey: 'QL6C', channelIndex: '9', signalId: resolveSignalId('9'), title: 'Крюк справа задвинуть' },
  {
    id: 'ql6c-A',
    moduleKey: 'QL6C',
    channelIndex: 'A',
    signalId: resolveSignalId('A'),
    title: 'Левый роликовый захват снаружи открыть',
  },
  {
    id: 'ql6c-B',
    moduleKey: 'QL6C',
    channelIndex: 'B',
    signalId: resolveSignalId('B'),
    title: 'Левый роликовый захват снаружи закрыть',
  },
  {
    id: 'ql6c-C',
    moduleKey: 'QL6C',
    channelIndex: 'C',
    signalId: resolveSignalId('C'),
    title: 'Левый роликовый захват внутри открыть',
  },
  {
    id: 'ql6c-D',
    moduleKey: 'QL6C',
    channelIndex: 'D',
    signalId: resolveSignalId('D'),
    title: 'Левый роликовый захват внутри закрыть',
  },
  { id: 'ql6c-E', moduleKey: 'QL6C', channelIndex: 'E', signalId: null, title: '' },
  { id: 'ql6c-F', moduleKey: 'QL6C', channelIndex: 'F', signalId: null, title: '' },
]
