import { moduleHotspotsQl6c } from '@/data/moduleHotspots_ql6c'

type ModuleHealthStatus = 'ok' | 'warning' | 'error'
type ModuleHotspotStatus = 'ok' | 'fault' | 'inactive'

export type WsPayload = {
  train: { modules: Record<string, { status: ModuleHealthStatus }> }
  module: {
    id: string
    leds: { yellow: boolean[]; red: boolean[] }
    hotspots: Record<string, { status: ModuleHotspotStatus }>
    currentFault?: string
  }
  logs: { level: 'info' | 'warning' | 'error'; message: string; ts: number }[]
}

function randomHealthStatus(): ModuleHealthStatus {
  const random = Math.random()

  if (random < 0.15) {
    return 'error'
  }

  if (random < 0.45) {
    return 'warning'
  }

  return 'ok'
}

function randomHotspotStatus(): ModuleHotspotStatus {
  const random = Math.random()

  if (random < 0.15) {
    return 'fault'
  }

  if (random < 0.35) {
    return 'inactive'
  }

  return 'ok'
}

function randomBitset(activeCount: number): boolean[] {
  const result = Array.from({ length: 16 }, () => false)
  const indices = Array.from({ length: 16 }, (_, index) => index)

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = indices[index]
    indices[index] = indices[swapIndex]
    indices[swapIndex] = current
  }

  for (let index = 0; index < activeCount; index += 1) {
    result[indices[index]] = true
  }

  return result
}

function createPayload(): WsPayload {
  const ql6cStatus = randomHealthStatus()
  const ql1cStatus = randomHealthStatus()

  const moduleHotspots = Object.fromEntries(
    moduleHotspotsQl6c.map((hotspot) => [hotspot.id, { status: randomHotspotStatus() }]),
  ) as Record<string, { status: ModuleHotspotStatus }>

  const redActiveCount = ql6cStatus === 'error' ? 1 + Math.floor(Math.random() * 4) : 0
  const yellowActiveCount =
    ql6cStatus === 'warning' || ql6cStatus === 'error' ? 1 + Math.floor(Math.random() * 5) : 0

  const level = ql6cStatus === 'error' ? 'error' : ql6cStatus === 'warning' ? 'warning' : 'info'

  return {
    train: {
      modules: {
        QL6C: { status: ql6cStatus },
        QL1C: { status: ql1cStatus },
      },
    },
    module: {
      id: 'QL6C',
      leds: {
        yellow: randomBitset(yellowActiveCount),
        red: randomBitset(redActiveCount),
      },
      hotspots: moduleHotspots,
      currentFault: ql6cStatus === 'error' ? 'Обрыв кабеля' : undefined,
    },
    logs: [
      {
        level,
        message:
          level === 'error'
            ? 'Критическая ошибка в цепи QL6C'
            : level === 'warning'
              ? 'Предупреждение по питанию QL6C'
              : 'Система работает в штатном режиме',
        ts: Date.now(),
      },
    ],
  }
}

export function connectMockWS(onData: (data: WsPayload) => void): () => void {
  onData(createPayload())

  const intervalId = window.setInterval(() => {
    onData(createPayload())
  }, 2500)

  return () => {
    window.clearInterval(intervalId)
  }
}
