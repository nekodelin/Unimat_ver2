import { useMemo, useReducer } from 'react'
import journalDockUrl from '../../assets/raw/Техническая вкладка/1 сост.svg'
import type { JournalEntry } from '../../types/journal'
import {
  createInitialTechnicalJournalState,
  technicalJournalReducer,
  TechnicalJournalScreens,
} from '../../utils/technicalJournalMachine'
import styles from './TechnicalJournalFlow.module.css'

interface TechnicalJournalFlowProps {
  entries: JournalEntry[]
}

function formatTimestamp(timestamp: string): string {
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

export function TechnicalJournalFlow({ entries }: TechnicalJournalFlowProps) {
  const [state, dispatch] = useReducer(technicalJournalReducer, undefined, createInitialTechnicalJournalState)
  const isExpanded = state.screen !== TechnicalJournalScreens.Collapsed

  const visibleEntries = useMemo(() => {
    const preparedEntries = state.mode === 'current' ? entries.filter((entry) => entry.level !== 'info') : entries

    if (preparedEntries.length > 0) {
      return preparedEntries
    }

    return [
      {
        id: 'journal-placeholder',
        timestamp: new Date().toISOString(),
        level: 'info' as const,
        source: 'Система',
        channel: '-',
        title: 'Отказов не обнаружено',
        message: 'По выбранному режиму активных событий не найдено',
      },
    ]
  }, [entries, state.mode])

  return (
    <div className={styles.host}>
      {!isExpanded ? (
        <button
          type="button"
          className={styles.dockTrigger}
          onClick={() => dispatch({ type: 'OPEN' })}
          aria-label="Открыть журнал событий"
        >
          <img src={journalDockUrl} alt="" aria-hidden="true" />
        </button>
      ) : null}

      {isExpanded ? (
        <div className={styles.overlay} aria-live="polite">
          <button
            type="button"
            className={styles.backdrop}
            onClick={() => dispatch({ type: 'CLOSE' })}
            aria-label="Свернуть журнал"
          />

          <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Журнал событий">
            <header className={styles.header}>
              <div className={styles.logoWrap}>
                <span className={styles.logoBadge}>LOG</span>
                <span className={styles.logoTitle}>ЖУРНАЛ СОБЫТИЙ</span>
              </div>

              <button
                type="button"
                className={styles.collapseButton}
                onClick={() => dispatch({ type: 'CLOSE' })}
                aria-label="Свернуть журнал"
              >
                <span aria-hidden="true">‹</span>
              </button>
            </header>

            {state.screen === TechnicalJournalScreens.Intro ? (
              <div className={styles.introScreen}>
                <p>Для просмотра журнала откройте окно авторизации.</p>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => dispatch({ type: 'GO_AUTH' })}
                >
                  Войти
                </button>
              </div>
            ) : null}

            {state.screen === TechnicalJournalScreens.Auth ? (
              <form
                className={styles.authScreen}
                onSubmit={(event) => {
                  event.preventDefault()
                  dispatch({ type: 'SUBMIT_AUTH' })
                }}
              >
                <label className={styles.field}>
                  <span>Учётная запись</span>
                  <input
                    type="text"
                    value={state.login}
                    onChange={(event) =>
                      dispatch({
                        type: 'SET_LOGIN',
                        value: event.currentTarget.value,
                      })
                    }
                    placeholder="Введите логин"
                  />
                </label>

                <label className={styles.field}>
                  <span>Пароль</span>
                  <input
                    type="password"
                    value={state.password}
                    onChange={(event) =>
                      dispatch({
                        type: 'SET_PASSWORD',
                        value: event.currentTarget.value,
                      })
                    }
                    placeholder="Введите пароль"
                  />
                </label>

                <div className={styles.authActions}>
                  <button type="submit" className={styles.primaryButton}>
                    Вход
                  </button>
                </div>
              </form>
            ) : null}

            {state.screen === TechnicalJournalScreens.ModeSelect ? (
              <div className={styles.modeScreen}>
                <button
                  type="button"
                  className={styles.modeCurrentButton}
                  onClick={() => dispatch({ type: 'OPEN_CURRENT_FAULTS' })}
                >
                  Текущие отказы
                </button>

                <div className={styles.periodCard}>
                  <label htmlFor="journal-period">Период отказов</label>
                  <input
                    id="journal-period"
                    type="text"
                    value={state.periodLabel}
                    onChange={(event) =>
                      dispatch({
                        type: 'SET_PERIOD_LABEL',
                        value: event.currentTarget.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => dispatch({ type: 'OPEN_PERIOD_FAULTS' })}
                  >
                    Применить
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.exitButton}
                  onClick={() => dispatch({ type: 'CLOSE' })}
                >
                  Выйти
                </button>
              </div>
            ) : null}

            {state.screen === TechnicalJournalScreens.JournalView ? (
              <div className={styles.journalScreen}>
                <div className={styles.toolbar}>
                  <div className={styles.toolbarMode}>
                    {state.mode === 'current' ? 'Текущие отказы' : 'Выбранный период'}
                  </div>

                  <div className={styles.toolbarPeriod}>{state.periodLabel}</div>

                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={() => dispatch({ type: 'BACK_TO_MODE_SELECT' })}
                  >
                    Изменить режим
                  </button>

                  <button type="button" className={styles.downloadButton}>
                    Скачать файл
                  </button>
                </div>

                <div className={styles.tableHead}>
                  <span>Время</span>
                  <span>Источник</span>
                  <span>Канал</span>
                  <span>Событие</span>
                </div>

                <div className={styles.tableBody}>
                  {visibleEntries.map((entry) => (
                    <article
                      key={entry.id}
                      className={`${styles.eventRow} ${
                        entry.level === 'error'
                          ? styles.eventError
                          : entry.level === 'warning'
                            ? styles.eventWarning
                            : styles.eventInfo
                      }`}
                    >
                      <span className={styles.eventTime}>{formatTimestamp(entry.timestamp)}</span>
                      <span className={styles.eventSource}>{entry.source}</span>
                      <span className={styles.eventChannel}>{entry.channel}</span>
                      <div className={styles.eventContent}>
                        <strong>{entry.title}</strong>
                        <p>{entry.message}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  )
}
