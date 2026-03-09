import { Fragment, useMemo } from 'react'
import { UNIMAT_TECH_ROWS_QL6C } from '../../features/unimat/config/techRows'
import { getModuleRowsState } from '../../features/unimat/lib/getModuleRowsState'
import type { ChannelState } from '../../types/channel'
import {
  AlarmIndicatorStates,
  type AlarmMachineState,
  getAlarmIndicatorState,
  isAlarmButtonPressAvailable,
  isSoundSignalOn,
} from '../../utils/alarmMachine'
import styles from './TechnicalPanel.module.css'

interface TechnicalPanelProps {
  decodedChannels: ChannelState[]
  alarmMachine: AlarmMachineState
  onAlarmSoundToggle: () => void
}

export function TechnicalPanel({
  decodedChannels,
  alarmMachine,
  onAlarmSoundToggle,
}: TechnicalPanelProps) {
  const rows = useMemo(
    () => getModuleRowsState(decodedChannels, UNIMAT_TECH_ROWS_QL6C, 'QL6C'),
    [decodedChannels],
  )

  const soundSignalOn = isSoundSignalOn(alarmMachine)
  const buttonPressAvailable = isAlarmButtonPressAvailable(alarmMachine)
  const indicatorState = getAlarmIndicatorState(alarmMachine)

  const indicatorClass =
    indicatorState === AlarmIndicatorStates.SolidBlue
      ? styles.indicatorSolid
      : indicatorState === AlarmIndicatorStates.BlinkingBlue
        ? styles.indicatorBlinking
        : styles.indicatorOff

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.grid}>
          <div className={styles.leftHeader}>Органы управления</div>
          <div className={styles.boardHeader}>
            <span>1</span>
            <span>0</span>
          </div>
          <div className={styles.rightHeader}>Неисправность</div>

          {rows.map((row) => {
            const isFault = row.visualState === 'fault'
            const isWarning = row.visualState === 'warning'
            const isMuted = row.visualState === 'inactive' || isWarning
            const yellowLampOn = row.visualState === 'normal' || row.visualState === 'warning'
            const redLampOn = row.visualState === 'fault'
            const channelKey = row.channel?.channelKey ?? `QL6C${row.channelIndex}`
            const signalId = row.channel?.signalId ?? row.signalId ?? ''
            const titleChunks = [channelKey, signalId, row.title].filter((chunk) => chunk.length > 0)
            const labelText = row.signalId ? `${row.signalId} ${row.title}` : row.title

            return (
              <Fragment key={row.id}>
                <div
                  className={`${styles.leftRow} ${isFault ? styles.faultRow : ''} ${
                    isMuted ? styles.mutedRow : ''
                  }`}
                  data-channel-key={channelKey}
                  data-signal-id={signalId}
                  title={titleChunks.join(' | ')}
                >
                  {labelText}
                </div>

                <div className={styles.boardRow} data-channel-key={channelKey} data-signal-id={signalId}>
                  <span
                    className={`${styles.lamp} ${styles.leftLamp} ${
                      yellowLampOn ? styles.yellowLampOn : styles.yellowLampOff
                    }`}
                  />
                  <span
                    className={`${styles.lamp} ${styles.rightLamp} ${
                      redLampOn ? styles.redLampOn : styles.redLampOff
                    }`}
                  />
                  <span className={styles.channel}>{row.channelLabel}</span>
                </div>

                <div
                  className={`${styles.rightRow} ${isFault ? styles.faultRow : ''} ${
                    isMuted ? styles.mutedRow : ''
                  }`}
                  data-channel-key={channelKey}
                  data-signal-id={signalId}
                  title={row.faultText}
                >
                  {row.faultText}
                </div>
              </Fragment>
            )
          })}
        </div>

        <div className={styles.footer}>
          <strong>АВАРИЯ</strong>
          <span className={`${styles.footerLamp} ${indicatorClass}`} />
          <button
            type="button"
            className={`${styles.soundButton} ${soundSignalOn ? styles.soundOn : styles.soundOff}`}
            onClick={onAlarmSoundToggle}
            disabled={!buttonPressAvailable}
            aria-pressed={soundSignalOn}
          >
            {soundSignalOn ? 'ВКЛ' : 'ВЫКЛ'}
          </button>
        </div>
      </div>
    </div>
  )
}
