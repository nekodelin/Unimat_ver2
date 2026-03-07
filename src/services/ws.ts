import { createDemoSnapshot } from '@/data/demoState'
import type { RealtimeConnectionStatus } from '@/types/realtime'

const WS_URL = import.meta.env.VITE_WS_URL?.trim() || 'ws://127.0.0.1:8000/ws/state'
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000]

export type RealtimeWsCallbacks = {
  onStatus: (status: RealtimeConnectionStatus) => void
  onMessage: (payload: unknown) => void
  onError?: (error: unknown) => void
}

export function connectRealtimeWs(callbacks: RealtimeWsCallbacks): () => void {
  let socket: WebSocket | null = null
  let reconnectTimer: number | null = null
  let reconnectAttempt = 0
  let disposed = false

  const clearTimer = () => {
    if (reconnectTimer === null) {
      return
    }

    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  const connect = () => {
    if (disposed) {
      return
    }

    callbacks.onStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting')
    socket = new WebSocket(WS_URL)

    socket.onopen = () => {
      reconnectAttempt = 0
      callbacks.onStatus('connected')
    }

    socket.onmessage = (event) => {
      try {
        callbacks.onMessage(JSON.parse(String(event.data)))
      } catch (error) {
        callbacks.onError?.(error)
      }
    }

    socket.onerror = (event) => {
      callbacks.onStatus('error')
      callbacks.onError?.(event)
      socket?.close()
    }

    socket.onclose = () => {
      if (disposed) {
        return
      }

      callbacks.onStatus('disconnected')
      const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)]
      reconnectAttempt += 1

      clearTimer()
      reconnectTimer = window.setTimeout(() => {
        connect()
      }, delay)
    }
  }

  connect()

  return () => {
    disposed = true
    clearTimer()
    socket?.close()
    socket = null
  }
}

// Legacy mock exports for backward compatibility with old prototype files.
export type WsPayload = ReturnType<typeof createDemoSnapshot>

export function connectMockWS(onData: (data: WsPayload) => void): () => void {
  const emit = () => onData(createDemoSnapshot())
  emit()
  const timerId = window.setInterval(emit, 3000)
  return () => window.clearInterval(timerId)
}
