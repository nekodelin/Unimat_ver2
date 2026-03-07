import { useEffect, useMemo, useState } from 'react'
import { statusToLabel, statusToTone } from '@/config/statusVisual'
import { moduleHotspotsQl6c } from '@/data/moduleHotspots_ql6c'
import { useRealtimeStore } from '@/store/useRealtimeStore'
import type { ChannelEntity, ChannelStatus } from '@/types/realtime'
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
  relatedChannelIds?: string[]
  onClose: () => void
}

function toTabStatus(status: ChannelStatus | undefined): ModuleTabStatus {
  const tone = status ? statusToTone(status) : 'inactive'

  if (tone === 'red') {
    return 'error'
  }

  if (tone === 'warning') {
    return 'warning'
  }

  if (tone === 'inactive') {
    return 'inactive'
  }

  return 'ok'
}

function toHotspotStatus(channel: ChannelEntity | undefined): 'ok' | 'fault' | 'warning' | 'inactive' {
  if (!channel) {
    return 'inactive'
  }

  const tone = statusToTone(channel.status)

  if (tone === 'red') {
    return 'fault'
  }

  if (tone === 'warning') {
    return 'warning'
  }

  if (tone === 'inactive') {
    return 'inactive'
  }

  return 'ok'
}

function ModuleModal({ moduleId, hotspotId, relatedChannelIds, onClose }: ModuleModalProps) {
  const { channels, modules } = useRealtimeStore()
  const [activeTab, setActiveTab] = useState<ModalTabId>('b31')
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    hotspotId || moduleHotspotsQl6c[0]?.id || '',
  )

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

  const relatedChannels = useMemo(() => {
    let sourceChannels: ChannelEntity[] = []

    if (relatedChannelIds && relatedChannelIds.length > 0) {
      sourceChannels = channels.filter((channel) => relatedChannelIds.includes(channel.id))
    }

    if (sourceChannels.length === 0) {
      sourceChannels = channels.filter((channel) => channel.module === moduleId)
    }

    return [...sourceChannels].sort((a, b) => {
      const photoA = a.photoIndex ?? Number.MAX_SAFE_INTEGER
      const photoB = b.photoIndex ?? Number.MAX_SAFE_INTEGER
      if (photoA !== photoB) {
        return photoA - photoB
      }

      return a.id.localeCompare(b.id)
    })
  }, [channels, moduleId, relatedChannelIds])

  const moduleStatus = modules.find((module) => module.id === moduleId)?.status
  const secondaryModuleStatus = modules.find((module) => module.id !== moduleId)?.status

  const tabs: ModuleTabItem[] = useMemo(
    () => [
      { id: 'b31', label: moduleId, status: toTabStatus(moduleStatus) },
      { id: 'b24', label: modules.find((module) => module.id !== moduleId)?.id || 'N/A', status: toTabStatus(secondaryModuleStatus) },
    ],
    [moduleId, moduleStatus, modules, secondaryModuleStatus],
  )

  const yellowBits = useMemo(() => {
    const bits = Array.from({ length: 16 }, () => false)

    relatedChannels.forEach((channel, index) => {
      const target = channel.photoIndex != null ? channel.photoIndex - 1 : index
      const tone = statusToTone(channel.status)
      bits[target] = tone === 'green' || tone === 'warning'
    })

    return bits
  }, [relatedChannels])

  const redBits = useMemo(() => {
    const bits = Array.from({ length: 16 }, () => false)

    relatedChannels.forEach((channel, index) => {
      const target = channel.photoIndex != null ? channel.photoIndex - 1 : index
      bits[target] = statusToTone(channel.status) === 'red'
    })

    return bits
  }, [relatedChannels])

  const channelsByPhotoIndex = useMemo(() => {
    const map = new Map<number, ChannelEntity>()

    relatedChannels.forEach((channel, index) => {
      const photoIndex = channel.photoIndex ?? index + 1
      if (!map.has(photoIndex)) {
        map.set(photoIndex, channel)
      }
    })

    return map
  }, [relatedChannels])

  const hotspots = useMemo(
    () =>
      moduleHotspotsQl6c.map((hotspot, index) => {
        const channel =
          (hotspot.photoIndex ? channelsByPhotoIndex.get(hotspot.photoIndex) : null) ??
          relatedChannels[index]

        return {
          ...hotspot,
          status: toHotspotStatus(channel),
          info: {
            event: channel?.title || hotspot.info.event,
            reason: channel?.cause || hotspot.info.reason,
            fault: channel?.stateLabel || hotspot.info.fault,
            action: channel?.action || hotspot.info.action,
          },
        }
      }),
    [channelsByPhotoIndex, relatedChannels],
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
                  <h4 className={styles.infoTitle}>Действие</h4>
                  <p className={styles.infoValue}>{selectedHotspot.info.action}</p>
                </article>

                <article className={styles.infoCard}>
                  <h4 className={styles.infoTitle}>Связанные каналы</h4>
                  <div className={styles.relatedList}>
                    {relatedChannels.length === 0 ? <p className={styles.infoValue}>Нет каналов</p> : null}
                    {relatedChannels.map((channel) => (
                      <div key={channel.id} className={styles.relatedItem}>
                        <p className={styles.relatedTitle}>{channel.title || channel.signalId || channel.channelKey}</p>
                        <p className={styles.relatedMeta}>
                          {channel.channelKey || '-'} / {channel.signalId || '-'} | status: {statusToLabel(channel.status)}
                        </p>
                        <p className={styles.relatedMeta}>cause: {channel.cause || '-'}</p>
                        <p className={styles.relatedMeta}>action: {channel.action || '-'}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </aside>

            <section className={styles.rightPane}>
              <div className={styles.moduleImageWrap}>
                {moduleImg ? (
                  <img src={moduleImg} alt={`Узел ${moduleId}`} className={styles.moduleImage} />
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

