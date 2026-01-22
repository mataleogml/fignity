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

export function upsertTextBlock(block: Omit<TextBlock, 'created_at'>): void {
  const stmt = db.prepare(`
    INSERT INTO text_blocks (
      id, project_id, page_id, page_name, frame_id, frame_name, frame_x, frame_y, frame_width, frame_height,
      content, style, font_size, x, y, width, height, content_hash, last_modified, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      page_id = excluded.page_id,
      page_name = excluded.page_name,
      frame_id = excluded.frame_id,
      frame_name = excluded.frame_name,
      frame_x = excluded.frame_x,
      frame_y = excluded.frame_y,
      frame_width = excluded.frame_width,
      frame_height = excluded.frame_height,
      content = excluded.content,
      style = excluded.style,
      font_size = excluded.font_size,
      x = excluded.x,
      y = excluded.y,
      width = excluded.width,
      height = excluded.height,
      content_hash = excluded.content_hash,
      last_modified = excluded.last_modified
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
    Date.now()
  )
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
