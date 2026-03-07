import type { ChannelStatus } from '@/types/realtime'

export type StatusTone = 'green' | 'red' | 'warning' | 'inactive'

export function statusToTone(status: ChannelStatus): StatusTone {
  if (status === 'normal' || status === 'active') {
    return 'green'
  }

  if (status === 'breakage' || status === 'short_circuit') {
    return 'red'
  }

  if (status === 'unknown') {
    return 'warning'
  }

  return 'inactive'
}

export function statusToLabel(status: ChannelStatus): string {
  if (status === 'normal') {
    return 'normal'
  }

  if (status === 'active') {
    return 'active'
  }

  if (status === 'breakage') {
    return 'breakage'
  }

  if (status === 'short_circuit') {
    return 'short_circuit'
  }

  if (status === 'unknown') {
    return 'unknown'
  }

  return 'inactive'
}

