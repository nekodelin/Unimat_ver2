import { createContext } from 'react'
import type { ChannelEntity, ModuleEntity, RealtimeState, ZoneEntity } from '@/types/realtime'

export type RealtimeContextValue = RealtimeState & {
  channels: ChannelEntity[]
  modules: ModuleEntity[]
  zones: ZoneEntity[]
  reconnect: () => void
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null)
