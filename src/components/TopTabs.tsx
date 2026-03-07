import styles from './TopTabs.module.css'

export type TabKey = 'train' | 'technical'

interface TopTabsProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'train', label: 'Поезд' },
  { key: 'technical', label: 'Техническая вкладка' },
]

function TopTabs({ activeTab, onTabChange }: TopTabsProps) {
  return (
    <nav className={styles.panel} aria-label="Основные вкладки">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        const className = isActive ? `${styles.tab} ${styles.active}` : styles.tab

        return (
          <button
            key={tab.key}
            type="button"
            className={className}
            onClick={() => onTabChange(tab.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

export default TopTabs

