import { NextResponse } from 'next/server'
import {
  getAllTextBlocks,
  getTextBlocksSince,
  getTextBlocksByProject,
} from '@/lib/db/text-blocks'
import { updateProject } from '@/lib/db/projects'
import { db } from '@/lib/db'
import { exportQuerySchema } from '@/lib/validation'
import type { TextBlock } from '@/lib/types'

function toCSV(blocks: TextBlock[]): string {
  const headers = [
    'id',
    'project_id',
    'page_id',
    'page_name',
    'frame_id',
    'frame_name',
    'content',
    'style',
    'x',
    'y',
    'width',
    'height',
    'last_modified',
  ]

  const rows = blocks.map((block) =>
    headers
      .map((h) => {
        const value = block[h as keyof TextBlock]
        const str = value === null ? '' : String(value)
        // Escape quotes and wrap in quotes if contains comma or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = exportQuerySchema.parse({
      format: searchParams.get('format') ?? 'json',
      since: searchParams.get('since'),
    })

    const projectId = searchParams.get('projectId')

    let blocks: TextBlock[]

    if (projectId) {
      // Filter by project
      blocks = getTextBlocksByProject(projectId)
      if (query.since) {
        blocks = blocks.filter((b) => b.last_modified >= query.since!)
      }
    } else {
      // All projects
      blocks = query.since ? getTextBlocksSince(query.since) : getAllTextBlocks()
    }

    const exportedAt = Date.now()

    // Update project last_export timestamp and mark accepted changes as clean
    if (projectId) {
      updateProject(projectId, { lastExport: exportedAt })

      // Mark all accepted changes as clean since they've been exported
      db.prepare(`
        UPDATE text_blocks
        SET
          change_status = 'clean',
          change_accepted_at = NULL
        WHERE project_id = ? AND change_status = 'accepted'
      `).run(projectId)
    }

    if (query.format === 'csv') {
      const csv = toCSV(blocks)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="fignity-export.csv"',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: blocks,
      meta: {
        total: blocks.length,
        exportedAt,
      },
    })
  } catch (error) {
    console.error('Export failed:', error)
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    )
  }
}
