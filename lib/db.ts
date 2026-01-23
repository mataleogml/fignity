import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { needsMigration, migrateToMultiProject } from './db/migration'

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'fignity.db')
const db = new Database(dbPath)

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL')

// Initialize base schema (v1)
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

// Run migration if needed (v1 → v2)
if (needsMigration()) {
  migrateToMultiProject()
}

// Create frames table for storing frame images (v3 schema addition)
db.exec(`
  CREATE TABLE IF NOT EXISTS frames (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    last_synced INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_frames_project_id ON frames(project_id);
  CREATE INDEX IF NOT EXISTS idx_frames_last_synced ON frames(last_synced);
`)

// Add change tracking columns to text_blocks table
try {
  db.exec(`
    ALTER TABLE text_blocks ADD COLUMN change_status TEXT DEFAULT 'clean';
  `)
} catch (e) {
  // Column might already exist, ignore error
}

try {
  db.exec(`
    ALTER TABLE text_blocks ADD COLUMN previous_content TEXT;
    ALTER TABLE text_blocks ADD COLUMN previous_style TEXT;
    ALTER TABLE text_blocks ADD COLUMN previous_x REAL;
    ALTER TABLE text_blocks ADD COLUMN previous_y REAL;
    ALTER TABLE text_blocks ADD COLUMN previous_width REAL;
    ALTER TABLE text_blocks ADD COLUMN previous_height REAL;
    ALTER TABLE text_blocks ADD COLUMN previous_content_hash TEXT;
    ALTER TABLE text_blocks ADD COLUMN change_detected_at INTEGER;
    ALTER TABLE text_blocks ADD COLUMN change_accepted_at INTEGER;
  `)
} catch (e) {
  // Columns might already exist, ignore error
}

// Create index for change status queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_text_blocks_change_status ON text_blocks(change_status);
`)

// Add last_export to projects table
try {
  db.exec(`
    ALTER TABLE projects ADD COLUMN last_export INTEGER;
  `)
} catch (e) {
  // Column might already exist, ignore error
}

export { db }
