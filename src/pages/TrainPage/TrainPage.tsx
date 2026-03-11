import { ConnectionStatusStrip } from '../../components/train/ConnectionStatusStrip'
import { TrainCanvas } from '../../components/train/TrainCanvas'
import { TRAIN_ZONE_DEFS } from '../../data/zones'
import type { ChannelState } from '../../types/channel'
import type { ConnectionState, ZoneStatus } from '../../types/status'
import type { TrainZonesState } from '../../types/unimat'
import type { ModuleZoneState, TrainZoneState } from '../../types/zone'
import styles from './TrainPage.module.css'

interface TrainPageProps {
  decodedChannels: ChannelState[]
  connectionState: ConnectionState
  updatedAt: string | null
  runtimeZones: TrainZoneState[]
  moduleZones: ModuleZoneState[]
  trainZonesState: TrainZonesState
  onZoneAction: (zoneId: string) => void
  zonesDisabled?: boolean
}

export function TrainPage({
  decodedChannels,
  connectionState,
  updatedAt,
  runtimeZones: _runtimeZones,
  moduleZones: _moduleZones,
  trainZonesState,
  onZoneAction,
  zonesDisabled = false,
}: TrainPageProps) {
  const sharedZoneStatus: ZoneStatus =
    trainZonesState === 'fault'
      ? 'fault'
      : trainZonesState === 'warning'
        ? 'inactive'
        : 'normal'

  const zones = TRAIN_ZONE_DEFS.map((zone) => ({
    ...zone,
    status: sharedZoneStatus,
  }))

  void _runtimeZones
  void _moduleZones

  return (
    <section className={styles.page}>
      <div className={styles.statusArea}>
        <ConnectionStatusStrip
          connectionState={connectionState}
          decodedChannels={decodedChannels}
          updatedAt={updatedAt}
        />
      </div>
      <div className={styles.stage}>
        <TrainCanvas zones={zones} onZoneClick={onZoneAction} zonesDisabled={zonesDisabled} />
      </div>
    </section>
  )
}
