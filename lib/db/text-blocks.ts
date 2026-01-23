import { db } from '@/lib/db'
import type { TextBlock, ComponentInfo } from '@/lib/types'

export function getTextBlock(id: string): TextBlock | null {
  const stmt = db.prepare('SELECT * FROM text_blocks WHERE id = ?')
  return stmt.get(id) as TextBlock | null
}

export function getAllTextBlocks(): TextBlock[] {
  const stmt = db.prepare(
    'SELECT * FROM text_blocks ORDER BY page_name, last_modified DESC'
  )
  return stmt.all() as TextBlock[]
}

export function getTextBlocksByProject(projectId: string): TextBlock[] {
  const stmt = db.prepare(`
    SELECT * FROM text_blocks
    WHERE project_id = ?
    ORDER BY page_name, frame_name, last_modified DESC
  `)
  return stmt.all(projectId) as TextBlock[]
}

export function getTextBlocksSince(
  timestamp: number,
  projectId?: string
): TextBlock[] {
  if (projectId) {
    const stmt = db.prepare(`
      SELECT * FROM text_blocks
      WHERE last_modified >= ? AND project_id = ?
      ORDER BY page_name, last_modified DESC
    `)
    return stmt.all(timestamp, projectId) as TextBlock[]
  }

  const stmt = db.prepare(`
    SELECT * FROM text_blocks
    WHERE last_modified >= ?
    ORDER BY page_name, last_modified DESC
  `)
  return stmt.all(timestamp) as TextBlock[]
}

export function upsertTextBlock(
  block: Omit<TextBlock, 'created_at' | 'change_status' | 'previous_content' | 'previous_style' | 'previous_x' | 'previous_y' | 'previous_width' | 'previous_height' | 'previous_content_hash' | 'change_detected_at' | 'change_accepted_at'>,
  options?: {
    isNew?: boolean
    isChanged?: boolean
    previousValues?: {
      content: string
      style: string
      x: number
      y: number
      width: number
      height: number
      content_hash: string
    }
  }
): void {
  const now = Date.now()
  const isNew = options?.isNew ?? false
  const isChanged = options?.isChanged ?? false

  if (isNew) {
    // New text block - insert with 'clean' status
    const stmt = db.prepare(`
      INSERT INTO text_blocks (
        id, project_id, page_id, page_name, frame_id, frame_name, frame_x, frame_y, frame_width, frame_height,
        content, style, font_size, x, y, width, height, content_hash, last_modified,
        change_status, previous_content, previous_style, previous_x, previous_y,
        previous_width, previous_height, previous_content_hash, change_detected_at, change_accepted_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      block.id,
      block.project_id,
      block.page_id,
      block.page_name,
      block.frame_id,
      block.frame_name,
      block.frame_x,
      block.frame_y,
      block.frame_width,
      block.frame_height,
      block.content,
      block.style,
      block.font_size,
      block.x,
      block.y,
      block.width,
      block.height,
      block.content_hash,
      block.last_modified,
      'clean',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      now
    )
  } else if (isChanged && options?.previousValues) {
    // Changed text block - update and mark as pending
    const prev = options.previousValues
    const stmt = db.prepare(`
      UPDATE text_blocks SET
        project_id = ?,
        page_id = ?,
        page_name = ?,
        frame_id = ?,
        frame_name = ?,
        frame_x = ?,
        frame_y = ?,
        frame_width = ?,
        frame_height = ?,
        content = ?,
        style = ?,
        font_size = ?,
        x = ?,
        y = ?,
        width = ?,
        height = ?,
        content_hash = ?,
        last_modified = ?,
        change_status = 'pending',
        previous_content = ?,
        previous_style = ?,
        previous_x = ?,
        previous_y = ?,
        previous_width = ?,
        previous_height = ?,
        previous_content_hash = ?,
        change_detected_at = ?
      WHERE id = ?
    `)

    stmt.run(
      block.project_id,
      block.page_id,
      block.page_name,
      block.frame_id,
      block.frame_name,
      block.frame_x,
      block.frame_y,
      block.frame_width,
      block.frame_height,
      block.content,
      block.style,
      block.font_size,
      block.x,
      block.y,
      block.width,
      block.height,
      block.content_hash,
      block.last_modified,
      prev.content,
      prev.style,
      prev.x,
      prev.y,
      prev.width,
      prev.height,
      prev.content_hash,
      now,
      block.id
    )
  } else {
    // Unchanged - update only the basic fields, preserve change status
    const stmt = db.prepare(`
      UPDATE text_blocks SET
        project_id = ?,
        page_id = ?,
        page_name = ?,
        frame_id = ?,
        frame_name = ?,
        frame_x = ?,
        frame_y = ?,
        frame_width = ?,
        frame_height = ?,
        last_modified = ?
      WHERE id = ?
    `)

    stmt.run(
      block.project_id,
      block.page_id,
      block.page_name,
      block.frame_id,
      block.frame_name,
      block.frame_x,
      block.frame_y,
      block.frame_width,
      block.frame_height,
      block.last_modified,
      block.id
    )
  }
}

export function getTextBlockCount(projectId?: string): number {
  if (projectId) {
    const stmt = db.prepare(
      'SELECT COUNT(*) as count FROM text_blocks WHERE project_id = ?'
    )
    const row = stmt.get(projectId) as { count: number }
    return row.count
  }

  const stmt = db.prepare('SELECT COUNT(*) as count FROM text_blocks')
  const row = stmt.get() as { count: number }
  return row.count
}

/**
 * Get all unique components (frames) for a project
 * Used for the inclusion/exclusion UI
 */
export function getComponentsByProject(projectId: string): ComponentInfo[] {
  const stmt = db.prepare(`
    SELECT
      frame_id as id,
      frame_name as name,
      'FRAME' as type,
      COUNT(*) as textBlockCount
    FROM text_blocks
    WHERE project_id = ? AND frame_id IS NOT NULL
    GROUP BY frame_id, frame_name
    ORDER BY frame_name
  `)

  return stmt.all(projectId) as ComponentInfo[]
}

/**
 * Delete all text blocks for a project
 */
export function deleteTextBlocksByProject(projectId: string): void {
  db.prepare('DELETE FROM text_blocks WHERE project_id = ?').run(projectId)
}
