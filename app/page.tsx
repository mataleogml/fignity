'use client'

import { useEffect } from 'react'
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

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, isLoading } = useAppConfig()

  useEffect(() => {
    if (!isLoading && projects.length === 0) {
      router.push('/projects/new')
    }
  }, [isLoading, projects, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fignity Projects</h1>
            <p className="text-gray-500 mt-1">
              Manage your Figma to Affinity workflows
            </p>
          </div>
          <Button onClick={() => router.push('/projects/new')}>
            Create New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-500 mb-4">No projects yet</p>
              <Button onClick={() => router.push('/projects/new')}>
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {project.figma_file_key}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.last_sync && (
                    <p className="text-sm text-gray-500">
                      Last synced:{' '}
                      {new Date(project.last_sync).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/projects/${project.id}`)
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/projects/${project.id}/settings`)
                      }}
                    >
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
