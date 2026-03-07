import { channelMappings, zoneMappings } from '@/config/mappings'
import type { JournalEntry } from '@/types/realtime'

export type DemoSnapshot = {
  channels: Array<Record<string, unknown>>
  modules: Array<Record<string, unknown>>
  zones: Array<Record<string, unknown>>
  journal: JournalEntry[]
}

export function createDemoSnapshot(): DemoSnapshot {
  const now = Date.now()

  const channels = channelMappings.map((mapping, index) => ({
    signalId: mapping.signalId,
    channelKey: mapping.channelKey,
    module: mapping.module,
    board: mapping.board,
    purpose: mapping.purpose,
    title: mapping.title,
    photoIndex: mapping.photoIndex,
    status: index === 1 ? 'breakage' : 'normal',
    stateLabel: index === 1 ? 'Обрыв' : 'Норма',
    cause: index === 1 ? 'Обрыв кабеля' : '',
    action: index === 1 ? 'Проверить подключение в блоке' : '',
    severity: index === 1 ? 'error' : 'info',
    isFault: index === 1,
    input: index === 1 ? 1 : 0,
    output: index === 1 ? 1 : 0,
    diagnostic: index === 1 ? 0 : 1,
    ts: now,
  }))

  const modules = [
    {
      id: 'QL6C',
      title: 'Модуль QL6C',
      board: 'B31/U15',
      channelIds: channelMappings.map((channel) => channel.id),
    },
    {
      id: 'QL1C',
      title: 'Модуль QL1C',
      board: 'B24/U6',
      channelIds: [],
    },
    {
      id: 'A3',
      title: 'Узел A3',
      board: 'A3',
      channelIds: [],
    },
  ]

  const zones = zoneMappings.map((zone) => ({
    id: zone.id,
    title: zone.title,
    moduleId: zone.moduleId,
    channelIds: zone.channelIds,
    rect: zone.rect,
  }))

  const journal: JournalEntry[] = [
    {
      id: `demo-${now}-1`,
      ts: now - 35000,
      level: 'info',
      module: 'SYSTEM',
      signalId: '',
      title: 'backend connected',
      reason: '',
      action: '',
      text: 'backend connected',
    },
    {
      id: `demo-${now}-2`,
      ts: now - 22000,
      level: 'info',
      module: 'SYSTEM',
      signalId: '',
      title: 'mqtt connected',
      reason: '',
      action: '',
      text: 'mqtt connected',
    },
    {
      id: `demo-${now}-3`,
      ts: now - 10000,
      level: 'error',
      module: 'QL6C',
      signalId: '1s212b',
      title: 'Крюк слева не выдвинуть',
      reason: 'Короткое замыкание в цепи гидрораспределителя 1s212b',
      action: 'Проверить фишку гидрораспределителя и электропроводку цепи',
      text: 'Крюк слева не выдвинуть',
    },
  ]

  return { channels, modules, zones, journal }
}
