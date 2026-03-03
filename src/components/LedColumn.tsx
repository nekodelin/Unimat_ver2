import LedIndicator from './LedIndicator'
import styles from './LedColumn.module.css'

interface LedColumnProps {
  label: string
  type: 'yellow' | 'red'
  states: boolean[]
}

const hexLabels = Array.from({ length: 16 }, (_, index) => index.toString(16).toUpperCase())

function LedColumn({ label, type, states }: LedColumnProps) {
  return (
    <div className={styles.column}>
      <h4 className={styles.title}>{label}</h4>
      <div className={styles.rows}>
        {hexLabels.map((hex, index) => (
          <div key={hex} className={styles.row}>
            <LedIndicator active={states[index] ?? false} type={type} />
            <span className={styles.index}>{hex}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LedColumn
