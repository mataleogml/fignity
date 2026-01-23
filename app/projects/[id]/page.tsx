'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { computeFrameStatus, computeProjectStatus } from '@/lib/status'
import type { Project, TextBlock, Frame, FrameWithStatus } from '@/lib/types'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([])
  const [frames, setFrames] = useState<Frame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 })
  const [loadingFrameIds, setLoadingFrameIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [projectRes, blocksRes, framesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/text-blocks`),
        fetch(`/api/projects/${projectId}/frames`),
      ])

      const [projectData, blocksData, framesData] = await Promise.all([
        projectRes.json(),
        blocksRes.json(),
        framesRes.json(),
      ])

      if (projectData.success) setProject(projectData.data)
      if (blocksData.success) setTextBlocks(blocksData.data)
      if (framesData.success) setFrames(framesData.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async (specificFrameId?: string) => {
    if (isSyncing) return

    try {
      setIsSyncing(true)

      // Show loading on specific frame or all frames
      const framesToSync = specificFrameId
        ? new Set([specificFrameId])
        : new Set(frames.map(f => f.id))
      setLoadingFrameIds(framesToSync)
      setSyncProgress({ current: 0, total: framesToSync.size })

      // Call sync API
      const res = await fetch(`/api/projects/${projectId}/sync`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Sync failed')
      }

      // Fetch updated data
      const [blocksRes, framesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/text-blocks`),
        fetch(`/api/projects/${projectId}/frames`),
      ])

      const [blocksData, framesData] = await Promise.all([
        blocksRes.json(),
        framesRes.json(),
      ])

      if (blocksData.success) setTextBlocks(blocksData.data)

      // Determine which frames changed
      const changedFrameIds = new Set<string>()
      if (blocksData.success) {
        const changedBlocks = blocksData.data.filter(
          (b: TextBlock) => b.change_status === 'pending' || b.change_status === 'accepted'
        )
        changedBlocks.forEach((b: TextBlock) => {
          if (b.frame_id) changedFrameIds.add(b.frame_id)
        })
      }

      // Remove loaders from unchanged frames progressively
      const unchangedFrameIds = Array.from(framesToSync).filter(id => !changedFrameIds.has(id))
      for (let i = 0; i < unchangedFrameIds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)) // Small delay for visual effect
        setLoadingFrameIds(prev => {
          const next = new Set(prev)
          next.delete(unchangedFrameIds[i])
          return next
        })
        setSyncProgress({ current: i + 1, total: framesToSync.size })
      }

      // Update frames data (this includes new images for changed frames)
      if (framesData.success) setFrames(framesData.data)

      // Remove loaders from changed frames
      for (const frameId of changedFrameIds) {
        await new Promise(resolve => setTimeout(resolve, 50))
        setLoadingFrameIds(prev => {
          const next = new Set(prev)
          next.delete(frameId)
          return next
        })
        setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }))
      }

      // Fetch updated project data
      const projectRes = await fetch(`/api/projects/${projectId}`)
      const projectData = await projectRes.json()
      if (projectData.success) setProject(projectData.data)

    } catch (err) {
      console.error('Sync failed:', err)
      // Clear loading states on error
      setLoadingFrameIds(new Set())
    } finally {
      setIsSyncing(false)
      setSyncProgress({ current: 0, total: 0 })
    }
  }

  const handleAcceptChange = async (blockId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/text-blocks/${blockId}/accept`,
        { method: 'POST' }
      )
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to accept change')
      }

      await fetchData()
    } catch (err) {
      console.error('Failed to accept change:', err)
    }
  }

  const handleExport = () => {
    window.open(`/api/export?format=json&projectId=${projectId}`, '_blank')
  }

  const handleUpdateProjectName = async (newName: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update project name')
      }

      await fetchData()
    } catch (err) {
      console.error('Failed to update project name:', err)
    }
  }

  if (isLoading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const framesWithStatus: FrameWithStatus[] = frames.map((frame) =>
    computeFrameStatus(frame, textBlocks)
  )

  const projectStatus = computeProjectStatus(textBlocks, project.last_export)

  return (
    <Layout
      projectId={projectId}
      projectName={project.name}
      projectStatus={projectStatus}
      frames={framesWithStatus}
      textBlocks={textBlocks}
      onAcceptChange={handleAcceptChange}
      onSync={handleSync}
      onExport={handleExport}
      onUpdateProjectName={handleUpdateProjectName}
      isSyncing={isSyncing}
      syncProgress={syncProgress}
      loadingFrameIds={loadingFrameIds}
    />
  )
}
