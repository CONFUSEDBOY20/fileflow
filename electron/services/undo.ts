import fs from 'fs'
import path from 'path'
import { Store } from './store'

interface UndoEntry {
  operationId: string
  timestamp: number
  sourcePath: string
  moves: Array<{
    from: string
    to: string
  }>
}

export class UndoService {
  private store: Store

  constructor(store: Store) {
    this.store = store
  }

  saveOperation(
    operationId: string,
    sourcePath: string,
    moves: Array<{ from: string; to: string }>
  ): void {
    const history = this.store.get<UndoEntry[]>('undo-history', [])
    history.unshift({
      operationId,
      timestamp: Date.now(),
      sourcePath,
      moves,
    })
    // Keep last 50 operations
    if (history.length > 50) {
      history.length = 50
    }
    this.store.set('undo-history', history)
  }

  async undoOperation(
    operationId: string
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const history = this.store.get<UndoEntry[]>('undo-history', [])
    const entry = history.find(h => h.operationId === operationId)

    if (!entry) {
      return { successful: 0, failed: 0, errors: ['Operation not found in history'] }
    }

    let successful = 0
    let failed = 0
    const errors: string[] = []

    for (const move of entry.moves) {
      try {
        if (!fs.existsSync(move.to)) {
          errors.push(`File not found: ${path.basename(move.to)}`)
          failed++
          continue
        }

        // Ensure original directory exists
        const origDir = path.dirname(move.from)
        if (!fs.existsSync(origDir)) {
          await fs.promises.mkdir(origDir, { recursive: true })
        }

        try {
          await fs.promises.rename(move.to, move.from)
        } catch (renameErr: any) {
          if (renameErr.code === 'EXDEV') {
            await fs.promises.copyFile(move.to, move.from)
            await fs.promises.unlink(move.to)
          } else {
            throw renameErr
          }
        }
        successful++
      } catch (err: any) {
        errors.push(`Failed to restore ${path.basename(move.to)}: ${err.message}`)
        failed++
      }
    }

    // Clean up empty category folders
    const foldersToCheck = new Set(entry.moves.map(m => path.dirname(m.to)))
    for (const folder of foldersToCheck) {
      try {
        const contents = await fs.promises.readdir(folder)
        if (contents.length === 0) {
          await fs.promises.rmdir(folder)
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    // Remove from undo history
    const idx = history.findIndex(h => h.operationId === operationId)
    if (idx !== -1) {
      history.splice(idx, 1)
      this.store.set('undo-history', history)
    }

    return { successful, failed, errors }
  }

  getHistory(): UndoEntry[] {
    return this.store.get<UndoEntry[]>('undo-history', [])
  }
}
