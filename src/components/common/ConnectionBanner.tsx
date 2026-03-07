import { useMemo } from 'react'
import type { RealtimeConnectionStatus } from '@/types/realtime'
import styles from './ConnectionBanner.module.css'

type ConnectionBannerProps = {
  status: RealtimeConnectionStatus
  lastUpdateAt: number | null
  error: string | null
  onRetry: () => void
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) {
    return '--:--:--'
  }

  return new Date(timestamp).toLocaleTimeString('ru-RU')
}

function ConnectionBanner({ status, lastUpdateAt, error, onRetry }: ConnectionBannerProps) {
  const labels = useMemo(() => {
    if (status === 'connected') {
      return { text: 'connected', className: styles.connected }
    }

    if (status === 'connecting') {
      return { text: 'connecting', className: styles.connecting }
    }

    if (status === 'reconnecting') {
      return { text: 'reconnecting', className: styles.reconnecting }
    }

    if (status === 'error') {
      return { text: 'error', className: styles.error }
    }

    return { text: 'disconnected', className: styles.disconnected }
  }, [status])

  return (
    <div className={styles.banner}>
      <span className={`${styles.badge} ${labels.className}`}>{labels.text}</span>
      <span className={styles.time}>Обновлено: {formatTime(lastUpdateAt)}</span>
      {error ? <span className={styles.errorText}>{error}</span> : null}
      {(status === 'disconnected' || status === 'error') && (
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Повторить подключение
        </button>
      )}
    </div>
  )
}

export default ConnectionBanner
