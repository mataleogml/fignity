import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const { id: projectId, blockId } = await params

    // Update the text block to mark change as accepted
    const stmt = db.prepare(`
      UPDATE text_blocks
      SET
        change_status = 'accepted',
        change_accepted_at = ?,
        previous_content = NULL,
        previous_style = NULL,
        previous_x = NULL,
        previous_y = NULL,
        previous_width = NULL,
        previous_height = NULL,
        previous_content_hash = NULL
      WHERE id = ? AND project_id = ?
    `)

    const now = Date.now()
    stmt.run(now, blockId, projectId)

    return NextResponse.json({
      success: true,
      data: { blockId, acceptedAt: now },
    })
  } catch (error) {
    console.error('Failed to accept change:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to accept change',
      },
      { status: 500 }
    )
  }
}
