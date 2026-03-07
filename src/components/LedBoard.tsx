import type { ChannelEntity } from '@/types/realtime'
import { statusToTone } from '@/config/statusVisual'
import styles from './LedBoard.module.css'

type LedBoardProps = {
  channels: ChannelEntity[]
}

const ROW_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'] as const

function LedBoard({ channels }: LedBoardProps) {
  const orderedChannels = [...channels].sort((a, b) => {
    const aOrder = a.photoIndex ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.photoIndex ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    return a.id.localeCompare(b.id)
  })

  const channelsByIndex = new Map(
    orderedChannels.map((channel, index) => [index.toString(16).toUpperCase(), channel] as const),
  )

  return (
    <section className={styles.board} aria-label="Плата диодов">
      <div className={styles.badges}>
        <span className={styles.badge}>1</span>
        <span className={styles.badge}>0</span>
      </div>

      <div className={styles.rows}>
        {ROW_KEYS.map((rowKey) => {
          const channel = channelsByIndex.get(rowKey)
          const tone = channel ? statusToTone(channel.status) : 'inactive'
          const tooltip = channel
            ? `${channel.channelKey || '-'} / ${channel.signalId || '-'}\n${channel.purpose}\n${channel.stateLabel}\n${channel.cause || 'Причина: -'}\n${channel.action || 'Действие: -'}`
            : 'Нет данных'

          const leftLedClass =
            tone === 'green'
              ? styles.ledGreenOn
              : tone === 'warning'
                ? styles.ledYellowOn
                : tone === 'inactive'
                  ? styles.ledInactive
                  : styles.ledLeftOff

          const rightLedClass =
            tone === 'red'
              ? styles.ledRedOn
              : tone === 'inactive'
                ? styles.ledInactive
                : styles.ledRedOff

          return (
            <div key={rowKey} className={styles.row} title={tooltip}>
              <span className={`${styles.led} ${leftLedClass}`} aria-hidden="true" />
              <span className={`${styles.led} ${rightLedClass}`} aria-hidden="true" />
              <span className={styles.index}>{rowKey}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>QL6C</div>
    </section>
  )
}

export default LedBoard

