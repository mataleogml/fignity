'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
} from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { useAppConfig } from '@/app/providers'

function extractFigmaFileKey(input: string): string | null {
  // If it looks like just a file key (alphanumeric, no slashes)
  if (/^[a-zA-Z0-9]+$/.test(input.trim())) {
    return input.trim()
  }

  // Try to extract from URL patterns:
  // https://www.figma.com/design/{FILE_KEY}/{name}
  // https://www.figma.com/file/{FILE_KEY}/{name}
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

export default function NewProjectPage() {
  const router = useRouter()
  const { refetchProjects } = useAppConfig()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [figmaUrlInput, setFigmaUrlInput] = useState('')

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

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create project')
      }

      await refetchProjects()
      router.push(`/projects/${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Set up a new Figma to Affinity workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {step === 1 && (
              <Field>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Q1 Newsletter"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
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
                />
                <FieldDescription>
                  Get this from Figma Settings {'>'} Account {'>'} Personal
                  access tokens
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
                />
                <FieldDescription>
                  Open your Figma file, click &quot;Share&quot;, then copy the
                  link. We&apos;ll extract the file key automatically.
                </FieldDescription>
                {formData.figmaFileKey && (
                  <p className="text-sm text-green-600 mt-2">
                    File key detected: {formData.figmaFileKey}
                  </p>
                )}
              </Field>
            )}

            {error && <FieldError>{error}</FieldError>}

            <div className="flex gap-2 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !formData.name) ||
                    (step === 2 && !formData.figmaToken)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.figmaFileKey}
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </Button>
              )}
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
