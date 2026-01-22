import { NextResponse } from 'next/server'
import { setSettings } from '@/lib/db/settings'
import { initializeSettingsSchema } from '@/lib/validation'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = initializeSettingsSchema.parse(body)

    setSettings({
      project_name: validated.projectName,
      figma_token: validated.figmaToken,
      figma_file_key: validated.figmaFileKey,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Failed to initialize settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize settings' },
      { status: 500 }
    )
  }
}
