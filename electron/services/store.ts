import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export class Store {
  private dataDir: string

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data')
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.dataDir, `${key}.json`)
  }

  get<T>(key: string, defaultValue: T): T {
    const filePath = this.getFilePath(key)
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(data) as T
      }
    } catch (e) {
      console.error(`Error reading store key "${key}":`, e)
    }
    return defaultValue
  }

  set<T>(key: string, value: T): void {
    const filePath = this.getFilePath(key)
    try {
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
    } catch (e) {
      console.error(`Error writing store key "${key}":`, e)
    }
  }

  delete(key: string): void {
    const filePath = this.getFilePath(key)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (e) {
      console.error(`Error deleting store key "${key}":`, e)
    }
  }
}
