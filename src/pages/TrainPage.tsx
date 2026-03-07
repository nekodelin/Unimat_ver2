import { useState, type CSSProperties } from 'react'
import ModuleModal from '@/components/ModuleModal/ModuleModal'
import { trainZones, type TrainZone } from '@/config/trainZonesConfig'
import { useRealtimeStore } from '@/store/useRealtimeStore'
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

function createTrainZoneStyle(zone: TrainZone): CSSProperties {
  return {
    left: zone.left,
    top: zone.top,
    width: zone.width,
    height: zone.height,
  }
}

function TrainPage() {
  const { zones, loading } = useRealtimeStore()
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [isNoDataOpen, setNoDataOpen] = useState(false)

  const openModuleModal = ({ moduleId, hotspotId, relatedChannelIds }: ModalState) => {
    setModalState({ moduleId, hotspotId, relatedChannelIds })
  }

  const openExistingModuleModal = (sourceZoneId?: string) => {
    const selected =
      (sourceZoneId ? zones.find((zone) => zone.id === sourceZoneId) : null) ??
      zones.find((zone) => zone.channelIds.length > 0) ??
      zones[0]

    if (!selected) {
      return
    }

    openModuleModal({
      moduleId: selected.moduleId,
      hotspotId: selected.id,
      relatedChannelIds: selected.channelIds,
    })
  }

  const onZoneClick = (zone: TrainZone) => {
    if (zone.action === 'show-no-data') {
      setModalState(null)
      setNoDataOpen(true)
      return
    }

    setNoDataOpen(false)
    openExistingModuleModal(zone.sourceZoneId)
  }

  return (
    <>
      <section className={styles.page}>
        <div className={styles.imageStage}>
          <div className={styles.trainCanvas}>
            {trainImg ? (
              <img src={trainImg} alt="Поезд" className={styles.trainImage} />
            ) : (
              <div className={styles.noImage}>NO IMAGE</div>
            )}

            <div className={styles.zonesLayer}>
              {trainZones.map((zone) => {
                const title =
                  zone.action === 'show-no-data' ? zone.label || 'Данных нет' : 'Открыть окно узла'

                return (
                  <button
                    key={zone.id}
                    type="button"
                    title={title}
                    aria-label={title}
                    className={`${styles.trainZone} ${
                      modalState && zone.action === 'open-existing-modal' ? styles.trainZoneActive : ''
                    }`}
                    style={createTrainZoneStyle(zone)}
                    onClick={() => onZoneClick(zone)}
                  />
                )
              })}
            </div>
          </div>
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

      {isNoDataOpen ? (
        <div className={styles.noDataOverlay} onClick={() => setNoDataOpen(false)}>
          <div
            className={styles.noDataDialog}
            role="dialog"
            aria-modal="true"
            aria-label="Информация по зоне"
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.noDataText}>Данных нет</p>
            <button type="button" className={styles.noDataClose} onClick={() => setNoDataOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default TrainPage
