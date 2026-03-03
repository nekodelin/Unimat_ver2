import styles from './moduleModal.module.css'

interface LedDotProps {
  active: boolean
  color: 'yellow' | 'red'
}

function LedDot({ active, color }: LedDotProps) {
  const colorClass = color === 'yellow' ? styles.ledYellow : styles.ledRed
  const activeClass = active ? styles.ledActive : ''

  return <span className={`${styles.ledDot} ${colorClass} ${activeClass}`} aria-hidden="true" />
}

export default LedDot
