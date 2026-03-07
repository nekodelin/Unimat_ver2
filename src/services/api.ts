const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://127.0.0.1:8000'
const REQUEST_TIMEOUT_MS = 8000

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController()
  const timerId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    return (await response.json()) as T
  } finally {
    window.clearTimeout(timerId)
  }
}

export async function fetchInitialState(): Promise<unknown> {
  return fetchJson<unknown>('/api/state')
}

export async function fetchConfig(): Promise<unknown> {
  return fetchJson<unknown>('/api/config')
}

export async function fetchJournal(): Promise<unknown> {
  return fetchJson<unknown>('/api/journal')
}
