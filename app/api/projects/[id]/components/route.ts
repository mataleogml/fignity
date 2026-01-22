import { NextRequest, NextResponse } from 'next/server'
import { getComponentsByProject } from '@/lib/db/text-blocks'
import type { ApiResponse, ComponentInfo } from '@/lib/types'

/**
 * GET /api/projects/[id]/components
 * Get all unique components (frames) for a project
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ComponentInfo[]>>> {
  try {
    const { id: projectId } = await params

    const components = getComponentsByProject(projectId)

    return NextResponse.json({
      success: true,
      data: components,
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/components] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch components',
      },
      { status: 500 }
    )
  }
}
