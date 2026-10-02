import fs from 'fs'
import path from 'path'
import { BrowserWindow } from 'electron'

export interface OrganizePlan {
  sourcePath: string
  mode: 'move' | 'copy'
  duplicateHandling: 'skip' | 'replace' | 'rename'
  items: OrganizeItem[]
}

export interface OrganizeItem {
  name: string
  sourcePath: string
  category: string
  destinationFolder: string
}

export interface MoveResult {
  name: string
  from: string
  to: string
  size: number
  category: string
}

export interface MoveError extends MoveResult {
  error: string
}

export interface OrganizeResult {
  operationId: string
  timestamp: number
  sourcePath: string
  successful: MoveResult[]
  failed: MoveError[]
  skipped: MoveResult[]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function getUniqueFileName(destDir: string, fileName: string): string {
  const ext = path.extname(fileName)
  const base = path.basename(fileName, ext)
  let counter = 1
  let newName = fileName

  while (fs.existsSync(path.join(destDir, newName))) {
    newName = `${base} (${counter})${ext}`
    counter++
  }

  return newName
}

export async function organizeFiles(
  plan: OrganizePlan,
  window: BrowserWindow
): Promise<OrganizeResult> {
  const result: OrganizeResult = {
    operationId: generateId(),
    timestamp: Date.now(),
    sourcePath: plan.sourcePath,
    successful: [],
    failed: [],
    skipped: [],
  }

  const total = plan.items.length

  for (let i = 0; i < plan.items.length; i++) {
    const item = plan.items[i]
    const destDir = path.join(plan.sourcePath, item.destinationFolder)

    try {
      // Create destination folder if needed
      if (!fs.existsSync(destDir)) {
        await fs.promises.mkdir(destDir, { recursive: true })
      }

      // Check if file still exists
      if (!fs.existsSync(item.sourcePath)) {
        result.failed.push({
          name: item.name,
          from: item.sourcePath,
          to: path.join(destDir, item.name),
          size: 0,
          category: item.category,
          error: 'Source file no longer exists',
        })
        continue
      }

      const stat = await fs.promises.stat(item.sourcePath)
      let destFileName = item.name
      const initialDestPath = path.join(destDir, destFileName)

      // Don't move file to itself
      if (path.resolve(item.sourcePath) === path.resolve(initialDestPath)) {
        result.skipped.push({
          name: item.name,
          from: item.sourcePath,
          to: initialDestPath,
          size: stat.size,
          category: item.category,
        })
        continue
      }

      // Handle duplicates
      if (fs.existsSync(initialDestPath)) {
        switch (plan.duplicateHandling) {
          case 'skip':
            result.skipped.push({
              name: item.name,
              from: item.sourcePath,
              to: initialDestPath,
              size: stat.size,
              category: item.category,
            })
            continue
          case 'replace':
            break
          case 'rename':
            destFileName = getUniqueFileName(destDir, item.name)
            break
        }
      }

      const finalDest = path.join(destDir, destFileName)

      if (plan.mode === 'move') {
        try {
          await fs.promises.rename(item.sourcePath, finalDest)
        } catch (renameErr: any) {
          // Handle cross-device move: copy + delete
          if (renameErr.code === 'EXDEV') {
            await fs.promises.copyFile(item.sourcePath, finalDest)
            await fs.promises.unlink(item.sourcePath)
          } else {
            throw renameErr
          }
        }
      } else {
        await fs.promises.copyFile(item.sourcePath, finalDest)
      }

      result.successful.push({
        name: item.name,
        from: item.sourcePath,
        to: finalDest,
        size: stat.size,
        category: item.category,
      })
    } catch (err: any) {
      result.failed.push({
        name: item.name,
        from: item.sourcePath,
        to: path.join(destDir, item.name),
        size: 0,
        category: item.category,
        error: err.message || 'Unknown error',
      })
    }

    // Report progress
    window.webContents.send('organize-progress', {
      current: i + 1,
      total,
      percentage: Math.round(((i + 1) / total) * 100),
      currentFile: item.name,
      successful: result.successful.length,
      failed: result.failed.length,
      skipped: result.skipped.length,
    })
  }

  return result
}
