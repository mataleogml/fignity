import { db } from '@/lib/db'
import type { Project } from '@/lib/types'
import { randomUUID } from 'crypto'

/**
 * Check if database needs migration from v1 (single-project) to v2 (multi-project)
 */
export function needsMigration(): boolean {
  // Check if projects table exists
  const result = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='projects'`
    )
    .get() as { name: string } | undefined

  return !result // If projects table doesn't exist, we need to migrate
}

/**
 * Migrate from v1 (single-project) to v2 (multi-project) schema
 */
export function migrateToMultiProject(): void {
  console.log('[Migration] Starting v1 → v2 migration...')

  // Start transaction
  db.exec('BEGIN TRANSACTION')

  try {
    // 1. Create projects table
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        figma_file_key TEXT NOT NULL,
        figma_token TEXT NOT NULL,
        included_components TEXT NOT NULL DEFAULT '[]',
        last_sync INTEGER,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);
    `)

    // 2. Read existing settings
    const settings = db
      .prepare('SELECT key, value FROM settings')
      .all() as Array<{ key: string; value: string }>

    const settingsMap = settings.reduce(
      (acc, { key, value }) => {
        acc[key] = value
        return acc
      },
      {} as Record<string, string>
    )

    const projectName = settingsMap.project_name || 'Default Project'
    const figmaFileKey = settingsMap.figma_file_key || ''
    const figmaToken = settingsMap.figma_token || ''
    const lastSync = settingsMap.last_sync
      ? parseInt(settingsMap.last_sync)
      : null

    // 3. Create default project (only if we have credentials)
    let defaultProjectId: string | null = null

    if (figmaFileKey && figmaToken) {
      defaultProjectId = randomUUID()
      const now = Date.now()

      db.prepare(
        `INSERT INTO projects (id, name, figma_file_key, figma_token, included_components, last_sync, archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
      ).run(
        defaultProjectId,
        projectName,
        figmaFileKey,
        figmaToken,
        '[]', // No component filtering by default
        lastSync,
        now,
        now
      )

      console.log('[Migration] Created default project:', defaultProjectId)
    }

    // 4. Add new columns to text_blocks table if they don't exist
    const textBlocksInfo = db
      .prepare(`PRAGMA table_info(text_blocks)`)
      .all() as Array<{ name: string }>

    const existingColumns = new Set(textBlocksInfo.map((col) => col.name))

    if (!existingColumns.has('project_id')) {
      db.exec(`ALTER TABLE text_blocks ADD COLUMN project_id TEXT`)
      console.log('[Migration] Added project_id column to text_blocks')
    }

    if (!existingColumns.has('frame_id')) {
      db.exec(`ALTER TABLE text_blocks ADD COLUMN frame_id TEXT`)
      console.log('[Migration] Added frame_id column to text_blocks')
    }

    if (!existingColumns.has('frame_name')) {
      db.exec(`ALTER TABLE text_blocks ADD COLUMN frame_name TEXT`)
      console.log('[Migration] Added frame_name column to text_blocks')
    }

    // 5. Update existing text_blocks with default project_id
    if (defaultProjectId) {
      const updateResult = db
        .prepare(
          `UPDATE text_blocks SET project_id = ? WHERE project_id IS NULL`
        )
        .run(defaultProjectId)

      console.log(
        `[Migration] Assigned ${updateResult.changes} text blocks to default project`
      )
    }

    // 6. Create indexes for new columns
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_text_blocks_project_id ON text_blocks(project_id);
      CREATE INDEX IF NOT EXISTS idx_text_blocks_frame_id ON text_blocks(frame_id);
    `)

    // 7. Mark migration complete
    db.prepare(
      `INSERT OR REPLACE INTO settings (key, value, created_at, updated_at)
       VALUES ('schema_version', '2', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000)`
    ).run()

    // Commit transaction
    db.exec('COMMIT')

    console.log('[Migration] Successfully migrated to v2 schema')
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK')
    console.error('[Migration] Failed to migrate:', error)
    throw error
  }
}
