import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Tray,
  Menu,
  nativeTheme,
  Notification,
  nativeImage,
} from 'electron'
import path from 'path'
import fs from 'fs'
import { Store } from './services/store'
import { scanFolder, ScanOptions } from './services/scanner'
import { organizeFiles, OrganizePlan } from './services/organizer'
import { UndoService } from './services/undo'
import { DEFAULT_CATEGORIES, classifyFile, Category } from './services/classifier'
import { applyRules, SmartRule } from './services/rules'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let store: Store
let undoService: UndoService
let autoOrganizeTimer: NodeJS.Timeout | null = null

function isProtectedPath(p: string): boolean {
  if (!p) return true
  const normalized = path.resolve(p).toLowerCase().replace(/[\\/]+$/, '')
  // Protect drive root e.g. "c:" or "c:\"
  if (/^[a-z]:$/.test(normalized) || /^[a-z]:\\$/.test(normalized)) {
    return true
  }
  const protectedRoots = [
    'c:\\windows',
    'c:\\program files',
    'c:\\program files (x86)',
    'c:\\programdata',
  ]
  return protectedRoots.some(
    prot => normalized === prot || normalized.startsWith(prot + '\\')
  )
}

function getAppIcon(): string | null {
  const possiblePaths = [
    path.join(__dirname, '../dist/icon.png'),
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, 'icon.png'),
    path.join(process.resourcesPath, 'icon.png'),
    path.join(app.getAppPath(), 'public/icon.png'),
    path.join(app.getAppPath(), 'dist/icon.png'),
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function getDefaultSettings() {
  return {
    theme: 'system' as const,
    startWithWindows: false,
    minimizeToTray: true,
    confirmBeforeOrganizing: true,
    showNotifications: true,
    organizationMode: 'move' as const,
    includeSubfolders: false,
    autoCreateFolders: true,
    duplicateHandling: 'rename' as const,
    protectSystemFolders: true,
    protectHiddenFiles: true,
    confirmBulkOperation: true,
    excludeHiddenFiles: true,
    excludeSystemFiles: true,
    excludedExtensions: [] as string[],
    excludedFolders: [
      'node_modules',
      '.git',
      '__pycache__',
      '$RECYCLE.BIN',
      'System Volume Information',
    ],
    minFileSize: null as number | null,
    maxFileSize: null as number | null,
    autoOrganize: {
      enabled: false,
      folders: [] as string[],
      interval: 'daily' as const,
    },
  }
}

function createWindow() {
  const iconPath = getAppIcon()
  const icon = iconPath ? nativeImage.createFromPath(iconPath) : undefined

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'FileFlow',
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', event => {
    const settings = store.get('settings', getDefaultSettings())
    if (settings.minimizeToTray && tray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createTray() {
  try {
    const iconPath = getAppIcon()
    if (!iconPath) return

    tray = new Tray(iconPath)

    const contextMenu = Menu.buildFromTemplate([
      { label: 'FileFlow', enabled: false },
      { type: 'separator' },
      {
        label: 'Open FileFlow',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
        },
      },
      {
        label: 'Organize Downloads',
        click: () => {
          const downloadsPath = app.getPath('downloads')
          mainWindow?.show()
          mainWindow?.focus()
          mainWindow?.webContents.send('select-folder-path', downloadsPath)
        },
      },
      {
        label: 'Choose Folder',
        click: async () => {
          mainWindow?.show()
          mainWindow?.focus()
          if (mainWindow) {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
            })
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send(
                'select-folder-path',
                result.filePaths[0]
              )
            }
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
          mainWindow?.webContents.send('navigate-to', 'settings')
        },
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => {
          if (tray) {
            tray.destroy()
            tray = null
          }
          app.quit()
        },
      },
    ])

    tray.setToolTip('FileFlow — Smart File Organizer')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })
  } catch {
    // Tray creation failed — continue without it
  }
}

