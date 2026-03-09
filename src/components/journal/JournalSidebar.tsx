import { useMemo } from 'react'
import type { JournalEntry } from '../../types/journal'
import styles from './JournalSidebar.module.css'

interface JournalSidebarProps {
  entries: JournalEntry[]
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return '--:--:--'
  }

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function JournalSidebar({ entries }: JournalSidebarProps) {
  const normalized = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        timeLabel: formatTime(entry.timestamp),
      })),
    [entries],
  )

  return (
    <aside className={styles.sidebar} aria-label="Журнал событий">
      <div className={styles.tab}>Журнал</div>
      <div className={styles.listWrap}>
        {normalized.map((entry) => (
          <article
            key={entry.id}
            className={`${styles.item} ${
              entry.level === 'error'
                ? styles.itemError
                : entry.level === 'warning'
                  ? styles.itemWarning
                  : styles.itemInfo
            }`}
          >
            <header className={styles.itemHeader}>
              <span className={styles.time}>{entry.timeLabel}</span>
              <span className={styles.source}>{entry.source}</span>
              <span className={styles.channel}>{entry.channel}</span>
            </header>
            <h4>{entry.title}</h4>
            <p>{entry.message}</p>
          </article>
        ))}
      </div>
    </aside>
  )
}
