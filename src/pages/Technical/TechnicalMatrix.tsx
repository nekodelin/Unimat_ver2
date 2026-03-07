import { statusToTone } from '@/config/statusVisual'
import type { ChannelStatus } from '@/types/realtime'
import type { TechnicalModuleTab, TechnicalRow } from './technicalAdapter'
import styles from './TechnicalMatrix.module.css'

type TechnicalMatrixProps = {
  moduleTabs: TechnicalModuleTab[]
  activeModuleId: string | null
  moduleStatus: ChannelStatus
  rows: TechnicalRow[]
  faultCount: number
  onSelectModule: (moduleId: string) => void
  onOpenJournal: () => void
}

function statusLabel(status: ChannelStatus): string {
  if (status === 'normal' || status === 'active') {
    return 'Норма'
  }

  if (status === 'inactive') {
    return 'Неактивен'
  }

  if (status === 'unknown') {
    return 'Предупреждение'
  }

  return 'Авария'
}

function TechnicalMatrix({
  moduleTabs,
  activeModuleId,
  moduleStatus,
  rows,
  faultCount,
  onSelectModule,
  onOpenJournal,
}: TechnicalMatrixProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.moduleTabs} role="tablist" aria-label="Выбор модуля">
        {moduleTabs.map((module) => {
          const isActive = module.id === activeModuleId
          const tone = statusToTone(module.status)
          const statusClass =
            tone === 'red'
              ? styles.moduleError
              : tone === 'warning'
                ? styles.moduleWarning
                : tone === 'inactive'
                  ? styles.moduleInactive
                  : styles.moduleOk

          return (
            <button
              key={module.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.moduleTab} ${isActive ? `${styles.moduleActive} ${statusClass}` : styles.moduleIdle}`}
              onClick={() => onSelectModule(module.id)}
            >
              {module.label}
            </button>
          )
        })}
      </div>

      <div className={styles.matrixWrap}>
        <button type="button" className={styles.journalButton} onClick={onOpenJournal} aria-label="Журнал событий">
          <span className={styles.journalTop}>ЖУРНАЛ</span>
          <span className={styles.journalBottom}>СОБЫТИЙ</span>
        </button>

        <div className={styles.table}>
          <div className={`${styles.cell} ${styles.headerCell}`}>Органы управления</div>
          <div className={`${styles.boardCell} ${styles.boardHeaderCell}`}>
            <span className={styles.badge}>1</span>
            <span className={styles.badge}>0</span>
          </div>
          <div className={`${styles.cell} ${styles.headerCell}`}>Неисправность</div>

          {rows.map((row) => (
            <TechnicalRowLine key={row.bit} row={row} />
          ))}

          <div className={`${styles.cell} ${styles.footerCell}`}>
            <div className={styles.alarmPanel}>
              <strong className={styles.alarmLabel}>АВАРИЯ</strong>
              <span className={`${styles.alarmLed} ${faultCount > 0 ? styles.alarmLedOn : styles.alarmLedOff}`} />
              <button type="button" className={styles.soundButton}>
                ВЫКЛ
              </button>
            </div>
          </div>
          <div className={`${styles.boardCell} ${styles.boardFooterCell}`}>{activeModuleId || '-'}</div>
          <div className={`${styles.cell} ${styles.footerCell}`}>
            <div className={styles.moduleStatus}>Статус: {statusLabel(moduleStatus)}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TechnicalRowLine({ row }: { row: TechnicalRow }) {
  const yellowClass =
    row.yellowLed === 'on' ? styles.ledYellowOn : row.yellowLed === 'dim' ? styles.ledYellowDim : styles.ledYellowOff

  return (
    <>
      <div className={`${styles.cell} ${styles.rowCell} ${row.status === 'fault' ? styles.rowFault : ''}`}>
        <span className={styles.signalCode}>{row.signalId || '\u00A0'}</span>
        <span className={styles.signalTitle}>{row.title || '\u00A0'}</span>
      </div>
      <div className={`${styles.boardCell} ${styles.boardRowCell}`}>
        <span className={`${styles.led} ${yellowClass}`} aria-hidden="true" />
        <span className={`${styles.led} ${row.redLed ? styles.ledRedOn : styles.ledRedOff}`} aria-hidden="true" />
        <span className={styles.bit}>{row.bit}</span>
      </div>
      <div className={`${styles.cell} ${styles.rowCell} ${row.status === 'fault' ? styles.rowFault : ''}`}>
        <span className={styles.faultText}>{row.status === 'fault' ? row.faultText || 'Авария' : '\u00A0'}</span>
      </div>
    </>
  )
}

export default TechnicalMatrix

