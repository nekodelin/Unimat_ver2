import { useEffect, useState } from 'react'
import EventJournalModal from '../components/EventJournalModal'
import LedColumn from '../components/LedColumn'
import { controls } from '../data/controls'
import { connectSocket, type SocketMessage } from '../services/socket'
import styles from './TechPage.module.css'

export type BoardStatus = 'normal' | 'warning' | 'error'

type BoardId = 'b31' | 'b24'

type BoardInfo = {
  id: BoardId
  title: string
}

const boards: BoardInfo[] = [
  { id: 'b31', title: 'B31/U15/QL6C' },
  { id: 'b24', title: 'B24/U6/QL1C' },
]

const EMPTY_LED_STATE = Array.from({ length: 16 }, () => false)

function makeLedState(activeCount: number): boolean[] {
  const nextState = Array.from({ length: 16 }, () => false)
  const indices = Array.from({ length: 16 }, (_, index) => index)

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = indices[index]
    indices[index] = indices[randomIndex]
    indices[randomIndex] = current
  }

  for (let index = 0; index < activeCount; index += 1) {
    nextState[indices[index]] = true
  }

  return nextState
}

function buildLedData(status: BoardStatus): { yellow: boolean[]; red: boolean[] } {
  if (status === 'error') {
    return {
      yellow: makeLedState(2 + Math.floor(Math.random() * 3)),
      red: makeLedState(1 + Math.floor(Math.random() * 3)),
    }
  }

  if (status === 'warning') {
    return {
      yellow: makeLedState(1 + Math.floor(Math.random() * 4)),
      red: makeLedState(0),
    }
  }

  return {
    yellow: makeLedState(0),
    red: makeLedState(0),
  }
}

export function getTabColor(status: BoardStatus): string {
  if (status === 'error') {
    return '#ff3b30'
  }

  if (status === 'warning') {
    return '#ffd600'
  }

  return '#7ed957'
}

function TechPage() {
  const [activeBoard, setActiveBoard] = useState<BoardId>('b31')
  const [journalOpen, setJournalOpen] = useState<boolean>(false)
  const [faults, setFaults] = useState<string[]>([])
  const [boardStatuses, setBoardStatuses] = useState<Record<BoardId, BoardStatus>>({
    b31: 'normal',
    b24: 'normal',
  })
  const [yellowLeds, setYellowLeds] = useState<Record<BoardId, boolean[]>>({
    b31: EMPTY_LED_STATE,
    b24: EMPTY_LED_STATE,
  })
  const [redLeds, setRedLeds] = useState<Record<BoardId, boolean[]>>({
    b31: EMPTY_LED_STATE,
    b24: EMPTY_LED_STATE,
  })

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setFaults(['Нет связи с модулем A3'])
    }, 2000)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [])

  useEffect(() => {
    function handleBoardMessage(boardId: BoardId, data: SocketMessage) {
      const status = data.level as BoardStatus
      const ledData = buildLedData(status)

      setBoardStatuses((prev) => ({ ...prev, [boardId]: status }))
      setYellowLeds((prev) => ({ ...prev, [boardId]: ledData.yellow }))
      setRedLeds((prev) => ({ ...prev, [boardId]: ledData.red }))
    }

    const disconnectB31 = connectSocket((data) => handleBoardMessage('b31', data))
    const disconnectB24 = connectSocket((data) => handleBoardMessage('b24', data))

    return () => {
      disconnectB31()
      disconnectB24()
    }
  }, [])

  const faultsRows = faults.length > 0 ? faults : Array.from({ length: 8 }, () => '')

  return (
    <>
      <div className={styles.page}>
        <div className={styles.topRow}>
          <button type="button" className={styles.journalButton} onClick={() => setJournalOpen(true)}>
            Журнал событий
          </button>

          <div className={styles.innerTabs} role="tablist" aria-label="Платы">
            {boards.map((board) => {
              const isActive = activeBoard === board.id
              const status = boardStatuses[board.id]

              return (
                <button
                  key={board.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.innerTab} ${isActive ? styles.innerTabActive : ''}`}
                  style={isActive ? { backgroundColor: getTabColor(status) } : undefined}
                  onClick={() => setActiveBoard(board.id)}
                >
                  {board.title}
                </button>
              )
            })}
          </div>
        </div>

        <section className={styles.content}>
          {activeBoard === 'b31' ? (
            <div className={styles.boardLayout}>
              <section className={styles.controlsPanel}>
                <h3 className={styles.sectionTitle}>Органы управления</h3>
                <ul className={styles.controlsList}>
                  {controls.map((control) => (
                    <li key={control} className={styles.controlRow}>
                      {control}
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.ledPanel}>
                <LedColumn label="Желтые" type="yellow" states={yellowLeds.b31} />
                <LedColumn label="Красные" type="red" states={redLeds.b31} />
              </section>

              <section className={styles.faultsPanel}>
                <h3 className={styles.sectionTitle}>Неисправность</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.faultTable}>
                    <tbody>
                      {faultsRows.map((fault, index) => (
                        <tr key={`${fault}-${index}`}>
                          <td>{fault || '\u00A0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            <div className={styles.emptyState}>Нет данных</div>
          )}
        </section>
      </div>

      <EventJournalModal isOpen={journalOpen} onClose={() => setJournalOpen(false)} />
    </>
  )
}

export default TechPage
