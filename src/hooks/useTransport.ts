import { useEffect } from 'react'
import { envConfig } from '../config/env'
import { backendTransport } from '../services/backendTransport'
import { mockTransport } from '../services/mockTransport'
import { useAppStore } from '../store/appStore'

export function useTransport() {
  const applySnapshot = useAppStore((state) => state.applySnapshot)
  const activeTransport = envConfig.useMocks ? mockTransport : backendTransport

  useEffect(() => {
    activeTransport.connect()
    const unsubscribe = activeTransport.subscribe(applySnapshot)

    return () => {
      unsubscribe()
      activeTransport.disconnect()
    }
  }, [activeTransport, applySnapshot])

  return {
    setScenario: (scenarioId: Parameters<typeof mockTransport.setScenario>[0]) => {
      if (envConfig.useMocks && activeTransport.setScenario) {
        activeTransport.setScenario(scenarioId)
      }
    },
  }
}

