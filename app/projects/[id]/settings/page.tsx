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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
} from '@/components/ui/field'
import type { Project, ComponentInfo, FigmaPageInfo } from '@/lib/types'

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [components, setComponents] = useState<ComponentInfo[]>([])
  const [pages, setPages] = useState<FigmaPageInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    figmaFileKey: '',
    figmaToken: '',
  })

  const [includedComponentIds, setIncludedComponentIds] = useState<string[]>([])
  const [sourcePageIds, setSourcePageIds] = useState<string[]>([])

  useEffect(() => {
    fetchProject()
    fetchComponents()
    fetchPages()
  }, [projectId])

  const fetchProject = async () => {
    try {
      // Fetch project with full token (server returns *** by default)
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success) {
        const proj = data.data as Project
        setProject(proj)
        setFormData({
          name: proj.name,
          figmaFileKey: proj.figma_file_key,
          figmaToken: '', // Don't pre-fill token for security
        })

        // Parse included components
        try {
          const ids = JSON.parse(proj.included_components)
          setIncludedComponentIds(ids)
        } catch {
          setIncludedComponentIds([])
        }

        // Parse source page IDs
        try {
          const pageIds = JSON.parse(proj.source_page_ids)
          setSourcePageIds(pageIds)
        } catch {
          setSourcePageIds([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch project:', err)
      setError('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComponents = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/components`)
      const data = await res.json()
      if (data.success) {
        setComponents(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch components:', err)
    }
  }

  const fetchPages = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pages`)
      const data = await res.json()
      if (data.success) {
        setPages(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch pages:', err)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const updates: Record<string, unknown> = {
        name: formData.name,
        figmaFileKey: formData.figmaFileKey,
        includedComponents: includedComponentIds,
        sourcePageIds,
      }

      // Only update token if user entered a new one
      if (formData.figmaToken.trim()) {
        updates.figmaToken = formData.figmaToken
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update project')
      }

      setSuccessMessage('Settings saved successfully!')
      setFormData((prev) => ({ ...prev, figmaToken: '' }))

      // Refetch project data
      await fetchProject()
      await fetchComponents()
      await fetchPages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Archive this project? You can restore it later.')) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to archive project')
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive project')
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'PERMANENTLY delete this project and all text blocks? This cannot be undone!'
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}?hard=true`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete project')
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const toggleComponentInclusion = (componentId: string) => {
    setIncludedComponentIds((prev) => {
      if (prev.includes(componentId)) {
        return prev.filter((id) => id !== componentId)
      }
      return [...prev, componentId]
    })
  }

  const selectAllComponents = () => {
    setIncludedComponentIds(components.map((c) => c.id))
  }

  const deselectAllComponents = () => {
    setIncludedComponentIds([])
  }

  const togglePageInclusion = (pageId: string) => {
    setSourcePageIds((prev) => {
      if (prev.includes(pageId)) {
        return prev.filter((id) => id !== pageId)
      }
      return [...prev, pageId]
    })
  }

  const selectAllPages = () => {
    setSourcePageIds(pages.map((p) => p.id))
  }

  const deselectAllPages = () => {
    setSourcePageIds([])
  }

  if (isLoading) {
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="mb-2"
            >
              ← Back to Project
            </Button>
            <h1 className="text-2xl font-bold">Project Settings</h1>
            <p className="text-gray-500">{project.name}</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 text-green-600">
              {successMessage}
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 text-red-600">{error}</CardContent>
          </Card>
        )}

        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
            <CardDescription>
              Update project name and Figma credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </Field>

              <Field>
                <Label htmlFor="figmaFileKey">Figma File Key</Label>
                <Input
                  id="figmaFileKey"
                  value={formData.figmaFileKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      figmaFileKey: e.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Can be a file key or full Figma URL
                </FieldDescription>
              </Field>

              <Field>
                <Label htmlFor="figmaToken">
                  Figma Personal Access Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="figmaToken"
                    type={showToken ? 'text' : 'password'}
                    value={formData.figmaToken}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        figmaToken: e.target.value,
                      }))
                    }
                    placeholder="Leave empty to keep current token"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <FieldDescription>
                  Only enter if you want to change it. Current token is hidden
                  for security.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Page Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Source Pages</CardTitle>
                <CardDescription>
                  Select which Figma pages to sync from
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPages}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllPages}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No pages found. Check your Figma credentials.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {sourcePageIds.length === 0
                    ? 'All pages included by default'
                    : `${sourcePageIds.length} of ${pages.length} pages selected`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pages.map((page) => {
                    const isIncluded =
                      sourcePageIds.length === 0 ||
                      sourcePageIds.includes(page.id)
                    return (
                      <div
                        key={page.id}
                        onClick={() => togglePageInclusion(page.id)}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isIncluded
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{page.name}</p>
                            <p className="text-xs text-gray-500">
                              Page ID: {page.id}
                            </p>
                          </div>
                          <Badge
                            variant={isIncluded ? 'default' : 'outline'}
                            className="ml-2"
                          >
                            {isIncluded ? 'Included' : 'Excluded'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Component Inclusion */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Component Inclusion</CardTitle>
                <CardDescription>
                  Select which frames to include in sync and export
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllComponents}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllComponents}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {components.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No components found. Sync from Figma first.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {includedComponentIds.length === 0
                    ? 'All components included by default'
                    : `${includedComponentIds.length} of ${components.length} components selected`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                  {components.map((component) => {
                    const isIncluded =
                      includedComponentIds.length === 0 ||
                      includedComponentIds.includes(component.id)
                    return (
                      <div
                        key={component.id}
                        onClick={() => toggleComponentInclusion(component.id)}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isIncluded
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {component.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {component.textBlockCount} text blocks
                            </p>
                          </div>
                          <Badge
                            variant={isIncluded ? 'default' : 'outline'}
                            className="ml-2"
                          >
                            {isIncluded ? 'Included' : 'Excluded'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Archive Project</p>
                <p className="text-sm text-gray-500">
                  Hide this project. Can be restored later.
                </p>
              </div>
              <Button variant="outline" onClick={handleArchive}>
                Archive
              </Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium text-red-600">Delete Project</p>
                <p className="text-sm text-gray-500">
                  Permanently delete project and all text blocks. Cannot be
                  undone!
                </p>
              </div>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Forever
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
