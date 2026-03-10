import { type FormEvent, useEffect, useReducer, useRef, useState } from 'react'
import journalBrandUrl from '../../assets/journal/journal-brand-log-lock.svg'
import { ApiRequestError } from '../../services/apiClient'
import {
  exportJournalToTxt,
  fetchJournalEntries,
  fetchJournalMe,
  loginJournal,
  logoutJournal,
  type JournalUser,
} from '../../services/journalApi'
import {
  clearJournalAuthToken,
  getJournalAuthToken,
  setJournalAuthToken,
} from '../../services/journalAuthStorage'
import {
  JournalRealtimeClient,
  type JournalRealtimeStatus,
} from '../../services/journalRealtime'
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

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatNowForFileName(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}_${hours}-${minutes}`
}

function defaultExportFileName(): string {
  return `journal_${formatNowForFileName(new Date())}.txt`
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Неизвестная ошибка'
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401
}

function isDateRangeValid(dateFrom: string, dateTo: string): boolean {
  if (!dateFrom || !dateTo) {
    return true
  }

  return dateFrom <= dateTo
}

function parseDateBoundary(dateValue: string, endOfDay: boolean): number | null {
  if (!dateValue) {
    return null
  }

  const normalizedValue = `${dateValue}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`
  const timestamp = Date.parse(normalizedValue)
  return Number.isNaN(timestamp) ? null : timestamp
}

function isEntryInFilterRange(entry: JournalEntry, dateFrom: string, dateTo: string): boolean {
  const entryTimestamp = Date.parse(entry.timestamp)
  if (Number.isNaN(entryTimestamp)) {
    return false
  }

  const fromBoundary = parseDateBoundary(dateFrom, false)
  if (fromBoundary !== null && entryTimestamp < fromBoundary) {
    return false
  }

  const toBoundary = parseDateBoundary(dateTo, true)
  if (toBoundary !== null && entryTimestamp > toBoundary) {
    return false
  }

  return true
}

function realtimeStatusLabel(status: JournalRealtimeStatus): string {
  if (status === 'connected') {
    return 'Realtime подключен'
  }

  if (status === 'connecting') {
    return 'Realtime подключение...'
  }

  return 'Realtime отключен'
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 0)
}

export function TechnicalJournalFlow({ entries: _entries }: TechnicalJournalFlowProps) {
  void _entries

  const [state, dispatch] = useReducer(technicalJournalReducer, undefined, createInitialTechnicalJournalState)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [currentUser, setCurrentUser] = useState<JournalUser | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(false)
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<{ dateFrom: string; dateTo: string }>({
    dateFrom: '',
    dateTo: '',
  })
  const [realtimeStatus, setRealtimeStatus] = useState<JournalRealtimeStatus>('disconnected')

  const realtimeClientRef = useRef<JournalRealtimeClient | null>(null)
  const activeFilterRef = useRef(activeFilter)

  const isExpanded = state.screen !== TechnicalJournalScreens.Collapsed

  useEffect(() => {
    activeFilterRef.current = activeFilter
  }, [activeFilter])

  useEffect(() => {
    return () => {
      realtimeClientRef.current?.disconnect()
      realtimeClientRef.current = null
    }
  }, [])

  const stopRealtime = (): void => {
    realtimeClientRef.current?.disconnect()
    realtimeClientRef.current = null
    setRealtimeStatus('disconnected')
  }

  const handleRealtimeAppend = (entry: JournalEntry): void => {
    const currentFilter = activeFilterRef.current
    if (!isEntryInFilterRange(entry, currentFilter.dateFrom, currentFilter.dateTo)) {
      return
    }

    setJournalEntries((currentEntries) => {
      if (currentEntries.some((existing) => existing.id === entry.id)) {
        return currentEntries
      }

      return [entry, ...currentEntries].sort(
        (left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp),
      )
    })
  }

  const startRealtime = (token: string): void => {
    stopRealtime()

    if (!token.trim()) {
      return
    }

    const client = new JournalRealtimeClient()
    realtimeClientRef.current = client
    client.connect({
      token,
      onAppend: handleRealtimeAppend,
      onStatusChange: setRealtimeStatus,
    })
  }

  const handleUnauthorized = (message = 'Сессия завершена. Войдите снова.'): void => {
    stopRealtime()
    clearJournalAuthToken()
    setCurrentUser(null)
    setJournalEntries([])
    setIsAuthChecking(false)
    setIsAuthSubmitting(false)
    setIsLoading(false)
    setIsExporting(false)
    setIsLoggingOut(false)
    setError(message)
    dispatch({ type: 'SHOW_AUTH' })
  }

  const loadJournal = async (dateFrom?: string, dateTo?: string): Promise<boolean> => {
    const token = getJournalAuthToken()
    const normalizedFilter = {
      dateFrom: dateFrom ?? '',
      dateTo: dateTo ?? '',
    }
    setActiveFilter(normalizedFilter)

    if (!token) {
      handleUnauthorized()
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const loadedEntries = await fetchJournalEntries({
        token,
        dateFrom,
        dateTo,
      })

      setJournalEntries(loadedEntries)
      return true
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        handleUnauthorized()
        return false
      }

      setJournalEntries([])
      setError(`Не удалось загрузить журнал: ${toErrorMessage(requestError)}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = async (): Promise<void> => {
    dispatch({ type: 'OPEN' })
    setError(null)

    const token = getJournalAuthToken()
    if (!token) {
      setCurrentUser(null)
      setJournalEntries([])
      dispatch({ type: 'SHOW_AUTH' })
      return
    }

    setIsAuthChecking(true)

    try {
      const user = await fetchJournalMe({ token })
      setCurrentUser(user)
      dispatch({ type: 'SHOW_JOURNAL' })
      const loaded = await loadJournal(state.dateFrom, state.dateTo)
      if (loaded) {
        startRealtime(token)
      }
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        handleUnauthorized()
        return
      }

      setCurrentUser(null)
      setJournalEntries([])
      dispatch({ type: 'SHOW_AUTH' })
      setError(`Не удалось проверить текущую сессию: ${toErrorMessage(requestError)}`)
    } finally {
      setIsAuthChecking(false)
    }
  }

  const handleClose = (): void => {
    stopRealtime()
    dispatch({ type: 'CLOSE' })
    setError(null)
    setIsAuthChecking(false)
    setIsAuthSubmitting(false)
    setIsLoading(false)
    setIsExporting(false)
    setIsLoggingOut(false)
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const login = state.login.trim()
    const password = state.password

    if (!login || !password) {
      setError('Введите логин и пароль.')
      return
    }

    setIsAuthSubmitting(true)
    setError(null)

    try {
      const authResult = await loginJournal({ login, password })
      setJournalAuthToken(authResult.token)

      let user = authResult.user
      try {
        user = await fetchJournalMe({ token: authResult.token })
      } catch (requestError) {
        if (isUnauthorizedError(requestError)) {
          handleUnauthorized()
          return
        }
      }

      setCurrentUser(user)
      dispatch({ type: 'SHOW_JOURNAL' })
      const loaded = await loadJournal(state.dateFrom, state.dateTo)
      if (loaded) {
        startRealtime(authResult.token)
      }
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        handleUnauthorized()
        return
      }

      setError(`Не удалось выполнить вход: ${toErrorMessage(requestError)}`)
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  const handleApplyFilters = (): void => {
    if (!isDateRangeValid(state.dateFrom, state.dateTo)) {
      setError('Дата "от" должна быть меньше или равна дате "до".')
      return
    }

    void loadJournal(state.dateFrom, state.dateTo)
  }

  const handleResetFilters = (): void => {
    dispatch({ type: 'RESET_FILTERS' })
    void loadJournal(undefined, undefined)
  }

  const handleExport = async (): Promise<void> => {
    if (!isDateRangeValid(state.dateFrom, state.dateTo)) {
      setError('Исправьте диапазон дат перед выгрузкой.')
      return
    }

    const token = getJournalAuthToken()
    if (!token) {
      handleUnauthorized()
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const exportResult = await exportJournalToTxt({
        token,
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
      })

      downloadBlob(exportResult.blob, exportResult.fileName || defaultExportFileName())
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        handleUnauthorized()
        return
      }

      setError(`Не удалось выгрузить журнал: ${toErrorMessage(requestError)}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    const token = getJournalAuthToken()
    setIsLoggingOut(true)
    stopRealtime()

    try {
      if (token) {
        await logoutJournal({ token })
      }
    } catch (requestError) {
      if (!isUnauthorizedError(requestError)) {
        setError(`Не удалось завершить сеанс: ${toErrorMessage(requestError)}`)
      }
    } finally {
      clearJournalAuthToken()
      setCurrentUser(null)
      setJournalEntries([])
      dispatch({ type: 'SHOW_AUTH' })
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={`${styles.host} ${isExpanded ? styles.hostExpanded : ''}`}>
      {!isExpanded ? (
        <button
          type="button"
          className={styles.dockTrigger}
          onClick={() => {
            void handleOpen()
          }}
          aria-label="Открыть журнал событий"
        >
          <span className={styles.dockTriggerMain}>
            <img className={styles.dockTriggerLogo} src={journalBrandUrl} alt="" aria-hidden="true" />
            <span className={styles.dockTriggerText}>
              <span>ЖУРНАЛ</span>
              <span>СОБЫТИЙ</span>
            </span>
          </span>
          <span className={styles.dockTriggerTail} aria-hidden="true">
            <span className={styles.dockTriggerArrow}>{'>'}</span>
          </span>
        </button>
      ) : null}

      {isExpanded ? (
        <div className={styles.overlay} aria-live="polite">
          <button
            type="button"
            className={styles.backdrop}
            onClick={handleClose}
            aria-label="Свернуть журнал"
          />

          <aside className={styles.panel} aria-label="Журнал событий">
            <header className={styles.header}>
              <div className={styles.logoWrap}>
                <img className={styles.logoBrand} src={journalBrandUrl} alt="" aria-hidden="true" />
                <span className={styles.logoTitle}>ЖУРНАЛ СОБЫТИЙ</span>
              </div>
              <button
                type="button"
                className={styles.headerToggleButton}
                onClick={handleClose}
                aria-label="Свернуть журнал"
              >
                <span aria-hidden="true">{'<'}</span>
              </button>
            </header>

            {state.screen === TechnicalJournalScreens.Auth ? (
              isAuthChecking ? (
                <div className={styles.introScreen}>
                  <p>Проверка авторизации...</p>
                </div>
              ) : (
                <form className={styles.authScreen} onSubmit={(event) => void handleLoginSubmit(event)}>
                  <div className={styles.authCard}>
                    <div className={styles.authCardHeader}>
                      <span className={styles.authCardIcon}>LOG</span>
                      <div className={styles.authCardText}>
                        <h2 className={styles.authTitle}>Вход в журнал</h2>
                        <p className={styles.authSubtitle}>Авторизация оператора</p>
                      </div>
                    </div>

                    <label className={styles.field}>
                      <span>Логин</span>
                      <input
                        type="text"
                        autoComplete="username"
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
                        autoComplete="current-password"
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

                    <div className={styles.authHint}>Для первой версии: admin / admin</div>

                    <div className={styles.authActions}>
                      <button type="submit" className={styles.primaryButton} disabled={isAuthSubmitting}>
                        {isAuthSubmitting ? 'Вход...' : 'Войти'}
                      </button>
                    </div>
                  </div>

                  {error ? <p className={styles.errorText}>{error}</p> : null}
                </form>
              )
            ) : null}

            {state.screen === TechnicalJournalScreens.JournalView ? (
              <div className={styles.journalScreen}>
                <div className={styles.toolbar}>
                  <div className={styles.toolbarTop}>
                    <div className={styles.toolbarMode}>Журнал событий</div>
                    <div className={styles.toolbarPeriod}>
                      {currentUser ? `Вы вошли как ${currentUser.displayName}` : 'Пользователь не определен'}
                    </div>
                    <div className={styles.realtimeStatus}>
                      <span
                        className={`${styles.realtimeDot} ${
                          realtimeStatus === 'connected'
                            ? styles.realtimeConnected
                            : realtimeStatus === 'connecting'
                              ? styles.realtimeConnecting
                              : styles.realtimeDisconnected
                        }`}
                        aria-hidden="true"
                      />
                      <span>{realtimeStatusLabel(realtimeStatus)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.toolbarButton}
                      onClick={() => {
                        void handleLogout()
                      }}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? 'Выход...' : 'Выйти'}
                    </button>
                    <button
                      type="button"
                      className={styles.downloadButton}
                      onClick={() => {
                        void handleExport()
                      }}
                      disabled={isExporting || isLoading}
                    >
                      {isExporting ? 'Выгрузка...' : 'Скачать TXT'}
                    </button>
                  </div>

                  <div className={styles.filterRow}>
                    <label className={styles.filterField}>
                      <span>Дата от</span>
                      <input
                        type="date"
                        value={state.dateFrom}
                        onChange={(event) =>
                          dispatch({ type: 'SET_DATE_FROM', value: event.currentTarget.value })
                        }
                      />
                    </label>

                    <label className={styles.filterField}>
                      <span>Дата до</span>
                      <input
                        type="date"
                        value={state.dateTo}
                        onChange={(event) => dispatch({ type: 'SET_DATE_TO', value: event.currentTarget.value })}
                      />
                    </label>

                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleApplyFilters}
                      disabled={isLoading}
                    >
                      Применить
                    </button>

                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleResetFilters}
                      disabled={isLoading}
                    >
                      Сбросить
                    </button>
                  </div>
                </div>

                <div className={styles.tableHead}>
                  <span>Дата и время</span>
                  <span>Элемент</span>
                  <span>Новое состояние</span>
                  <span>Описание</span>
                </div>

                <div className={styles.tableBody}>
                  {isLoading ? <p className={styles.stateMessage}>Загрузка журнала...</p> : null}
                  {!isLoading && error ? <p className={styles.errorText}>{error}</p> : null}
                  {!isLoading && !error && journalEntries.length === 0 ? (
                    <p className={styles.stateMessage}>Записей за выбранный период нет.</p>
                  ) : null}

                  {!isLoading && !error
                    ? journalEntries.map((entry) => (
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
                          <span className={styles.eventCell}>{formatDateTime(entry.timestamp)}</span>
                          <span className={`${styles.eventCell} ${styles.eventCellElement}`}>
                            {entry.element || entry.channel || '-'}
                          </span>
                          <span className={styles.eventCell}>{entry.newState || '-'}</span>
                          <span className={`${styles.eventCell} ${styles.eventCellDescription}`}>
                            {entry.description || entry.message || entry.reason || '-'}
                          </span>
                        </article>
                      ))
                    : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  )
}
