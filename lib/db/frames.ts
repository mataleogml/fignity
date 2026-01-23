import { db } from '@/lib/db'
import type { Frame } from '@/lib/types'

export function getFrame(id: string): Frame | null {
  const stmt = db.prepare('SELECT * FROM frames WHERE id = ?')
  return stmt.get(id) as Frame | null
}

export function getFramesByProject(projectId: string): Frame[] {
  const stmt = db.prepare(`
    SELECT * FROM frames
    WHERE project_id = ?
    ORDER BY y, x
  `)
  return stmt.all(projectId) as Frame[]
}

export function upsertFrame(frame: Omit<Frame, 'created_at'>): void {
  const stmt = db.prepare(`
    INSERT INTO frames (
      id, project_id, name, image_url, x, y, width, height, last_synced, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      name = excluded.name,
      image_url = excluded.image_url,
      x = excluded.x,
      y = excluded.y,
      width = excluded.width,
      height = excluded.height,
      last_synced = excluded.last_synced
  `)

  stmt.run(
    frame.id,
    frame.project_id,
    frame.name,
    frame.image_url,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    frame.last_synced,
    Date.now()
  )
}

export function deleteFramesByProject(projectId: string): void {
  db.prepare('DELETE FROM frames WHERE project_id = ?').run(projectId)
}
