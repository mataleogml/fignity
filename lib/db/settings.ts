import { db } from '@/lib/db'
import type { SettingsMap } from '@/lib/types'

export function getSetting(key: string): string | null {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const row = stmt.get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function getSettings(): SettingsMap {
  const stmt = db.prepare('SELECT key, value FROM settings')
  const rows = stmt.all() as { key: string; value: string }[]

  return rows.reduce<SettingsMap>((acc, row) => ({
    ...acc,
    [row.key]: row.value,
  }), {})
}

export function setSetting(key: string, value: string): void {
  const now = Date.now()
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `)
  stmt.run(key, value, now, now)
}

export function setSettings(settings: Record<string, string>): void {
  const now = Date.now()
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `)

  const transaction = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) {
      stmt.run(key, value, now, now)
    }
  })

  transaction(Object.entries(settings))
}

export function isConfigured(): boolean {
  const token = getSetting('figma_token')
  const fileKey = getSetting('figma_file_key')
  const projectName = getSetting('project_name')

  return Boolean(token && fileKey && projectName)
}
