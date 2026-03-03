import { useState } from 'react'
import ImageView from './ImageView'
import TopTabs, { type TabKey } from './TopTabs'
import styles from './Layout.module.css'

function Layout() {
  const [activeTab, setActiveTab] = useState<TabKey>('train')

  return (
    <div className={styles.container}>
      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.workspace}>
        {activeTab === 'train' ? <ImageView /> : null}
      </main>
    </div>
  )
}

export default Layout
