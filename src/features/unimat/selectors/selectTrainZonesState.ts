import type { ChannelState } from '../../../types/channel'
import type { TrainZonesState } from '../../../types/unimat'

export function selectTrainZonesState(
  decodedChannels: ChannelState[] | undefined,
): TrainZonesState {
  const channels = decodedChannels ?? []

  if (channels.some((channel) => channel.isFault === true)) {
    return 'fault'
  }

  if (channels.some((channel) => channel.backendStatus === 'unknown')) {
    return 'warning'
  }

  return 'normal'
}
