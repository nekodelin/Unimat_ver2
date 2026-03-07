import { useMemo } from 'react'
import { statusToTone } from '@/config/statusVisual'
import { bitFromPhotoIndex, TECH_BITS, toTechnicalBit, type TechnicalBit } from '@/pages/Technical/technicalConfig'
import type { ChannelEntity } from '@/types/realtime'
import styles from './LedBoard.module.css'

type LedBoardProps = {
  channels: ChannelEntity[]
  moduleLabel?: string
  selectedBit?: string | null
  onSelectBit?: (bit: TechnicalBit) => void
}

function resolveBit(channel: Pick<ChannelEntity, 'channelKey' | 'photoIndex'>): TechnicalBit | null {
  const fromChannelKey = toTechnicalBit(channel.channelKey.slice(-1))
  if (fromChannelKey) {
    return fromChannelKey
  }

  return bitFromPhotoIndex(channel.photoIndex)
}

function LedBoard({ channels, moduleLabel = 'QL6C', selectedBit, onSelectBit }: LedBoardProps) {
  const normalizedSelectedBit = selectedBit ? selectedBit.toUpperCase() : null

  const channelsByBit = useMemo(() => {
    const map = new Map<TechnicalBit, ChannelEntity>()

    channels.forEach((channel) => {
      const bit = resolveBit(channel)
      if (!bit) {
        return
      }

      const existing = map.get(bit)
      if (!existing || channel.updatedAt >= existing.updatedAt) {
        map.set(bit, channel)
      }
    })

    return map
  }, [channels])

  return (
    <section className={styles.board} aria-label="Плата диодов">
      <div className={styles.badges}>
        <span className={styles.badge}>1</span>
        <span className={styles.badge}>0</span>
      </div>

      <div className={styles.rows}>
        {TECH_BITS.map((rowKey) => {
          const channel = channelsByBit.get(rowKey)
          const tone = channel ? statusToTone(channel.status) : 'inactive'
          const isFault = channel ? channel.isFault || tone === 'red' : false
          const tooltip = channel
            ? `${channel.channelKey || '-'} / ${channel.signalId || '-'}\n${channel.purpose}\n${channel.stateLabel}\n${
                channel.cause || 'Причина: -'
              }\n${channel.action || 'Действие: -'}`
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
            isFault
              ? styles.ledRedOn
              : tone === 'inactive'
                ? styles.ledInactive
                : styles.ledRedOff

          const isSelected = normalizedSelectedBit === rowKey
          const rowClass = `${styles.row} ${onSelectBit ? styles.rowButton : ''} ${isSelected ? styles.rowSelected : ''}`

          if (onSelectBit) {
            return (
              <button
                key={rowKey}
                type="button"
                className={rowClass}
                title={tooltip}
                onClick={() => onSelectBit(rowKey)}
                aria-label={`Канал ${rowKey}`}
              >
                <span className={`${styles.led} ${leftLedClass}`} aria-hidden="true" />
                <span className={`${styles.led} ${rightLedClass}`} aria-hidden="true" />
                <span className={styles.index}>{rowKey}</span>
              </button>
            )
          }

          return (
            <div key={rowKey} className={rowClass} title={tooltip}>
              <span className={`${styles.led} ${leftLedClass}`} aria-hidden="true" />
              <span className={`${styles.led} ${rightLedClass}`} aria-hidden="true" />
              <span className={styles.index}>{rowKey}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>{moduleLabel}</div>
    </section>
  )
}

export default LedBoard
