'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Field,
  FieldDescription,
  FieldError,
} from './ui/field'
import type { FigmaPageInfo } from '@/lib/types'

function extractFigmaFileKey(input: string): string | null {
  if (/^[a-zA-Z0-9]+$/.test(input.trim())) {
    return input.trim()
  }

  const urlPatterns = [
    /figma\.com\/design\/([a-zA-Z0-9]+)/,
    /figma\.com\/file\/([a-zA-Z0-9]+)/,
  ]

  for (const pattern of urlPatterns) {
    const match = input.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated?: (projectId: string) => void
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: NewProjectDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPages, setIsFetchingPages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [figmaUrlInput, setFigmaUrlInput] = useState('')
  const [availablePages, setAvailablePages] = useState<FigmaPageInfo[]>([])
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    figmaToken: '',
    figmaFileKey: '',
  })

  const handleFigmaUrlChange = (value: string) => {
    setFigmaUrlInput(value)
    const fileKey = extractFigmaFileKey(value)
    if (fileKey) {
      setFormData((prev) => ({ ...prev, figmaFileKey: fileKey }))
    }
  }

  const fetchAvailablePages = async () => {
    setIsFetchingPages(true)
    setError(null)

    try {
      const response = await fetch('/api/figma/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figmaToken: formData.figmaToken,
          figmaFileKey: formData.figmaFileKey,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch pages')
      }

      setAvailablePages(data.data.pages)

      // Auto-select all pages by default
      setSelectedPageIds(data.data.pages.map((p: FigmaPageInfo) => p.id))

      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages')
    } finally {
      setIsFetchingPages(false)
    }
  }

  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId]
    )
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sourcePageIds: selectedPageIds,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create project')
      }

      onOpenChange(false)
      if (onProjectCreated) {
        onProjectCreated(data.data.id)
      } else {
        router.push(`/projects/${data.data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    if (!isLoading && !isFetchingPages) {
      onOpenChange(false)
      setStep(1)
      setFormData({ name: '', figmaToken: '', figmaFileKey: '' })
      setFigmaUrlInput('')
      setError(null)
      setAvailablePages([])
      setSelectedPageIds([])
    }
  }

  const stepTitle = () => {
    switch (step) {
      case 1: return 'Project Name'
      case 2: return 'Figma Token'
      case 3: return 'Figma File'
      case 4: return 'Select Pages'
      default: return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={!isLoading && !isFetchingPages}>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {stepTitle()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {step === 1 && (
            <Field>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Q1 Newsletter"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formData.name) {
                    setStep(2)
                  }
                }}
                autoFocus
              />
              <FieldDescription>
                A name to identify this project
              </FieldDescription>
            </Field>
          )}

          {step === 2 && (
            <Field>
              <Label htmlFor="figmaToken">Figma Personal Access Token</Label>
              <Input
                id="figmaToken"
                type="password"
                placeholder="figd_..."
                value={formData.figmaToken}
                onChange={(e) => updateField('figmaToken', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formData.figmaToken) {
                    setStep(3)
                  }
                }}
                autoFocus
              />
              <FieldDescription>
                Get this from Figma Settings {'>'} Account {'>'} Personal access tokens
              </FieldDescription>
            </Field>
          )}

          {step === 3 && (
            <Field>
              <Label htmlFor="figmaUrl">Figma File URL</Label>
              <Input
                id="figmaUrl"
                placeholder="https://www.figma.com/design/..."
                value={figmaUrlInput}
                onChange={(e) => handleFigmaUrlChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formData.figmaFileKey && !isFetchingPages) {
                    fetchAvailablePages()
                  }
                }}
                autoFocus
              />
              <FieldDescription>
                Open your Figma file, click "Share", then copy the link
              </FieldDescription>
              {formData.figmaFileKey && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  File key detected: {formData.figmaFileKey}
                </p>
              )}
            </Field>
          )}

          {step === 4 && (
            <Field>
              <Label>Select Pages to Sync</Label>
              <FieldDescription>
                Choose which pages from your Figma file to include in this project
              </FieldDescription>
              <div className="space-y-2 mt-3 max-h-[300px] overflow-y-auto">
                {availablePages.map((page) => (
                  <label
                    key={page.id}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPageIds.includes(page.id)}
                      onChange={() => togglePageSelection(page.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{page.name}</span>
                  </label>
                ))}
              </div>
              {selectedPageIds.length === 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  Please select at least one page
                </p>
              )}
            </Field>
          )}

          {error && <FieldError>{error}</FieldError>}
        </div>

        <DialogFooter>
          {step > 1 && step !== 4 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={isLoading || isFetchingPages}
            >
              Back
            </Button>
          )}

          {step === 4 && (
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              disabled={isLoading}
            >
              Back
            </Button>
          )}

          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!formData.name}
            >
              Next
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={() => setStep(3)}
              disabled={!formData.figmaToken}
            >
              Next
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={fetchAvailablePages}
              disabled={isFetchingPages || !formData.figmaFileKey}
            >
              {isFetchingPages ? 'Loading Pages...' : 'Next'}
            </Button>
          )}

          {step === 4 && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || selectedPageIds.length === 0}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
