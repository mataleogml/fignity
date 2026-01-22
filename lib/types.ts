// Settings types
export interface Setting {
  key: string
  value: string
  created_at: number
  updated_at: number
}

export type SettingsMap = {
  figma_token?: string
  figma_file_key?: string
  project_name?: string
  last_sync?: string
}

// Text block types
export interface TextBlock {
  id: string
  page_id: string
  page_name: string
  content: string
  style: string
  x: number
  y: number
  width: number
  height: number
  content_hash: string
  last_modified: number
  created_at: number
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
