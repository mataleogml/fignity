import { NextRequest, NextResponse } from 'next/server'
import { fetchFigmaFile, FigmaApiError } from '@/lib/figma/client'
import type { FigmaPageInfo } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { figmaToken, figmaFileKey } = body

    if (!figmaToken || !figmaFileKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing figmaToken or figmaFileKey',
        },
        { status: 400 }
      )
    }

    // Fetch the Figma file
    const figmaFile = await fetchFigmaFile(figmaFileKey, figmaToken)

    // Extract pages from the document
    const pages: FigmaPageInfo[] = figmaFile.document.children
      ?.filter((child) => child.type === 'CANVAS')
      .map((child) => ({
        id: child.id,
        name: child.name,
      })) || []

    return NextResponse.json({
      success: true,
      data: {
        pages,
        fileName: figmaFile.name,
      },
    })
  } catch (error) {
    if (error instanceof FigmaApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Figma pages',
      },
      { status: 500 }
    )
  }
}
