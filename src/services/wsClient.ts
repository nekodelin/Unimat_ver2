import { debugLog } from '../config/env'

export type WsPayloadHandler = (payload: unknown) => void

export interface WsClientOptions {
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: unknown) => void
  reconnectDelayMs?: number
}

export class WsClient {
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private shouldReconnect = false
  private url = ''
  private handler: WsPayloadHandler | null = null
  private options: WsClientOptions = {}

  connect(url: string, handler: WsPayloadHandler, options: WsClientOptions = {}): void {
    this.disconnect()

    if (url.trim().length === 0) {
      debugLog('WS url is empty, skip connect')
      return
    }

    this.url = url
    this.handler = handler
    this.options = options
    this.shouldReconnect = true
    this.open()
  }

  disconnect(): void {
    this.shouldReconnect = false

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  private open(): void {
    try {
      this.socket = new WebSocket(this.url)
    } catch (error) {
      this.options.onError?.(error)
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      debugLog('WS connected', this.url)
      this.options.onOpen?.()
    }

    this.socket.onmessage = (event) => {
      this.handler?.(this.parsePayload(event.data))
    }

    this.socket.onerror = (event) => {
      debugLog('WS error', event)
      this.options.onError?.(event)
    }

    this.socket.onclose = () => {
      debugLog('WS disconnected')
      this.options.onClose?.()
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer !== null) {
      return
    }

    const delay = this.options.reconnectDelayMs ?? 2500

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null

      if (!this.shouldReconnect) {
        return
      }

      debugLog('WS reconnect attempt')
      this.open()
    }, delay)
  }

  private parsePayload(data: unknown): unknown {
    if (typeof data !== 'string') {
      return data
    }

    try {
      return JSON.parse(data) as unknown
    } catch {
      return data
    }
  }
}

