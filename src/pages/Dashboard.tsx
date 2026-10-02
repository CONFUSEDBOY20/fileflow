import React, { useState, useEffect } from 'react'
import {
  FolderOpen,
  Scan,
  Video,
  Image,
  FileText,
  Music,
  Archive,
  AppWindow,
  Code,
  Type,
  Disc,
  File,
  Search,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import { formatFileSize, formatNumber } from '../utils/format'

type Page = 'dashboard' | 'organize' | 'activity' | 'categories' | 'settings'

interface DashboardProps {
  selectedFolder: string | null
  onSelectFolder: (folder: string | null) => void
  onNavigate: (page: Page) => void
  addToast: (toast: { type: string; title: string; message: string }) => void
}

const categoryIcons: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  Videos: { icon: <Video size={14} />, color: '#e74c3c' },
  Photos: { icon: <Image size={14} />, color: '#2ecc71' },
  Documents: { icon: <FileText size={14} />, color: '#3498db' },
  Music: { icon: <Music size={14} />, color: '#9b59b6' },
  Archives: { icon: <Archive size={14} />, color: '#e67e22' },
  Applications: { icon: <AppWindow size={14} />, color: '#1abc9c' },
  Code: { icon: <Code size={14} />, color: '#f39c12' },
  Fonts: { icon: <Type size={14} />, color: '#34495e' },
  'Disk Images': { icon: <Disc size={14} />, color: '#7f8c8d' },
  Spreadsheets: { icon: <FileText size={14} />, color: '#27ae60' },
  Presentations: { icon: <FileText size={14} />, color: '#c0392b' },
  Others: { icon: <File size={14} />, color: '#95a5a6' },
}

export default function Dashboard({
  selectedFolder,
  onSelectFolder,
  onNavigate,
  addToast,
}: DashboardProps) {
  const [statistics, setStatistics] = useState<{
    totalFilesOrganized: number
    totalSizeOrganized: number
    categoryCounts: Record<string, number>
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    { name: string; path: string; size: number }[] | null
  >(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    window.fileflow.getStatistics().then(setStatistics)
  }, [])

  const handleSelectFolder = async () => {
    const result = await window.fileflow.selectFolder()
    if (result?.error) {
      addToast({
        type: 'error',
        title: 'Cannot select folder',
        message: result.error,
      })
      return
    }
    if (result?.path) {
      onSelectFolder(result.path)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedFolder) return
    setIsSearching(true)
    try {
      const results = await window.fileflow.searchFiles(
        searchQuery,
        selectedFolder
      )
      setSearchResults(results)
    } catch {
      addToast({
        type: 'error',
        title: 'Search failed',
        message: 'Could not search files',
      })
    }
    setIsSearching(false)
  }

  const handleOpenFolder = (filePath: string) => {
    const idx = filePath.lastIndexOf('\\')
    if (idx >= 0) {
      window.fileflow.openFolder(filePath.substring(0, idx))
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Smart File Organizer</h2>
        <p className="text-sm text-[#666] dark:text-[#999]">
          Clean your folders automatically and keep your files organized.
        </p>
      </div>

      {/* Folder Selector */}
      <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium mb-1">Select Folder</h3>
            {selectedFolder ? (
              <p className="text-xs text-[#0078d4] dark:text-[#4cc2ff] font-mono">
                {selectedFolder}
              </p>
            ) : (
              <p className="text-xs text-[#999] dark:text-[#666]">
                Choose a folder to organize
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm rounded-md transition-colors duration-100"
            >
              Choose Folder
            </button>
            {selectedFolder && (
              <button
                onClick={() => onNavigate('organize')}
                className="px-4 py-2 bg-[#f0f0f0] dark:bg-[#404040] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] text-sm rounded-md transition-colors duration-100 flex items-center gap-1.5"
              >
                <Scan size={14} />
                Scan & Organize
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      {selectedFolder && (
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-4 mb-5">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search files by name..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4] dark:focus:border-[#4cc2ff] transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-[#f0f0f0] dark:bg-[#404040] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] text-sm rounded-md transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {searchResults !== null && (
            <div className="mt-3">
              <p className="text-xs text-[#888] mb-2">
                {searchResults.length} files found
              </p>
              <div className="max-h-60 overflow-auto">
                {searchResults.slice(0, 50).map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 hover:bg-[#f5f5f5] dark:hover:bg-[#383838] rounded text-sm cursor-pointer"
                    onDoubleClick={() => window.fileflow.openFile(file.path)}
                  >
                    <span className="truncate flex-1 text-[13px]">
                      {file.name}
                    </span>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-xs text-[#888] tabular-nums">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleOpenFolder(file.path)
                        }}
                        className="text-xs text-[#0078d4] hover:underline"
                      >
                        Open Folder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {statistics && statistics.totalFilesOrganized > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatCard
              label="Files Organized"
              value={formatNumber(statistics.totalFilesOrganized)}
              icon={<File size={16} className="text-[#0078d4]" />}
            />
            <StatCard
              label="Storage Organized"
              value={formatFileSize(statistics.totalSizeOrganized)}
              icon={<Archive size={16} className="text-[#e67e22]" />}
              color="#e67e22"
            />
          </div>

          {/* Category distribution */}
          {Object.keys(statistics.categoryCounts).length > 0 && (
            <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-4">
              <h4 className="text-xs font-medium text-[#888] dark:text-[#777] mb-3">
                Category Distribution
              </h4>
              <div className="space-y-2">
                {Object.entries(statistics.categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const total = statistics.totalFilesOrganized
                    const pct = Math.round((count / total) * 100)
                    const ci =
                      categoryIcons[category] || categoryIcons.Others
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-[#666] dark:text-[#999] flex items-center gap-1.5 shrink-0">
                          {ci.icon}
                          <span className="truncate">{category}</span>
                        </div>
                        <div className="flex-1 h-2 bg-[#e5e5e5] dark:bg-[#404040] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: ci.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#888] tabular-nums w-10 text-right">
                          {formatNumber(count)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {(!statistics || statistics.totalFilesOrganized === 0) &&
        !selectedFolder && (
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-8 text-center">
            <FolderOpen
              size={40}
              className="mx-auto mb-3 text-[#ccc] dark:text-[#555]"
            />
            <h3 className="text-sm font-medium mb-1">No folder selected</h3>
            <p className="text-xs text-[#999] dark:text-[#666] mb-4">
              Select a folder to start organizing your files
            </p>
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm rounded-md transition-colors"
            >
              Choose Folder
            </button>
          </div>
        )}
    </div>
  )
}
