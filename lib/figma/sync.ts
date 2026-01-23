import { fetchFigmaFile, extractTextNodes, fetchFrameImages } from './client'
import { mapFontSizeToStyle } from './style-mapper'
import { generateContentHash } from '@/lib/hash'
import { getTextBlock, upsertTextBlock } from '@/lib/db/text-blocks'
import { getProject, updateProject } from '@/lib/db/projects'
import { upsertFrame } from '@/lib/db/frames'
import type { SyncResult } from '@/lib/types'

/**
 * Sync text blocks from Figma for a specific project
 */
export async function syncFromFigma(projectId: string): Promise<SyncResult> {
  // Get project credentials
  const project = getProject(projectId)
  if (!project) {
    throw new Error(`Project not found: ${projectId}`)
  }

  // Fetch the Figma file
  const file = await fetchFigmaFile(project.figma_file_key, project.figma_token)

  // Parse source page IDs
  let sourcePageIds: string[] = []
  try {
    sourcePageIds = JSON.parse(project.source_page_ids)
  } catch {
    sourcePageIds = []
  }

  // Extract all TEXT nodes (with frame tracking and page filtering)
  const allTextNodes = extractTextNodes(file, sourcePageIds)

  // Filter based on included_components
  let includedComponentIds: string[]
  try {
    includedComponentIds = JSON.parse(project.included_components)
  } catch {
    includedComponentIds = []
  }

  // If no specific components are included, include all
  const textNodes =
    includedComponentIds.length === 0
      ? allTextNodes
      : allTextNodes.filter(
          (node) =>
            node.frameId === null || includedComponentIds.includes(node.frameId)
        )

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
        project_id: projectId,
        page_id: node.pageId,
        page_name: node.pageName,
        frame_id: node.frameId,
        frame_name: node.frameName,
        frame_x: node.frameX,
        frame_y: node.frameY,
        frame_width: node.frameWidth,
        frame_height: node.frameHeight,
        content: node.content,
        style,
        font_size: node.fontSize,
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
        project_id: projectId,
        page_id: node.pageId,
        page_name: node.pageName,
        frame_id: node.frameId,
        frame_name: node.frameName,
        frame_x: node.frameX,
        frame_y: node.frameY,
        frame_width: node.frameWidth,
        frame_height: node.frameHeight,
        content: node.content,
        style,
        font_size: node.fontSize,
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

  // Extract unique frames and fetch images for all of them
  const uniqueFrames = new Map<string, { id: string; name: string; x: number; y: number; width: number; height: number }>()

  for (const node of textNodes) {
    if (node.frameId && !uniqueFrames.has(node.frameId)) {
      uniqueFrames.set(node.frameId, {
        id: node.frameId,
        name: node.frameName ?? 'Unnamed Frame',
        x: node.frameX ?? 0,
        y: node.frameY ?? 0,
        width: node.frameWidth ?? 0,
        height: node.frameHeight ?? 0,
      })
    }
  }

  // Fetch frame images from Figma (always fetch fresh images on sync)
  const frameIds = Array.from(uniqueFrames.keys())
  const frameImages = frameIds.length > 0
    ? await fetchFrameImages(project.figma_file_key, project.figma_token, frameIds)
    : {}

  // Store frame metadata and images
  for (const [frameId, frameData] of uniqueFrames) {
    upsertFrame({
      id: frameId,
      project_id: projectId,
      name: frameData.name,
      image_url: frameImages[frameId] ?? null,
      x: frameData.x,
      y: frameData.y,
      width: frameData.width,
      height: frameData.height,
      last_synced: timestamp,
    })
  }

  // Update last sync timestamp on project
  updateProject(projectId, { lastSync: timestamp })

  return {
    total: textNodes.length,
    new: newCount,
    updated: updatedCount,
    unchanged: unchangedCount,
    timestamp,
  }
}
