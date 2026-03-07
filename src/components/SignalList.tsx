import type { ChannelEntity } from '@/types/realtime'
import { statusToTone } from '@/config/statusVisual'
import styles from './SignalList.module.css'

const DEBUG = false

type SignalListProps = {
  channels: ChannelEntity[]
}

function SignalList({ channels }: SignalListProps) {
  return (
    <section className={styles.panel} aria-label="Органы управления">
      <h2 className={styles.title}>Органы управления</h2>
      <div className={styles.list}>
        {channels.map((channel) => {
          const tone = statusToTone(channel.status)
          const rowStatusClass =
            channel.isFault || tone === 'red'
              ? styles.rowFault
              : tone === 'green'
                ? styles.rowGreen
                : tone === 'warning'
                  ? styles.rowWarning
                  : styles.rowInactive

          return (
            <div key={channel.id || channel.channelKey || channel.signalId} className={`${styles.row} ${rowStatusClass}`}>
              <span className={styles.marker} aria-hidden="true" />
              <div className={styles.content}>
                <span className={styles.name}>{channel.title || `${channel.signalId} ${channel.purpose}`}</span>
                <span className={styles.state}>{channel.stateLabel || channel.status || '\u00A0'}</span>
                {channel.isFault && (channel.cause || channel.action) ? (
                  <span className={styles.extra}>
                    {channel.cause ? `Причина: ${channel.cause}` : ''}
                    {channel.cause && channel.action ? ' | ' : ''}
                    {channel.action ? `Действие: ${channel.action}` : ''}
                  </span>
                ) : null}
                {DEBUG ? (
                  <span className={styles.debug}>
                    key:{channel.channelKey || '-'} signal:{channel.signalId || '-'} in:{channel.input ?? '-'} out:{channel.output ?? '-'} dg:
                    {channel.diagnostic ?? '-'}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default SignalList

