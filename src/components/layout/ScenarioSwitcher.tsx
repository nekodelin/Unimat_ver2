import type { ScenarioId } from '../../types/app'
import styles from './ScenarioSwitcher.module.css'

const OPTIONS: Array<{ id: ScenarioId; label: string }> = [
  { id: 'one-fault', label: 'Одна ошибка' },
  { id: 'all-normal', label: 'Все нормально' },
  { id: 'multi-fault', label: 'Несколько ошибок' },
  { id: 'no-data', label: 'Нет данных' },
]

interface ScenarioSwitcherProps {
  scenarioId: ScenarioId
  onChange: (scenarioId: ScenarioId) => void
}

export function ScenarioSwitcher({ scenarioId, onChange }: ScenarioSwitcherProps) {
  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor="scenario-select">
        Сценарий mock
      </label>
      <select
        id="scenario-select"
        className={styles.select}
        value={scenarioId}
        onChange={(event) => onChange(event.target.value as ScenarioId)}
      >
        {OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
