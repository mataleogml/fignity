import { NextRequest, NextResponse } from 'next/server'
import { getProject } from '@/lib/db/projects'
import { fetchFigmaFile } from '@/lib/figma/client'
import type { ApiResponse, FigmaPageInfo } from '@/lib/types'

/**
 * GET /api/projects/[id]/pages
 * Get all organizational pages from the Figma file
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<FigmaPageInfo[]>>> {
  try {
    const { id: projectId } = await params

    const project = getProject(projectId)
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      )
    }

    // Fetch Figma file to get pages
    const file = await fetchFigmaFile(
      project.figma_file_key,
      project.figma_token
    )

    // Extract page IDs and names from document children
    const pages: FigmaPageInfo[] = (file.document.children || []).map(
      (page) => ({
        id: page.id,
        name: page.name,
      })
    )

    return NextResponse.json({
      success: true,
      data: pages,
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/pages] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch pages',
      },
      { status: 500 }
    )
  }
}
