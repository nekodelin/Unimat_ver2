import { buildApiUrl } from '../config/env'

type QueryParamValue = string | number | boolean | null | undefined

export interface ApiRequestOptions {
  timeoutMs?: number
  headers?: HeadersInit
  query?: Record<string, QueryParamValue>
  signal?: AbortSignal
}

export interface ApiBlobResponse {
  blob: Blob
  headers: Headers
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly statusText: string
  readonly responseBody: string

  constructor(status: number, statusText: string, responseBody: string) {
    super(`HTTP ${status} ${statusText}${responseBody ? `: ${responseBody}` : ''}`)
    this.name = 'ApiRequestError'
    this.status = status
    this.statusText = statusText
    this.responseBody = responseBody
  }
}

function buildRequestUrl(path: string, query?: Record<string, QueryParamValue>): string {
  const url = new URL(buildApiUrl(path))

  if (!query) {
    return url.toString()
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    const normalizedValue = String(value).trim()
    if (!normalizedValue) {
      return
    }

    url.searchParams.set(key, normalizedValue)
  })

  return url.toString()
}

function buildHeaders(baseHeaders?: HeadersInit, defaults?: Record<string, string>): Headers {
  const headers = new Headers(baseHeaders)

  if (defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
      if (!headers.has(key)) {
        headers.set(key, value)
      }
    })
  }

  return headers
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function apiRequest(
  method: 'GET' | 'POST',
  path: string,
  options: ApiRequestOptions = {},
  body?: BodyInit,
  defaultHeaders?: Record<string, string>,
): Promise<Response> {
  const request = fetch(buildRequestUrl(path, options.query), {
    method,
    body,
    signal: options.signal,
    headers: buildHeaders(options.headers, defaultHeaders),
  }).then(async (response) => {
    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      throw new ApiRequestError(response.status, response.statusText, responseBody)
    }

    return response
  })

  return withTimeout(request, options.timeoutMs ?? 8000)
}

export async function apiGet<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await apiRequest('GET', path, options, undefined, {
    Accept: 'application/json',
  })

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiPost<T>(
  path: string,
  payload?: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  if (payload !== undefined) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  const response = await apiRequest(
    'POST',
    path,
    options,
    payload === undefined ? undefined : JSON.stringify(payload),
    defaultHeaders,
  )

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return (await response.text()) as T
}

export async function apiGetBlob(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiBlobResponse> {
  const response = await apiRequest('GET', path, options)
  return {
    blob: await response.blob(),
    headers: response.headers,
  }
}
