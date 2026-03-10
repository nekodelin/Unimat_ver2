export type JournalLevel = 'info' | 'warning' | 'error'

export interface JournalEntry {
  id: string
  timestamp: string
  level: JournalLevel
  type?: string
  source: string
  element?: string
  oldState?: string
  newState?: string
  description?: string
  channel: string
  title: string
  message: string
  signalId?: string
  reason?: string
  action?: string
  severity?: string
}

