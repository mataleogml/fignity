import { NextRequest, NextResponse } from 'next/server'
import {
  getProject,
  updateProject,
  archiveProject,
  deleteProject,
} from '@/lib/db/projects'
import { deleteTextBlocksByProject } from '@/lib/db/text-blocks'
import type { ApiResponse, Project } from '@/lib/types'
import { z } from 'zod'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  figmaFileKey: z.string().min(1).optional(),
  figmaToken: z.string().min(1).optional(),
  includedComponents: z.array(z.string()).optional(),
  sourcePageIds: z.array(z.string()).optional(),
})

/**
 * GET /api/projects/[id]
 * Get a single project
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Project>>> {
  try {
    const { id } = await params
    const project = getProject(id)

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      )
    }

    // Hide token in response
    return NextResponse.json({
      success: true,
      data: {
        ...project,
        figma_token: '***',
      },
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch project',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Project>>> {
  try {
    const { id } = await params
    const body = await request.json()

    const validated = UpdateProjectSchema.parse(body)

    // Extract file key if URL provided
    let updates = { ...validated }
    if (validated.figmaFileKey && validated.figmaFileKey.startsWith('http')) {
      const extracted = extractFigmaFileKey(validated.figmaFileKey)
      if (!extracted) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid Figma URL',
          },
          { status: 400 }
        )
      }
      updates = { ...updates, figmaFileKey: extracted }
    }

    const updated = updateProject(id, updates)

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      )
    }

    // Hide token in response
    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        figma_token: '***',
      },
    })
  } catch (error) {
    console.error('[PUT /api/projects/[id]] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0].message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update project',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project (soft delete by default, hard delete with ?hard=true)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete: Remove project and all text blocks
      deleteProject(id)
    } else {
      // Soft delete: Archive project
      archiveProject(id)
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete project',
      },
      { status: 500 }
    )
  }
}

function extractFigmaFileKey(input: string): string | null {
  const urlPatterns = [
    /figma\.com\/design\/([a-zA-Z0-9]+)/,
    /figma\.com\/file\/([a-zA-Z0-9]+)/,
    /figma\.com\/proto\/([a-zA-Z0-9]+)/,
  ]

  for (const pattern of urlPatterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }

  return null
}
