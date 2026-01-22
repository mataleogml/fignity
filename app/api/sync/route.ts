import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/db/settings'
import { syncFromFigma } from '@/lib/figma/sync'
import { FigmaApiError } from '@/lib/figma/client'

export async function POST() {
  try {
    const token = getSetting('figma_token')
    const fileKey = getSetting('figma_file_key')

    if (!token || !fileKey) {
      return NextResponse.json(
        { success: false, error: 'Figma credentials not configured' },
        { status: 400 }
      )
    }

    const result = await syncFromFigma(fileKey, token)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof FigmaApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status ?? 500 }
      )
    }
    console.error('Sync failed:', error)
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    )
  }
}
