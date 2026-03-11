import { useEffect, useMemo, useState } from 'react'
import type { ChannelState } from '../../types/channel'
import type { ConnectionState } from '../../types/status'
import styles from './ConnectionStatusStrip.module.css'

type IndicatorTone = 'green' | 'yellow' | 'red' | 'gray'

interface ConnectionStatusStripProps {
  connectionState: ConnectionState
  decodedChannels: ChannelState[]
  updatedAt: string | null
}

interface StatusIndicator {
  id: string
  label: string
  tone: IndicatorTone
  details: string
  lastSuccessAt: number | null
}

const MAIN_MODULE_KEY = 'QL6C'

const FRESH_OK_SECONDS = 10
const FRESH_WARN_SECONDS = 30
const UI_FLOW_OK_SECONDS = 7
const UI_FLOW_WARN_SECONDS = 20

const TONE_CLASS_BY_VALUE: Record<IndicatorTone, string> = {
  green: styles.dotGreen,
  yellow: styles.dotYellow,
  red: styles.dotRed,
  gray: styles.dotGray,
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

function secondsSince(now: number, timestamp: number | null): number | null {
  if (!timestamp) {
    return null
  }

  return Math.max(0, Math.floor((now - timestamp) / 1000))
}

function formatSecondsAgo(seconds: number | null): string {
  if (seconds === null) {
    return 'нет данных'
  }

  if (seconds < 1) {
    return 'только что'
  }

  if (seconds < 60) {
    return `${seconds} сек назад`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} мин назад`
  }

  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  if (hours < 24) {
    return restMinutes > 0 ? `${hours} ч ${restMinutes} мин назад` : `${hours} ч назад`
  }

  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours > 0 ? `${days} д ${restHours} ч назад` : `${days} д назад`
}

function toneByAge(seconds: number | null): IndicatorTone {
  if (seconds === null) {
    return 'gray'
  }

  if (seconds <= FRESH_OK_SECONDS) {
    return 'green'
  }

  if (seconds <= FRESH_WARN_SECONDS) {
    return 'yellow'
  }

  return 'red'
}

function connectionTone(connectionState: ConnectionState): IndicatorTone {
  if (connectionState === 'connected') {
    return 'green'
  }

  if (connectionState === 'reconnecting') {
    return 'yellow'
  }

  return 'red'
}

function connectionDetails(connectionState: ConnectionState): string {
  if (connectionState === 'connected') {
    return 'Соединение с backend активно.'
  }

  if (connectionState === 'reconnecting') {
    return 'Идет переподключение к backend.'
  }

  return 'Связь с backend отсутствует.'
}

export function ConnectionStatusStrip({
  connectionState,
  decodedChannels,
  updatedAt,
}: ConnectionStatusStripProps) {
  const [now, setNow] = useState(() => Date.now())
  const [lastUiFlowAt, setLastUiFlowAt] = useState<number | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!updatedAt) {
      return
    }

    setLastUiFlowAt(Date.now())
  }, [updatedAt])

  const updatedAtTs = useMemo(() => parseTimestamp(updatedAt), [updatedAt])

  const latestIncomingTs = useMemo(() => {
    const timestamps = decodedChannels
      .map((channel) => parseTimestamp(channel.lastUpdated))
      .filter((value): value is number => value !== null)

    if (timestamps.length === 0) {
      return null
    }

    return Math.max(...timestamps)
  }, [decodedChannels])

  const boardChannels = useMemo(
    () => decodedChannels.filter((channel) => channel.moduleKey.trim().toUpperCase() === MAIN_MODULE_KEY),
    [decodedChannels],
  )

  const boardKnownChannels = useMemo(
    () => boardChannels.filter((channel) => channel.backendStatus !== 'unknown'),
    [boardChannels],
  )
  const boardLatestTs = useMemo(() => {
    const source = boardKnownChannels.length > 0 ? boardKnownChannels : boardChannels
    const timestamps = source
      .map((channel) => parseTimestamp(channel.lastUpdated))
      .filter((value): value is number => value !== null)

    if (timestamps.length === 0) {
      return null
    }

    return Math.max(...timestamps)
  }, [boardChannels, boardKnownChannels])

  const boardAge = secondsSince(now, boardLatestTs)
  const incomingAge = secondsSince(now, latestIncomingTs)
  const updatedAge = secondsSince(now, updatedAtTs)
  const uiFlowAge = secondsSince(now, lastUiFlowAt)

  const indicators: StatusIndicator[] = [
    {
      id: 'board-online',
      label: 'Плата онлайн',
      tone:
        boardChannels.length === 0
          ? connectionState === 'offline'
            ? 'red'
            : 'gray'
          : connectionState === 'offline'
            ? 'red'
            : boardKnownChannels.length === 0
              ? 'yellow'
              : toneByAge(boardAge),
      details:
        boardChannels.length === 0
          ? 'Данные по каналам платы не поступали.'
          : `Каналов в потоке: ${boardChannels.length}, подтвержденных статусов: ${boardKnownChannels.length}.`,
      lastSuccessAt: boardLatestTs,
    },
    {
      id: 'incoming-data',
      label: 'Есть входящие данные',
      tone:
        decodedChannels.length === 0
          ? connectionState === 'offline'
            ? 'red'
            : 'gray'
          : connectionState === 'offline'
            ? 'red'
            : toneByAge(incomingAge),
      details:
        decodedChannels.length === 0
          ? 'Входящий поток пока пустой.'
          : `Получено каналов: ${decodedChannels.length}.`,
      lastSuccessAt: latestIncomingTs,
    },
    {
      id: 'backend',
      label: 'Бекенд доступен',
      tone: connectionTone(connectionState),
      details: connectionDetails(connectionState),
      lastSuccessAt: updatedAtTs,
    },
    {
      id: 'ui-updates',
      label: 'Обновления доходят до интерфейса',
      tone:
        uiFlowAge === null
          ? 'gray'
          : uiFlowAge <= UI_FLOW_OK_SECONDS
            ? 'green'
            : uiFlowAge <= UI_FLOW_WARN_SECONDS
              ? 'yellow'
              : 'red',
      details:
        uiFlowAge === null
          ? 'Сигнал обновления UI еще не получен.'
          : `Последняя доставка обновления в UI: ${formatSecondsAgo(uiFlowAge)}.`,
      lastSuccessAt: lastUiFlowAt,
    },
    {
      id: 'fresh-data',
      label: 'Данные свежие',
      tone: toneByAge(updatedAge),
      details:
        updatedAge === null
          ? 'Backend еще не передал отметку времени.'
          : `Возраст последних данных: ${formatSecondsAgo(updatedAge)}.`,
      lastSuccessAt: updatedAtTs,
    },
  ]

  const lastUpdateText = `Последнее обновление: ${formatSecondsAgo(updatedAge)}`

  const lastSuccessTs = useMemo(() => {
    const timestamps = [updatedAtTs, latestIncomingTs, lastUiFlowAt].filter(
      (value): value is number => value !== null,
    )

    if (timestamps.length === 0) {
      return null
    }

    return Math.max(...timestamps)
  }, [lastUiFlowAt, latestIncomingTs, updatedAtTs])

  const lastSuccessText = `Последний успешный обмен: ${formatSecondsAgo(secondsSince(now, lastSuccessTs))}`

  return (
    <section className={styles.strip} aria-label="Статусы связи">
      <div className={styles.indicators}>
        {indicators.map((indicator) => {
          const details = `${indicator.label}. ${indicator.details} Последний успешный обмен: ${formatSecondsAgo(
            secondsSince(now, indicator.lastSuccessAt),
          )}.`

          return (
            <button
              key={indicator.id}
              type="button"
              className={styles.indicatorButton}
              data-tooltip={details}
              aria-label={details}
            >
              <span className={`${styles.dot} ${TONE_CLASS_BY_VALUE[indicator.tone]}`} aria-hidden="true" />
              <span className={styles.indicatorLabel}>{indicator.label}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.meta}>
        <span>{lastUpdateText}</span>
        <span>{lastSuccessText}</span>
      </div>
    </section>
  )
}
