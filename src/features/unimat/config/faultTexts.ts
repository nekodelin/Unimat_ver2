import type { DecodedChannelStatus } from '../../../types/unimat'

type FaultStatus = Extract<DecodedChannelStatus, 'open_circuit' | 'short_circuit'>

type FaultStatusTextMap = Partial<Record<FaultStatus, string>>

export const UNIMAT_FAULT_TEXTS: Record<string, FaultStatusTextMap> = {
  '1s212a': {
    open_circuit: 'Крюк слева не задвинуть',
    short_circuit: 'Крюк слева не задвинуть',
  },
  '1s212b': {
    open_circuit: 'Крюк слева не выдвинуть',
    short_circuit: 'Крюк слева не выдвинуть',
  },
  '1s213a': {
    open_circuit: 'Крюк справа не задвинуть',
    short_circuit: 'Крюк справа не задвинуть',
  },
  '1s213b': {
    open_circuit: 'Крюк справа не выдвинуть',
    short_circuit: 'Крюк справа не выдвинуть',
  },
  '1s247a': {
    open_circuit: 'Левый роликовый захват снаружи не закрыть',
    short_circuit: 'Левый роликовый захват снаружи не закрыть',
  },
  '1s247b': {
    open_circuit: 'Левый роликовый захват снаружи не открыть',
    short_circuit: 'Левый роликовый захват снаружи не открыть',
  },
  '1s248a': {
    open_circuit: 'Левый роликовый захват внутри не закрыть',
    short_circuit: 'Левый роликовый захват внутри не закрыть',
  },
  '1s248b': {
    open_circuit: 'Левый роликовый захват внутри не открыть',
    short_circuit: 'Левый роликовый захват внутри не открыть',
  },
}
