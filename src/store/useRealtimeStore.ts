import { useContext } from 'react'
import { RealtimeContext } from './realtimeContext'

export function useRealtimeStore() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtimeStore must be used inside RealtimeProvider')
  }

  return context
}
