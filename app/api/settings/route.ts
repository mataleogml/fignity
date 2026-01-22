import { NextResponse } from 'next/server'
import { getSettings, setSettings } from '@/lib/db/settings'
import { updateSettingsSchema } from '@/lib/validation'
import { ZodError } from 'zod'

export async function GET() {
  try {
    const settings = getSettings()

    // Exclude sensitive token from response
    const { figma_token, ...safeSettings } = settings

    return NextResponse.json({
      success: true,
      data: {
        ...safeSettings,
        hasToken: Boolean(figma_token),
      },
    })
  } catch (error) {
    console.error('Failed to get settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validated = updateSettingsSchema.parse(body)

    setSettings(validated)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
