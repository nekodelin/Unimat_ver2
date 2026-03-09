export type SupportedModuleKey = 'QL6C' | 'QL6D'

export interface ChannelBinding {
  moduleKey: SupportedModuleKey
  channelIndex: string
  channelKey: string
  signalId: string
}

const MODULE_ALIASES: Record<string, SupportedModuleKey> = {
  QL6C: 'QL6C',
  QL6D: 'QL6D',
}

const CHANNEL_BINDINGS_INPUT: Array<Omit<ChannelBinding, 'channelKey'>> = [
  { moduleKey: 'QL6C', channelIndex: '0', signalId: '1s201a' },
  { moduleKey: 'QL6C', channelIndex: '1', signalId: '1s201b' },
  { moduleKey: 'QL6C', channelIndex: '2', signalId: '1s202b' },
  { moduleKey: 'QL6C', channelIndex: '3', signalId: 's1202b' },
  { moduleKey: 'QL6C', channelIndex: '6', signalId: '1s212b' },
  { moduleKey: 'QL6C', channelIndex: '7', signalId: '1s212a' },
  { moduleKey: 'QL6C', channelIndex: '8', signalId: '1s213b' },
  { moduleKey: 'QL6C', channelIndex: '9', signalId: '1s213a' },
  { moduleKey: 'QL6C', channelIndex: 'A', signalId: '1s247b' },
  { moduleKey: 'QL6C', channelIndex: 'B', signalId: '1s247a' },
  { moduleKey: 'QL6C', channelIndex: 'C', signalId: '1s248b' },
  { moduleKey: 'QL6C', channelIndex: 'D', signalId: '1s248a' },
  { moduleKey: 'QL6D', channelIndex: '0', signalId: '1s250b' },
  { moduleKey: 'QL6D', channelIndex: '1', signalId: '1s250a' },
  { moduleKey: 'QL6D', channelIndex: '2', signalId: '1s251b' },
  { moduleKey: 'QL6D', channelIndex: '3', signalId: '1s251a' },
]

export const CHANNEL_BINDINGS: ChannelBinding[] = CHANNEL_BINDINGS_INPUT.map((entry) => ({
  ...entry,
  signalId: normalizeSignalId(entry.signalId),
  channelIndex: normalizeChannelIndex(entry.channelIndex) ?? '0',
  channelKey: `${entry.moduleKey}${entry.channelIndex}`,
}))

const BINDING_BY_SIGNAL_ID = new Map(
  CHANNEL_BINDINGS.map((binding) => [normalizeSignalId(binding.signalId), binding]),
)

const BINDING_BY_MODULE_AND_INDEX = new Map(
  CHANNEL_BINDINGS.map((binding) => [
    `${binding.moduleKey}:${binding.channelIndex}`,
    binding,
  ]),
)

const BINDING_BY_CHANNEL_KEY = new Map(
  CHANNEL_BINDINGS.map((binding) => [binding.channelKey, binding]),
)

export function normalizeSignalId(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}

export function normalizeModuleKey(value: unknown): SupportedModuleKey | null {
  if (typeof value !== 'string') {
    return null
  }

  const compact = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  if (compact.length === 0) {
    return null
  }

  if (compact.includes('QL6C')) {
    return MODULE_ALIASES.QL6C
  }

  if (compact.includes('QL6D')) {
    return MODULE_ALIASES.QL6D
  }

  return MODULE_ALIASES[compact] ?? null
}

export function normalizeChannelIndex(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null
  }

  const normalized = String(value).trim().toUpperCase()
  if (!/^[0-9A-F]$/.test(normalized)) {
    return null
  }

  return normalized
}

export function parseChannelKey(
  channelKey: unknown,
): { moduleKey: SupportedModuleKey; channelIndex: string } | null {
  if (typeof channelKey !== 'string') {
    return null
  }

  const compact = channelKey
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  if (compact.length === 0) {
    return null
  }

  const moduleMatch = compact.match(/QL6[CD]/)
  if (!moduleMatch) {
    return null
  }

  const moduleKey = normalizeModuleKey(moduleMatch[0])
  if (!moduleKey) {
    return null
  }

  const afterModule = compact.slice(moduleMatch.index! + moduleMatch[0].length)
  const firstIndex = afterModule.match(/[0-9A-F]/)?.[0] ?? null
  const channelIndex = normalizeChannelIndex(firstIndex)

  if (!channelIndex) {
    return null
  }

  return { moduleKey, channelIndex }
}

export function getChannelBindingBySignalId(signalId: unknown): ChannelBinding | null {
  const normalized = normalizeSignalId(signalId)
  if (!normalized) {
    return null
  }

  return BINDING_BY_SIGNAL_ID.get(normalized) ?? null
}

export function getChannelBindingByModuleAndIndex(
  moduleKey: unknown,
  channelIndex: unknown,
): ChannelBinding | null {
  const normalizedModule = normalizeModuleKey(moduleKey)
  const normalizedIndex = normalizeChannelIndex(channelIndex)

  if (!normalizedModule || !normalizedIndex) {
    return null
  }

  return BINDING_BY_MODULE_AND_INDEX.get(`${normalizedModule}:${normalizedIndex}`) ?? null
}

export function getChannelBindingByChannelKey(channelKey: unknown): ChannelBinding | null {
  const parsed = parseChannelKey(channelKey)
  if (!parsed) {
    return null
  }

  return BINDING_BY_CHANNEL_KEY.get(`${parsed.moduleKey}${parsed.channelIndex}`) ?? null
}

export function getModuleBindings(moduleKey: unknown): ChannelBinding[] {
  const normalized = normalizeModuleKey(moduleKey)
  if (!normalized) {
    return []
  }

  return CHANNEL_BINDINGS.filter((binding) => binding.moduleKey === normalized)
}
