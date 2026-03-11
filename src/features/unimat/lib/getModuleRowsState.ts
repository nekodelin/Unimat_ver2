import type { ChannelState } from '../../../types/channel'
import type { DecodedChannelStatus, UnimatModuleRowState, UnimatTechRowConfig } from '../../../types/unimat'

const SIGNAL_ALIAS_CANONICAL: Record<string, string> = {
  '1s202a': '1s202b',
  '1s202b': '1s202b',
}
const DEV_CHANNEL_DEBUG_ENABLED = import.meta.env.DEV
const DEBUG_MODULE_KEY = 'QL6C'
const DEBUG_CHANNEL_INDICES = new Set(['6', '7'])

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

function resolveRowChannel(
  moduleChannels: ChannelState[],
  row: UnimatTechRowConfig,
): ChannelState | null {
  const byChannelIndex =
    moduleChannels.find((channel) => channel.channelIndex.toUpperCase() === row.channelIndex.toUpperCase()) ?? null
  if (byChannelIndex) {
    return byChannelIndex
  }

  if (!row.signalId) {
    return null
  }

  const normalizedRowSignalId = normalizeSignalId(row.signalId)
  const bySignalId =
    moduleChannels.find((channel) => normalizeSignalId(channel.signalId) === normalizedRowSignalId) ?? null

  return bySignalId
}

function getFaultLabel(yellowActive: boolean, redActive: boolean): string {
  if (!yellowActive && !redActive) {
    return ''
  }

  if (yellowActive && !redActive) {
    return ''
  }

  if (yellowActive && redActive) {
    return 'ОБРЫВ'
  }

  if (!yellowActive && redActive) {
    return 'КЗ'
  }

  return ''
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
    const yellowLed = channel?.yellowLed ?? false
    const redLed = channel?.redLed ?? false
    const visualState: UnimatModuleRowState['visualState'] = redLed
      ? 'fault'
      : yellowLed
        ? 'normal'
        : 'inactive'
    const faultText = getFaultLabel(yellowLed, redLed)

    if (
      DEV_CHANNEL_DEBUG_ENABLED &&
      row.moduleKey.trim().toUpperCase() === DEBUG_MODULE_KEY &&
      DEBUG_CHANNEL_INDICES.has(row.channelIndex.trim().toUpperCase())
    ) {
      console.debug(`[technical-debug][${DEBUG_MODULE_KEY}] row-ui`, {
        channelIndex: row.channelIndex,
        channelKey: channel?.channelKey ?? `${row.moduleKey}${row.channelIndex}`,
        signalId: channel?.signalId ?? row.signalId ?? '',
        hasChannelData: channel !== null,
        decodedStatus,
        visualState,
        yellowLed,
        redLed,
        faultText,
      })
    }

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
