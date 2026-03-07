export const TECH_BITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'] as const

export type TechnicalBit = (typeof TECH_BITS)[number]

export type TechnicalRowSeed = {
  bit: TechnicalBit
  bitIndex: number
  photoIndex: number
}

export const TECH_ROW_SEEDS: TechnicalRowSeed[] = TECH_BITS.map((bit, bitIndex) => ({
  bit,
  bitIndex,
  photoIndex: bitIndex + 1,
}))

const BIT_SET = new Set<string>(TECH_BITS)

export function toTechnicalBit(raw: string): TechnicalBit | null {
  const normalized = raw.trim().toUpperCase()
  if (!BIT_SET.has(normalized)) {
    return null
  }

  return normalized as TechnicalBit
}

export function bitFromPhotoIndex(photoIndex: number | null): TechnicalBit | null {
  if (photoIndex == null || photoIndex < 1 || photoIndex > 16) {
    return null
  }

  return TECH_BITS[photoIndex - 1]
}

