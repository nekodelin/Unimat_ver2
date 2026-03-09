import type { ChannelState } from '../types/channel'

export function getLedClass(channel: ChannelState): 'red' | 'yellow' | 'dim' {
  if (channel.ledColor === 'red') {
    return 'red'
  }

  if (channel.ledColor === 'yellow') {
    return 'yellow'
  }

  return 'dim'
}

export function getRowClass(channel: ChannelState): 'red' | 'normal' | 'muted' {
  if (channel.rowColor === 'red') {
    return 'red'
  }

  if (channel.rowColor === 'muted' || channel.status === 'inactive') {
    return 'muted'
  }

  return 'normal'
}

export function buildChannelRowText(channel: ChannelState): string {
  const parts = [channel.stateLabel]

  if (channel.message) {
    parts.push(channel.message)
  }

  if (channel.reason && channel.rowColor === 'red') {
    parts.push(channel.reason)
  }

  if (channel.action && channel.rowColor === 'red') {
    parts.push(channel.action)
  }

  return parts.join(' | ')
}

