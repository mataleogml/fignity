import { db } from '@/lib/db'
import type { TextBlock } from '@/lib/types'

export function getTextBlock(id: string): TextBlock | null {
  const stmt = db.prepare('SELECT * FROM text_blocks WHERE id = ?')
  return stmt.get(id) as TextBlock | null
}

export function getAllTextBlocks(): TextBlock[] {
  const stmt = db.prepare('SELECT * FROM text_blocks ORDER BY page_name, last_modified DESC')
  return stmt.all() as TextBlock[]
}

export function getTextBlocksSince(timestamp: number): TextBlock[] {
  const stmt = db.prepare(`
    SELECT * FROM text_blocks
    WHERE last_modified >= ?
    ORDER BY page_name, last_modified DESC
  `)
  return stmt.all(timestamp) as TextBlock[]
}

export function upsertTextBlock(block: Omit<TextBlock, 'created_at'>): void {
  const stmt = db.prepare(`
    INSERT INTO text_blocks (id, page_id, page_name, content, style, x, y, width, height, content_hash, last_modified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      page_id = excluded.page_id,
      page_name = excluded.page_name,
      content = excluded.content,
      style = excluded.style,
      x = excluded.x,
      y = excluded.y,
      width = excluded.width,
      height = excluded.height,
      content_hash = excluded.content_hash,
      last_modified = excluded.last_modified
  `)

  stmt.run(
    block.id,
    block.page_id,
    block.page_name,
    block.content,
    block.style,
    block.x,
    block.y,
    block.width,
    block.height,
    block.content_hash,
    block.last_modified,
    Date.now()
  )
}

export function getTextBlockCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM text_blocks')
  const row = stmt.get() as { count: number }
  return row.count
}