async function runAutoOrganizeCycle() {
  if (!mainWindow) return
  const settings = store.get('settings', getDefaultSettings())
  if (!settings.autoOrganize?.enabled || !settings.autoOrganize.folders?.length) {
    return
  }

  const categories = store.get<Category[]>('categories', DEFAULT_CATEGORIES)
  const rules = store.get<SmartRule[]>('rules', [])

  for (const folder of settings.autoOrganize.folders) {
    if (!fs.existsSync(folder) || isProtectedPath(folder)) continue

    try {
      const scanOptions: ScanOptions = {
        includeSubfolders: settings.includeSubfolders,
        excludeHidden: settings.excludeHiddenFiles,
        excludeSystem: settings.excludeSystemFiles,
        excludedExtensions: settings.excludedExtensions || [],
        excludedFolders: settings.excludedFolders || [],
        minFileSize: settings.minFileSize,
        maxFileSize: settings.maxFileSize,
      }

      const files = await scanFolder(folder, scanOptions, mainWindow)
      const classified = files.map(f => {
        const ruleResult = applyRules(f.name, f.size, rules)
        if (ruleResult) {
          return {
            name: f.name,
            sourcePath: f.path,
            category: ruleResult.destination,
            destinationFolder: ruleResult.destination,
          }
        }
        const { category, folder: destFolder } = classifyFile(f.name, categories)
        return {
          name: f.name,
          sourcePath: f.path,
          category,
          destinationFolder: destFolder,
        }
      })

      const toMove = classified.filter(f => {
        const parentDir = path.basename(path.dirname(f.sourcePath))
        return parentDir !== f.destinationFolder
      })

      if (toMove.length > 0) {
        const plan: OrganizePlan = {
          sourcePath: folder,
          mode: settings.organizationMode || 'move',
          duplicateHandling: settings.duplicateHandling || 'rename',
          items: toMove,
        }

        const result = await organizeFiles(plan, mainWindow)

        if (result.successful.length > 0 && plan.mode === 'move') {
          undoService.saveOperation(
            result.operationId,
            plan.sourcePath,
            result.successful.map(s => ({ from: s.from, to: s.to }))
          )
        }

        const activity = store.get<Record<string, unknown>[]>('activity', [])
        activity.unshift({
          id: result.operationId,
          timestamp: result.timestamp,
          sourcePath: folder,
          totalFiles: toMove.length,
          successful: result.successful.length,
          failed: result.failed.length,
          skipped: result.skipped.length,
          details: result,
          undone: false,
          isAuto: true,
        })
        if (activity.length > 100) activity.length = 100
        store.set('activity', activity)

        if (settings.showNotifications) {
          try {
            new Notification({
              title: 'FileFlow Auto-Organize',
              body: `${result.successful.length} files organized in ${path.basename(folder)}.`,
            }).show()
          } catch {
            /* ignore notification error */
          }
        }
      }
    } catch (err) {
      console.error(`Auto organize error for ${folder}:`, err)
    }
  }
}

function setupAutoOrganize() {
  if (autoOrganizeTimer) {
    clearInterval(autoOrganizeTimer)
    autoOrganizeTimer = null
  }

  const settings = store.get('settings', getDefaultSettings())
  if (!settings.autoOrganize?.enabled) return

  const intervalMap: Record<string, number> = {
    '15min': 15 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000,
  }

  // Initial check after 5s on launch
  setTimeout(() => runAutoOrganizeCycle(), 5000)

  const ms = intervalMap[settings.autoOrganize.interval]
  if (ms) {
    autoOrganizeTimer = setInterval(() => runAutoOrganizeCycle(), ms)
  }
}

