import fs from 'fs'
import path from 'path'
import { BrowserWindow } from 'electron'

export interface ScannedFile {
  name: string
  path: string
  extension: string
  size: number
  modifiedAt: number
  isHidden: boolean
}

export interface ScanOptions {
  includeSubfolders: boolean
  excludeHidden: boolean
  excludeSystem: boolean
  excludedExtensions: string[]
  excludedFolders: string[]
  minFileSize: number | null
  maxFileSize: number | null
}

const SYSTEM_FOLDERS = [
  '$recycle.bin',
  'system volume information',
  'windows',
  'program files',
  'program files (x86)',
  'programdata',
  'node_modules',
  '.git',
  '__pycache__',
]

export async function scanFolder(
  folderPath: string,
  options: ScanOptions,
  window: BrowserWindow
): Promise<ScannedFile[]> {
  const files: ScannedFile[] = []
  let totalFound = 0

  async function walk(dir: string): Promise<void> {
    let entries: fs.Dirent[]
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true })
    } catch {
      return // Skip inaccessible directories
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        const dirNameLower = entry.name.toLowerCase()

        // Skip excluded folders
        if (options.excludedFolders.some(f => dirNameLower === f.toLowerCase())) continue
        if (SYSTEM_FOLDERS.includes(dirNameLower)) continue

        if (options.includeSubfolders) {
          await walk(fullPath)
        }
      } else if (entry.isFile()) {
        try {
          const ext = path.extname(entry.name).toLowerCase()

          // Apply filters
          if (options.excludeHidden && entry.name.startsWith('.')) continue
          if (options.excludedExtensions.includes(ext)) continue

          const stat = await fs.promises.stat(fullPath)

          if (options.minFileSize !== null && stat.size < options.minFileSize) continue
          if (options.maxFileSize !== null && stat.size > options.maxFileSize) continue

          const fileInfo: ScannedFile = {
            name: entry.name,
            path: fullPath,
            extension: ext,
            size: stat.size,
            modifiedAt: stat.mtimeMs,
            isHidden: entry.name.startsWith('.'),
          }

          files.push(fileInfo)
          totalFound++

          // Report progress every 50 files
          if (totalFound % 50 === 0) {
            window.webContents.send('scan-progress', {
              current: totalFound,
              total: 0,
              percentage: -1,
              currentFile: entry.name,
            })
          }
        } catch {
          // Skip files we can't stat
        }
      }
    }
  }

  await walk(folderPath)

  // Send final progress
  window.webContents.send('scan-progress', {
    current: totalFound,
    total: totalFound,
    percentage: 100,
    currentFile: '',
  })

  return files
}
