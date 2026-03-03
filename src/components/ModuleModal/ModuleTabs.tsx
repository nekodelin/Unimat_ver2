import styles from './moduleModal.module.css'

export type ModuleTabStatus = 'ok' | 'warning' | 'error'

export interface ModuleTabItem {
  id: string
  label: string
  status: ModuleTabStatus
}

interface ModuleTabsProps {
  tabs: ModuleTabItem[]
  activeTabId: string
  onTabChange: (tabId: string) => void
}

function ModuleTabs({ tabs, activeTabId, onTabChange }: ModuleTabsProps) {
  return (
    <div className={styles.moduleTabs} role="tablist" aria-label="Вкладки модуля">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        const statusClass =
          tab.status === 'error'
            ? styles.tabError
            : tab.status === 'warning'
              ? styles.tabWarning
              : styles.tabOk

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.moduleTab} ${isActive ? `${styles.moduleTabActive} ${statusClass}` : styles.moduleTabInactive}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default ModuleTabs
