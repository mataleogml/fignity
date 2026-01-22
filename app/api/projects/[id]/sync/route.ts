import { NextRequest, NextResponse } from 'next/server'
import { syncFromFigma } from '@/lib/figma/sync'
import type { ApiResponse, SyncResult } from '@/lib/types'

/**
 * POST /api/projects/[id]/sync
 * Trigger a sync from Figma for a specific project
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<SyncResult>>> {
  try {
    const { id: projectId } = await params

    const result = await syncFromFigma(projectId)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[POST /api/projects/[id]/sync] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    )
  }
}
