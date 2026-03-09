import type { CSSProperties } from 'react'
import trainBaseSvg from '../../assets/train/train-base.svg'
import type { ZoneStatus } from '../../types/status'
import type { TrainZoneDefinition } from '../../types/zone'
import { STATUS_VISUALS } from '../../utils/status'
import styles from './TrainCanvas.module.css'

interface TrainCanvasZone extends TrainZoneDefinition {
  status: ZoneStatus
}

interface TrainCanvasProps {
  zones: TrainCanvasZone[]
  onZoneClick: (zoneId: string) => void
  zonesDisabled?: boolean
}

export function TrainCanvas({ zones, onZoneClick, zonesDisabled = false }: TrainCanvasProps) {
  const renderedZones = zonesDisabled ? [] : zones

  return (
    <div className={styles.canvasWrap}>
      <div className={styles.canvas}>
        <img className={styles.trainImage} src={trainBaseSvg} alt="Схема поезда" />
        <div className={styles.railLine} aria-hidden="true" />

        {renderedZones.map((zone) => {
          const visual = STATUS_VISUALS[zone.status]

          return (
            <button
              key={zone.id}
              type="button"
              className={styles.zoneButton}
              style={{
                left: `${zone.shape.leftPct}%`,
                top: `${zone.shape.topPct}%`,
                width: `${zone.shape.widthPct}%`,
                height: `${zone.shape.heightPct}%`,
                '--zone-stroke': visual.stroke,
                '--zone-fill': visual.fill,
              } as CSSProperties}
              onClick={() => onZoneClick(zone.id)}
              aria-label={zone.title}
              title={zone.title}
              disabled={zonesDisabled}
            >
              <svg
                viewBox={`0 0 ${zone.shape.viewBoxWidth} ${zone.shape.viewBoxHeight}`}
                className={styles.zoneShape}
                aria-hidden="true"
              >
                <path d={zone.shape.path} />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
