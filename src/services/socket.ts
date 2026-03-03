export type SocketLevel = 'normal' | 'warning' | 'error'

export interface SocketMessage {
  level: SocketLevel
}

export function connectSocket(onMessage: (data: SocketMessage) => void): () => void {
  const intervalId = window.setInterval(() => {
    const random = Math.random()

    if (random < 0.1) {
      onMessage({ level: 'error' })
      return
    }

    if (random < 0.3) {
      onMessage({ level: 'warning' })
      return
    }

    onMessage({ level: 'normal' })
  }, 5000)

  return () => {
    window.clearInterval(intervalId)
  }
}
