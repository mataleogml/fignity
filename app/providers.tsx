'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import type { Project } from '@/lib/types'

interface AppConfig {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  setCurrentProject: (id: string) => void
  refetchProjects: () => Promise<void>
}

const AppConfigContext = createContext<AppConfig | null>(null)

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()

      if (data.success) {
        const projectList = data.data as Project[]
        setProjects(projectList)

        // Set first project as current if none selected
        if (!currentProjectId && projectList.length > 0) {
          setCurrentProjectId(projectList[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null

  return (
    <AppConfigContext.Provider
      value={{
        projects,
        currentProject,
        isLoading,
        setCurrentProject: setCurrentProjectId,
        refetchProjects: fetchProjects,
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
