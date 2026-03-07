import type { ChannelEntity } from '@/types/realtime'
import styles from './FaultPanel.module.css'

type FaultPanelProps = {
  activeChannel: ChannelEntity | null
  faultCount: number
}

function FaultPanel({ activeChannel, faultCount }: FaultPanelProps) {
  const rows = [
    { label: 'Событие', value: activeChannel?.title ?? '' },
    { label: 'Причина', value: activeChannel?.cause ?? '' },
    { label: 'Неисправность', value: activeChannel?.stateLabel ?? '' },
    { label: 'Действие', value: activeChannel?.action ?? '' },
  ]

  return (
    <section className={styles.panel} aria-label="Неисправность">
      <div className={styles.header}>
        <h2 className={styles.title}>Неисправность</h2>
        <span className={styles.count} aria-label={`Количество ошибок: ${faultCount}`}>
          {faultCount}
        </span>
      </div>

      <div className={styles.rows}>
        {rows.map((row) => (
          <article key={row.label} className={styles.row}>
            {activeChannel ? (
              <>
                <h3 className={styles.rowLabel}>{row.label}</h3>
                <p className={styles.rowValue}>{row.value}</p>
              </>
            ) : (
              <span className={styles.emptyCell}>&nbsp;</span>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default FaultPanel
