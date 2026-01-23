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

// Project status: clean (all accepted), pending (has unaccepted changes), needs_export (accepted changes not exported)
export type ProjectStatus = 'clean' | 'pending' | 'needs_export'

// Project types
export interface Project {
  id: string
  name: string
  figma_file_key: string
  figma_token: string
  included_components: string // JSON array of component IDs to include
  source_page_ids: string // JSON array of Figma page IDs to sync
  last_sync: number | null
  last_export: number | null
  archived: boolean
  created_at: number
  updated_at: number
}

// Figma page info (organizational pages from sidebar)
export interface FigmaPageInfo {
  id: string
  name: string
}

// Change status for text blocks and frames
export type ChangeStatus = 'clean' | 'pending' | 'accepted'

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
  change_status: ChangeStatus
  previous_content: string | null
  previous_style: string | null
  previous_x: number | null
  previous_y: number | null
  previous_width: number | null
  previous_height: number | null
  previous_content_hash: string | null
  change_detected_at: number | null
  change_accepted_at: number | null
}

// Change information for displaying diffs
export interface TextBlockChange {
  type: 'content' | 'style' | 'position' | 'size'
  label: string
  oldValue: string
  newValue: string
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

// Frame status computed from its text blocks
export interface FrameWithStatus extends Frame {
  status: ChangeStatus
  pendingChangesCount: number
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
  styles?: {
    text?: string // Text style ID reference
  }
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

export interface FigmaStyleMetadata {
  key: string
  name: string
  styleType: string
  description?: string
}

export interface FigmaFile {
  name: string
  document: FigmaNode
  styles?: Record<string, FigmaStyleMetadata>
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