function registerIpcHandlers() {
  // ── Folder selection ──────────────────────────────────────────────────
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const selectedPath = result.filePaths[0]
    const settings = store.get('settings', getDefaultSettings())

    if (settings.protectSystemFolders && isProtectedPath(selectedPath)) {
      return {
        error:
          'This is a protected system folder. Organization is blocked for safety.',
      }
    }

    return { path: selectedPath }
  })

  // ── Scan folder ───────────────────────────────────────────────────────
  ipcMain.handle(
    'scan-folder',
    async (_event, folderPath: string, options?: Partial<ScanOptions>) => {
      if (!mainWindow) {
        return {
          files: [],
          totalSize: 0,
          totalFiles: 0,
          allFilesCount: 0,
          categoryCounts: {},
          categorySizes: {},
        }
      }

      const settings = store.get('settings', getDefaultSettings())
      const opts = options || {}
      const scanOptions: ScanOptions = {
        includeSubfolders:
          opts.includeSubfolders ?? settings.includeSubfolders,
        excludeHidden: opts.excludeHidden ?? settings.excludeHiddenFiles,
        excludeSystem: opts.excludeSystem ?? settings.excludeSystemFiles,
        excludedExtensions: settings.excludedExtensions || [],
        excludedFolders: settings.excludedFolders || [],
        minFileSize: settings.minFileSize ?? null,
        maxFileSize: settings.maxFileSize ?? null,
      }

      try {
        const files = await scanFolder(folderPath, scanOptions, mainWindow)

        // Classify files
        const categories = store.get<Category[]>(
          'categories',
          DEFAULT_CATEGORIES
        )
        const rules = store.get<SmartRule[]>('rules', [])

        const classified = files.map(f => {
          // Smart rules take priority
          const ruleResult = applyRules(f.name, f.size, rules)
          if (ruleResult) {
            return {
              ...f,
              category: ruleResult.destination,
              destinationFolder: ruleResult.destination,
            }
          }
          // Fallback to category classification
          const { category, folder } = classifyFile(f.name, categories)
          return { ...f, category, destinationFolder: folder }
        })

        // Filter out files already in their category folder
        const organizable = classified.filter(f => {
          const parentDir = path.basename(path.dirname(f.path))
          return parentDir !== f.destinationFolder
        })

        const totalSize = organizable.reduce((sum, f) => sum + f.size, 0)
        const categoryCounts: Record<string, number> = {}
        const categorySizes: Record<string, number> = {}

        for (const f of organizable) {
          categoryCounts[f.category] =
            (categoryCounts[f.category] || 0) + 1
          categorySizes[f.category] =
            (categorySizes[f.category] || 0) + f.size
        }

        return {
          files: organizable,
          totalSize,
          totalFiles: organizable.length,
          allFilesCount: files.length,
          categoryCounts,
          categorySizes,
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return {
          error: message,
          files: [],
          totalSize: 0,
          totalFiles: 0,
          allFilesCount: 0,
          categoryCounts: {},
          categorySizes: {},
        }
      }
    }
  )

  // ── Organize files ────────────────────────────────────────────────────
  ipcMain.handle('organize-files', async (_event, planOrFiles: any) => {
    if (!mainWindow) return null

    const settings = store.get('settings', getDefaultSettings())
    let plan: OrganizePlan

    if (Array.isArray(planOrFiles)) {
      const first = planOrFiles[0]
      const sourcePath = first
        ? path.dirname(first.path || first.sourcePath || '')
        : ''
      plan = {
        sourcePath,
        mode: settings.organizationMode || 'move',
        duplicateHandling: settings.duplicateHandling || 'rename',
        items: planOrFiles.map((f: any) => ({
          name: f.name,
          sourcePath: f.path || f.sourcePath,
          category: f.category,
          destinationFolder: f.destinationFolder || f.category,
        })),
      }
    } else {
      plan = {
        sourcePath: planOrFiles.sourcePath || '',
        mode: planOrFiles.mode || settings.organizationMode || 'move',
        duplicateHandling:
          planOrFiles.duplicateHandling ||
          settings.duplicateHandling ||
          'rename',
        items: (planOrFiles.items || planOrFiles.files || []).map(
          (f: any) => ({
            name: f.name,
            sourcePath: f.sourcePath || f.path,
            category: f.category,
            destinationFolder: f.destinationFolder || f.category,
          })
        ),
      }
    }

    const result = await organizeFiles(plan, mainWindow)

    // Save undo info (only for move mode)
    if (result.successful.length > 0 && plan.mode === 'move') {
      undoService.saveOperation(
        result.operationId,
        plan.sourcePath,
        result.successful.map(s => ({ from: s.from, to: s.to }))
      )
    }

    // Save activity
    const activity = store.get<Record<string, unknown>[]>('activity', [])
    activity.unshift({
      id: result.operationId,
      timestamp: result.timestamp,
      sourcePath: plan.sourcePath,
      totalFiles: plan.items.length,
      successful: result.successful.length,
      failed: result.failed.length,
      skipped: result.skipped.length,
      details: result,
      undone: false,
    })
    if (activity.length > 100) activity.length = 100
    store.set('activity', activity)

    // Update statistics
    const stats = store.get('statistics', {
      totalFilesOrganized: 0,
      totalSizeOrganized: 0,
      categoryCounts: {} as Record<string, number>,
    })
    stats.totalFilesOrganized += result.successful.length
    stats.totalSizeOrganized += result.successful.reduce(
      (s, f) => s + f.size,
      0
    )
    for (const f of result.successful) {
      stats.categoryCounts[f.category] =
        (stats.categoryCounts[f.category] || 0) + 1
    }
    store.set('statistics', stats)

    // Notification
    if (settings.showNotifications) {
      try {
        new Notification({
          title: 'FileFlow',
          body:
            result.failed.length > 0
              ? `${result.successful.length} files organized. ${result.failed.length} failed.`
              : `${result.successful.length} files organized successfully.`,
        }).show()
      } catch {
        /* notifications may be unavailable */
      }
    }

    return result
  })

  // ── Undo ──────────────────────────────────────────────────────────────
  ipcMain.handle('undo-operation', async (_event, operationId: string) => {
    const result = await undoService.undoOperation(operationId)

    // Mark activity as undone
    const activity = store.get<Record<string, unknown>[]>('activity', [])
    const entry = activity.find(
      (a: Record<string, unknown>) => a.id === operationId
    )
    if (entry) {
      entry.undone = true
      store.set('activity', activity)
    }

    return result
  })

  // ── Settings ──────────────────────────────────────────────────────────
  ipcMain.handle('get-settings', () =>
    store.get('settings', getDefaultSettings())
  )

  ipcMain.handle(
    'save-settings',
    (_event, settings: Record<string, unknown>) => {
      store.set('settings', settings)
      const theme = settings.theme as string
      nativeTheme.themeSource =
        theme === 'system' ? 'system' : (theme as 'light' | 'dark')
      setupAutoOrganize()
      return true
    }
  )

  // ── Categories ────────────────────────────────────────────────────────
  ipcMain.handle('get-categories', () =>
    store.get('categories', DEFAULT_CATEGORIES)
  )

  ipcMain.handle('save-categories', (_event, categories: Category[]) => {
    store.set('categories', categories)
    return true
  })

  // ── Rules ─────────────────────────────────────────────────────────────
  ipcMain.handle('get-rules', () => store.get<SmartRule[]>('rules', []))

  ipcMain.handle('save-rules', (_event, rules: SmartRule[]) => {
    store.set('rules', rules)
    return true
  })

  // ── Activity ──────────────────────────────────────────────────────────
  ipcMain.handle('get-activity', () =>
    store.get<Record<string, unknown>[]>('activity', [])
  )

  ipcMain.handle('clear-activity', () => {
    store.set('activity', [])
    return true
  })

  // ── Search ────────────────────────────────────────────────────────────
  ipcMain.handle(
    'search-files',
    async (_event, query: string, searchPath: string) => {
      if (!searchPath || !query) return []

      const results: Record<string, unknown>[] = []
      const queryLower = query.toLowerCase()

      async function search(dir: string): Promise<void> {
        try {
          const entries = await fs.promises.readdir(dir, {
            withFileTypes: true,
          })

          for (const entry of entries) {
            if (results.length >= 200) return
            const fullPath = path.join(dir, entry.name)

            if (
              entry.isFile() &&
              entry.name.toLowerCase().includes(queryLower)
            ) {
              try {
                const stat = await fs.promises.stat(fullPath)
                results.push({
                  name: entry.name,
                  path: fullPath,
                  size: stat.size,
                  modifiedAt: stat.mtimeMs,
                  extension: path.extname(entry.name),
                })
              } catch {
                /* skip */
              }
            } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
              await search(fullPath)
            }
          }
        } catch {
          /* skip inaccessible dirs */
        }
      }

      await search(searchPath)
      return results
    }
  )

  // ── File / folder opening ─────────────────────────────────────────────
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    try {
      await shell.openPath(filePath)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('open-folder', async (_event, folderPath: string) => {
    try {
      await shell.openPath(folderPath)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('show-item-in-folder', (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
    return true
  })

  // ── Statistics ────────────────────────────────────────────────────────
  ipcMain.handle('get-statistics', () =>
    store.get('statistics', {
      totalFilesOrganized: 0,
      totalSizeOrganized: 0,
      categoryCounts: {} as Record<string, number>,
    })
  )

  // ── Theme ─────────────────────────────────────────────────────────────
  ipcMain.handle('get-system-theme', () =>
    nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  )

  // ── First launch ──────────────────────────────────────────────────────
  ipcMain.handle('is-first-launch', () =>
    store.get('firstLaunchDone', false) === false
  )

  ipcMain.handle('set-first-launch-done', () => {
    store.set('firstLaunchDone', true)
    return true
  })

  // ── System Folders ────────────────────────────────────────────────────
  ipcMain.handle('get-system-folders', () => ({
    downloads: app.getPath('downloads'),
    desktop: app.getPath('desktop'),
    documents: app.getPath('documents'),
    pictures: app.getPath('pictures'),
    music: app.getPath('music'),
    videos: app.getPath('videos'),
  }))

  // ── Trigger Auto-Organize ─────────────────────────────────────────────
  ipcMain.handle('trigger-auto-organize', async () => {
    await runAutoOrganizeCycle()
    return true
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    store = new Store()
    undoService = new UndoService(store)

    registerIpcHandlers()
    createWindow()
    createTray()
    setupAutoOrganize()

    // Watch for system theme changes
    nativeTheme.on('updated', () => {
      const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      mainWindow?.webContents.send('theme-changed', theme)
    })

    // Apply saved theme
    const settings = store.get('settings', getDefaultSettings())
    if (settings.theme !== 'system') {
      nativeTheme.themeSource = settings.theme
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}
