import { NextRequest, NextResponse } from 'next/server'
import { getTextBlocksByProject } from '@/lib/db/text-blocks'
import type { ApiResponse, TextBlock } from '@/lib/types'

/**
 * GET /api/projects/[id]/text-blocks
 * Get all text blocks for a project
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<TextBlock[]>>> {
  try {
    const { id: projectId } = await params

    const textBlocks = getTextBlocksByProject(projectId)

    return NextResponse.json({
      success: true,
      data: textBlocks,
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/text-blocks] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch text blocks',
      },
      { status: 500 }
    )
  }
}
