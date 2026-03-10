export type AppEnv = 'prod' | 'dev'

interface FrontendEnvConfig {
  appEnv: AppEnv
  apiBaseUrl: string
  wsBaseUrl: string
  useMocks: boolean
  debugApi: boolean
  pollFallbackMs: number
  wsReconnectDelayMs: number
}

function normalizeBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function normalizeAppEnv(value: string | undefined): AppEnv {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'dev' || normalized === 'development') {
    return 'dev'
  }

  return 'prod'
}

function normalizeNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

const devModeEnabled = normalizeBoolean(import.meta.env.VITE_DEV_MODE, import.meta.env.DEV)
const mockEnabledByConfig = normalizeBoolean(
  import.meta.env.VITE_ENABLE_MOCK,
  normalizeBoolean(import.meta.env.VITE_USE_MOCKS, false),
)

export const envConfig: FrontendEnvConfig = {
  appEnv: normalizeAppEnv(import.meta.env.VITE_APP_ENV),
  apiBaseUrl: trimTrailingSlash((import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').trim()),
  wsBaseUrl: trimTrailingSlash((import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000').trim()),
  useMocks: devModeEnabled && mockEnabledByConfig,
  debugApi: normalizeBoolean(import.meta.env.VITE_DEBUG_API, false),
  pollFallbackMs: normalizeNumber(import.meta.env.VITE_POLL_FALLBACK_MS, 5000),
  wsReconnectDelayMs: 2500,
}

function normalizeApiPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized.startsWith('/api') ? normalized : `/api${normalized}`
}

function normalizeWsPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized.startsWith('/ws') ? normalized : `/ws${normalized}`
}

export function buildApiUrl(path: string): string {
  const normalizedPath = normalizeApiPath(path)
  if (envConfig.apiBaseUrl.endsWith('/api')) {
    return `${envConfig.apiBaseUrl}${normalizedPath.replace(/^\/api/, '')}`
  }

  return `${envConfig.apiBaseUrl}${normalizedPath}`
}

export function buildWsUrl(path: string): string {
  const normalizedPath = normalizeWsPath(path)
  if (envConfig.wsBaseUrl.endsWith('/ws')) {
    return `${envConfig.wsBaseUrl}${normalizedPath.replace(/^\/ws/, '')}`
  }

  return `${envConfig.wsBaseUrl}${normalizedPath}`
}

export function debugLog(message: string, payload?: unknown): void {
  if (!envConfig.debugApi) {
    return
  }

  if (payload === undefined) {
    console.debug(`[frontend-debug] ${message}`)
    return
  }

  console.debug(`[frontend-debug] ${message}`, payload)
}

