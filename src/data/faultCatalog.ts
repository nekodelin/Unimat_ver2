import type { ModuleFaultInfo } from '../types/module'

const DEFAULT_MODULE_INFO: ModuleFaultInfo = {
  event: 'Нет утвержденного текста',
  cause: 'Причина уточняется',
  fault: 'Неисправность не обнаружена',
  action: 'Проверить цепь исполнительного механизма',
  title: 'Канал',
  techNumber: '-',
  signalId: '-',
  stateLabel: 'Нет данных',
  message: '',
  reason: 'Причина уточняется',
  severity: 'info',
  isFault: false,
  isActive: false,
}

export const MODULE_FAULT_CATALOG: Record<string, ModuleFaultInfo> = {
  'module-zone-1': {
    ...DEFAULT_MODULE_INFO,
    event: '1s212b Крюк с лева не выдвинуть',
    cause: 'Не проходит сигнал',
    fault: 'Обрыв кабеля',
    title: '1s212b Крюк слева выдвинуть',
    techNumber: '6',
    signalId: '1s212b',
    stateLabel: 'Ошибка',
    message: 'Обрыв кабеля',
    reason: 'Не проходит сигнал',
    severity: 'error',
    isFault: true,
    action: 'Проверить подключение в блоке',
  },
  'module-zone-5': {
    ...DEFAULT_MODULE_INFO,
    event: '1s212b Крюк с лева не выдвинуть',
    cause: 'Нет подтверждения положения',
    fault: 'Срабатывание защиты канала',
    title: '1s212b Крюк слева выдвинуть',
    techNumber: '6',
    signalId: '1s212b',
    stateLabel: 'Ошибка',
    message: 'Срабатывание защиты канала',
    reason: 'Нет подтверждения положения',
    severity: 'error',
    isFault: true,
    action: 'Проверить разъем и питание клапана',
  },
  'module-zone-8': {
    ...DEFAULT_MODULE_INFO,
    event: '1s213b Крюк справа не выдвинуть',
    cause: 'Заниженное давление',
    fault: 'Гидролиния загрязнена',
    title: '1s213b Крюк справа выдвинуть',
    techNumber: '8',
    signalId: '1s213b',
    stateLabel: 'Ошибка',
    message: 'Гидролиния загрязнена',
    reason: 'Заниженное давление',
    severity: 'error',
    isFault: true,
    action: 'Проверить фильтр и дроссель',
  },
  'module-zone-12': {
    ...DEFAULT_MODULE_INFO,
    event: '1s248b Захват внутри не открыть',
    cause: 'Канал не активен',
    fault: 'Отсутствие данных от датчика',
    title: '1s248b Левый роликовый захват внутри открыть',
    techNumber: 'C',
    signalId: '1s248b',
    stateLabel: 'Ошибка',
    message: 'Отсутствие данных от датчика',
    reason: 'Канал не активен',
    severity: 'error',
    isFault: true,
    action: 'Проверить датчик и линию связи',
  },
}

export function getModuleFaultInfo(zoneId: string): ModuleFaultInfo {
  return MODULE_FAULT_CATALOG[zoneId] ?? DEFAULT_MODULE_INFO
}

export const SIGNAL_FAULT_CATALOG: Record<string, string> = {
  'signal-6': 'Обрыв кабеля в цепи управления',
  'signal-8': 'Клапан не подтвердил срабатывание',
  'signal-11': 'Перегрузка по току канала',
  'signal-12': 'Нет обратной связи от датчика',
}

