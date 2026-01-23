import { NextRequest, NextResponse } from 'next/server'
import { getFramesByProject } from '@/lib/db/frames'
import type { ApiResponse, Frame } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Frame[]>>> {
  const { id } = await params

  try {
    const frames = getFramesByProject(id)

    return NextResponse.json({
      success: true,
      data: frames,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch frames',
      },
      { status: 500 }
    )
  }
}
