import { Fragment, useMemo, useState } from 'react'
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

type BoardTabKey = 'QL6C' | 'QL1C'
type BoardTabStatus = 'unknown' | 'normal' | 'fault'

export function TechnicalPanel({
  decodedChannels,
  alarmMachine,
  onAlarmSoundToggle,
}: TechnicalPanelProps) {
  const [activeBoardTab, setActiveBoardTab] = useState<BoardTabKey>('QL6C')

  const rows = useMemo(
    () => getModuleRowsState(decodedChannels, UNIMAT_TECH_ROWS_QL6C, 'QL6C'),
    [decodedChannels],
  )

  const isPrimaryBoardTab = activeBoardTab === 'QL6C'
  const faultCount = rows.filter((row) => row.visualState === 'fault').length
  const hasPrimaryBoardData = rows.some((row) => row.visualState !== 'inactive')
  const primaryBoardTabStatus: BoardTabStatus =
    faultCount > 0 ? 'fault' : hasPrimaryBoardData ? 'normal' : 'unknown'
  const secondaryBoardTabStatus: BoardTabStatus = 'unknown'
  const tabStatusClassMap: Record<BoardTabStatus, string> = {
    unknown: styles.tabButtonUnknown,
    normal: styles.tabButtonNormal,
    fault: styles.tabButtonFault,
  }
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
      <div className={styles.tabs} role="tablist" aria-label="Выбор платы">
        <button
          type="button"
          role="tab"
          aria-selected={isPrimaryBoardTab}
          className={`${styles.tabButton} ${tabStatusClassMap[primaryBoardTabStatus]} ${
            isPrimaryBoardTab ? styles.tabButtonActive : ''
          }`}
          onClick={() => {
            setActiveBoardTab('QL6C')
          }}
        >
          B31/U15/QL6C
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isPrimaryBoardTab}
          className={`${styles.tabButton} ${tabStatusClassMap[secondaryBoardTabStatus]} ${
            !isPrimaryBoardTab ? styles.tabButtonActive : ''
          }`}
          onClick={() => {
            setActiveBoardTab('QL1C')
          }}
        >
          B24/U6/QL1C
        </button>
      </div>

      <div className={styles.panel}>
        {isPrimaryBoardTab ? (
          <>
            <div className={styles.gridScroll}>
              <div className={styles.grid}>
                <div className={styles.leftHeader}>Органы управления</div>
                <div className={styles.boardHeader}>
                  <span className={`${styles.boardBitBadge} ${styles.boardBitYellow}`}>1</span>
                  <span className={`${styles.boardBitBadge} ${styles.boardBitRed}`}>0</span>
                </div>
                <div className={styles.rightHeader}>Неисправность</div>

                {rows.map((row) => {
                  const isFault = row.visualState === 'fault'
                  const isMuted = row.visualState === 'inactive'
                  const yellowLampOn = row.channel?.yellowLed ?? false
                  const redLampOn = row.channel?.redLed ?? false
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

                <div className={styles.leftBoardSpacer} aria-hidden="true" />
                <div className={styles.boardFooter}>QL6C</div>
                <div className={styles.rightBoardSpacer} aria-hidden="true" />
              </div>
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
          </>
        ) : (
          <div className={styles.emptyState}>Данных нет</div>
        )}
      </div>
    </div>
  )
}
