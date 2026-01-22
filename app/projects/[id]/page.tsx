'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Project, TextBlock, SyncResult } from '@/lib/types'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'page' | 'list'>('list')

  useEffect(() => {
    fetchProject()
    fetchTextBlocks()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success) {
        setProject(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch project:', err)
    }
  }

  const fetchTextBlocks = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/text-blocks`)
      const data = await res.json()
      if (data.success) {
        setTextBlocks(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch text blocks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/sync`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Sync failed')
      }

      setSyncResult(data.data)
      await fetchTextBlocks()
      await fetchProject()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    window.open(`/api/export?format=${format}&projectId=${projectId}`, '_blank')
  }

  // Group text blocks by frame ID (to handle duplicate frame names)
  const blocksByFrameId = textBlocks.reduce(
    (acc, block) => {
      const frameId = block.frame_id || 'ungrouped'
      if (!acc[frameId]) {
        acc[frameId] = []
      }
      acc[frameId].push(block)
      return acc
    },
    {} as Record<string, TextBlock[]>
  )

  // Create frame entries with metadata
  const frameEntries = Object.entries(blocksByFrameId).map(([frameId, blocks]) => {
    const firstBlock = blocks[0]
    const frameName = firstBlock?.frame_name || 'Ungrouped'
    const frameY = firstBlock?.frame_y ?? 0
    const frameX = firstBlock?.frame_x ?? 0

    return {
      frameId,
      frameName,
      blocks,
      frameY,
      frameX,
    }
  })

  // Sort frames by position: top to bottom, then left to right
  const sortedFrames = frameEntries.sort((a, b) => {
    // Group by rows (tolerance of 100px for "same row")
    const yDiff = a.frameY - b.frameY
    if (Math.abs(yDiff) > 100) {
      return yDiff // Different rows: sort by Y
    }
    return a.frameX - b.frameX // Same row: sort by X (left to right)
  })

  if (isLoading && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Project not found</p>
          <Button onClick={() => router.push('/')}>Back to Projects</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="mb-2"
            >
              ← Back to Projects
            </Button>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.last_sync && (
              <p className="text-sm text-gray-500">
                Last synced: {new Date(project.last_sync).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/settings`)}
            >
              Settings
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')}>
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? 'Syncing...' : 'Sync from Figma'}
            </Button>
          </div>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4 text-sm">
                <span>Total: {syncResult.total}</span>
                <span className="text-green-600">New: {syncResult.new}</span>
                <span className="text-blue-600">
                  Updated: {syncResult.updated}
                </span>
                <span className="text-gray-500">
                  Unchanged: {syncResult.unchanged}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 text-red-600">{error}</CardContent>
          </Card>
        )}

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'page' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('page')}
          >
            Page View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
        </div>

        {/* List View - Collapsible grouped by frame (publication page) */}
        {viewMode === 'list' &&
          sortedFrames.map((frame, index) => (
            <details key={frame.frameId} className="group" open>
              <summary className="cursor-pointer list-none">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {frame.frameName} {index + 1}
                      </CardTitle>
                      <CardDescription>
                        {frame.blocks.length} text blocks
                      </CardDescription>
                    </div>
                    <div className="text-gray-400 group-open:rotate-90 transition-transform">
                      ▶
                    </div>
                  </CardHeader>
                </Card>
              </summary>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {frame.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="border rounded-lg p-4 space-y-2 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{block.style}</Badge>
                          <span className="text-xs text-gray-400 ml-auto">
                            ({block.x.toFixed(0)}, {block.y.toFixed(0)})
                          </span>
                        </div>
                        <p className="text-sm">{block.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </details>
          ))}

        {/* Page View - Visual canvas showing each publication page */}
        {viewMode === 'page' &&
          sortedFrames.map((frame, index) => {
            // Use frame dimensions from first block (all blocks in same frame have same dimensions)
            const firstBlock = frame.blocks[0]
            const pageWidth = firstBlock?.frame_width ?? 612
            const pageHeight = firstBlock?.frame_height ?? 792
            const frameX = firstBlock?.frame_x ?? 0
            const frameY = firstBlock?.frame_y ?? 0

            // Scale to fit display (target 600px wide)
            const targetWidth = 600
            const scale = targetWidth / pageWidth

            return (
              <Card key={frame.frameId}>
                <CardHeader>
                  <CardTitle>
                    {frame.frameName} {index + 1}
                  </CardTitle>
                  <CardDescription>
                    {frame.blocks.length} text blocks · {pageWidth.toFixed(0)}×
                    {pageHeight.toFixed(0)}px
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div
                      className="relative border rounded-lg bg-white shadow-md overflow-hidden"
                      style={{
                        width: pageWidth * scale,
                        height: pageHeight * scale,
                      }}
                    >
                      {frame.blocks.map((block) => {
                        const scaledFontSize = Math.max(6, block.font_size * scale)
                        return (
                          <div
                            key={block.id}
                            className="absolute border border-blue-200 bg-blue-50/30 p-1 hover:z-10 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer group"
                            style={{
                              left: (block.x - frameX) * scale,
                              top: (block.y - frameY) * scale,
                              width: block.width * scale,
                              minHeight: block.height * scale,
                            }}
                            title={block.content}
                          >
                            <Badge
                              variant="secondary"
                              className="absolute top-0 left-0 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                            >
                              {block.style}
                            </Badge>
                            <p
                              className="leading-tight text-gray-700"
                              style={{
                                fontSize: scaledFontSize,
                                lineHeight: `${scaledFontSize * 1.2}px`,
                              }}
                            >
                              {block.content}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Hover over text blocks to see style · Actual page size:{' '}
                    {pageWidth}×{pageHeight}px
                  </p>
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
