import type { OverlayZone } from '@/config/moduleOverlayMap'
import styles from './moduleModal.module.css'

export type OverlayVisualState = 'ok' | 'fault' | 'inactive'

export type OverlayZoneView = {
  zone: OverlayZone
  status: OverlayVisualState
  title: string
}

interface ModulePhotoOverlayProps {
  zones: OverlayZoneView[]
  selectedZoneKey: string | null
  onSelectZone: (zoneKey: string) => void
}

function ModulePhotoOverlay({ zones, selectedZoneKey, onSelectZone }: ModulePhotoOverlayProps) {
  return (
    <svg className={styles.moduleOverlay} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Интерактивные зоны узла">
      {zones.map(({ zone, status, title }) => {
        const points = zone.polygonPercent.map((point) => `${point.x},${point.y}`).join(' ')
        const statusClass =
          status === 'fault'
            ? styles.overlayZoneFault
            : status === 'ok'
              ? styles.overlayZoneOk
              : styles.overlayZoneInactive
        const isSelected = selectedZoneKey === zone.key

        return (
          <polygon
            key={zone.key}
            points={points}
            className={`${styles.overlayZone} ${statusClass} ${isSelected ? styles.overlayZoneSelected : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelectZone(zone.key)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectZone(zone.key)
              }
            }}
          >
            <title>{title}</title>
          </polygon>
        )
      })}
    </svg>
  )
}

export default ModulePhotoOverlay
