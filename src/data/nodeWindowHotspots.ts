import { MODULE_PATHS } from './modulePaths.generated'

export const NODE_WINDOW_PHOTO_FRAME = {
  x: 736,
  y: 119.464,
  width: 1063.52,
  height: 830.013,
} as const

export interface NodeWindowHotspotDefinition {
  id: string
  zoneId: string
  title: string
  x: number
  y: number
  width: number
  height: number
  path: string
}

const PATH_BY_ZONE_ID = new Map(MODULE_PATHS.map((zone) => [zone.id, zone.path]))

const HOTSPOT_LAYOUT: Array<Omit<NodeWindowHotspotDefinition, 'path'>> = [
  { id: 'photo-1', zoneId: 'module-zone-2', title: 'Фото 1 • канал B • 1s247a', x: 50.868, y: 62.353, width: 5.581, height: 14.517 },
  { id: 'photo-2', zoneId: 'module-zone-13', title: 'Фото 2 • канал A • 1s247b', x: 38.762, y: 61.824, width: 5.746, height: 15.19 },
  { id: 'photo-3', zoneId: 'module-zone-15', title: 'Фото 3 • канал D • 1s248a', x: 24.475, y: 82.016, width: 6.792, height: 16.893 },
  { id: 'photo-4', zoneId: 'module-zone-14', title: 'Фото 4 • канал C • 1s248b', x: 10.813, y: 81.476, width: 7.214, height: 15.876 },
  { id: 'photo-9', zoneId: 'module-zone-6', title: 'Фото 9 • канал 7 • 1s212a', x: 27.208, y: 42.155, width: 5.495, height: 9.651 },
  { id: 'photo-10', zoneId: 'module-zone-5', title: 'Фото 10 • канал 6 • 1s212b', x: 28.355, y: 31.586, width: 4.888, height: 10.369 },
  { id: 'photo-11', zoneId: 'module-zone-12', title: 'Фото 11 • канал 9 • 1s213a', x: 26.301, y: 61.812, width: 6.259, height: 14.915 },
  { id: 'photo-12', zoneId: 'module-zone-11', title: 'Фото 12 • канал 8 • 1s213b', x: 14.616, y: 60.765, width: 6.827, height: 15.567 },
]

export const NODE_WINDOW_HOTSPOTS: NodeWindowHotspotDefinition[] = HOTSPOT_LAYOUT
  .map((hotspot) => ({
    ...hotspot,
    path: PATH_BY_ZONE_ID.get(hotspot.zoneId) ?? '',
  }))
  .filter((hotspot) => hotspot.path.length > 0)

