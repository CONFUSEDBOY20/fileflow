import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { formatFileSize, formatDate } from '../utils/format'

interface FileRow {
  name: string
  path: string
  size: number
  category: string
  destinationFolder: string
  extension?: string
  modifiedAt?: number
}

interface FileTableProps {
  files: FileRow[]
  showCategory?: boolean
  showDestination?: boolean
  showSize?: boolean
  showDate?: boolean
  pageSize?: number
  onOpenFile?: (path: string) => void
}

export default function FileTable({
  files,
  showCategory = true,
  showDestination = true,
  showSize = true,
  showDate = false,
  pageSize = 50,
  onOpenFile,
}: FileTableProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const totalPages = Math.ceil(files.length / pageSize)

  const sorted = useMemo(() => {
    const arr = [...files]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'size':
          cmp = a.size - b.size
          break
        case 'category':
          cmp = a.category.localeCompare(b.category)
          break
        case 'date':
          cmp = (a.modifiedAt || 0) - (b.modifiedAt || 0)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [files, sortBy, sortDir])

  const pageFiles = sorted.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  )

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const SortHeader = ({
    col,
    label,
  }: {
    col: string
    label: string
  }) => (
    <th
      className="text-left px-3 py-2.5 text-xs font-medium text-[#666] dark:text-[#999] cursor-pointer hover:text-[#333] dark:hover:text-[#ccc] select-none"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={11}
          className={sortBy === col ? 'opacity-100' : 'opacity-30'}
        />
      </span>
    </th>
  )

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e0e0e0] dark:border-[#404040]">
              <SortHeader col="name" label="File" />
              {showCategory && <SortHeader col="category" label="Category" />}
              {showDestination && (
                <th className="text-left px-3 py-2.5 text-xs font-medium text-[#666] dark:text-[#999]">
                  Destination
                </th>
              )}
              {showSize && <SortHeader col="size" label="Size" />}
              {showDate && <SortHeader col="date" label="Modified" />}
            </tr>
          </thead>
          <tbody>
            {pageFiles.map((file, i) => (
              <tr
                key={`${file.path}-${i}`}
                className="border-b border-[#f0f0f0] dark:border-[#353535] hover:bg-[#f8f8f8] dark:hover:bg-[#333] transition-colors duration-75 cursor-default"
                onDoubleClick={() => onOpenFile?.(file.path)}
              >
                <td className="px-3 py-2 text-[13px]">
                  <span
                    className="truncate block max-w-xs"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                </td>
                {showCategory && (
                  <td className="px-3 py-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-[#f0f0f0] dark:bg-[#404040] text-[#555] dark:text-[#bbb]">
                      {file.category}
                    </span>
                  </td>
                )}
                {showDestination && (
                  <td className="px-3 py-2 text-xs text-[#888] dark:text-[#777]">
                    {file.destinationFolder}
                  </td>
                )}
                {showSize && (
                  <td className="px-3 py-2 text-xs text-[#888] dark:text-[#777] tabular-nums">
                    {formatFileSize(file.size)}
                  </td>
                )}
                {showDate && file.modifiedAt && (
                  <td className="px-3 py-2 text-xs text-[#888] dark:text-[#777]">
                    {formatDate(file.modifiedAt)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-3 border-t border-[#e0e0e0] dark:border-[#404040]">
          <span className="text-xs text-[#888] dark:text-[#777]">
            Showing {currentPage * pageSize + 1}–
            {Math.min((currentPage + 1) * pageSize, files.length)} of{' '}
            {files.length} files
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#404040] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-[#666] dark:text-[#999] px-2 tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(p => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-[#404040] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
