import styles from './LedBoardPanel.module.css'

type LedBoardPanelProps = {
  errors: string[]
}

const LED_INDEXES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'] as const
const YELLOW_DISABLED = new Set(['4', '5', 'E', 'F'])

function normalize(value: string): string {
  return value.trim().toUpperCase()
}

function LedBoardPanel({ errors }: LedBoardPanelProps) {
  const activeErrors = new Set(errors.map(normalize))

  return (
    <section className={styles.board} aria-label="LED BOARD">
      <div className={styles.badges}>
        <span className={styles.badge}>1</span>
        <span className={styles.badge}>0</span>
      </div>

      <div className={styles.rows}>
        {LED_INDEXES.map((index) => {
          const yellowClass = YELLOW_DISABLED.has(index) ? styles.yellowDisabled : styles.yellowOn
          const redClass = activeErrors.has(index) ? styles.redOn : styles.redOff

          return (
            <div key={index} className={styles.row}>
              <span className={`${styles.led} ${yellowClass}`} aria-hidden="true" />
              <span className={`${styles.led} ${redClass}`} aria-hidden="true" />
              <span className={styles.index}>{index}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>QL6C</div>
    </section>
  )
}

export default LedBoardPanel
