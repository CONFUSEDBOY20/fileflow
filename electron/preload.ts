import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Folder operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (folderPath: string, options: Record<string, unknown>) =>
    ipcRenderer.invoke('scan-folder', folderPath, options),
  organizeFiles: (plan: Record<string, unknown>) =>
    ipcRenderer.invoke('organize-files', plan),

  // Undo
  undoOperation: (operationId: string) =>
    ipcRenderer.invoke('undo-operation', operationId),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('save-settings', settings),

  // Categories
  getCategories: () => ipcRenderer.invoke('get-categories'),
  saveCategories: (categories: Record<string, unknown>[]) =>
    ipcRenderer.invoke('save-categories', categories),

  // Rules
  getRules: () => ipcRenderer.invoke('get-rules'),
  saveRules: (rules: Record<string, unknown>[]) =>
    ipcRenderer.invoke('save-rules', rules),

  // Activity
  getActivity: () => ipcRenderer.invoke('get-activity'),
  clearActivity: () => ipcRenderer.invoke('clear-activity'),

  // Search
  searchFiles: (query: string, searchPath: string) =>
    ipcRenderer.invoke('search-files', query, searchPath),

  // File operations
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  openFolder: (folderPath: string) =>
    ipcRenderer.invoke('open-folder', folderPath),
  showItemInFolder: (filePath: string) =>
    ipcRenderer.invoke('show-item-in-folder', filePath),

  // Statistics
  getStatistics: () => ipcRenderer.invoke('get-statistics'),

  // Theme
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),

  // First launch
  isFirstLaunch: () => ipcRenderer.invoke('is-first-launch'),
  setFirstLaunchDone: () => ipcRenderer.invoke('set-first-launch-done'),

  // System folders
  getSystemFolders: () => ipcRenderer.invoke('get-system-folders'),
  triggerAutoOrganize: () => ipcRenderer.invoke('trigger-auto-organize'),

  // Events
  onScanProgress: (callback: (data: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: Record<string, unknown>) =>
      callback(data)
    ipcRenderer.on('scan-progress', handler)
    return () => {
      ipcRenderer.removeListener('scan-progress', handler)
    }
  },
  onOrganizeProgress: (callback: (data: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: Record<string, unknown>) =>
      callback(data)
    ipcRenderer.on('organize-progress', handler)
    return () => {
      ipcRenderer.removeListener('organize-progress', handler)
    }
  },
  onThemeChange: (callback: (theme: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: string) =>
      callback(theme)
    ipcRenderer.on('theme-changed', handler)
    return () => {
      ipcRenderer.removeListener('theme-changed', handler)
    }
  },
  onSelectFolderPath: (callback: (path: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, folderPath: string) =>
      callback(folderPath)
    ipcRenderer.on('select-folder-path', handler)
    return () => {
      ipcRenderer.removeListener('select-folder-path', handler)
    }
  },
  onNavigateTo: (callback: (page: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, page: string) =>
      callback(page)
    ipcRenderer.on('navigate-to', handler)
    return () => {
      ipcRenderer.removeListener('navigate-to', handler)
    }
  },
}

contextBridge.exposeInMainWorld('fileflow', api)
contextBridge.exposeInMainWorld('fileFlow', api)

export type FileFlowAPI = typeof api
