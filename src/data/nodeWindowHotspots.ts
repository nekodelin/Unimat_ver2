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
  { id: 'hotspot-0', zoneId: 'module-zone-3', title: 'Верхний левый узел', x: 20.561, y: 12.183, width: 7.818, height: 12.769 },
  { id: 'hotspot-1', zoneId: 'module-zone-10', title: 'Левый подвод', x: 7.175, y: 22.288, width: 8.51, height: 4.449 },
  { id: 'hotspot-2', zoneId: 'module-zone-5', title: 'Клапан 1', x: 28.355, y: 31.586, width: 4.888, height: 10.369 },
  { id: 'hotspot-3', zoneId: 'module-zone-4', title: 'Клапан 2', x: 37.973, y: 33.099, width: 4.333, height: 8.51 },
  { id: 'hotspot-4', zoneId: 'module-zone-8', title: 'Верхний правый узел', x: 50.373, y: 14.705, width: 6.939, height: 12.349 },
  { id: 'hotspot-5', zoneId: 'module-zone-9', title: 'Правый подвод', x: 62.084, y: 22.639, width: 9.373, height: 6.095 },
  { id: 'hotspot-6', zoneId: 'module-zone-6', title: 'Клапан 3', x: 27.208, y: 42.155, width: 5.495, height: 9.651 },
  { id: 'hotspot-7', zoneId: 'module-zone-7', title: 'Клапан 4', x: 37.436, y: 41.828, width: 5.048, height: 10.388 },
  { id: 'hotspot-8', zoneId: 'module-zone-11', title: 'Клапан 5', x: 14.616, y: 60.765, width: 6.827, height: 15.567 },
  { id: 'hotspot-9', zoneId: 'module-zone-12', title: 'Клапан 6', x: 26.301, y: 61.812, width: 6.259, height: 14.915 },
  { id: 'hotspot-10', zoneId: 'module-zone-13', title: 'Клапан 7', x: 38.762, y: 61.824, width: 5.746, height: 15.19 },
  { id: 'hotspot-11', zoneId: 'module-zone-2', title: 'Клапан 8', x: 50.868, y: 62.353, width: 5.581, height: 14.517 },
  { id: 'hotspot-12', zoneId: 'module-zone-14', title: 'Нижний узел 1', x: 10.813, y: 81.476, width: 7.214, height: 15.876 },
  { id: 'hotspot-13', zoneId: 'module-zone-15', title: 'Нижний узел 2', x: 24.475, y: 82.016, width: 6.792, height: 16.893 },
  { id: 'hotspot-14', zoneId: 'module-zone-16', title: 'Нижний узел 3', x: 38.079, y: 82.507, width: 6.503, height: 16.666 },
  { id: 'hotspot-15', zoneId: 'module-zone-17', title: 'Нижний узел 4', x: 52.102, y: 83.052, width: 6.485, height: 15.617 },
]

export const NODE_WINDOW_HOTSPOTS: NodeWindowHotspotDefinition[] = HOTSPOT_LAYOUT
  .map((hotspot) => ({
    ...hotspot,
    path: PATH_BY_ZONE_ID.get(hotspot.zoneId) ?? '',
  }))
  .filter((hotspot) => hotspot.path.length > 0)

