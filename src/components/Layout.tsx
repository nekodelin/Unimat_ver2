import { useState } from 'react'
import TopTabs, { type TabKey } from '@/components/TopTabs'
import TechnicalPage from '@/pages/Technical/TechnicalPage'
import TrainPage from '@/pages/TrainPage'
import styles from './Layout.module.css'

function Layout() {
  const [activeTab, setActiveTab] = useState<TabKey>('technical')

  return (
    <div className={styles.container}>
      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.workspace}>
        {activeTab === 'train' ? <TrainPage /> : <TechnicalPage />}
      </main>
    </div>
  )
}

export default Layout
