import Layout from './components/Layout'
import { RealtimeProvider } from './store/realtimeStore'

function App() {
  return (
    <RealtimeProvider>
      <Layout />
    </RealtimeProvider>
  )
}

export default App
