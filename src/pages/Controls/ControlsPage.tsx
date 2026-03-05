import LedBoardPanel from '@/components/LedBoardPanel'
import SignalList, { type SignalItem } from '@/components/SignalList'
import { boardErrors } from '@/config/boardErrors'
import styles from './ControlsPage.module.css'

const signalRows: SignalItem[] = [
  { index: '0', text: '1s201a Подъем ПРУ слева' },
  { index: '1', text: '1s201b Опускание ПРУ слева' },
  { index: '2', text: '1s202b Подъем ПРУ справа' },
  { index: '3', text: 's1202b Опускание ПРУ справа' },
  { index: '4', text: '1s212b Крюч с лева выдвинуть' },
  { index: '5', text: '1s212a Крюч с лева задвинуть' },
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

function ControlsPage() {
  const errors = boardErrors.find((payload) => payload.board === 'QL6C')?.errors ?? []

  return (
    <section className={styles.page}>
      <div className={styles.listWrap}>
        <SignalList items={signalRows} errors={errors} />
      </div>

      <aside className={styles.boardWrap}>
        <LedBoardPanel errors={errors} />
      </aside>
    </section>
  )
}

export default ControlsPage
