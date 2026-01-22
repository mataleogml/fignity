import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'fignity.db')
const db = new Database(dbPath)

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL')

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS text_blocks (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    page_name TEXT NOT NULL,
    content TEXT NOT NULL,
    style TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    content_hash TEXT NOT NULL,
    last_modified INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_text_blocks_page_id ON text_blocks(page_id);
  CREATE INDEX IF NOT EXISTS idx_text_blocks_last_modified ON text_blocks(last_modified);
  CREATE INDEX IF NOT EXISTS idx_text_blocks_content_hash ON text_blocks(content_hash);
`)

export { db }
