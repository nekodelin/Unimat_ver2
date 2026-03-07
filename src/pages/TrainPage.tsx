import { useMemo, useState } from 'react'
import HotspotsLayer, { type LayerHotspot } from '@/components/ModuleModal/HotspotsLayer'
import ModuleModal from '@/components/ModuleModal/ModuleModal'
import { statusToTone } from '@/config/statusVisual'
import { useRealtimeStore } from '@/store/useRealtimeStore'
import type { ChannelStatus } from '@/types/realtime'
import styles from './TrainPage.module.css'

const trainImageMap = import.meta.glob('@/assets/images/train/train.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const trainImg = Object.values(trainImageMap)[0]

type ModalState = {
  moduleId: string
  hotspotId: string
  relatedChannelIds: string[]
}

function toHotspotStatus(status: string): 'ok' | 'fault' | 'warning' | 'inactive' {
  const tone = statusToTone(status as ChannelStatus)

  if (tone === 'green') {
    return 'ok'
  }

  if (tone === 'red') {
    return 'fault'
  }

  if (tone === 'warning') {
    return 'warning'
  }

  return 'inactive'
}

function TrainPage() {
  const { zones, loading } = useRealtimeStore()
  const [modalState, setModalState] = useState<ModalState | null>(null)

  const layerHotspots = useMemo<LayerHotspot[]>(
    () =>
      zones.map((zone) => ({
        id: zone.id,
        title: zone.title,
        rect: zone.rect,
        status: toHotspotStatus(zone.status),
      })),
    [zones],
  )

  const openModuleModal = ({ moduleId, hotspotId, relatedChannelIds }: ModalState) => {
    setModalState({ moduleId, hotspotId, relatedChannelIds })
  }

  return (
    <>
      <section className={styles.page}>
        <div className={styles.imageStage}>
          {trainImg ? (
            <img src={trainImg} alt="Поезд" className={styles.trainImage} />
          ) : (
            <div className={styles.noImage}>NO IMAGE</div>
          )}

          <HotspotsLayer
            hotspots={layerHotspots}
            selectedHotspotId={modalState?.hotspotId}
            onHotspotClick={(hotspotId) => {
              const selected = zones.find((zone) => zone.id === hotspotId)
              if (!selected) {
                return
              }

              openModuleModal({
                moduleId: selected.moduleId,
                hotspotId: selected.id,
                relatedChannelIds: selected.channelIds,
              })
            }}
          />
        </div>
      </section>

      {loading ? <div className={styles.loading}>Загрузка состояния зон...</div> : null}

      {modalState ? (
        <ModuleModal
          key={`${modalState.moduleId}-${modalState.hotspotId}`}
          moduleId={modalState.moduleId}
          hotspotId={modalState.hotspotId}
          relatedChannelIds={modalState.relatedChannelIds}
          onClose={() => setModalState(null)}
        />
      ) : null}
    </>
  )
}

export default TrainPage

