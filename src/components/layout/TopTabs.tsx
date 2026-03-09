import type { CSSProperties, ReactNode } from 'react'
import techTabIconUrl from '../../assets/train/tab-tech-icon.svg'
import type { AppTab } from '../../types/app'
import type { ZoneStatus } from '../../types/status'
import { STATUS_VISUALS } from '../../utils/status'
import styles from './TopTabs.module.css'

interface TopTabsProps {
  activeTab: AppTab
  trainStatus: ZoneStatus
  technicalStatus: ZoneStatus
  onTabChange: (tab: AppTab) => void
}

function TrainIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M5 4C3.9 4 3 4.9 3 6V14C3 15.1 3.9 16 5 16L4 18V19H6V18H18V19H20V18L19 16C20.1 16 21 15.1 21 14V6C21 4.9 20.1 4 19 4H5ZM5 6H19V10H5V6ZM7 12.5A1.5 1.5 0 1 1 7 15.5A1.5 1.5 0 0 1 7 12.5ZM17 12.5A1.5 1.5 0 1 1 17 15.5A1.5 1.5 0 0 1 17 12.5Z" />
    </svg>
  )
}

function ToolsIcon() {
  return <img className={styles.techIcon} src={techTabIconUrl} alt="" aria-hidden="true" />
}

interface TabButtonProps {
  active: boolean
  status: ZoneStatus
  label: string
  icon: ReactNode
  onClick: () => void
}

function TabButton({ active, status, label, icon, onClick }: TabButtonProps) {
  const color = STATUS_VISUALS[status]

  return (
    <button
      type="button"
      className={`${styles.tabButton} ${active ? styles.active : ''}`}
      style={{ '--tab-accent': color.badge } as CSSProperties}
      onClick={onClick}
    >
      <span className={styles.iconWrap}>{icon}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.statusDot} aria-hidden="true" />
    </button>
  )
}

export function TopTabs({ activeTab, trainStatus, technicalStatus, onTabChange }: TopTabsProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.tabs}>
        <TabButton
          active={activeTab === 'train'}
          status={trainStatus}
          label="Поезд"
          icon={<TrainIcon />}
          onClick={() => onTabChange('train')}
        />
        <TabButton
          active={activeTab === 'technical'}
          status={technicalStatus}
          label="Техническая вкладка"
          icon={<ToolsIcon />}
          onClick={() => onTabChange('technical')}
        />
      </div>
    </header>
  )
}
