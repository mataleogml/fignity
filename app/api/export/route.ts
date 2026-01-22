import { NextResponse } from 'next/server'
import { getAllTextBlocks, getTextBlocksSince } from '@/lib/db/text-blocks'
import { exportQuerySchema } from '@/lib/validation'
import type { TextBlock } from '@/lib/types'

function toCSV(blocks: TextBlock[]): string {
  const headers = [
    'id',
    'page_id',
    'page_name',
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
        const str = String(value)
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

    const blocks = query.since
      ? getTextBlocksSince(query.since)
      : getAllTextBlocks()

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
        exportedAt: Date.now(),
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
