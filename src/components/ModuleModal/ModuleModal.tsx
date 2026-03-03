import { useEffect, useMemo, useState } from 'react'
import { moduleHotspotsQl6c, type ModuleHotspot } from '@/data/moduleHotspots_ql6c'
import { connectMockWS, type WsPayload } from '@/services/ws'
import HotspotsLayer from './HotspotsLayer'
import LedBoard from './LedBoard'
import ModuleTabs, { type ModuleTabItem, type ModuleTabStatus } from './ModuleTabs'
import styles from './moduleModal.module.css'

const moduleImageMap = import.meta.glob('@/assets/images/modules/ql6c.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const moduleImg = Object.values(moduleImageMap)[0]

type ModalTabId = 'b31' | 'b24'

interface ModuleModalProps {
  moduleId: string
  hotspotId: string
  onClose: () => void
}

function toTabStatus(status: 'ok' | 'warning' | 'error' | undefined): ModuleTabStatus {
  if (status === 'error') {
    return 'error'
  }

  if (status === 'warning') {
    return 'warning'
  }

  return 'ok'
}

function normalizeBits(bits: boolean[] | undefined): boolean[] {
  if (!bits) {
    return Array.from({ length: 16 }, () => false)
  }

  const normalized = bits.slice(0, 16)

  while (normalized.length < 16) {
    normalized.push(false)
  }

  return normalized
}

function ModuleModal({ moduleId, hotspotId, onClose }: ModuleModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTabId>('b31')
  const [yellowBits, setYellowBits] = useState<boolean[]>(Array.from({ length: 16 }, () => false))
  const [redBits, setRedBits] = useState<boolean[]>(Array.from({ length: 16 }, () => false))
  const [hotspots, setHotspots] = useState<ModuleHotspot[]>(moduleHotspotsQl6c)
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    hotspotId || moduleHotspotsQl6c[0]?.id || '',
  )
  const [tabStatuses, setTabStatuses] = useState<Record<ModalTabId, ModuleTabStatus>>({
    b31: 'ok',
    b24: 'ok',
  })

  useEffect(() => {
    setSelectedHotspotId(hotspotId || moduleHotspotsQl6c[0]?.id || '')
  }, [hotspotId])

  useEffect(() => {
    const disconnect = connectMockWS((payload: WsPayload) => {
      setTabStatuses({
        b31: toTabStatus(payload.train.modules.QL6C?.status),
        b24: toTabStatus(payload.train.modules.QL1C?.status),
      })

      setYellowBits(normalizeBits(payload.module.leds.yellow))
      setRedBits(normalizeBits(payload.module.leds.red))

      setHotspots((prevHotspots) =>
        prevHotspots.map((hotspot) => {
          const nextStatus = payload.module.hotspots[hotspot.id]?.status
          return nextStatus ? { ...hotspot, status: nextStatus } : hotspot
        }),
      )
    })

    return () => {
      disconnect()
    }
  }, [moduleId])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const tabs: ModuleTabItem[] = useMemo(
    () => [
      { id: 'b31', label: 'B31/U15/QL6C', status: tabStatuses.b31 },
      { id: 'b24', label: 'B24/U6/QL1C', status: tabStatuses.b24 },
    ],
    [tabStatuses],
  )

  const selectedHotspot =
    hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ??
    hotspots[0] ?? {
      id: 'fallback',
      title: 'Нет данных',
      status: 'inactive',
      rect: { x: 0, y: 0, w: 0, h: 0 },
      info: { event: '', reason: '', fault: '', action: '' },
    }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalWindow} onClick={(event) => event.stopPropagation()}>
        <header className={styles.modalHeader}>
          <ModuleTabs tabs={tabs} activeTabId={activeTab} onTabChange={(tabId) => setActiveTab(tabId as ModalTabId)} />
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Закрыть
          </button>
        </header>

        {activeTab === 'b31' ? (
          <div className={styles.modalContent}>
            <aside className={styles.leftPane}>
              <LedBoard yellowBits={yellowBits} redBits={redBits} moduleLabel={moduleId} />

              <div className={styles.infoList}>
                <article className={styles.infoCard}>
                  <h4 className={styles.infoTitle}>Событие</h4>
                  <p className={styles.infoValue}>{selectedHotspot.info.event}</p>
                </article>

                <article className={styles.infoCard}>
                  <h4 className={styles.infoTitle}>Причина</h4>
                  <p className={styles.infoValue}>{selectedHotspot.info.reason}</p>
                </article>

                <article className={styles.infoCard}>
                  <h4 className={styles.infoTitle}>Неисправность</h4>
                  <p className={styles.infoValue}>{selectedHotspot.info.fault}</p>
                </article>

                <article className={styles.infoCard}>
                  <h4 className={styles.infoTitle}>Действие</h4>
                  <p className={styles.infoValue}>{selectedHotspot.info.action}</p>
                </article>
              </div>
            </aside>

            <section className={styles.rightPane}>
              <div className={styles.moduleImageWrap}>
                {moduleImg ? (
                  <img src={moduleImg} alt="Узел QL6C" className={styles.moduleImage} />
                ) : (
                  <div className={styles.noImage}>NO IMAGE</div>
                )}

                <HotspotsLayer
                  hotspots={hotspots}
                  selectedHotspotId={selectedHotspot.id}
                  onHotspotClick={setSelectedHotspotId}
                />
              </div>
            </section>
          </div>
        ) : (
          <div className={styles.emptyTab}>Нет данных</div>
        )}
      </div>
    </div>
  )
}

export default ModuleModal
