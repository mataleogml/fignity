// Settings types (now only app-level settings)
export interface Setting {
  key: string
  value: string
  created_at: number
  updated_at: number
}

export type SettingsMap = {
  schema_version?: string
  [key: string]: string | undefined
}

// Project types
export interface Project {
  id: string
  name: string
  figma_file_key: string
  figma_token: string
  included_components: string // JSON array of component IDs to include
  source_page_ids: string // JSON array of Figma page IDs to sync
  last_sync: number | null
  archived: boolean
  created_at: number
  updated_at: number
}

// Figma page info (organizational pages from sidebar)
export interface FigmaPageInfo {
  id: string
  name: string
}

// Text block types
export interface TextBlock {
  id: string
  project_id: string
  page_id: string
  page_name: string
  frame_id: string | null
  frame_name: string | null
  frame_x: number | null
  frame_y: number | null
  frame_width: number | null
  frame_height: number | null
  content: string
  style: string
  font_size: number
  x: number
  y: number
  width: number
  height: number
  content_hash: string
  last_modified: number
  created_at: number
}

// Frame metadata (for visual mode)
export interface Frame {
  id: string
  project_id: string
  name: string
  image_url: string | null
  x: number
  y: number
  width: number
  height: number
  last_synced: number
  created_at: number
}

// Component metadata (for inclusion/exclusion UI)
export interface ComponentInfo {
  id: string
  name: string
  type: string // 'FRAME' | 'COMPONENT' | 'INSTANCE'
  textBlockCount: number
}

// Figma API types (minimal subset needed)
export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  characters?: string
  style?: FigmaTextStyle
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface FigmaTextStyle {
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
}

export interface FigmaFile {
  name: string
  document: FigmaNode
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SyncResult {
  total: number
  new: number
  updated: number
  unchanged: number
  timestamp: number
}
