import { NextResponse } from 'next/server'
import { isConfigured } from '@/lib/db/settings'

export async function GET() {
  try {
    const configured = isConfigured()
    return NextResponse.json({
      success: true,
      data: { isConfigured: configured },
    })
  } catch (error) {
    console.error('Failed to check configuration:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check configuration' },
      { status: 500 }
    )
  }
}
