import { useMemo, useState } from 'react'
import ConnectionBanner from '@/components/common/ConnectionBanner'
import EventJournalModal from '@/components/EventJournalModal'
import { useRealtimeStore } from '@/store/useRealtimeStore'
import TechnicalMatrix from './TechnicalMatrix'
import { buildTechnicalModuleTabs, buildTechnicalRows } from './technicalAdapter'
import styles from './TechnicalPage.module.css'

function TechnicalPage() {
  const [journalOpen, setJournalOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const {
    channels,
    modules,
    summary,
    connectionStatus,
    lastUpdateAt,
    error,
    reconnect,
    loading,
    demoMode,
  } = useRealtimeStore()

  const moduleTabs = useMemo(
    () => buildTechnicalModuleTabs(modules, summary.moduleStatus).slice(0, 2),
    [modules, summary.moduleStatus],
  )

  const activeModuleId =
    selectedModuleId && moduleTabs.some((module) => module.id === selectedModuleId)
      ? selectedModuleId
      : (moduleTabs[0]?.id ?? null)
  const activeTab = moduleTabs.find((module) => module.id === activeModuleId) ?? moduleTabs[0] ?? null
  const activeRows = useMemo(
    () => buildTechnicalRows(channels, activeTab?.id ?? ''),
    [channels, activeTab?.id],
  )
  const activeFaultCount = activeRows.filter((row) => row.status === 'fault').length

  return (
    <section className={styles.page}>
      <ConnectionBanner status={connectionStatus} lastUpdateAt={lastUpdateAt} error={error} onRetry={reconnect} />

      {loading ? <div className={styles.loading}>Загрузка данных...</div> : null}
      {demoMode ? <div className={styles.demoBadge}>demo-mode</div> : null}

      {import.meta.env.DEV ? (
        <section className={styles.debugPanel} aria-label="Debug panel">
          <div className={styles.debugRow}>connection: {connectionStatus}</div>
          <div className={styles.debugRow}>
            last update: {lastUpdateAt ? new Date(lastUpdateAt).toLocaleString('ru-RU') : '-'}
          </div>
          <div className={styles.debugRow}>faultCount: {summary.faultCount}</div>
          <div className={styles.debugRow}>warningCount: {summary.warningCount}</div>
          <div className={styles.debugRow}>normalCount: {summary.normalCount}</div>
          <div className={styles.debugList}>
            {channels.map((channel) => (
              <div key={`debug-${channel.id}`} className={styles.debugItem}>
                {channel.channelKey || channel.signalId || '-'}: {channel.status}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <TechnicalMatrix
        moduleTabs={moduleTabs}
        activeModuleId={activeTab?.id ?? null}
        moduleStatus={activeTab?.status ?? 'inactive'}
        rows={activeRows}
        faultCount={activeFaultCount}
        onSelectModule={setSelectedModuleId}
        onOpenJournal={() => setJournalOpen(true)}
      />

      <EventJournalModal isOpen={journalOpen} onClose={() => setJournalOpen(false)} />
    </section>
  )
}

export default TechnicalPage
