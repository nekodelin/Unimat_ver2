import { useEffect, useState } from 'react'
import styles from './EventJournalModal.module.css'

export type LogEvent = {
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
}

interface EventJournalModalProps {
  isOpen: boolean
  onClose: () => void
}

const infoMessages = [
  'Плановая проверка связи',
  'Стабилизация параметров завершена',
  'Принят пакет телеметрии',
]

const warningMessages = [
  'Повышенная температура блока U15',
  'Нестабильное питание линии QL6C',
  'Рекомендуется проверка релейной группы',
]

const errorMessages = [
  'Потеря связи с модулем A3',
  'Авария входа дискретного канала',
  'Сработала критическая защита контроллера',
]

function getMessage(level: LogEvent['level']): string {
  if (level === 'error') {
    return errorMessages[Math.floor(Math.random() * errorMessages.length)]
  }

  if (level === 'warning') {
    return warningMessages[Math.floor(Math.random() * warningMessages.length)]
  }

  return infoMessages[Math.floor(Math.random() * infoMessages.length)]
}

function getRandomLevel(): LogEvent['level'] {
  const random = Math.random()

  if (random < 0.15) {
    return 'error'
  }

  if (random < 0.4) {
    return 'warning'
  }

  return 'info'
}

function EventJournalModal({ isOpen, onClose }: EventJournalModalProps) {
  const [logs, setLogs] = useState<LogEvent[]>([])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const level = getRandomLevel()
      const nextLog: LogEvent = {
        level,
        message: getMessage(level),
        timestamp: new Date().toLocaleString('ru-RU'),
      }

      setLogs((prevLogs) => [nextLog, ...prevLogs].slice(0, 200))
    }, 4000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Журнал событий"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h3 className={styles.title}>Журнал событий</h3>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            X
          </button>
        </header>

        <div className={styles.logList}>
          {logs.length === 0 ? <div className={styles.empty}>События появятся автоматически...</div> : null}

          {logs.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} className={`${styles.logItem} ${styles[log.level]}`}>
              <span className={styles.time}>{log.timestamp}</span>
              <span className={styles.message}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EventJournalModal
