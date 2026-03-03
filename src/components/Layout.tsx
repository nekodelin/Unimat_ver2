import { useState } from 'react'
import TopTabs, { type TabKey } from '@/components/TopTabs'
import TechPage from '@/pages/TechPage'
import TrainPage from '@/pages/TrainPage'
import styles from './Layout.module.css'

function Layout() {
  const [activeTab, setActiveTab] = useState<TabKey>('train')

  return (
    <div className={styles.container}>
      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.workspace}>
        {activeTab === 'train' ? <TrainPage /> : <TechPage />}
      </main>
    </div>
  )
}

export default Layout
