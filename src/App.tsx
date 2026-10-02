import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Toast, { ToastMessage } from './components/Toast'
import Dashboard from './pages/Dashboard'
import Organize from './pages/Organize'
import Activity from './pages/Activity'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'

type Page = 'dashboard' | 'organize' | 'activity' | 'categories' | 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // Initialize theme and first-launch state
  useEffect(() => {
    async function init() {
      try {
        const settings = await window.fileflow.getSettings()
        const systemTheme = await window.fileflow.getSystemTheme()

        if (settings.theme === 'system') {
          setTheme(systemTheme as 'light' | 'dark')
        } else {
          setTheme(settings.theme as 'light' | 'dark')
        }

        const firstLaunch = await window.fileflow.isFirstLaunch()
        setIsFirstLaunch(firstLaunch)
      } catch (err) {
        console.error('Failed to initialize app:', err)
      }
    }
    init()

    const cleanupTheme = window.fileflow.onThemeChange((newTheme: string) => {
      window.fileflow.getSettings().then((s: Record<string, unknown>) => {
        if (s.theme === 'system') {
          setTheme(newTheme as 'light' | 'dark')
        }
      })
    })

    const cleanupFolder = window.fileflow.onSelectFolderPath?.(
      (folderPath: string) => {
        setSelectedFolder(folderPath)
        setPage('organize')
      }
    )

    const cleanupNavigate = window.fileflow.onNavigateTo?.(
      (targetPage: string) => {
        setPage(targetPage as Page)
      }
    )

    return () => {
      cleanupTheme?.()
      cleanupFolder?.()
      cleanupNavigate?.()
    }
  }, [])

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const addToast = useCallback(
    (toast: { type: string; title: string; message: string }) => {
      const id = Date.now().toString()
      const validTypes: ('success' | 'error' | 'info' | 'warning')[] = [
        'success',
        'error',
        'info',
        'warning',
      ]
      const type = (
        validTypes.includes(toast.type as any) ? toast.type : 'info'
      ) as 'success' | 'error' | 'info' | 'warning'
      setToasts(prev => [
        ...prev,
        { id, type, title: toast.title, message: toast.message },
      ])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 4000)
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleFirstLaunchDone = async () => {
    await window.fileflow.setFirstLaunchDone()
    setIsFirstLaunch(false)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'system') {
      window.fileflow
        .getSystemTheme()
        .then((t: string) => setTheme(t as 'light' | 'dark'))
    } else {
      setTheme(newTheme)
    }
  }

  // First-launch welcome screen
  if (isFirstLaunch) {
    return (
      <Welcome
        onComplete={handleFirstLaunchDone}
        onSelectFolder={folder => {
          setSelectedFolder(folder)
          handleFirstLaunchDone()
        }}
      />
    )
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            onNavigate={setPage}
            addToast={addToast}
          />
        )
      case 'organize':
        return (
          <Organize
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            addToast={addToast}
          />
        )
      case 'activity':
        return <Activity addToast={addToast} />
      case 'categories':
        return <Categories addToast={addToast} />
      case 'settings':
        return (
          <Settings onThemeChange={handleThemeChange} addToast={addToast} />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-[#f5f5f5] dark:bg-[#1e1e1e] text-[#1a1a1a] dark:text-[#e0e0e0]">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto">
        <div className="page-transition" key={page}>
          {renderPage()}
        </div>
      </main>
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
