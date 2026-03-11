import type { ChannelState } from '../../../types/channel'

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase()
}

export function getChannelFaultText(channel: ChannelState | null | undefined): string {
  if (!channel) {
    return ''
  }

  const status = normalizeStatus(channel.backendStatus)
  if (status === 'open_circuit') {
    return 'Обрыв'
  }

  if (status === 'short_circuit') {
    return 'КЗ'
  }

  return ''
}
