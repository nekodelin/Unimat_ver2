import type { ZoneStatus } from '../types/status'

export interface StatusVisual {
  fill: string
  stroke: string
  text: string
  badge: string
}

export const STATUS_VISUALS: Record<ZoneStatus, StatusVisual> = {
  normal: {
    fill: 'rgba(20, 228, 1, 0.5)',
    stroke: '#218718',
    text: '#218718',
    badge: '#89f180',
  },
  fault: {
    fill: 'rgba(255, 0, 0, 0.52)',
    stroke: '#ff0000',
    text: '#b30000',
    badge: '#ff8080',
  },
  inactive: {
    fill: 'rgba(42, 42, 42, 0.5)',
    stroke: '#3f3f3f',
    text: '#6b6b6b',
    badge: '#b2b2b2',
  },
}

export function aggregateStatus(statuses: ZoneStatus[]): ZoneStatus {
  if (statuses.some((status) => status === 'fault')) {
    return 'fault'
  }

  if (statuses.length > 0 && statuses.every((status) => status === 'inactive')) {
    return 'inactive'
  }

  return 'normal'
}
