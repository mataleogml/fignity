'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

interface AppConfig {
  isConfigured: boolean
  isLoading: boolean
  projectName?: string
  figmaFileKey?: string
  lastSync?: string
  refetch: () => Promise<void>
}

const AppConfigContext = createContext<AppConfig | null>(null)

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, string>>({})

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const [checkRes, settingsRes] = await Promise.all([
        fetch('/api/settings/check'),
        fetch('/api/settings'),
      ])

      const checkData = await checkRes.json()
      const settingsData = await settingsRes.json()

      setIsConfigured(checkData.data?.isConfigured ?? false)
      setSettings(settingsData.data ?? {})
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  return (
    <AppConfigContext.Provider
      value={{
        isConfigured,
        isLoading,
        projectName: settings.project_name,
        figmaFileKey: settings.figma_file_key,
        lastSync: settings.last_sync,
        refetch: fetchConfig,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  const context = useContext(AppConfigContext)
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider')
  }
  return context
}
