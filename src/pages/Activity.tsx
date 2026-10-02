import React, { useState, useEffect } from 'react'
import {
  Clock,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  formatDate,
  formatRelativeDate,
  formatNumber,
  formatFileSize,
} from '../utils/format'

interface ActivityProps {
  addToast: (toast: { type: string; title: string; message: string }) => void
}

interface ActivityEntry {
  id: string
  timestamp: number
  sourcePath: string
  totalFiles: number
  successful: number
  failed: number
  skipped: number
  undone?: boolean
  details?: {
    successful?: Array<{
      name: string
      category: string
      size: number
    }>
    failed?: Array<{ name: string; error: string }>
  }
}

export default function Activity({ addToast }: ActivityProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadActivity()
  }, [])

  const loadActivity = async () => {
    const data = await window.fileflow.getActivity()
    setActivities(data)
  }

  const handleUndo = async (operationId: string) => {
    try {
      const result = await window.fileflow.undoOperation(operationId)
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
          message: `${result.successful} files restored`,
        })
      }
      await loadActivity()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      addToast({ type: 'error', title: 'Undo failed', message })
    }
  }

  const handleClear = async () => {
    await window.fileflow.clearActivity()
    setActivities([])
    addToast({
      type: 'info',
      title: 'Activity cleared',
      message: 'Activity history has been cleared',
    })
  }

  // Group activities by date
  const grouped = activities.reduce<Record<string, ActivityEntry[]>>(
    (acc, activity) => {
      const dateKey = formatRelativeDate(activity.timestamp)
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(activity)
      return acc
    },
    {}
  )

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold mb-1">Activity</h2>
          <p className="text-sm text-[#666] dark:text-[#999]">
            History of file organization operations.
          </p>
        </div>
        {activities.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs text-[#d13438] hover:bg-[#fdf2f2] dark:hover:bg-[#3d2020] rounded-md transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={12} />
            Clear History
          </button>
        )}
      </div>

      {activities.length === 0 && (
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-8 text-center">
          <Clock
            size={36}
            className="mx-auto mb-3 text-[#ccc] dark:text-[#555]"
          />
          <h3 className="text-sm font-medium mb-1">No activity yet</h3>
          <p className="text-xs text-[#999] dark:text-[#666]">
            Your file organization history will appear here.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([dateKey, entries]) => (
        <div key={dateKey} className="mb-5">
          <h3 className="text-xs font-medium text-[#888] dark:text-[#777] mb-2 uppercase tracking-wide">
            {dateKey}
          </h3>
          <div className="space-y-2">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#f8f8f8] dark:hover:bg-[#353535] transition-colors"
                  onClick={() =>
                    setExpandedId(
                      expandedId === entry.id ? null : entry.id
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    {entry.undone ? (
                      <XCircle size={16} className="text-[#999]" />
                    ) : (
                      <CheckCircle2
                        size={16}
                        className="text-[#107c10]"
                      />
                    )}
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">
                          {formatNumber(entry.totalFiles)}
                        </span>{' '}
                        files organized
                        {entry.undone && (
                          <span className="text-xs text-[#999] ml-2">
                            (undone)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#888] dark:text-[#777]">
                        {formatDate(entry.timestamp)} · {entry.sourcePath}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry.undone && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleUndo(entry.id)
                        }}
                        className="px-2.5 py-1 text-xs text-[#0078d4] hover:bg-[#e8f4fd] dark:hover:bg-[#0078d4]/20 rounded transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={11} />
                        Undo
                      </button>
                    )}
                    {expandedId === entry.id ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </div>
                </div>

                {expandedId === entry.id && entry.details && (
                  <div className="px-4 py-3 border-t border-[#f0f0f0] dark:border-[#353535]">
                    <div className="flex gap-4 mb-3 text-xs">
                      <span className="text-[#107c10]">
                        ✓ {entry.successful} successful
                      </span>
                      {entry.failed > 0 && (
                        <span className="text-[#d13438]">
                          ✗ {entry.failed} failed
                        </span>
                      )}
                      {entry.skipped > 0 && (
                        <span className="text-[#ff8c00]">
                          ⊘ {entry.skipped} skipped
                        </span>
                      )}
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {entry.details.successful
                        ?.slice(0, 30)
                        .map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 py-1 text-xs"
                          >
                            <span className="text-[#107c10]">→</span>
                            <span className="truncate flex-1 text-[#666] dark:text-[#999]">
                              {f.name}
                            </span>
                            <span className="text-[#888]">
                              {f.category}
                            </span>
                            <span className="text-[#aaa] tabular-nums">
                              {formatFileSize(f.size)}
                            </span>
                          </div>
                        ))}
                      {(entry.details.successful?.length || 0) > 30 && (
                        <p className="text-xs text-[#999] mt-1">
                          ...and{' '}
                          {(entry.details.successful?.length || 0) - 30}{' '}
                          more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
