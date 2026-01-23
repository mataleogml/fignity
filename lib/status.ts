import type { TextBlock, ChangeStatus, ProjectStatus, FrameWithStatus, Frame } from './types'

/**
 * Compute frame status based on its text blocks
 */
export function computeFrameStatus(
  frame: Frame,
  textBlocks: TextBlock[]
): FrameWithStatus {
  const frameBlocks = textBlocks.filter((b) => b.frame_id === frame.id)

  const hasPending = frameBlocks.some((b) => b.change_status === 'pending')
  const hasAccepted = frameBlocks.some((b) => b.change_status === 'accepted')

  const pendingChangesCount = frameBlocks.filter(
    (b) => b.change_status === 'pending'
  ).length

  let status: ChangeStatus = 'clean'
  if (hasPending) {
    status = 'pending'
  } else if (hasAccepted) {
    status = 'accepted'
  }

  return {
    ...frame,
    status,
    pendingChangesCount,
  }
}

/**
 * Compute project status based on text blocks and last export time
 */
export function computeProjectStatus(
  textBlocks: TextBlock[],
  lastExport: number | null
): ProjectStatus {
  const hasPending = textBlocks.some((b) => b.change_status === 'pending')
  const hasAccepted = textBlocks.some((b) => b.change_status === 'accepted')

  if (hasPending) {
    return 'pending'
  }

  if (hasAccepted && (!lastExport || textBlocks.some((b) => b.change_accepted_at && b.change_accepted_at > lastExport))) {
    return 'needs_export'
  }

  return 'clean'
}

/**
 * Get list of changes for a text block
 */
export function getTextBlockChanges(block: TextBlock) {
  const changes: Array<{
    type: 'content' | 'style' | 'position' | 'size'
    label: string
    oldValue: string
    newValue: string
  }> = []

  if (
    block.previous_content !== null &&
    block.previous_content !== block.content
  ) {
    changes.push({
      type: 'content',
      label: 'Content',
      oldValue: block.previous_content,
      newValue: block.content,
    })
  }

  if (block.previous_style !== null && block.previous_style !== block.style) {
    changes.push({
      type: 'style',
      label: 'Style',
      oldValue: block.previous_style,
      newValue: block.style,
    })
  }

  if (
    block.previous_x !== null &&
    block.previous_y !== null &&
    (block.previous_x !== block.x || block.previous_y !== block.y)
  ) {
    changes.push({
      type: 'position',
      label: 'Position',
      oldValue: `(${block.previous_x.toFixed(0)}, ${block.previous_y.toFixed(0)})`,
      newValue: `(${block.x.toFixed(0)}, ${block.y.toFixed(0)})`,
    })
  }

  if (
    block.previous_width !== null &&
    block.previous_height !== null &&
    (block.previous_width !== block.width ||
      block.previous_height !== block.height)
  ) {
    changes.push({
      type: 'size',
      label: 'Size',
      oldValue: `${block.previous_width.toFixed(0)}×${block.previous_height.toFixed(0)}`,
      newValue: `${block.width.toFixed(0)}×${block.height.toFixed(0)}`,
    })
  }

  return changes
}
