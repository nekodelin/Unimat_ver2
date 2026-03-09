export type ZoneStatus = 'normal' | 'fault' | 'inactive'

export type ConnectionState = 'connected' | 'reconnecting' | 'offline'

export type LedColor = 'red' | 'yellow' | 'dim' | 'muted'

export type RowColor = 'red' | 'normal' | 'muted'

export const ZONE_STATUS_PRIORITY: ZoneStatus[] = ['fault', 'normal', 'inactive']

