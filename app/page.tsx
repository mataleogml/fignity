'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppConfig } from '@/app/providers'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TextBlock, SyncResult } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const { isConfigured, isLoading, projectName, lastSync, refetch } =
    useAppConfig()

  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isConfigured) {
      router.push('/setup')
    }
  }, [isLoading, isConfigured, router])

  useEffect(() => {
    if (isConfigured) {
      fetchTextBlocks()
    }
  }, [isConfigured])

  const fetchTextBlocks = async () => {
    try {
      const res = await fetch('/api/changes')
      const data = await res.json()
      if (data.success) {
        setTextBlocks(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch text blocks:', err)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Sync failed')
      }

      setSyncResult(data.data)
      await fetchTextBlocks()
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    window.open(`/api/export?format=${format}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isConfigured) {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{projectName}</h1>
            {lastSync && (
              <p className="text-sm text-gray-500">
                Last synced: {new Date(parseInt(lastSync)).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
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

        {/* Text Blocks */}
        <Card>
          <CardHeader>
            <CardTitle>Text Blocks</CardTitle>
            <CardDescription>
              {textBlocks.length} text blocks synced from Figma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {textBlocks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No text blocks yet. Click &quot;Sync from Figma&quot; to get
                started.
              </p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {textBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{block.style}</Badge>
                      <span className="text-sm text-gray-500">
                        {block.page_name}
                      </span>
                    </div>
                    <p className="text-sm">{block.content}</p>
                    <p className="text-xs text-gray-400">
                      Position: ({block.x.toFixed(0)}, {block.y.toFixed(0)})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
