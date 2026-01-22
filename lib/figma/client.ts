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
  content: string
  fontSize: number
  x: number
  y: number
  width: number
  height: number
}

export function extractTextNodes(file: FigmaFile): ExtractedTextNode[] {
  const textNodes: ExtractedTextNode[] = []

  function traverse(
    node: FigmaNode,
    pageId: string,
    pageName: string
  ): void {
    if (node.type === 'TEXT' && node.characters) {
      const bounds = node.absoluteBoundingBox
      if (bounds) {
        textNodes.push({
          id: node.id,
          pageId,
          pageName,
          content: node.characters,
          fontSize: node.style?.fontSize ?? 14,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        })
      }
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child, pageId, pageName)
      }
    }
  }

  // The document's direct children are pages
  const pages = file.document.children ?? []
  for (const page of pages) {
    traverse(page, page.id, page.name)
  }

  return textNodes
}
