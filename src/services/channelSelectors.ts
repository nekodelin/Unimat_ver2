import type { ChannelState } from '../types/channel'
import type { ZoneStatus } from '../types/status'

export type ModuleComputedStatus = 'fault' | 'warning' | 'normal' | 'inactive'

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

export function getAllDecodedChannels(channels: ChannelState[]): ChannelState[] {
  return channels
}

export function getChannelsByModule(channels: ChannelState[], moduleKey: string): ChannelState[] {
  const normalized = normalizeText(moduleKey)
  if (!normalized) {
    return []
  }

  return channels.filter((channel) => normalizeText(channel.moduleKey) === normalized)
}

export function getChannelsBySignalId(channels: ChannelState[], signalId: string): ChannelState[] {
  const normalized = normalizeText(signalId)
  if (!normalized) {
    return []
  }

  return channels.filter((channel) => normalizeText(channel.signalId) === normalized)
}

export function getChannelByChannelKey(
  channels: ChannelState[],
  channelKey: string,
): ChannelState | undefined {
  const normalized = normalizeText(channelKey)
  if (!normalized) {
    return undefined
  }

  return channels.find((channel) => normalizeText(channel.channelKey) === normalized)
}

export function getChannelByZoneId(channels: ChannelState[], zoneId: string): ChannelState | undefined {
  const normalized = normalizeText(zoneId)
  if (!normalized) {
    return undefined
  }

  return channels.find((channel) => normalizeText(channel.zoneId) === normalized)
}

function isFaultChannel(channel: ChannelState): boolean {
  return (
    channel.isFault ||
    channel.status === 'fault' ||
    channel.backendStatus === 'open_circuit' ||
    channel.backendStatus === 'short_circuit'
  )
}

export function getFaultChannels(channels: ChannelState[]): ChannelState[] {
  return channels.filter(isFaultChannel)
}

function isUnknownChannel(channel: ChannelState): boolean {
  return channel.backendStatus === 'unknown'
}

export function getUnknownChannels(channels: ChannelState[]): ChannelState[] {
  return channels.filter(isUnknownChannel)
}

export function resolveModuleComputedStatus(channels: ChannelState[]): ModuleComputedStatus {
  if (channels.length === 0) {
    return 'inactive'
  }

  if (channels.some(isFaultChannel)) {
    return 'fault'
  }

  if (channels.some(isUnknownChannel)) {
    return 'warning'
  }

  if (channels.every((channel) => channel.status === 'normal')) {
    return 'normal'
  }

  return 'warning'
}

export function moduleComputedStatusToZoneStatus(status: ModuleComputedStatus): ZoneStatus {
  if (status === 'fault') {
    return 'fault'
  }

  if (status === 'normal') {
    return 'normal'
  }

  return 'inactive'
}

