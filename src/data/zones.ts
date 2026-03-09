import { MODULE_PATHS } from './modulePaths.generated'
import type { ModuleZoneDefinition, TrainZoneDefinition } from '../types/zone'

export const TRAIN_CANVAS_SIZE = {
  width: 1824.63,
  height: 501.795,
}

const TRAIN_MAIN_ZONE_PATH =
  'M2 59.6493L2.00002 3.01368C2.00002 2.45384 2.45386 2 3.0137 2L49.6747 2.00007C50.2346 2.00007 50.6884 2.45391 50.6884 3.01375V26.5617C50.6884 27.1215 51.1422 27.5754 51.7021 27.5754H71.7108H205.797C206.357 27.5754 206.811 28.0292 206.811 28.5891V45.3017C206.811 45.8615 206.357 46.3154 205.797 46.3154H72.7245C72.1646 46.3154 71.7108 46.7692 71.7108 47.3291V59.6493C71.7108 60.2091 71.257 60.663 70.6971 60.663H3.01368C2.45384 60.663 2 60.2091 2 59.6493Z'

const TRAIN_SECONDARY_ZONE_PATH =
  'M2 64.5407L2.00001 3.01368C2.00001 2.45384 2.45386 2 3.0137 2L36.5561 2.00007C37.116 2.00007 37.5698 2.45391 37.5698 3.01375V64.5407C37.5698 65.1005 37.116 65.5543 36.5561 65.5543H3.01368C2.45384 65.5543 2 65.1005 2 64.5407Z'

export const TRAIN_ZONE_DEFS: TrainZoneDefinition[] = [
  {
    id: 'train-main-module',
    title: 'B31/U15/QL6C',
    description: 'Главный узел поезда',
    action: 'open-module',
    shape: {
      path: TRAIN_MAIN_ZONE_PATH,
      viewBoxWidth: 209,
      viewBoxHeight: 63,
      leftPct: 59.8478,
      topPct: 69.6422,
      widthPct: 11.4544,
      heightPct: 12.5549,
    },
  },
  {
    id: 'train-secondary-module',
    title: 'B24/U6/QL1C',
    description: 'Второй узел (открывает общий экран узла)',
    action: 'open-module',
    shape: {
      path: TRAIN_SECONDARY_ZONE_PATH,
      viewBoxWidth: 40,
      viewBoxHeight: 68,
      leftPct: 67.2158,
      topPct: 54.0751,
      widthPct: 2.1922,
      heightPct: 13.5514,
    },
  },
]

export const MODULE_CANVAS = {
  viewBoxWidth: 1800,
  viewBoxHeight: 975,
}

const HIDDEN_MODULE_ZONE_IDS = new Set([
  'module-zone-0',
  'module-zone-1',
  'module-zone-7',
])

export const MODULE_ZONE_DEFS: ModuleZoneDefinition[] = MODULE_PATHS.filter(
  (zone) => !HIDDEN_MODULE_ZONE_IDS.has(zone.id),
).map((zone, index) => ({
  id: zone.id,
  title: zone.title,
  description: `Интерактивный элемент #${index + 1}`,
  path: zone.path,
}))

export const DEFAULT_SELECTED_MODULE_ZONE_ID = 'module-zone-5'
