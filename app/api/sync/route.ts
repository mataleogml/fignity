import { NextResponse } from 'next/server'
import { getAllProjects } from '@/lib/db/projects'
import { syncFromFigma } from '@/lib/figma/sync'
import { FigmaApiError } from '@/lib/figma/client'

/**
 * POST /api/sync (DEPRECATED - use /api/projects/[id]/sync instead)
 * Syncs the first non-archived project for backwards compatibility
 */
export async function POST() {
  try {
    const projects = getAllProjects()

    if (projects.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No projects configured' },
        { status: 400 }
      )
    }

    // Sync the first project for backwards compatibility
    const firstProject = projects[0]
    const result = await syncFromFigma(firstProject.id)

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
