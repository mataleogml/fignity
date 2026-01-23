'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { NewProjectDialog } from '@/components/NewProjectDialog'
import { useAppConfig } from '@/app/providers'

export default function NewProjectPage() {
  const router = useRouter()
  const { refetchProjects } = useAppConfig()
  const [dialogOpen, setDialogOpen] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string>('')

  const handleProjectCreated = async (projectId: string) => {
    try {
      // Close dialog and show loading state
      setDialogOpen(false)
      setIsSyncing(true)
      setSyncStatus('Preparing to sync...')

      // Refetch projects to update context
      await refetchProjects()

      // Start the initial sync
      setSyncStatus('Syncing frames from Figma...')
      const syncResponse = await fetch(`/api/projects/${projectId}/sync`, {
        method: 'POST',
      })

      const syncData = await syncResponse.json()

      if (!syncData.success) {
        throw new Error(syncData.error || 'Sync failed')
      }

      setSyncStatus('Sync complete! Redirecting...')

      // Brief delay to show completion message
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to the project
      router.push(`/projects/${projectId}`)
    } catch (err) {
      console.error('Failed to sync project:', err)
      // Still redirect even if sync fails - user can retry from project page
      router.push(`/projects/${projectId}`)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open && !isSyncing) {
      // If user closes the dialog, redirect back to projects list
      router.push('/')
    }
    setDialogOpen(open)
  }

  return (
    <>
      <Layout previewMode />
      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onProjectCreated={handleProjectCreated}
      />

      {/* Loading overlay during initial sync */}
      {isSyncing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <svg
              className="w-16 h-16 text-blue-600 animate-spin mb-4 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Setting up your project</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{syncStatus}</p>
          </div>
        </div>
      )}
    </>
  )
}
