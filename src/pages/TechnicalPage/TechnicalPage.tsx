import { TechnicalJournalFlow } from '../../components/journal/TechnicalJournalFlow'
import { TechnicalPanel } from '../../components/technical/TechnicalPanel'
import type { ChannelState } from '../../types/channel'
import type { JournalEntry } from '../../types/journal'
import type { AlarmMachineState } from '../../utils/alarmMachine'
import styles from './TechnicalPage.module.css'

interface TechnicalPageProps {
  decodedChannels: ChannelState[]
  journalEntries: JournalEntry[]
  alarmMachine: AlarmMachineState
  onAlarmSoundToggle: () => void
}

export function TechnicalPage({
  decodedChannels,
  journalEntries,
  alarmMachine,
  onAlarmSoundToggle,
}: TechnicalPageProps) {
  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <TechnicalJournalFlow entries={journalEntries} />
        <div className={styles.mainArea}>
          <TechnicalPanel
            decodedChannels={decodedChannels}
            alarmMachine={alarmMachine}
            onAlarmSoundToggle={onAlarmSoundToggle}
          />
        </div>
      </div>
    </section>
  )
}
