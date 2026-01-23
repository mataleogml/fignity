import { db } from '@/lib/db'
import type { Project } from '@/lib/types'
import { randomUUID } from 'crypto'

/**
 * Get a single project by ID
 */
export function getProject(id: string): Project | null {
  const row = db
    .prepare(
      `SELECT * FROM projects WHERE id = ? AND archived = 0`
    )
    .get(id) as
    | {
        id: string
        name: string
        figma_file_key: string
        figma_token: string
        included_components: string
        source_page_ids: string
        last_sync: number | null
        last_export: number | null
        archived: number
        created_at: number
        updated_at: number
      }
    | undefined

  if (!row) return null

  return {
    ...row,
    archived: Boolean(row.archived),
  }
}

/**
 * Get all non-archived projects
 */
export function getAllProjects(): Project[] {
  const rows = db
    .prepare(
      `SELECT * FROM projects WHERE archived = 0 ORDER BY updated_at DESC`
    )
    .all() as Array<{
    id: string
    name: string
    figma_file_key: string
    figma_token: string
    included_components: string
    source_page_ids: string
    last_sync: number | null
    last_export: number | null
    archived: number
    created_at: number
    updated_at: number
  }>

  return rows.map((row) => ({
    ...row,
    archived: Boolean(row.archived),
  }))
}

/**
 * Get all projects including archived
 */
export function getAllProjectsIncludingArchived(): Project[] {
  const rows = db
    .prepare(`SELECT * FROM projects ORDER BY updated_at DESC`)
    .all() as Array<{
    id: string
    name: string
    figma_file_key: string
    figma_token: string
    included_components: string
    source_page_ids: string
    last_sync: number | null
    last_export: number | null
    archived: number
    created_at: number
    updated_at: number
  }>

  return rows.map((row) => ({
    ...row,
    archived: Boolean(row.archived),
  }))
}

/**
 * Create a new project
 */
export function createProject(data: {
  name: string
  figmaFileKey: string
  figmaToken: string
  includedComponents?: string[]
  sourcePageIds?: string[]
}): Project {
  const id = randomUUID()
  const now = Date.now()
  const includedComponents = JSON.stringify(data.includedComponents || [])
  const sourcePageIds = JSON.stringify(data.sourcePageIds || [])

  db.prepare(
    `INSERT INTO projects (id, name, figma_file_key, figma_token, included_components, source_page_ids, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(id, data.name, data.figmaFileKey, data.figmaToken, includedComponents, sourcePageIds, now, now)

  return {
    id,
    name: data.name,
    figma_file_key: data.figmaFileKey,
    figma_token: data.figmaToken,
    included_components: includedComponents,
    source_page_ids: sourcePageIds,
    last_sync: null,
    last_export: null,
    archived: false,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Update an existing project
 */
export function updateProject(
  id: string,
  data: Partial<{
    name: string
    figmaFileKey: string
    figmaToken: string
    includedComponents: string[]
    sourcePageIds: string[]
    lastSync: number | null
    lastExport: number | null
  }>
): Project | null {
  const existing = getProject(id)
  if (!existing) return null

  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }

  if (data.figmaFileKey !== undefined) {
    updates.push('figma_file_key = ?')
    values.push(data.figmaFileKey)
  }

  if (data.figmaToken !== undefined) {
    updates.push('figma_token = ?')
    values.push(data.figmaToken)
  }

  if (data.includedComponents !== undefined) {
    updates.push('included_components = ?')
    values.push(JSON.stringify(data.includedComponents))
  }

  if (data.sourcePageIds !== undefined) {
    updates.push('source_page_ids = ?')
    values.push(JSON.stringify(data.sourcePageIds))
  }

  if (data.lastSync !== undefined) {
    updates.push('last_sync = ?')
    values.push(data.lastSync)
  }

  if (data.lastExport !== undefined) {
    updates.push('last_export = ?')
    values.push(data.lastExport)
  }

  if (updates.length === 0) {
    return existing
  }

  updates.push('updated_at = ?')
  values.push(Date.now())

  values.push(id)

  db.prepare(
    `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`
  ).run(...values)

  return getProject(id)
}

/**
 * Soft delete a project (mark as archived)
 */
export function archiveProject(id: string): void {
  db.prepare(`UPDATE projects SET archived = 1, updated_at = ? WHERE id = ?`).run(
    Date.now(),
    id
  )
}

/**
 * Restore an archived project
 */
export function restoreProject(id: string): void {
  db.prepare(`UPDATE projects SET archived = 0, updated_at = ? WHERE id = ?`).run(
    Date.now(),
    id
  )
}

/**
 * Hard delete a project and all associated text blocks
 */
export function deleteProject(id: string): void {
  db.transaction(() => {
    db.prepare(`DELETE FROM text_blocks WHERE project_id = ?`).run(id)
    db.prepare(`DELETE FROM projects WHERE id = ?`).run(id)
  })()
}

/**
 * Check if any projects exist
 */
export function hasAnyProjects(): boolean {
  const result = db
    .prepare(`SELECT COUNT(*) as count FROM projects WHERE archived = 0`)
    .get() as { count: number }

  return result.count > 0
}
