import { NextResponse } from 'next/server'
import { getAllTextBlocks, getTextBlocksSince } from '@/lib/db/text-blocks'
import { changesQuerySchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = changesQuerySchema.parse({
      since: searchParams.get('since'),
    })

    const blocks = query.since
      ? getTextBlocksSince(query.since)
      : getAllTextBlocks()

    return NextResponse.json({
      success: true,
      data: blocks,
      meta: { total: blocks.length },
    })
  } catch (error) {
    console.error('Failed to get changes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get changes' },
      { status: 500 }
    )
  }
}
