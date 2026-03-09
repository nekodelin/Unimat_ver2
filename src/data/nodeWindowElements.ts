import type { ModuleFaultInfo } from '../types/module'
import { getChannelBindingByModuleAndIndex } from './channelMapping'
import { TECHNICAL_SIGNAL_DEFS } from './mockSignals'

export const NODE_WINDOW_CHANNELS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
] as const

export type NodeWindowChannel = (typeof NODE_WINDOW_CHANNELS)[number]

export interface NodeWindowElementDefinition {
  id: string
  channel: NodeWindowChannel
  channelIndex: string
  channelKey: string
  moduleKey: string
  signalId: string
  backendSignalId: string
  zoneId: string
  title: string
  info: ModuleFaultInfo
}

const CHANNEL_TO_ZONE_ID: Record<NodeWindowChannel, string> = {
  '0': 'module-zone-3',
  '1': 'module-zone-10',
  '2': 'module-zone-4',
  '3': 'module-zone-9',
  '4': 'module-zone-8',
  '5': 'module-zone-7',
  '6': 'module-zone-5',
  '7': 'module-zone-6',
  '8': 'module-zone-11',
  '9': 'module-zone-12',
  A: 'module-zone-13',
  B: 'module-zone-2',
  C: 'module-zone-14',
  D: 'module-zone-15',
  E: 'module-zone-16',
  F: 'module-zone-17',
}

const SIGNAL_BY_CHANNEL = new Map(TECHNICAL_SIGNAL_DEFS.map((signal) => [signal.channel, signal]))

function buildFallbackInfo(channel: NodeWindowChannel, signalId: string, title: string): ModuleFaultInfo {
  return {
    event: title,
    cause: '',
    fault: '',
    action: 'Проверить цепь исполнительного механизма',
    title,
    techNumber: channel,
    signalId,
    stateLabel: 'Неизвестно',
    message: '',
    reason: '',
    severity: 'info',
    isFault: false,
    isActive: false,
  }
}

export const NODE_WINDOW_ELEMENTS: NodeWindowElementDefinition[] = NODE_WINDOW_CHANNELS.map((channel) => {
  const zoneId = CHANNEL_TO_ZONE_ID[channel]
  const signal = SIGNAL_BY_CHANNEL.get(channel)
  const moduleKey = 'QL6C'
  const channelIndex = channel
  const binding = getChannelBindingByModuleAndIndex(moduleKey, channelIndex)
  const backendSignalId = binding?.signalId ?? signal?.signalId?.trim().toLowerCase() ?? '-'
  const resolvedSignalId = signal?.id ?? `signal-${channel.toLowerCase()}`
  const title = signal?.title?.trim() || `Канал ${channel}`

  return {
    id: `ql6c-${channel.toLowerCase()}`,
    channel,
    channelIndex,
    channelKey: `${moduleKey}${channelIndex}`,
    moduleKey,
    signalId: resolvedSignalId,
    backendSignalId,
    zoneId,
    title,
    info: buildFallbackInfo(channel, backendSignalId, title),
  }
})

export const NODE_WINDOW_ELEMENTS_BY_ZONE_ID = new Map(
  NODE_WINDOW_ELEMENTS.map((element) => [element.zoneId, element]),
)

export const NODE_WINDOW_ELEMENTS_BY_SIGNAL_ID = new Map(
  NODE_WINDOW_ELEMENTS.map((element) => [element.signalId, element]),
)

export const NODE_WINDOW_ELEMENTS_BY_CHANNEL_KEY = new Map(
  NODE_WINDOW_ELEMENTS.map((element) => [element.channelKey, element]),
)
