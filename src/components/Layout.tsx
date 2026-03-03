import { type ReactNode, useState } from 'react'
import TopTabs, { type TabKey } from './TopTabs'
import styles from './Layout.module.css'

interface LayoutProps {
  children?: ReactNode
}

function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('train')

  return (
    <div className={styles.container}>
      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.workspace}>{children}</main>
    </div>
  )
}

export default Layout
