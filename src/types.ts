export interface FileInfo {
  name: string
  path: string
  extension: string
  size: number
  modifiedAt: number
  category: string
  destinationFolder: string
}

export interface CategoryDef {
  id: string
  name: string
  extensions: string[]
  folder: string
  isCustom?: boolean
}

export interface ScanResult {
  files: FileInfo[]
  totalSize: number
  totalFiles: number
  allFilesCount: number
  categoryCounts: Record<string, number>
  categorySizes: Record<string, number>
  error?: string
}

export interface OrganizeResult {
  operationId: string
  timestamp: number
  sourcePath: string
  successful: FileMove[]
  failed: FileMoveError[]
  skipped: FileMove[]
}

export interface FileMove {
  name: string
  from: string
  to: string
  size: number
  category: string
}

export interface FileMoveError extends FileMove {
  error: string
}

export interface ActivityEntry {
  id: string
  timestamp: number
  sourcePath: string
  totalFiles: number
  successful: number
  failed: number
  skipped: number
  details: OrganizeResult
  undone?: boolean
}

export interface SmartRule {
  id: string
  enabled: boolean
  condition: {
    type: string
    value: string
  }
  destination: string
  priority: number
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  startWithWindows: boolean
  minimizeToTray: boolean
  confirmBeforeOrganizing: boolean
  showNotifications: boolean
  organizationMode: 'move' | 'copy'
  includeSubfolders: boolean
  autoCreateFolders: boolean
  duplicateHandling: 'skip' | 'replace' | 'rename'
  protectSystemFolders: boolean
  protectHiddenFiles: boolean
  confirmBulkOperation: boolean
  excludeHiddenFiles: boolean
  excludeSystemFiles: boolean
  excludedExtensions: string[]
  excludedFolders: string[]
  minFileSize: number | null
  maxFileSize: number | null
  autoOrganize: {
    enabled: boolean
    folders: string[]
    interval: 'startup' | '15min' | '1hour' | 'daily'
  }
}

export interface Statistics {
  totalFilesOrganized: number
  totalSizeOrganized: number
  categoryCounts: Record<string, number>
}

export interface ScanProgress {
  current: number
  total: number
  percentage: number
  currentFile: string
}

export interface OrganizeProgress {
  current: number
  total: number
  percentage: number
  currentFile: string
  successful: number
  failed: number
  skipped: number
}

// Augment global Window for the fileflow API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileflow: Record<string, (...args: any[]) => any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileFlow: Record<string, (...args: any[]) => any>
  }
}
