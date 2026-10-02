import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = '480px',
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative bg-white dark:bg-[#2d2d2d] rounded-lg shadow-xl border border-[#e0e0e0] dark:border-[#404040] w-full mx-4"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0] dark:border-[#404040]">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#666] dark:text-[#666] dark:hover:text-[#999] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
