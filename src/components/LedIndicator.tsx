import styles from './LedIndicator.module.css'

interface LedIndicatorProps {
  active: boolean
  type: 'yellow' | 'red'
}

function LedIndicator({ active, type }: LedIndicatorProps) {
  const baseToneClass = type === 'yellow' ? styles.yellow : styles.red
  const activeClass = active
    ? type === 'yellow'
      ? styles.yellowActive
      : styles.redActive
    : ''

  return <span className={`${styles.led} ${baseToneClass} ${activeClass}`} aria-hidden="true" />
}

export default LedIndicator
