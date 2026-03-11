import { useMemo } from 'react'
import { NoDataModal } from './components/modal/NoDataModal'
import { NodeDetailModal } from './components/modal/NodeDetailModal'
import { ScenarioSwitcher } from './components/layout/ScenarioSwitcher'
import { TopTabs } from './components/layout/TopTabs'
import { envConfig } from './config/env'
import { TRAIN_ZONE_DEFS } from './data/zones'
import { selectTrainZonesState } from './features/unimat/selectors/selectTrainZonesState'
import { useTransport } from './hooks/useTransport'
import { TechnicalPage } from './pages/TechnicalPage/TechnicalPage'
import { TrainPage } from './pages/TrainPage/TrainPage'
import { useAppStore } from './store/appStore'
import { aggregateStatus } from './utils/status'
import styles from './App.module.css'

function App() {
  const { setScenario } = useTransport()

  const activeTab = useAppStore((state) => state.activeTab)
  const scenarioId = useAppStore((state) => state.scenarioId)
  const decodedChannels = useAppStore((state) => state.decodedChannels)
  const journalEntries = useAppStore((state) => state.journalEntries)
  const trainZones = useAppStore((state) => state.trainZones)
  const moduleZones = useAppStore((state) => state.moduleZones)
  const moduleInfoByZone = useAppStore((state) => state.moduleInfoByZone)
  const technicalSignals = useAppStore((state) => state.technicalSignals)
  const updatedAt = useAppStore((state) => state.updatedAt)
  const connectionState = useAppStore((state) => state.connectionState)
  const alarmMachine = useAppStore((state) => state.alarmMachine)
  const moduleOpen = useAppStore((state) => state.moduleOpen)
  const noDataOpen = useAppStore((state) => state.noDataOpen)
  const selectedModuleZoneId = useAppStore((state) => state.selectedModuleZoneId)

  const setTab = useAppStore((state) => state.setTab)
  const toggleAlarmSound = useAppStore((state) => state.toggleAlarmSound)
  const openModule = useAppStore((state) => state.openModule)
  const closeModule = useAppStore((state) => state.closeModule)
  const closeNoData = useAppStore((state) => state.closeNoData)
  const selectModuleZone = useAppStore((state) => state.selectModuleZone)

  const trainZonesState = useMemo(() => selectTrainZonesState(decodedChannels), [decodedChannels])

  const trainStatus = useMemo(
    () =>
      trainZonesState === 'fault'
        ? 'fault'
        : trainZonesState === 'warning'
          ? 'inactive'
          : 'normal',
    [trainZonesState],
  )

  const technicalStatus = useMemo(
    () => aggregateStatus(technicalSignals.map((signal) => signal.status)),
    [technicalSignals],
  )

  const onTrainZoneAction = (zoneId: string) => {
    const zoneDef = TRAIN_ZONE_DEFS.find((zone) => zone.id === zoneId)
    if (!zoneDef) {
      return
    }

    openModule()
  }

  return (
    <div className={styles.appRoot}>
      <TopTabs
        activeTab={activeTab}
        trainStatus={trainStatus}
        technicalStatus={technicalStatus}
        onTabChange={setTab}
      />

      <div className={styles.workspace}>
        <main className={styles.main}>
          {activeTab === 'train' ? (
            <TrainPage
              decodedChannels={decodedChannels}
              connectionState={connectionState}
              updatedAt={updatedAt}
              runtimeZones={trainZones}
              moduleZones={moduleZones}
              trainZonesState={trainZonesState}
              onZoneAction={onTrainZoneAction}
              zonesDisabled={moduleOpen || noDataOpen}
            />
          ) : (
            <TechnicalPage
              decodedChannels={decodedChannels}
              journalEntries={journalEntries}
              alarmMachine={alarmMachine}
              onAlarmSoundToggle={toggleAlarmSound}
            />
          )}
        </main>
      </div>

      {envConfig.useMocks ? <ScenarioSwitcher scenarioId={scenarioId} onChange={setScenario} /> : null}

      <NodeDetailModal
        open={moduleOpen}
        zones={moduleZones}
        decodedChannels={decodedChannels}
        selectedZoneId={selectedModuleZoneId}
        moduleInfoByZone={moduleInfoByZone}
        onSelectZone={selectModuleZone}
        onClose={closeModule}
      />

      <NoDataModal open={noDataOpen} onClose={closeNoData} />
    </div>
  )
}

export default App
