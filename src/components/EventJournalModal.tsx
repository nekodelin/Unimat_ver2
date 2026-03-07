import { useEffect, useMemo, useRef, useState } from 'react'
import { statusToLabel } from '@/config/statusVisual'
import type { JournalEntry } from '@/types/realtime'
import { useRealtimeStore } from '@/store/useRealtimeStore'
import styles from './EventJournalModal.module.css'

type JournalFilter = 'all' | 'errors' | 'info'

interface EventJournalModalProps {
  isOpen: boolean
  onClose: () => void
}

function EventJournalModal({ isOpen, onClose }: EventJournalModalProps) {
  const { journal, modules, channels } = useRealtimeStore()
  const [filter, setFilter] = useState<JournalFilter>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const listRef = useRef<HTMLDivElement | null>(null)

  const fallbackJournal = useMemo<JournalEntry[]>(() => {
    return channels
      .filter((channel) => channel.isFault)
      .map(
        (channel, index) =>
          ({
            id: `fault-${channel.id}-${channel.updatedAt || 0}-${index}`,
            ts: channel.updatedAt || 0,
            level: 'error',
            module: channel.module,
            signalId: channel.signalId,
            title: channel.title || channel.signalId || channel.channelKey,
            reason: channel.cause,
            action: channel.action,
            text: channel.stateLabel,
            status: channel.status,
          }) satisfies JournalEntry,
      )
      .sort((a, b) => b.ts - a.ts)
  }, [channels])

  const effectiveJournal = journal.length > 0 ? journal : fallbackJournal

  const filteredLogs = useMemo(() => {
    return effectiveJournal.filter((entry) => {
      if (filter === 'errors' && entry.level !== 'error') {
        return false
      }

      if (filter === 'info' && entry.level !== 'info') {
        return false
      }

      if (moduleFilter !== 'all' && entry.module !== moduleFilter) {
        return false
      }

      return true
    })
  }, [effectiveJournal, filter, moduleFilter])

  useEffect(() => {
    if (!isOpen || !listRef.current) {
      return
    }

    listRef.current.scrollTop = 0
  }, [isOpen, filteredLogs])

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

        <div className={styles.filters}>
          <select
            value={filter}
            className={styles.filterSelect}
            onChange={(event) => setFilter(event.target.value as JournalFilter)}
          >
            <option value="all">all</option>
            <option value="errors">errors</option>
            <option value="info">info</option>
          </select>

          <select
            value={moduleFilter}
            className={styles.filterSelect}
            onChange={(event) => setModuleFilter(event.target.value)}
          >
            <option value="all">by module: all</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.id}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.logList} ref={listRef}>
          {filteredLogs.length === 0 ? <div className={styles.empty}>События отсутствуют</div> : null}

          {filteredLogs.map((log) => (
            <div key={log.id} className={`${styles.logItem} ${styles[log.level]}`}>
              <span className={styles.time}>{new Date(log.ts).toLocaleString('ru-RU')}</span>
              <span className={styles.message}>
                [{log.module || '-'}] {log.signalId ? `${log.signalId}: ` : ''}
                {log.title}
              </span>
              <span className={styles.status}>status: {log.status ? statusToLabel(log.status) : '-'}</span>
              {log.reason ? <span className={styles.details}>Причина: {log.reason}</span> : null}
              {log.action ? <span className={styles.details}>Действие: {log.action}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EventJournalModal
