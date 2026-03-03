import { useEffect, useMemo, useState } from 'react'
import HotspotsLayer, { type LayerHotspot } from '@/components/ModuleModal/HotspotsLayer'
import ModuleModal from '@/components/ModuleModal/ModuleModal'
import { trainHotspots, type HotspotStatus, type TrainHotspot } from '@/data/trainHotspots'
import { connectMockWS, type WsPayload } from '@/services/ws'
import styles from './TrainPage.module.css'

const trainImageMap = import.meta.glob('@/assets/images/train/train.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const trainImg = Object.values(trainImageMap)[0]

type ModalState = {
  moduleId: string
  hotspotId: string
}

function toHotspotStatus(status: 'ok' | 'warning' | 'error' | undefined): HotspotStatus {
  if (!status) {
    return 'inactive'
  }

  if (status === 'ok') {
    return 'ok'
  }

  return 'fault'
}

function TrainPage() {
  const [hotspots, setHotspots] = useState<TrainHotspot[]>(trainHotspots)
  const [modalState, setModalState] = useState<ModalState | null>(null)

  useEffect(() => {
    const disconnect = connectMockWS((payload: WsPayload) => {
      setHotspots((prevHotspots) =>
        prevHotspots.map((hotspot) => {
          const moduleStatus = payload.train.modules[hotspot.moduleId]?.status
          if (!moduleStatus) {
            return hotspot
          }

          return {
            ...hotspot,
            status: toHotspotStatus(moduleStatus),
          }
        }),
      )
    })

    return () => {
      disconnect()
    }
  }, [])

  const layerHotspots = useMemo<LayerHotspot[]>(
    () =>
      hotspots.map((hotspot) => ({
        id: hotspot.id,
        title: hotspot.label,
        rect: hotspot.rect,
        status: hotspot.status,
      })),
    [hotspots],
  )

  const openModuleModal = ({ moduleId, hotspotId }: { moduleId: string; hotspotId: string }) => {
    setModalState({ moduleId, hotspotId })
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
              const selected = hotspots.find((hotspot) => hotspot.id === hotspotId)
              if (!selected) {
                return
              }

              openModuleModal({ moduleId: selected.moduleId, hotspotId: selected.id })
            }}
          />
        </div>
      </section>

      {modalState ? (
        <ModuleModal
          moduleId={modalState.moduleId}
          hotspotId={modalState.hotspotId}
          onClose={() => setModalState(null)}
        />
      ) : null}
    </>
  )
}

export default TrainPage
