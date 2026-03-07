import { channelMappings } from '@/config/mappings'
import { statusToTone } from '@/config/statusVisual'
import type { ChannelEntity, ChannelStatus, ModuleEntity } from '@/types/realtime'
import { bitFromPhotoIndex, TECH_ROW_SEEDS, toTechnicalBit, type TechnicalBit } from './technicalConfig'

export type TechnicalRow = {
  bit: TechnicalBit
  signalId: string
  title: string
  status: 'normal' | 'fault'
  faultText: string
  yellowLed: 'on' | 'dim' | 'off'
  redLed: boolean
}

export type TechnicalModuleTab = {
  id: string
  label: string
  status: ChannelStatus
}

function normalizeModuleId(raw: string): string {
  return raw.trim().toUpperCase()
}

function extractBitFromChannelKey(channelKey: string): TechnicalBit | null {
  if (!channelKey) {
    return null
  }

  const lastChar = channelKey.trim().slice(-1)
  return toTechnicalBit(lastChar)
}

function resolveBit(channel: Pick<ChannelEntity, 'channelKey' | 'photoIndex'>): TechnicalBit | null {
  return extractBitFromChannelKey(channel.channelKey) ?? bitFromPhotoIndex(channel.photoIndex)
}

function titleWithoutSignal(signalId: string, title: string, purpose: string): string {
  const source = purpose || title || ''
  if (!source) {
    return ''
  }

  if (!signalId) {
    return source.trim()
  }

  const loweredSource = source.toLowerCase()
  const loweredSignal = signalId.toLowerCase()
  if (!loweredSource.startsWith(loweredSignal)) {
    return source.trim()
  }

  return source.slice(signalId.length).trim()
}

function faultTextFromChannel(channel: ChannelEntity | undefined): string {
  if (!channel) {
    return ''
  }

  return channel.cause || channel.stateLabel || channel.action || ''
}

function channelToFault(channel: ChannelEntity | undefined): boolean {
  if (!channel) {
    return false
  }

  const tone = statusToTone(channel.status)
  return channel.isFault || tone === 'red'
}

function yellowLedFromChannel(channel: ChannelEntity | undefined): TechnicalRow['yellowLed'] {
  if (!channel) {
    return 'off'
  }

  const tone = statusToTone(channel.status)
  if (channelToFault(channel)) {
    return 'off'
  }

  if (tone === 'green') {
    return 'on'
  }

  if (tone === 'warning') {
    return 'dim'
  }

  return 'off'
}

function buildFallbackByBit(moduleId: string): Map<TechnicalBit, (typeof channelMappings)[number]> {
  const byBit = new Map<TechnicalBit, (typeof channelMappings)[number]>()

  channelMappings
    .filter((mapping) => normalizeModuleId(mapping.module) === normalizeModuleId(moduleId))
    .forEach((mapping) => {
      const bit = toTechnicalBit(mapping.channelKey.slice(-1)) ?? bitFromPhotoIndex(mapping.photoIndex)
      if (!bit || byBit.has(bit)) {
        return
      }

      byBit.set(bit, mapping)
    })

  return byBit
}

function buildLiveByBit(channels: ChannelEntity[]): Map<TechnicalBit, ChannelEntity> {
  const byBit = new Map<TechnicalBit, ChannelEntity>()

  channels.forEach((channel) => {
    const bit = resolveBit(channel)
    if (!bit) {
      return
    }

    const existing = byBit.get(bit)
    if (!existing || channel.updatedAt >= existing.updatedAt) {
      byBit.set(bit, channel)
    }
  })

  return byBit
}

export function buildTechnicalModuleTabs(
  modules: ModuleEntity[],
  summaryModuleStatus: Record<string, ChannelStatus>,
): TechnicalModuleTab[] {
  const moduleMap = new Map<string, TechnicalModuleTab>()
  const channelCountByModuleId = new Map<string, number>()

  modules.forEach((module) => {
    const status = summaryModuleStatus[module.id] ?? module.status
    moduleMap.set(module.id, {
      id: module.id,
      label: module.board ? `${module.board}/${module.id}` : module.id,
      status,
    })
    channelCountByModuleId.set(module.id, module.channelIds.length)
  })

  Object.entries(summaryModuleStatus).forEach(([moduleId, status]) => {
    if (moduleMap.has(moduleId)) {
      return
    }

    moduleMap.set(moduleId, {
      id: moduleId,
      label: moduleId,
      status,
    })
    channelCountByModuleId.set(moduleId, 0)
  })

  const statusPriority = (status: ChannelStatus): number => {
    if (status === 'breakage' || status === 'short_circuit') {
      return 0
    }

    if (status === 'unknown') {
      return 1
    }

    if (status === 'normal' || status === 'active') {
      return 2
    }

    return 3
  }

  return Array.from(moduleMap.values()).sort((a, b) => {
    const channelsA = channelCountByModuleId.get(a.id) ?? 0
    const channelsB = channelCountByModuleId.get(b.id) ?? 0
    if (channelsA !== channelsB) {
      return channelsB - channelsA
    }

    const statusDiff = statusPriority(a.status) - statusPriority(b.status)
    if (statusDiff !== 0) {
      return statusDiff
    }

    return a.id.localeCompare(b.id)
  })
}

export function buildTechnicalRows(channels: ChannelEntity[], moduleId: string): TechnicalRow[] {
  const normalizedModuleId = normalizeModuleId(moduleId)
  const moduleChannels = channels
    .filter((channel) => normalizeModuleId(channel.module) === normalizedModuleId)
    .sort((a, b) => {
      const aPhoto = a.photoIndex ?? Number.MAX_SAFE_INTEGER
      const bPhoto = b.photoIndex ?? Number.MAX_SAFE_INTEGER
      if (aPhoto !== bPhoto) {
        return aPhoto - bPhoto
      }

      return a.id.localeCompare(b.id)
    })

  const fallbackByBit = buildFallbackByBit(normalizedModuleId)
  const liveByBit = buildLiveByBit(moduleChannels)
  const fallbackByPhoto = moduleChannels

  return TECH_ROW_SEEDS.map((seed) => {
    const liveChannel = liveByBit.get(seed.bit) ?? fallbackByPhoto[seed.bitIndex]
    const fallback = fallbackByBit.get(seed.bit)
    const signalId = liveChannel?.signalId || fallback?.signalId || ''
    const title = titleWithoutSignal(signalId, liveChannel?.title || fallback?.title || '', liveChannel?.purpose || fallback?.purpose || '')
    const isFault = channelToFault(liveChannel)

    return {
      bit: seed.bit,
      signalId,
      title,
      status: isFault ? 'fault' : 'normal',
      faultText: isFault ? faultTextFromChannel(liveChannel) : '',
      yellowLed: yellowLedFromChannel(liveChannel),
      redLed: isFault,
    } satisfies TechnicalRow
  })
}
