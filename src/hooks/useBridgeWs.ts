import { useEffect, useRef, useState } from 'react'
import type { BridgeConnectionStatus, BridgeIncomingMessage, PumaBoardDecodedMessage } from '@/types/bridge'

const WS_URL = import.meta.env.VITE_BRIDGE_WS_URL?.trim() || 'ws://localhost:8000/ws'
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000]

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isBoardDecodedMessage(message: unknown): message is PumaBoardDecodedMessage {
  if (!isObject(message)) {
    return false
  }

  return message.type === 'puma_board_decoded' && Array.isArray(message.channels)
}

export type UseBridgeWsResult = {
  connectionStatus: BridgeConnectionStatus
  lastBoardDecoded: PumaBoardDecodedMessage | null
}

export function useBridgeWs(): UseBridgeWsResult {
  const [connectionStatus, setConnectionStatus] = useState<BridgeConnectionStatus>('connecting')
  const [lastBoardDecoded, setLastBoardDecoded] = useState<PumaBoardDecodedMessage | null>(null)

  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const disposedRef = useRef(false)

  useEffect(() => {
    disposedRef.current = false

    function clearReconnectTimer() {
      if (reconnectTimerRef.current === null) {
        return
      }

      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    function connect() {
      if (disposedRef.current) {
        return
      }

      setConnectionStatus(reconnectAttemptRef.current === 0 ? 'connecting' : 'reconnecting')
      const socket = new WebSocket(WS_URL)
      wsRef.current = socket

      socket.onopen = () => {
        reconnectAttemptRef.current = 0
        setConnectionStatus('connected')
      }

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as BridgeIncomingMessage
          if (isBoardDecodedMessage(parsed)) {
            setLastBoardDecoded(parsed)
          }
        } catch {
          // Ignore malformed payloads from bridge.
        }
      }

      socket.onerror = () => {
        socket.close()
      }

      socket.onclose = () => {
        if (disposedRef.current) {
          return
        }

        setConnectionStatus('disconnected')

        const delay =
          RECONNECT_DELAYS_MS[Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS_MS.length - 1)]
        reconnectAttemptRef.current += 1

        clearReconnectTimer()
        reconnectTimerRef.current = window.setTimeout(() => {
          connect()
        }, delay)
      }
    }

    connect()

    return () => {
      disposedRef.current = true
      clearReconnectTimer()
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  return { connectionStatus, lastBoardDecoded }
}
