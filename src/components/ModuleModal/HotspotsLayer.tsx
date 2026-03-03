import type { CSSProperties } from 'react'
import styles from './moduleModal.module.css'

export type HotspotRect = {
  x: number
  y: number
  w: number
  h: number
}

export type HotspotVisualStatus = 'ok' | 'fault' | 'inactive'

export type LayerHotspot = {
  id: string
  title: string
  rect: HotspotRect
  status: HotspotVisualStatus
}

export function createHotspotStyle({ x, y, w, h }: HotspotRect): CSSProperties {
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${w}%`,
    height: `${h}%`,
  }
}

interface HotspotsLayerProps {
  hotspots: LayerHotspot[]
  selectedHotspotId?: string | null
  onHotspotClick?: (hotspotId: string) => void
}

function HotspotsLayer({ hotspots, selectedHotspotId, onHotspotClick }: HotspotsLayerProps) {
  return (
    <div className={styles.hotspotsLayer}>
      {hotspots.map((hotspot) => {
        const statusClass =
          hotspot.status === 'fault'
            ? styles.hotspotFault
            : hotspot.status === 'inactive'
              ? styles.hotspotInactive
              : styles.hotspotOk

        const isSelected = selectedHotspotId === hotspot.id

        return (
          <button
            key={hotspot.id}
            type="button"
            title={hotspot.title}
            aria-label={hotspot.title}
            className={`${styles.hotspot} ${statusClass} ${isSelected ? styles.hotspotSelected : ''}`}
            style={createHotspotStyle(hotspot.rect)}
            onClick={() => onHotspotClick?.(hotspot.id)}
          />
        )
      })}
    </div>
  )
}

export default HotspotsLayer
