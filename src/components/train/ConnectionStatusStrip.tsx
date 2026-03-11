import { useEffect, useMemo, useState } from 'react'
import type {
  ConnectionDiagnosticSeverity,
  ConnectionDiagnostics,
  ConnectionIndicatorTone,
} from '../../types/app'
import type { ChannelState } from '../../types/channel'
import type { ConnectionState } from '../../types/status'
import styles from './ConnectionStatusStrip.module.css'

interface ConnectionStatusStripProps {
  connectionState: ConnectionState
  decodedChannels: ChannelState[]
  updatedAt: string | null
  connectionDiagnostics: ConnectionDiagnostics | null
}

interface StatusIndicator {
  id: string
  label: string
  tone: ConnectionIndicatorTone
  details: string
  lastSuccessAt: number | null
}

interface SystemDiagnosis {
  problemTitle: string
  recommendedChecks: string[]
  severity: ConnectionDiagnosticSeverity
}

const MAIN_MODULE_KEY = 'QL6C'

const FRESH_OK_SECONDS = 10
const FRESH_WARN_SECONDS = 30
const UI_FLOW_OK_SECONDS = 7
const UI_FLOW_WARN_SECONDS = 20

const TONE_CLASS_BY_VALUE: Record<ConnectionIndicatorTone, string> = {
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
  if (timestamp === null) {
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

function formatRelativeAge(rawAgo: number | string | null | undefined, fallbackAge: number | null): string {
  if (typeof rawAgo === 'number' && Number.isFinite(rawAgo)) {
    return formatSecondsAgo(Math.max(0, Math.trunc(rawAgo)))
  }

  if (typeof rawAgo === 'string') {
    const trimmed = rawAgo.trim()
    if (!trimmed) {
      return formatSecondsAgo(fallbackAge)
    }

    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) {
      return formatSecondsAgo(Math.max(0, Math.trunc(parsed)))
    }

    return trimmed
  }

  return formatSecondsAgo(fallbackAge)
}

function toneByAge(seconds: number | null): ConnectionIndicatorTone {
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

function connectionTone(connectionState: ConnectionState): ConnectionIndicatorTone {
  if (connectionState === 'connected') {
    return 'green'
  }

  if (connectionState === 'reconnecting') {
    return 'yellow'
  }

  return 'red'
}

function toneCaption(tone: ConnectionIndicatorTone): string {
  if (tone === 'green') {
    return 'OK'
  }

  if (tone === 'yellow') {
    return 'Внимание'
  }

  if (tone === 'red') {
    return 'Ошибка'
  }

  return 'Нет данных'
}

function inferSeverity(indicators: StatusIndicator[]): ConnectionDiagnosticSeverity {
  const tones = indicators.map((indicator) => indicator.tone)

  if (tones.includes('red')) {
    return 'error'
  }

  if (tones.includes('yellow')) {
    return 'warning'
  }

  if (tones.every((tone) => tone === 'gray')) {
    return 'unknown'
  }

  return 'normal'
}

function severityLabel(severity: ConnectionDiagnosticSeverity): string {
  if (severity === 'error') {
    return 'Ошибка'
  }

  if (severity === 'warning') {
    return 'Предупреждение'
  }

  if (severity === 'normal') {
    return 'Норма'
  }

  return 'Неизвестно'
}

function deriveFallbackDiagnosis(
  indicators: StatusIndicator[],
  connectionState: ConnectionState,
): SystemDiagnosis {
  const byId = new Map(indicators.map((indicator) => [indicator.id, indicator]))

  if (connectionState === 'offline' || byId.get('backend')?.tone === 'red') {
    return {
      problemTitle: 'Сервер недоступен',
      recommendedChecks: ['Работает ли сервер', 'Есть ли интернет-соединение', 'Запущен ли backend сервис'],
      severity: 'error',
    }
  }

  const incomingTone = byId.get('incoming-data')?.tone ?? 'gray'
  if (incomingTone === 'red' || incomingTone === 'gray') {
    return {
      problemTitle: 'Нет данных от Orange',
      recommendedChecks: ['Orange', 'Кабель к плате', 'Передачу данных на сервер'],
      severity: incomingTone === 'red' ? 'error' : 'warning',
    }
  }

  const freshTone = byId.get('fresh-data')?.tone ?? 'gray'
  if (freshTone === 'red') {
    return {
      problemTitle: 'Данные давно не обновлялись',
      recommendedChecks: ['Источник данных включен', 'Передача данных не остановлена', 'Сервер принимает новые данные'],
      severity: 'error',
    }
  }

  const severity = inferSeverity(indicators)
  if (severity === 'warning') {
    return {
      problemTitle: 'Есть предупреждение по связи',
      recommendedChecks: ['Проверьте пункты со статусом "Внимание"', 'Проверьте пункты со статусом "Ошибка"'],
      severity,
    }
  }

  if (severity === 'unknown') {
    return {
      problemTitle: 'Недостаточно данных',
      recommendedChecks: ['Orange', 'Кабель к плате', 'Передачу данных на сервер'],
      severity,
    }
  }

  return {
    problemTitle: 'Не обнаружена',
    recommendedChecks: [],
    severity: 'normal',
  }
}

function buildBackendDiagnosis(
  diagnostics: ConnectionDiagnostics,
  fallbackDiagnosis: SystemDiagnosis,
): SystemDiagnosis {
  const problemTitle = diagnostics.problemTitle.trim()
  const recommendedChecks = diagnostics.recommendedChecks
    .map((check) => check.trim())
    .filter((check) => check.length > 0)

  const severity =
    diagnostics.severity === 'unknown' ? fallbackDiagnosis.severity : diagnostics.severity

  const fallbackProblemTitle =
    severity === 'normal' ? 'Не обнаружена' : fallbackDiagnosis.problemTitle || 'Требуется внимание'

  return {
    problemTitle: problemTitle || fallbackProblemTitle,
    recommendedChecks:
      recommendedChecks.length > 0
        ? recommendedChecks
        : severity === 'normal'
          ? []
          : fallbackDiagnosis.recommendedChecks,
    severity,
  }
}

export function ConnectionStatusStrip({
  connectionState,
  decodedChannels,
  updatedAt,
  connectionDiagnostics,
}: ConnectionStatusStripProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

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
  const uiFlowAnchorTs = updatedAtTs ?? latestIncomingTs
  const uiFlowAge = secondsSince(now, uiFlowAnchorTs)

  const fallbackIndicators: StatusIndicator[] = [
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
      details:
        connectionState === 'connected'
          ? 'Соединение с бекендом активно.'
          : connectionState === 'reconnecting'
            ? 'Идет переподключение к бекенду.'
            : 'Связь с бекендом отсутствует.',
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
          ? 'Сигнал обновления UI пока не зафиксирован.'
          : `Последняя доставка обновления в UI: ${formatSecondsAgo(uiFlowAge)}.`,
      lastSuccessAt: uiFlowAnchorTs,
    },
    {
      id: 'fresh-data',
      label: 'Данные свежие',
      tone: toneByAge(updatedAge),
      details:
        updatedAge === null
          ? 'Нет отметки времени по последним данным.'
          : `Возраст последних данных: ${formatSecondsAgo(updatedAge)}.`,
      lastSuccessAt: updatedAtTs,
    },
  ]

  const backendIndicators = useMemo<StatusIndicator[]>(() => {
    if (!connectionDiagnostics || connectionDiagnostics.statuses.length === 0) {
      return []
    }

    return connectionDiagnostics.statuses
      .map((status, index) => ({
        id: status.id || `status-${index + 1}`,
        label: status.label.trim(),
        tone: status.tone,
        details: status.details?.trim() ?? '',
        lastSuccessAt: parseTimestamp(status.lastSuccessAt),
      }))
      .filter((status) => status.label.length > 0)
  }, [connectionDiagnostics])

  const indicators = backendIndicators.length > 0 ? backendIndicators : fallbackIndicators
  const fallbackDiagnosis = useMemo(
    () => deriveFallbackDiagnosis(indicators, connectionState),
    [connectionState, indicators],
  )
  const diagnosis = connectionDiagnostics
    ? buildBackendDiagnosis(connectionDiagnostics, fallbackDiagnosis)
    : fallbackDiagnosis
  const showHealthyState = diagnosis.recommendedChecks.length === 0 && diagnosis.severity === 'normal'

  const lastSuccessFallbackTs = useMemo(() => {
    const timestamps = indicators
      .map((indicator) => indicator.lastSuccessAt)
      .filter((value): value is number => value !== null)

    if (timestamps.length === 0) {
      return null
    }

    return Math.max(...timestamps)
  }, [indicators])

  const diagnosticsUpdatedTs = parseTimestamp(connectionDiagnostics?.lastUpdatedAt)
  const diagnosticsSuccessTs = parseTimestamp(connectionDiagnostics?.lastSuccessfulExchangeAt)
  const lastUpdatedText = `Последнее обновление: ${formatRelativeAge(
    connectionDiagnostics?.lastUpdatedAgo,
    secondsSince(now, diagnosticsUpdatedTs ?? updatedAtTs),
  )}`
  const lastSuccessfulText = `Последний успешный обмен: ${formatRelativeAge(
    connectionDiagnostics?.lastSuccessfulExchangeAgo,
    secondsSince(now, diagnosticsSuccessTs ?? lastSuccessFallbackTs),
  )}`

  const severityClass =
    diagnosis.severity === 'error'
      ? styles.summaryError
      : diagnosis.severity === 'warning'
        ? styles.summaryWarning
        : diagnosis.severity === 'normal'
          ? styles.summaryNormal
          : styles.summaryUnknown

  return (
    <section className={styles.strip} aria-label="Состояние системы связи">
      <header className={styles.header}>
        <h3 className={styles.title}>Состояние системы</h3>
        <span className={`${styles.severityBadge} ${severityClass}`}>{severityLabel(diagnosis.severity)}</span>
      </header>

      <div className={`${styles.summary} ${severityClass}`}>
        <p className={styles.summaryLine}>
          <span className={styles.summaryLabel}>Проблема:</span>
          <span className={styles.summaryValue}>{diagnosis.problemTitle}</span>
        </p>
        {diagnosis.recommendedChecks.length > 0 ? (
          <div className={styles.summaryChecks}>
            <span className={styles.summaryLabel}>Что проверить:</span>
            <ul className={styles.checkList}>
              {diagnosis.recommendedChecks.map((check, index) => (
                <li key={`${check}-${index}`} className={styles.checkItem}>
                  {check}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          showHealthyState && <p className={styles.summaryOk}>Система работает нормально</p>
        )}
      </div>

      <div className={styles.indicators} aria-label="Диагностика статусов связи">
        {indicators.map((indicator) => (
          <div key={indicator.id} className={styles.indicatorItem}>
            <span className={`${styles.dot} ${TONE_CLASS_BY_VALUE[indicator.tone]}`} aria-hidden="true" />
            <span className={styles.indicatorLabel}>{indicator.label}</span>
            <span className={styles.indicatorTone}>{toneCaption(indicator.tone)}</span>
          </div>
        ))}
      </div>

      <div className={styles.meta}>
        <span>{lastUpdatedText}</span>
        <span>{lastSuccessfulText}</span>
      </div>
    </section>
  )
}
