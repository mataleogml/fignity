import type { FigmaFile, FigmaNode } from '@/lib/types'

const FIGMA_API_BASE = 'https://api.figma.com/v1'

export class FigmaApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'FigmaApiError'
  }
}

export async function fetchFigmaFile(
  fileKey: string,
  token: string
): Promise<FigmaFile> {
  const url = `${FIGMA_API_BASE}/files/${fileKey}`

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new FigmaApiError(
      `Figma API error: ${errorText}`,
      response.status
    )
  }

  return response.json()
}

export interface ExtractedTextNode {
  id: string
  pageId: string
  pageName: string
  frameId: string | null
  frameName: string | null
  frameX: number | null
  frameY: number | null
  frameWidth: number | null
  frameHeight: number | null
  content: string
  fontSize: number
  styleName: string | null // Figma text style name (e.g., "Body/Medium", "Heading/Large")
  x: number
  y: number
  width: number
  height: number
}

/**
 * Fetch frame images from Figma
 */
export async function fetchFrameImages(
  fileKey: string,
  token: string,
  frameIds: string[]
): Promise<Record<string, string>> {
  if (frameIds.length === 0) {
    return {}
  }

  const url = `${FIGMA_API_BASE}/images/${fileKey}?ids=${frameIds.join(',')}&format=png&scale=1`

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new FigmaApiError(
      `Figma Images API error: ${errorText}`,
      response.status
    )
  }

  const data = await response.json() as { images: Record<string, string> }
  return data.images
}

export function extractTextNodes(
  file: FigmaFile,
  sourcePageIds?: string[]
): ExtractedTextNode[] {
  const textNodes: ExtractedTextNode[] = []

  // Build style ID to name mapping
  const styleIdToName = new Map<string, string>()
  if (file.styles) {
    for (const [styleId, styleMetadata] of Object.entries(file.styles)) {
      if (styleMetadata.styleType === 'TEXT') {
        styleIdToName.set(styleId, styleMetadata.name)
      }
    }
  }

  function traverse(
    node: FigmaNode,
    pageId: string,
    pageName: string,
    parentFrame?: { id: string; name: string; x: number; y: number; width: number; height: number }
  ): void {
    // Track current frame context - only set it once (top-level artboard)
    let currentFrame = parentFrame

    // Only set frame context if we don't already have one (this captures the top-level artboard)
    if (
      !currentFrame &&
      (node.type === 'FRAME' ||
        node.type === 'COMPONENT' ||
        node.type === 'INSTANCE' ||
        node.type === 'COMPONENT_SET')
    ) {
      const frameBounds = node.absoluteBoundingBox
      currentFrame = {
        id: node.id,
        name: node.name,
        x: frameBounds?.x ?? 0,
        y: frameBounds?.y ?? 0,
        width: frameBounds?.width ?? 0,
        height: frameBounds?.height ?? 0,
      }
    }

    // Extract text nodes
    if (node.type === 'TEXT' && node.characters) {
      const bounds = node.absoluteBoundingBox
      if (bounds) {
        // Look up the text style name from the style ID
        const styleId = node.styles?.text
        const styleName = styleId ? styleIdToName.get(styleId) ?? null : null

        textNodes.push({
          id: node.id,
          pageId,
          pageName,
          frameId: currentFrame?.id ?? null,
          frameName: currentFrame?.name ?? null,
          frameX: currentFrame?.x ?? null,
          frameY: currentFrame?.y ?? null,
          frameWidth: currentFrame?.width ?? null,
          frameHeight: currentFrame?.height ?? null,
          content: node.characters,
          fontSize: node.style?.fontSize ?? 14,
          styleName,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        })
      }
    }

    // Recurse with updated frame context
    if (node.children) {
      for (const child of node.children) {
        traverse(child, pageId, pageName, currentFrame)
      }
    }
  }

  // The document's direct children are pages
  const pages = file.document.children ?? []

  // Filter pages if sourcePageIds is provided
  const pagesToProcess =
    sourcePageIds && sourcePageIds.length > 0
      ? pages.filter((page) => sourcePageIds.includes(page.id))
      : pages

  for (const page of pagesToProcess) {
    traverse(page, page.id, page.name)
  }

  return textNodes
}
