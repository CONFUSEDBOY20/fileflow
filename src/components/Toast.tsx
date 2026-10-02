import React from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

const icons = {
  success: <CheckCircle2 size={16} className="text-[#107c10]" />,
  error: <AlertCircle size={16} className="text-[#d13438]" />,
  warning: <AlertTriangle size={16} className="text-[#ff8c00]" />,
  info: <Info size={16} className="text-[#0078d4]" />,
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-enter bg-white dark:bg-[#2d2d2d] rounded-lg shadow-lg border border-[#e0e0e0] dark:border-[#404040] p-3 flex items-start gap-2.5"
        >
          <div className="mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1a1a] dark:text-[#e0e0e0]">
              {toast.title}
            </p>
            <p className="text-xs text-[#666] dark:text-[#999] mt-0.5">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-[#999] hover:text-[#666] dark:text-[#666] dark:hover:text-[#999] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
