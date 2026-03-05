import styles from './SignalList.module.css'

export type SignalItem = {
  index: string
  text: string
}

type SignalListProps = {
  items: SignalItem[]
  errors: string[]
}

function normalize(value: string): string {
  return value.trim().toUpperCase()
}

function SignalList({ items, errors }: SignalListProps) {
  const activeErrors = new Set(errors.map(normalize))

  return (
    <section className={styles.panel} aria-label="Органы управления">
      <h2 className={styles.title}>Органы управления</h2>
      <div className={styles.list}>
        {items.map((item) => {
          const isError = activeErrors.has(normalize(item.index))
          return (
            <div key={item.index} className={`${styles.row} ${isError ? styles.rowError : ''}`}>
              <span className={styles.marker} aria-hidden="true" />
              <span className={styles.text}>{item.text || '\u00A0'}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default SignalList
