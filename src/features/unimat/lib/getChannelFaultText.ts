import { UNIMAT_FAULT_TEXTS } from '../config/faultTexts'
import type { ChannelState } from '../../../types/channel'

function normalizeSignalId(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase()
}

export function getChannelFaultText(channel: ChannelState | null | undefined): string {
  if (!channel) {
    return ''
  }

  const status = normalizeStatus(channel.backendStatus)
  if (status === 'normal') {
    return ''
  }

  const signalId = normalizeSignalId(channel.signalId)
  const bySignal = UNIMAT_FAULT_TEXTS[signalId]
  if ((status === 'open_circuit' || status === 'short_circuit') && bySignal?.[status]) {
    return bySignal[status] ?? ''
  }

  if (channel.faultText.trim().length > 0) {
    return channel.faultText
  }

  if (channel.message.trim().length > 0) {
    return channel.message
  }

  if (channel.cause.trim().length > 0) {
    return channel.cause
  }

  if (channel.title.trim().length > 0) {
    return `${channel.title}: неисправность`
  }

  return ''
}
