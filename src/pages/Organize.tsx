import React, { useState, useEffect } from 'react'
import {
  Scan,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import FileTable from '../components/FileTable'
import { formatFileSize, formatNumber } from '../utils/format'

interface OrganizeProps {
  selectedFolder: string | null
  onSelectFolder: (folder: string | null) => void
  addToast: (toast: { type: string; title: string; message: string }) => void
}

type Stage = 'idle' | 'scanning' | 'preview' | 'organizing' | 'complete'

export default function Organize({
  selectedFolder,
  onSelectFolder,
  addToast,
}: OrganizeProps) {
  const [stage, setStage] = useState<Stage>('idle')
  const [includeSubfolders, setIncludeSubfolders] = useState(false)
  const [scanResult, setScanResult] = useState<Record<string, unknown> | null>(
    null
  )
  const [scanProgress, setScanProgress] = useState({
    current: 0,
    percentage: -1,
    currentFile: '',
  })
  const [organizeProgress, setOrganizeProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    currentFile: '',
    successful: 0,
    failed: 0,
    skipped: 0,
  })
  const [organizeResult, setOrganizeResult] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    window.fileflow.getSettings().then(setSettings)
  }, [])

  useEffect(() => {
    const cleanupScan = window.fileflow.onScanProgress(
      (data: Record<string, unknown>) => {
        setScanProgress(data as typeof scanProgress)
      }
    )
    const cleanupOrganize = window.fileflow.onOrganizeProgress(
      (data: Record<string, unknown>) => {
        setOrganizeProgress(data as typeof organizeProgress)
      }
    )
    return () => {
      cleanupScan()
      cleanupOrganize()
    }
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
      setScanResult(null)
      setOrganizeResult(null)
      setStage('idle')
    }
  }

  const handleScan = async () => {
    if (!selectedFolder) return
    setStage('scanning')
    setScanProgress({ current: 0, percentage: -1, currentFile: '' })

    try {
      const result = await window.fileflow.scanFolder(selectedFolder, {
        includeSubfolders,
      })
      if (result.error) {
        addToast({
          type: 'error',
          title: 'Scan failed',
          message: result.error,
        })
        setStage('idle')
        return
      }
      setScanResult(result)
      setStage('preview')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      addToast({ type: 'error', title: 'Scan failed', message })
      setStage('idle')
    }
  }

  const handleOrganize = async () => {
    if (!scanResult || !selectedFolder || !settings) return

    setStage('organizing')
    const files = scanResult.files as Array<Record<string, unknown>>
    setOrganizeProgress({
      current: 0,
      total: files.length,
      percentage: 0,
      currentFile: '',
      successful: 0,
      failed: 0,
      skipped: 0,
    })

    try {
      const plan = {
        sourcePath: selectedFolder,
        mode: (settings.organizationMode as string) || 'move',
        duplicateHandling:
          (settings.duplicateHandling as string) || 'rename',
        items: files.map((f: Record<string, unknown>) => ({
          name: f.name,
          sourcePath: f.path,
          category: f.category,
          destinationFolder: f.destinationFolder,
        })),
      }

      const result = await window.fileflow.organizeFiles(plan)
      setOrganizeResult(result)
      setStage('complete')

      const failed = (result.failed as unknown[])?.length || 0
      const successful = (result.successful as unknown[])?.length || 0

      if (failed > 0) {
        addToast({
          type: 'warning',
          title: 'Organization complete',
          message: `${successful} organized, ${failed} failed`,
        })
      } else {
        addToast({
          type: 'success',
          title: 'Organization complete',
          message: `${successful} files organized successfully`,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      addToast({ type: 'error', title: 'Organization failed', message })
      setStage('preview')
    }
  }

  const handleUndo = async () => {
    if (!organizeResult) return
    try {
      const result = await window.fileflow.undoOperation(
        organizeResult.operationId as string
      )
      if (result.failed > 0) {
        addToast({
          type: 'warning',
          title: 'Undo partially complete',
          message: `${result.successful} restored, ${result.failed} failed`,
        })
      } else {
        addToast({
          type: 'success',
          title: 'Undo complete',
          message: `${result.successful} files restored to original locations`,
        })
      }
      setOrganizeResult(null)
      setScanResult(null)
      setStage('idle')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      addToast({ type: 'error', title: 'Undo failed', message })
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-xl font-semibold mb-1">Organize Files</h2>
      <p className="text-sm text-[#666] dark:text-[#999] mb-5">
        Scan, preview, and organize your files.
      </p>

      {/* Folder selector */}
      <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen size={18} className="text-[#0078d4]" />
            <div>
              {selectedFolder ? (
                <p className="text-sm font-mono text-[#0078d4] dark:text-[#4cc2ff]">
                  {selectedFolder}
                </p>
              ) : (
                <p className="text-sm text-[#999]">No folder selected</p>
              )}
            </div>
          </div>
          <button
            onClick={handleSelectFolder}
            className="px-3 py-1.5 text-sm bg-[#f0f0f0] dark:bg-[#404040] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] rounded-md transition-colors"
          >
            {selectedFolder ? 'Change' : 'Choose Folder'}
          </button>
        </div>
      </div>

      {/* Scan controls */}
      {selectedFolder && stage === 'idle' && (
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-4 mb-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSubfolders}
                onChange={e => setIncludeSubfolders(e.target.checked)}
                className="rounded"
              />
              Include subfolders
            </label>
            <button
              onClick={handleScan}
              className="px-4 py-2 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm rounded-md transition-colors flex items-center gap-1.5"
            >
              <Scan size={14} />
              Scan Folder
            </button>
          </div>
        </div>
      )}

      {/* Scanning progress */}
      {stage === 'scanning' && (
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-6 mb-4">
          <h3 className="text-sm font-medium mb-3">Scanning files...</h3>
          <ProgressBar
            percentage={
              scanProgress.percentage >= 0 ? scanProgress.percentage : 0
            }
            indeterminate={scanProgress.percentage < 0}
            sublabel={`${formatNumber(scanProgress.current)} files found${
              scanProgress.currentFile
                ? ` · ${scanProgress.currentFile}`
                : ''
            }`}
          />
        </div>
      )}

      {/* Preview */}
      {stage === 'preview' && scanResult && (
        <div>
          {/* Summary */}
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-4">
            <h3 className="text-sm font-semibold mb-3">
              Organization Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 rounded-md bg-[#f5f5f5] dark:bg-[#383838]">
                <p className="text-lg font-semibold text-[#0078d4]">
                  {formatNumber(scanResult.totalFiles as number)}
                </p>
                <p className="text-xs text-[#888]">Total Files</p>
              </div>
              <div className="text-center p-3 rounded-md bg-[#f5f5f5] dark:bg-[#383838]">
                <p className="text-lg font-semibold text-[#e67e22]">
                  {formatFileSize(scanResult.totalSize as number)}
                </p>
                <p className="text-xs text-[#888]">Total Size</p>
              </div>
              <div className="text-center p-3 rounded-md bg-[#f5f5f5] dark:bg-[#383838]">
                <p className="text-lg font-semibold text-[#2ecc71]">
                  {
                    Object.keys(
                      scanResult.categoryCounts as Record<string, number>
                    ).length
                  }
                </p>
                <p className="text-xs text-[#888]">Categories</p>
              </div>
              <div className="text-center p-3 rounded-md bg-[#f5f5f5] dark:bg-[#383838]">
                <p className="text-lg font-semibold text-[#888]">
                  {formatNumber(scanResult.allFilesCount as number)}
                </p>
                <p className="text-xs text-[#888]">Scanned</p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="space-y-1.5 mb-4">
              {Object.entries(
                scanResult.categoryCounts as Record<string, number>
              )
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between py-1.5 px-3 rounded bg-[#f8f8f8] dark:bg-[#353535]"
                  >
                    <span className="text-sm">{category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#888]">
                        {formatFileSize(
                          (
                            scanResult.categorySizes as Record<
                              string,
                              number
                            >
                          )[category] || 0
                        )}
                      </span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatNumber(count)} files
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleOrganize}
                className="px-4 py-2 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm rounded-md transition-colors"
              >
                Organize Files
              </button>
              <button
                onClick={() => {
                  setStage('idle')
                  setScanResult(null)
                }}
                className="px-4 py-2 bg-[#f0f0f0] dark:bg-[#404040] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] text-sm rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Detailed file list */}
          <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-[#f8f8f8] dark:hover:bg-[#353535] transition-colors"
            >
              <span>
                File Details (
                {formatNumber(
                  (scanResult.files as unknown[]).length
                )}{' '}
                files)
              </span>
              {showDetails ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {showDetails && (
              <FileTable
                files={
                  scanResult.files as Array<{
                    name: string
                    path: string
                    size: number
                    category: string
                    destinationFolder: string
                  }>
                }
                showCategory
                showDestination
                showSize
                onOpenFile={(p: string) => window.fileflow.openFile(p)}
              />
            )}
          </div>
        </div>
      )}

      {/* Organizing progress */}
      {stage === 'organizing' && (
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-6 mb-4">
          <h3 className="text-sm font-medium mb-3">Organizing files...</h3>
          <ProgressBar
            percentage={organizeProgress.percentage}
            sublabel={`${organizeProgress.currentFile} · ${organizeProgress.successful} successful, ${organizeProgress.failed} failed`}
          />
          <div className="flex gap-4 mt-3 text-xs text-[#888]">
            <span>
              {organizeProgress.current} / {organizeProgress.total}
            </span>
          </div>
        </div>
      )}

      {/* Complete */}
      {stage === 'complete' && organizeResult && (
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 size={20} className="text-[#107c10] mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold">
                Organization Complete
              </h3>
              <p className="text-sm text-[#666] dark:text-[#999] mt-1">
                {formatNumber(
                  (organizeResult.successful as unknown[])?.length || 0
                )}{' '}
                files organized successfully.
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-[#107c10]">
              ✓{' '}
              {(organizeResult.successful as unknown[])?.length || 0}{' '}
              successful
            </span>
            {((organizeResult.failed as unknown[])?.length || 0) > 0 && (
              <span className="text-[#d13438]">
                ✗ {(organizeResult.failed as unknown[])?.length} failed
              </span>
            )}
            {((organizeResult.skipped as unknown[])?.length || 0) > 0 && (
              <span className="text-[#ff8c00]">
                ⊘ {(organizeResult.skipped as unknown[])?.length}{' '}
                skipped
              </span>
            )}
          </div>

          {/* Failed files */}
          {((organizeResult.failed as unknown[])?.length || 0) > 0 && (
            <div className="mb-4 p-3 bg-[#fdf2f2] dark:bg-[#3d2020] rounded-md border border-[#fca5a5] dark:border-[#7f1d1d]">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-[#d13438]" />
                <span className="text-xs font-medium text-[#d13438]">
                  Failed Files
                </span>
              </div>
              {(
                organizeResult.failed as Array<{
                  name: string
                  error: string
                }>
              ).map((f, i) => (
                <div key={i} className="text-xs text-[#888] py-0.5">
                  {f.name} — {f.error}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {(settings?.organizationMode as string) !== 'copy' && (
              <button
                onClick={handleUndo}
                className="px-4 py-2 bg-[#f0f0f0] dark:bg-[#404040] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] text-sm rounded-md transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                Undo Last Organization
              </button>
            )}
            <button
              onClick={() => {
                setStage('idle')
                setScanResult(null)
                setOrganizeResult(null)
              }}
              className="px-4 py-2 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm rounded-md transition-colors"
            >
              Organize More
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
