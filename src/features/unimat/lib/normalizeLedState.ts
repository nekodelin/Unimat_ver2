const ACTIVE_CHANNELS = new Set(['6', '7', '8', '9', 'A', 'B', 'C', 'D'])

export interface LedViewState {
  yellow: boolean
  red: boolean
  faultText: string
}

interface NormalizeLedStateInput {
  hasData: boolean
  isFault: boolean
  faultText?: string
  channelLabel: string
}

function normalizeChannelLabel(channelLabel: string): string {
  return channelLabel.trim().toUpperCase()
}

export function isActiveLedChannel(channelLabel: string): boolean {
  return ACTIVE_CHANNELS.has(normalizeChannelLabel(channelLabel))
}

export function normalizeLedState(input: NormalizeLedStateInput): LedViewState {
  if (!isActiveLedChannel(input.channelLabel)) {
    return { yellow: false, red: false, faultText: '' }
  }

  if (!input.hasData) {
    return { yellow: false, red: false, faultText: '' }
  }

  if (input.isFault) {
    return { yellow: true, red: true, faultText: input.faultText?.trim() ?? '' }
  }

  return { yellow: true, red: false, faultText: '' }
}
