import LedDot from './LedDot'
import styles from './moduleModal.module.css'

interface LedBoardProps {
  yellowBits: boolean[]
  redBits: boolean[]
  moduleLabel: string
}

const hexLabels = Array.from({ length: 16 }, (_, index) => index.toString(16).toUpperCase())

function LedBoard({ yellowBits, redBits, moduleLabel }: LedBoardProps) {
  return (
    <section className={styles.ledBoard}>
      <div className={styles.ledTopRow}>
        <span className={styles.ledTopLabel}>Сигналы</span>
        <span className={styles.ledBadge}>1</span>
        <span className={styles.ledBadge}>0</span>
      </div>

      <div className={styles.ledGridHeader}>
        <span className={styles.ledIndexHeader}>#</span>
        <span className={styles.ledColumnHeader}>Y</span>
        <span className={styles.ledColumnHeader}>R</span>
      </div>

      <div className={styles.ledGrid}>
        {hexLabels.map((label, index) => (
          <div key={label} className={styles.ledRow}>
            <span className={styles.ledIndex}>{label}</span>
            <LedDot active={yellowBits[index] ?? false} color="yellow" />
            <LedDot active={redBits[index] ?? false} color="red" />
          </div>
        ))}
      </div>

      <div className={styles.ledModuleLabel}>{moduleLabel}</div>
    </section>
  )
}

export default LedBoard
