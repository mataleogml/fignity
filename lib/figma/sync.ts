import { fetchFigmaFile, extractTextNodes } from './client'
import { mapFontSizeToStyle } from './style-mapper'
import { generateContentHash } from '@/lib/hash'
import { getTextBlock, upsertTextBlock } from '@/lib/db/text-blocks'
import { setSetting } from '@/lib/db/settings'
import type { SyncResult } from '@/lib/types'

export async function syncFromFigma(
  fileKey: string,
  token: string
): Promise<SyncResult> {
  // Fetch the Figma file
  const file = await fetchFigmaFile(fileKey, token)

  // Extract all TEXT nodes
  const textNodes = extractTextNodes(file)

  let newCount = 0
  let updatedCount = 0
  let unchangedCount = 0
  const timestamp = Date.now()

  for (const node of textNodes) {
    const style = mapFontSizeToStyle(node.fontSize)
    const contentHash = generateContentHash(
      node.content,
      style,
      node.x,
      node.y
    )

    const existing = getTextBlock(node.id)

    if (!existing) {
      // New block
      upsertTextBlock({
        id: node.id,
        page_id: node.pageId,
        page_name: node.pageName,
        content: node.content,
        style,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        content_hash: contentHash,
        last_modified: timestamp,
      })
      newCount++
    } else if (existing.content_hash !== contentHash) {
      // Changed block
      upsertTextBlock({
        id: node.id,
        page_id: node.pageId,
        page_name: node.pageName,
        content: node.content,
        style,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        content_hash: contentHash,
        last_modified: timestamp,
      })
      updatedCount++
    } else {
      // Unchanged
      unchangedCount++
    }
  }

  // Update last sync timestamp
  setSetting('last_sync', timestamp.toString())

  return {
    total: textNodes.length,
    new: newCount,
    updated: updatedCount,
    unchanged: unchangedCount,
    timestamp,
  }
}
