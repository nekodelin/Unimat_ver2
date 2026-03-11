const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true })

let cp1251CharToByteMap: Map<string, number> | null | undefined

function getCp1251CharToByteMap(): Map<string, number> | null {
  if (cp1251CharToByteMap !== undefined) {
    return cp1251CharToByteMap
  }

  try {
    const decoder = new TextDecoder('windows-1251')
    const mapping = new Map<string, number>()

    for (let byte = 0; byte < 256; byte += 1) {
      const decoded = decoder.decode(Uint8Array.of(byte))
      if (!mapping.has(decoded)) {
        mapping.set(decoded, byte)
      }
    }

    cp1251CharToByteMap = mapping
    return mapping
  } catch {
    cp1251CharToByteMap = null
    return null
  }
}

function encodeWithMap(value: string, mapping: Map<string, number>): Uint8Array | null {
  const bytes: number[] = []

  for (const char of value) {
    const mappedByte = mapping.get(char)
    if (mappedByte === undefined) {
      return null
    }

    bytes.push(mappedByte)
  }

  return Uint8Array.from(bytes)
}

function encodeAsLatin1(value: string): Uint8Array | null {
  const bytes: number[] = []

  for (const char of value) {
    const codePoint = char.codePointAt(0)
    if (codePoint === undefined || codePoint > 0xff) {
      return null
    }

    bytes.push(codePoint)
  }

  return Uint8Array.from(bytes)
}

function decodeUtf8(bytes: Uint8Array | null): string | null {
  if (!bytes || bytes.length === 0) {
    return null
  }

  try {
    return UTF8_DECODER.decode(bytes)
  } catch {
    return null
  }
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0
}

function mojibakeScore(value: string): number {
  const markerCount = countMatches(value, /[\u0420\u0421\u00d0\u00d1]/g)
  const specialCount = countMatches(
    value,
    /[\u0402\u0403\u201a\u0453\u201e\u2026\u2020\u2021\u20ac\u2030\u0409\u2039\u040a\u040c\u040b\u040f\u0452\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u2122\u0459\u203a\u045a\u045c\u045b\u045f]/g,
  )

  return markerCount + specialCount * 2
}

function hasReadableContent(value: string): boolean {
  return /[\u0410-\u044f\u0401\u0451a-z0-9]/i.test(value)
}

export function isLikelyMojibake(value: string): boolean {
  if (value.length < 2) {
    return false
  }

  const markerCount = countMatches(value, /[\u0420\u0421\u00d0\u00d1]/g)
  const suspiciousPattern = /(?:[\u0420\u0421][\u0400-\u04ff]|[\u00d0\u00d1][\u0080-\u00ff])/u

  return suspiciousPattern.test(value) && (markerCount >= 2 || mojibakeScore(value) >= 3)
}

function recoverMojibake(value: string): string | null {
  const candidates = new Set<string>()

  const cp1251Map = getCp1251CharToByteMap()
  if (cp1251Map) {
    const cp1251Decoded = decodeUtf8(encodeWithMap(value, cp1251Map))
    if (cp1251Decoded) {
      candidates.add(cp1251Decoded)
    }
  }

  const latin1Decoded = decodeUtf8(encodeAsLatin1(value))
  if (latin1Decoded) {
    candidates.add(latin1Decoded)
  }

  const sourceScore = mojibakeScore(value)
  let bestCandidate: string | null = null
  let bestScore = sourceScore

  for (const candidate of candidates) {
    const score = mojibakeScore(candidate)
    if (
      score < bestScore &&
      !isLikelyMojibake(candidate) &&
      hasReadableContent(candidate)
    ) {
      bestCandidate = candidate
      bestScore = score
    }
  }

  return bestCandidate
}

export function normalizeReadableText(value: string | null | undefined, fallback = ''): string {
  const source = value?.trim() ?? ''
  if (!source) {
    return fallback
  }

  const recovered = recoverMojibake(source)
  if (recovered) {
    return recovered
  }

  return isLikelyMojibake(source) ? fallback : source
}
