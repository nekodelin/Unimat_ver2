import type { ChannelState } from '../../../types/channel'
import type { DecodedChannelStatus, UnimatModuleRowState, UnimatTechRowConfig } from '../../../types/unimat'
import { getChannelFaultText } from './getChannelFaultText'

const SIGNAL_ALIAS_CANONICAL: Record<string, string> = {
  '1s202a': '1s202b',
  '1s202b': '1s202b',
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeSignalId(value: string): string {
  const normalized = normalizeToken(value)
  return SIGNAL_ALIAS_CANONICAL[normalized] ?? normalized
}

function resolveDecodedStatus(channel: ChannelState | null): DecodedChannelStatus | 'no_data' {
  if (!channel) {
    return 'no_data'
  }

  const status = normalizeToken(channel.backendStatus)
  if (
    status === 'normal' ||
    status === 'open_circuit' ||
    status === 'short_circuit' ||
    status === 'unknown'
  ) {
    return status
  }

  if (channel.isFault) {
    return 'open_circuit'
  }

  return channel.status === 'normal' ? 'normal' : 'unknown'
}

function resolveVisualState(
  channel: ChannelState | null,
  decodedStatus: DecodedChannelStatus | 'no_data',
): UnimatModuleRowState['visualState'] {
  if (decodedStatus === 'no_data') {
    return 'inactive'
  }

  if (
    channel?.isFault === true ||
    decodedStatus === 'open_circuit' ||
    decodedStatus === 'short_circuit'
  ) {
    return 'fault'
  }

  if (decodedStatus === 'unknown') {
    return 'warning'
  }

  return 'normal'
}

function resolveRowChannel(
  moduleChannels: ChannelState[],
  row: UnimatTechRowConfig,
): ChannelState | null {
  if (!row.signalId) {
    return null
  }

  const byChannelIndex =
    moduleChannels.find((channel) => channel.channelIndex.toUpperCase() === row.channelIndex.toUpperCase()) ?? null
  if (byChannelIndex) {
    return byChannelIndex
  }

  const normalizedRowSignalId = normalizeSignalId(row.signalId)
  const bySignalId =
    moduleChannels.find((channel) => normalizeSignalId(channel.signalId) === normalizedRowSignalId) ?? null

  return bySignalId
}

export function getModuleRowsState(
  decodedChannels: ChannelState[] | undefined,
  rowsConfig: UnimatTechRowConfig[],
  moduleKey: string,
): UnimatModuleRowState[] {
  const channels = decodedChannels ?? []
  const normalizedModuleKey = moduleKey.trim().toLowerCase()
  const moduleChannels = channels.filter(
    (channel) => channel.moduleKey.trim().toLowerCase() === normalizedModuleKey,
  )

  return rowsConfig.map((row) => {
    const channel = resolveRowChannel(moduleChannels, row)
    const decodedStatus = resolveDecodedStatus(channel)
    const visualState = resolveVisualState(channel, decodedStatus)
    const faultText = visualState === 'normal' || visualState === 'inactive' ? '' : getChannelFaultText(channel)

    return {
      id: row.id,
      moduleKey: row.moduleKey,
      channelIndex: row.channelIndex,
      channelLabel: row.channelIndex,
      signalId: row.signalId,
      title: row.title,
      visualState,
      decodedStatus,
      faultText,
      channel,
    }
  })
}
