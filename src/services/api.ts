import { debugLog } from '../config/env'
import { apiGet } from './apiClient'

export async function fetchSystemStateRaw(): Promise<unknown> {
  const payload = await apiGet<unknown>('/state')
  debugLog('REST /api/state', payload)
  return payload
}

export async function fetchMqttHealthRaw(): Promise<unknown> {
  const payload = await apiGet<unknown>('/health/mqtt')
  debugLog('REST /api/health/mqtt', payload)
  return payload
}

