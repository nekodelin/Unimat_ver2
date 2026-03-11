import type { CSSProperties, KeyboardEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import nodeBackgroundSvg from '../../assets/node-window/background.svg'
import {
  NODE_WINDOW_ELEMENTS,
  NODE_WINDOW_TRAIN_ELEMENTS,
  NODE_WINDOW_TRAIN_ELEMENTS_BY_ZONE_ID,
} from '../../data/nodeWindowElements'
import { NODE_WINDOW_HOTSPOTS, NODE_WINDOW_PHOTO_FRAME } from '../../data/nodeWindowHotspots'
import type { ChannelState } from '../../types/channel'
import type { ModuleFaultInfo } from '../../types/module'
import type { ZoneStatus } from '../../types/status'
import type { ModuleZoneState } from '../../types/zone'
import { STATUS_VISUALS } from '../../utils/status'
import { normalizeReadableText } from '../../utils/textNormalization'
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

type FaultLabel = 'Норма' | 'ОБРЫВ' | 'КЗ' | 'Неизвестно'

type ChannelVisualState = {
  faultLabel: FaultLabel
  yellowActive: boolean
  redActive: boolean
}

const TRAIN_ZONE_IDS = new Set(NODE_WINDOW_TRAIN_ELEMENTS.map((element) => element.zoneId))

function resolveCardTitle(status: ZoneStatus): string {
  return status === 'fault' ? 'Неисправность' : 'Состояние узла'
}

function normalizeToken(value: string | null | undefined): string {
  return normalizeReadableText(value, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function getFaultLabelFromSignals(yellowActive: boolean, redActive: boolean): FaultLabel {
  if (!yellowActive && !redActive) {
    return 'Норма'
  }

  if (yellowActive && !redActive) {
    return 'Норма'
  }

  if (yellowActive && redActive) {
    return 'ОБРЫВ'
  }

  if (!yellowActive && redActive) {
    return 'КЗ'
  }

  return 'Неизвестно'
}

function getIndicatorsByFaultLabel(
  faultLabel: FaultLabel,
  preferYellowForNormal: boolean,
): Pick<ChannelVisualState, 'yellowActive' | 'redActive'> {
  if (faultLabel === 'ОБРЫВ') {
    return { yellowActive: true, redActive: true }
  }

  if (faultLabel === 'КЗ') {
    return { yellowActive: false, redActive: true }
  }

  if (faultLabel === 'Норма') {
    return preferYellowForNormal
      ? { yellowActive: true, redActive: false }
      : { yellowActive: false, redActive: false }
  }

  return { yellowActive: false, redActive: false }
}

function resolveFaultLabel(channel: ChannelState | undefined, fallbackStateLabel?: string): FaultLabel {
  if (!channel && !fallbackStateLabel) {
    return 'Неизвестно'
  }

  const stateToken = normalizeToken(channel?.stateLabel || fallbackStateLabel)
  const backendStatusToken = normalizeToken(channel?.backendStatus)

  if (
    stateToken === 'кз' ||
    stateToken.includes('коротк') ||
    backendStatusToken === 'short_circuit'
  ) {
    return 'КЗ'
  }

  if (
    stateToken === 'обрыв' ||
    stateToken.includes('обрыв') ||
    backendStatusToken === 'open_circuit'
  ) {
    return 'ОБРЫВ'
  }

  if (
    stateToken === 'норма' ||
    stateToken === 'ok' ||
    stateToken === 'normal' ||
    backendStatusToken === 'normal'
  ) {
    return 'Норма'
  }

  return getFaultLabelFromSignals(channel?.yellowLed ?? false, channel?.redLed ?? false)
}

function resolveChannelVisualState(
  channel: ChannelState | undefined,
  fallbackStateLabel?: string,
): ChannelVisualState {
  const faultLabel = resolveFaultLabel(channel, fallbackStateLabel)
  const preferYellowForNormal = (channel?.yellowLed ?? false) && !(channel?.redLed ?? false)
  const indicators = getIndicatorsByFaultLabel(faultLabel, preferYellowForNormal)

  return {
    faultLabel,
    yellowActive: indicators.yellowActive,
    redActive: indicators.redActive,
  }
}

function resolveZoneStatusByFaultLabel(faultLabel: FaultLabel): ZoneStatus {
  if (faultLabel === 'ОБРЫВ' || faultLabel === 'КЗ') {
    return 'fault'
  }

  if (faultLabel === 'Норма') {
    return 'normal'
  }

  return 'inactive'
}

function toCardText(value: string | null | undefined, fallback = ''): string {
  return normalizeReadableText(value, fallback)
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

  useEffect(() => {
    if (!open) {
      return
    }

    if (TRAIN_ZONE_IDS.has(selectedZoneId)) {
      return
    }

    const fallbackZoneId = NODE_WINDOW_TRAIN_ELEMENTS[0]?.zoneId
    if (fallbackZoneId) {
      onSelectZone(fallbackZoneId)
    }
  }, [open, onSelectZone, selectedZoneId])

  const zoneStateMap = useMemo(() => new Map(zones.map((zone) => [zone.id, zone])), [zones])
  const channelByZoneId = useMemo(
    () => new Map(decodedChannels.map((channel) => [channel.zoneId, channel])),
    [decodedChannels],
  )

  const activeElement =
    NODE_WINDOW_TRAIN_ELEMENTS_BY_ZONE_ID.get(selectedZoneId) ??
    NODE_WINDOW_TRAIN_ELEMENTS[0] ??
    NODE_WINDOW_ELEMENTS[0]
  const activeZoneId = activeElement.zoneId
  const activeChannel = channelByZoneId.get(activeZoneId)

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
  const activeVisualState = resolveChannelVisualState(activeChannel, cardInfo.stateLabel)
  const activeStatus = resolveZoneStatusByFaultLabel(activeVisualState.faultLabel)
  const details = [
    { label: 'Название', value: toCardText(cardInfo.title, activeElement.title) },
    { label: 'Состояние', value: activeVisualState.faultLabel },
    { label: 'Сообщение', value: toCardText(cardInfo.message) },
    { label: 'Причина', value: toCardText(cardInfo.cause || cardInfo.reason) },
    {
      label: 'Действие',
      value: toCardText(cardInfo.action, 'Проверить цепь исполнительного механизма'),
    },
  ].filter((item) => item.value.trim().length > 0)

  const selectZone = (zoneId: string) => {
    if (!TRAIN_ZONE_IDS.has(zoneId)) {
      return
    }

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
                  const interactive = TRAIN_ZONE_IDS.has(element.zoneId)
                  const channel = interactive ? channelByZoneId.get(element.zoneId) : undefined
                  const selected = interactive && element.zoneId === activeZoneId
                  const hovered = interactive && element.zoneId === hoveredZoneId
                  const visualState = interactive
                    ? resolveChannelVisualState(channel)
                    : { faultLabel: 'Неизвестно', yellowActive: false, redActive: false }

                  return (
                    <li key={element.id}>
                      <button
                        type="button"
                        className={`${styles.channelButton} ${
                          interactive ? '' : styles.channelButtonPassive
                        } ${selected ? styles.channelButtonSelected : ''} ${
                          hovered ? styles.channelButtonHovered : ''
                        }`}
                        onClick={interactive ? () => selectZone(element.zoneId) : undefined}
                        onMouseEnter={interactive ? () => setHoveredZoneId(element.zoneId) : undefined}
                        onMouseLeave={interactive ? () => setHoveredZoneId(null) : undefined}
                        onFocus={interactive ? () => setHoveredZoneId(element.zoneId) : undefined}
                        onBlur={interactive ? () => setHoveredZoneId(null) : undefined}
                        aria-pressed={interactive ? selected : undefined}
                        disabled={!interactive}
                        title={
                          interactive
                            ? `${channel?.channelKey ?? element.channelKey} | ${channel?.signalId ?? element.backendSignalId}`
                            : `${element.channelKey} | пассивный слот`
                        }
                      >
                        <span className={styles.ledGroup}>
                          <span
                            className={`${styles.led} ${
                              visualState.yellowActive ? styles.ledYellowOn : styles.ledYellowOff
                            } ${selected ? styles.ledSelected : ''}`}
                          />
                          <span
                            className={`${styles.led} ${
                              visualState.redActive ? styles.ledRedOn : styles.ledRedOff
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
