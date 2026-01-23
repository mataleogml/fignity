import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const now = Date.now()

    // Update all pending text blocks to accepted
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
      WHERE project_id = ? AND change_status = 'pending'
    `)

    const result = stmt.run(now, projectId)

    return NextResponse.json({
      success: true,
      data: {
        acceptedCount: result.changes,
        acceptedAt: now,
      },
    })
  } catch (error) {
    console.error('Failed to accept all changes:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to accept all changes',
      },
      { status: 500 }
    )
  }
}
