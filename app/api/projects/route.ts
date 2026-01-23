import { NextRequest, NextResponse } from 'next/server'
import { getAllProjects, createProject } from '@/lib/db/projects'
import type { ApiResponse, Project } from '@/lib/types'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  figmaFileKey: z.string().min(1, 'Figma file key is required'),
  figmaToken: z.string().min(1, 'Figma token is required'),
  includedComponents: z.array(z.string()).optional(),
  sourcePageIds: z.array(z.string()).optional(),
})

/**
 * GET /api/projects
 * Get all non-archived projects
 */
export async function GET(): Promise<
  NextResponse<ApiResponse<Project[]>>
> {
  try {
    const projects = getAllProjects()

    // Hide tokens in response for security
    const sanitized = projects.map((p) => ({
      ...p,
      figma_token: '***',
    }))

    return NextResponse.json({
      success: true,
      data: sanitized,
    })
  } catch (error) {
    console.error('[GET /api/projects] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch projects',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Project>>> {
  try {
    const body = await request.json()

    const validated = CreateProjectSchema.parse(body)

    // Extract file key from URL if needed
    let fileKey = validated.figmaFileKey.trim()
    if (fileKey.startsWith('http')) {
      const extracted = extractFigmaFileKey(fileKey)
      if (!extracted) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid Figma URL. Please provide a file key or valid Figma URL.',
          },
          { status: 400 }
        )
      }
      fileKey = extracted
    }

    const project = createProject({
      name: validated.name,
      figmaFileKey: fileKey,
      figmaToken: validated.figmaToken,
      includedComponents: validated.includedComponents,
      sourcePageIds: validated.sourcePageIds,
    })

    // Hide token in response
    return NextResponse.json(
      {
        success: true,
        data: {
          ...project,
          figma_token: '***',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/projects] Error:', error)

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
          error instanceof Error ? error.message : 'Failed to create project',
      },
      { status: 500 }
    )
  }
}

/**
 * Extract Figma file key from various URL formats
 */
function extractFigmaFileKey(input: string): string | null {
  if (/^[a-zA-Z0-9]+$/.test(input.trim())) {
    return input.trim()
  }

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
