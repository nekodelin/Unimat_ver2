import FaultPanel from '@/components/FaultPanel'
import LedBoardPanel from '@/components/LedBoardPanel'
import SignalList, { type SignalItem } from '@/components/SignalList'
import styles from './TechnicalPage.module.css'

const errors: string[] = []

const signals: SignalItem[] = [
  { index: '0', text: '1s201a Подъем ПРУ слева' },
  { index: '1', text: '1s201b Опускание ПРУ слева' },
  { index: '2', text: '1s202b Подъем ПРУ справа' },
  { index: '3', text: 's1202b Опускание ПРУ справа' },
  { index: '4', text: '1s212b Крюч слева выдвинуть' },
  { index: '5', text: '1s212a Крюч слева задвинуть' },
  { index: '6', text: '1s213b Крюч справа выдвинуть' },
  { index: '7', text: '1s213a Крюч справа задвинуть' },
  { index: '8', text: '1s247b Левый роликовый захват снаружи открыть' },
  { index: '9', text: '1s247a Левый роликовый захват снаружи закрыть' },
  { index: 'A', text: '1s248b Левый роликовый захват внутри открыть' },
  { index: 'B', text: '1s248a Левый роликовый захват внутри закрыть' },
  { index: 'C', text: '' },
  { index: 'D', text: '' },
  { index: 'E', text: '' },
  { index: 'F', text: '' },
]

function TechnicalPage() {
  return (
    <section className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.journalPanel} aria-label="Журнал событий">
          <div className={styles.journalIcon} aria-hidden="true">
            <span className={styles.journalIconLine} />
            <span className={styles.journalIconLine} />
            <span className={styles.journalIconLine} />
          </div>
          <div className={styles.journalText}>ЖУРНАЛ СОБЫТИЙ</div>
          <div className={styles.journalArrow} aria-hidden="true" />
        </aside>

        <div className={styles.signalColumn}>
          <div className={styles.boardTabs} role="tablist" aria-label="Плата">
            <button type="button" className={`${styles.boardTab} ${styles.boardTabActive}`} aria-selected="true">
              B31/U15/QL6C
            </button>
            <button type="button" className={`${styles.boardTab} ${styles.boardTabInactive}`} aria-selected="false">
              B24/U6/QL1C
            </button>
          </div>

          <SignalList items={signals} errors={errors} />
        </div>

        <aside className={styles.ledColumn}>
          <LedBoardPanel errors={errors} />
        </aside>

        <aside className={styles.faultColumn}>
          <FaultPanel errors={errors} />
        </aside>
      </div>
    </section>
  )
}

export default TechnicalPage
