import { useEffect, useMemo, useState } from 'react'
import LedBoard from '@/components/LedBoard'
import { moduleOverlayZones } from '@/config/moduleOverlayMap'
import { statusToLabel, statusToTone } from '@/config/statusVisual'
import { bitFromPhotoIndex, toTechnicalBit, type TechnicalBit } from '@/pages/Technical/technicalConfig'
import { useRealtimeStore } from '@/store/useRealtimeStore'
import type { ChannelEntity, ChannelStatus } from '@/types/realtime'
import ModulePhotoOverlay, { type OverlayZoneView, type OverlayVisualState } from './ModulePhotoOverlay'
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

type ZoneViewWithChannel = OverlayZoneView & {
  channel: ChannelEntity | null
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeModuleId(value: string): string {
  return value.trim().toUpperCase()
}

function resolveChannelBit(channel: Pick<ChannelEntity, 'channelKey' | 'photoIndex'>): TechnicalBit | null {
  const bitFromKey = toTechnicalBit(channel.channelKey.slice(-1))
  if (bitFromKey) {
    return bitFromKey
  }

  return bitFromPhotoIndex(channel.photoIndex)
}

function fallbackValue(value: string | null | undefined): string {
  return value && value.trim() ? value : 'Нет данных'
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

function toOverlayStatus(channel: ChannelEntity | null): OverlayVisualState {
  if (!channel) {
    return 'inactive'
  }

  const tone = statusToTone(channel.status)
  if (channel.isFault || tone === 'red') {
    return 'fault'
  }

  if (tone === 'green') {
    return 'ok'
  }

  return 'inactive'
}

function ModuleModal({ moduleId, hotspotId, relatedChannelIds, onClose }: ModuleModalProps) {
  const { channels, modules } = useRealtimeStore()
  const [activeTab, setActiveTab] = useState<ModalTabId>('b31')
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null)

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
      const normalizedModule = normalizeModuleId(moduleId)
      sourceChannels = channels.filter((channel) => normalizeModuleId(channel.module) === normalizedModule)
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

  const ql6cChannels = useMemo(
    () => channels.filter((channel) => normalizeModuleId(channel.module) === 'QL6C'),
    [channels],
  )

  const moduleStatuses = useMemo(() => {
    const byModule = new Map<string, ChannelStatus>()

    modules.forEach((module) => {
      byModule.set(normalizeModuleId(module.id), module.status)
    })

    return byModule
  }, [modules])

  const tabs: ModuleTabItem[] = useMemo(
    () => [
      {
        id: 'b31',
        label: 'B31/U15/QL6C',
        status: toTabStatus(moduleStatuses.get('QL6C') ?? moduleStatuses.get(normalizeModuleId(moduleId))),
      },
      {
        id: 'b24',
        label: 'B24/U6/QL1C',
        status: toTabStatus(moduleStatuses.get('QL1C')),
      },
    ],
    [moduleId, moduleStatuses],
  )

  const channelLookup = useMemo(() => {
    const bySignalId = new Map<string, ChannelEntity>()
    const byChannelKey = new Map<string, ChannelEntity>()
    const byModuleBit = new Map<string, ChannelEntity>()

    const upsert = (map: Map<string, ChannelEntity>, rawKey: string, channel: ChannelEntity) => {
      const key = normalizeText(rawKey)
      if (!key) {
        return
      }

      const existing = map.get(key)
      if (!existing || channel.updatedAt >= existing.updatedAt) {
        map.set(key, channel)
      }
    }

    channels.forEach((channel) => {
      upsert(bySignalId, channel.signalId, channel)
      upsert(byChannelKey, channel.channelKey, channel)

      const bit = resolveChannelBit(channel)
      if (!bit) {
        return
      }

      upsert(byModuleBit, `${normalizeModuleId(channel.module)}:${bit}`, channel)
    })

    return {
      bySignalId,
      byChannelKey,
      byModuleBit,
    }
  }, [channels])

  const relatedByBit = useMemo(() => {
    const map = new Map<TechnicalBit, ChannelEntity>()

    relatedChannels.forEach((channel) => {
      const bit = resolveChannelBit(channel)
      if (!bit) {
        return
      }

      const existing = map.get(bit)
      if (!existing || channel.updatedAt >= existing.updatedAt) {
        map.set(bit, channel)
      }
    })

    return map
  }, [relatedChannels])

  const zones = useMemo<ZoneViewWithChannel[]>(() => {
    return moduleOverlayZones.map((zone) => {
      const bySignal =
        zone.signalIds
          .map((signalId) => channelLookup.bySignalId.get(normalizeText(signalId)))
          .find((item): item is ChannelEntity => Boolean(item)) ?? null

      const byChannelKey = channelLookup.byChannelKey.get(normalizeText(zone.channelKey)) ?? null
      const bit = toTechnicalBit(zone.channelIndex)
      const byModuleBit =
        bit ? channelLookup.byModuleBit.get(normalizeText(`${zone.module}:${bit}`)) ?? null : null
      const byRelated = zone.module === 'QL6C' && bit ? relatedByBit.get(bit) ?? null : null

      const channel = bySignal ?? byChannelKey ?? byModuleBit ?? byRelated

      return {
        zone,
        title: `${zone.id}. ${zone.title}`,
        status: toOverlayStatus(channel),
        channel,
      }
    })
  }, [channelLookup.byChannelKey, channelLookup.byModuleBit, channelLookup.bySignalId, relatedByBit])

  const effectiveSelectedZoneKey =
    selectedZoneKey && zones.some((zone) => zone.zone.key === selectedZoneKey)
      ? selectedZoneKey
      : (zones.find((zone) => zone.channel)?.zone.key ?? zones[0]?.zone.key ?? null)

  const selectedZone = zones.find((zone) => zone.zone.key === effectiveSelectedZoneKey) ?? zones[0] ?? null
  const selectedBit = selectedZone?.zone.module === 'QL6C' ? toTechnicalBit(selectedZone.zone.channelIndex) : null

  const selectedEvent = fallbackValue(
    selectedZone
      ? selectedZone.channel?.title || selectedZone.channel?.signalId || selectedZone.zone.title
      : null,
  )
  const selectedReason = fallbackValue(selectedZone?.channel?.cause)
  const selectedFault = fallbackValue(
    selectedZone?.channel
      ? selectedZone.channel.stateLabel || statusToLabel(selectedZone.channel.status)
      : null,
  )
  const selectedAction = fallbackValue(selectedZone?.channel?.action)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalWindow} data-hotspot-id={hotspotId} onClick={(event) => event.stopPropagation()}>
        <header className={styles.modalHeader}>
          <ModuleTabs tabs={tabs} activeTabId={activeTab} onTabChange={(tabId) => setActiveTab(tabId as ModalTabId)} />
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Закрыть
          </button>
        </header>

        {activeTab === 'b31' ? (
          <div className={styles.modalContent}>
            <aside className={styles.boardPane}>
              <LedBoard
                channels={ql6cChannels}
                moduleLabel="QL6C"
                selectedBit={selectedBit}
                onSelectBit={(bit) => {
                  const target = zones.find(
                    (zone) => zone.zone.module === 'QL6C' && toTechnicalBit(zone.zone.channelIndex) === bit,
                  )
                  if (!target) {
                    return
                  }

                  setSelectedZoneKey(target.zone.key)
                }}
              />
            </aside>

            <section className={styles.infoPane}>
              <div className={styles.infoHeader}>{selectedZone ? selectedZone.title : 'Зона не выбрана'}</div>

              <article className={styles.infoCard}>
                <h4 className={styles.infoTitle}>Событие</h4>
                <p className={styles.infoValue}>{selectedEvent}</p>
              </article>

              <article className={styles.infoCard}>
                <h4 className={styles.infoTitle}>Причина</h4>
                <p className={styles.infoValue}>{selectedReason}</p>
              </article>

              <article className={styles.infoCard}>
                <h4 className={styles.infoTitle}>Неисправность</h4>
                <p className={styles.infoValue}>{selectedFault}</p>
              </article>

              <article className={styles.infoCard}>
                <h4 className={styles.infoTitle}>Действие</h4>
                <p className={styles.infoValue}>{selectedAction}</p>
              </article>
            </section>

            <section className={styles.photoPane}>
              <div className={styles.moduleImageWrap}>
                {moduleImg ? (
                  <img src={moduleImg} alt={`Узел ${moduleId}`} className={styles.moduleImage} />
                ) : (
                  <div className={styles.noImage}>NO IMAGE</div>
                )}

                <ModulePhotoOverlay
                  zones={zones.map(({ zone, title, status }) => ({ zone, title, status }))}
                  selectedZoneKey={effectiveSelectedZoneKey}
                  onSelectZone={setSelectedZoneKey}
                />
              </div>
            </section>
          </div>
        ) : (
          <div className={styles.emptyTab}>
            <div className={styles.emptyTabCard}>
              <h3 className={styles.emptyTabTitle}>B24/U6/QL1C</h3>
              <p className={styles.emptyTabText}>Нет данных</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModuleModal
