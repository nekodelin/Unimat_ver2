import type { CSSProperties, KeyboardEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import nodeBackgroundSvg from '../../assets/node-window/background.svg'
import { NODE_WINDOW_ELEMENTS, NODE_WINDOW_ELEMENTS_BY_ZONE_ID } from '../../data/nodeWindowElements'
import { NODE_WINDOW_HOTSPOTS, NODE_WINDOW_PHOTO_FRAME } from '../../data/nodeWindowHotspots'
import { normalizeLedState, type LedViewState } from '../../features/unimat/lib/normalizeLedState'
import type { ChannelState } from '../../types/channel'
import type { ModuleFaultInfo } from '../../types/module'
import type { ZoneStatus } from '../../types/status'
import type { ModuleZoneState } from '../../types/zone'
import { STATUS_VISUALS } from '../../utils/status'
import styles from './NodeDetailModal.module.css'

interface NodeDetailModalProps {
  open: boolean
  zones: ModuleZoneState[]
  decodedChannels: ChannelState[]
  selectedZoneId: string
  moduleInfoByZone: Record<string, ModuleFaultInfo>
  onSelectZone: (zoneId: string) => void
  onClose: () => void
}

const STATUS_LABELS: Record<ZoneStatus, string> = {
  normal: 'Норма',
  fault: 'Ошибка',
  inactive: 'Неактивно',
}

type NodeLedState = 'off' | 'yellow' | 'yellow-red'

function resolveCardTitle(status: ZoneStatus): string {
  return status === 'fault' ? 'Неисправность' : 'Состояние узла'
}

function resolveChannelLedViewState(channel: ChannelState | undefined, channelLabel: string): LedViewState {
  return normalizeLedState({
    hasData: channel !== undefined && channel.backendStatus !== 'unknown',
    isFault:
      channel !== undefined &&
      (channel.isFault ||
        channel.status === 'fault' ||
        channel.backendStatus === 'open_circuit' ||
        channel.backendStatus === 'short_circuit'),
    faultText: channel?.faultText,
    channelLabel,
  })
}

function resolveNodeLedState(channel: ChannelState | undefined, channelLabel: string): NodeLedState {
  const ledState = resolveChannelLedViewState(channel, channelLabel)

  if (ledState.red) {
    return 'yellow-red'
  }

  if (ledState.yellow) {
    return 'yellow'
  }

  return 'off'
}

export function NodeDetailModal({
  open,
  zones,
  decodedChannels,
  selectedZoneId,
  moduleInfoByZone,
  onSelectZone,
  onClose,
}: NodeDetailModalProps) {
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return
    }

    const { body, documentElement } = document
    const prevOverflow = body.style.overflow
    const prevPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth

    body.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPaddingRight
    }
  }, [open])

  const zoneStateMap = useMemo(() => new Map(zones.map((zone) => [zone.id, zone])), [zones])
  const channelByZoneId = useMemo(
    () => new Map(decodedChannels.map((channel) => [channel.zoneId, channel])),
    [decodedChannels],
  )

  const activeElement = NODE_WINDOW_ELEMENTS_BY_ZONE_ID.get(selectedZoneId) ?? NODE_WINDOW_ELEMENTS[0]
  const activeZoneId = activeElement.zoneId
  const activeChannel = channelByZoneId.get(activeZoneId)
  const activeLedState = resolveChannelLedViewState(activeChannel, activeElement.channel)
  const activeStatus: ZoneStatus = activeLedState.red ? 'fault' : activeLedState.yellow ? 'normal' : 'inactive'

  const runtimeInfo = moduleInfoByZone[activeZoneId]
  const fallbackInfo = activeElement.info
  const cardInfo: ModuleFaultInfo = {
    event: activeChannel?.event ?? runtimeInfo?.event ?? fallbackInfo.event ?? activeElement.title,
    cause:
      activeChannel?.cause ??
      activeChannel?.reason ??
      runtimeInfo?.cause ??
      runtimeInfo?.reason ??
      fallbackInfo.cause ??
      '',
    fault: activeChannel?.faultText ?? runtimeInfo?.fault ?? runtimeInfo?.message ?? fallbackInfo.fault ?? '',
    action:
      activeChannel?.action ??
      runtimeInfo?.action ??
      fallbackInfo.action ??
      'Проверить цепь исполнительного механизма',
    title: activeChannel?.title ?? runtimeInfo?.title ?? fallbackInfo.title ?? activeElement.title,
    techNumber: activeChannel?.techNumber ?? runtimeInfo?.techNumber ?? fallbackInfo.techNumber ?? activeElement.channel,
    signalId: activeChannel?.signalId ?? runtimeInfo?.signalId ?? fallbackInfo.signalId ?? '-',
    stateLabel: activeChannel?.stateLabel ?? runtimeInfo?.stateLabel ?? fallbackInfo.stateLabel ?? 'Неизвестно',
    message: activeChannel?.message ?? runtimeInfo?.message ?? fallbackInfo.message ?? '',
    reason: activeChannel?.reason ?? runtimeInfo?.reason ?? fallbackInfo.reason ?? '',
    severity: activeChannel?.severity ?? runtimeInfo?.severity ?? fallbackInfo.severity ?? 'info',
    isFault: activeChannel?.isFault ?? runtimeInfo?.isFault ?? fallbackInfo.isFault ?? false,
    isActive: activeChannel?.isActive ?? runtimeInfo?.isActive ?? fallbackInfo.isActive ?? false,
  }
  const details = [
    { label: 'Название', value: cardInfo.title },
    { label: 'Состояние', value: cardInfo.stateLabel },
    { label: 'Сообщение', value: cardInfo.message },
    { label: 'Причина', value: cardInfo.cause || cardInfo.reason },
    { label: 'Действие', value: cardInfo.action },
  ].filter((item) => item.value.trim().length > 0)

  const selectZone = (zoneId: string) => {
    if (zoneId !== selectedZoneId) {
      onSelectZone(zoneId)
    }
  }

  const handleZoneKeyDown = (event: KeyboardEvent<SVGPathElement>, zoneId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectZone(zoneId)
    }
  }

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Карточка состояния узла"
      >
        <header className={styles.dialogHeader}>
          <div className={styles.dialogSpacer} aria-hidden="true" />
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.boardPanelWrap}>
            <aside className={styles.boardPanel}>
              <div className={styles.boardHeader}>
                <span className={`${styles.boardHeadBadge} ${styles.boardHeadBadgeYellow}`}>1</span>
                <span className={`${styles.boardHeadBadge} ${styles.boardHeadBadgeRed}`}>0</span>
              </div>

              <ul className={styles.channelList}>
                {NODE_WINDOW_ELEMENTS.map((element) => {
                  const channel = channelByZoneId.get(element.zoneId)
                  const selected = element.zoneId === activeZoneId
                  const hovered = element.zoneId === hoveredZoneId
                  const ledState = resolveNodeLedState(channel, element.channel)

                  return (
                    <li key={element.id}>
                      <button
                        type="button"
                        className={`${styles.channelButton} ${selected ? styles.channelButtonSelected : ''} ${
                          hovered ? styles.channelButtonHovered : ''
                        }`}
                        onClick={() => selectZone(element.zoneId)}
                        onMouseEnter={() => setHoveredZoneId(element.zoneId)}
                        onMouseLeave={() => setHoveredZoneId(null)}
                        onFocus={() => setHoveredZoneId(element.zoneId)}
                        onBlur={() => setHoveredZoneId(null)}
                        aria-pressed={selected}
                        title={`${channel?.channelKey ?? element.channelKey} | ${channel?.signalId ?? element.backendSignalId}`}
                      >
                        <span className={styles.ledGroup}>
                          <span
                            className={`${styles.led} ${
                              ledState === 'off' ? styles.ledYellowOff : styles.ledYellowOn
                            } ${selected ? styles.ledSelected : ''}`}
                          />
                          <span
                            className={`${styles.led} ${
                              ledState === 'yellow-red' ? styles.ledRedOn : styles.ledRedOff
                            } ${selected ? styles.ledSelected : ''}`}
                          />
                        </span>
                        <span className={styles.channelCode}>{element.channel}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className={styles.boardFooter}>{activeChannel?.moduleKey ?? 'QL6C'}</div>
            </aside>
          </div>

          <section className={styles.infoPanel}>
            <article className={styles.infoCard}>
              <div className={styles.infoHead}>
                <h3>{resolveCardTitle(activeStatus)}</h3>
                <span
                  className={styles.statusTag}
                  style={{ '--status-color': STATUS_VISUALS[activeStatus].badge } as CSSProperties}
                >
                  {STATUS_LABELS[activeStatus]}
                </span>
              </div>

              <dl className={styles.infoGrid}>
                {details.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>

              <p className={styles.hint}>
                Нажмите на канал платы или подсвеченный элемент на фото для обновления описания.
              </p>
            </article>
          </section>

          <section className={styles.photoPanel}>
            <div className={styles.photoViewport}>
              <img className={styles.photoImage} src={nodeBackgroundSvg} alt="Расположение узлов QL6C" />
              <svg
                className={styles.hotspotLayer}
                viewBox={`0 0 ${NODE_WINDOW_PHOTO_FRAME.width} ${NODE_WINDOW_PHOTO_FRAME.height}`}
                aria-label="Интерактивные зоны узла"
              >
                <g transform={`translate(-${NODE_WINDOW_PHOTO_FRAME.x} -${NODE_WINDOW_PHOTO_FRAME.y})`}>
                  {NODE_WINDOW_HOTSPOTS.map((hotspot) => {
                    const channel = channelByZoneId.get(hotspot.zoneId)
                    const zoneStatus = channel?.status ?? zoneStateMap.get(hotspot.zoneId)?.status ?? 'inactive'
                    const visual = STATUS_VISUALS[zoneStatus]
                    const selected = hotspot.zoneId === activeZoneId
                    const hovered = hotspot.zoneId === hoveredZoneId

                    return (
                      <path
                        key={hotspot.id}
                        d={hotspot.path}
                        className={`${styles.zonePath} ${selected ? styles.zoneSelected : ''} ${
                          hovered ? styles.zoneHovered : ''
                        }`}
                        style={{ '--zone-fill': visual.fill, '--zone-stroke': visual.stroke } as CSSProperties}
                        role="button"
                        tabIndex={0}
                        aria-label={hotspot.title}
                        onClick={() => selectZone(hotspot.zoneId)}
                        onMouseEnter={() => setHoveredZoneId(hotspot.zoneId)}
                        onMouseLeave={() => setHoveredZoneId(null)}
                        onFocus={() => setHoveredZoneId(hotspot.zoneId)}
                        onBlur={() => setHoveredZoneId(null)}
                        onKeyDown={(event) => handleZoneKeyDown(event, hotspot.zoneId)}
                      />
                    )
                  })}
                </g>
              </svg>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
