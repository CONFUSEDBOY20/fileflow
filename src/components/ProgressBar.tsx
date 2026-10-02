import React from 'react'

interface ProgressBarProps {
  percentage: number
  label?: string
  sublabel?: string
  indeterminate?: boolean
}

export default function ProgressBar({
  percentage,
  label,
  sublabel,
  indeterminate,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-[#444] dark:text-[#bbb]">{label}</span>
          {!indeterminate && (
            <span className="text-sm font-medium text-[#0078d4] dark:text-[#4cc2ff] tabular-nums">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-[#e5e5e5] dark:bg-[#404040] rounded-full overflow-hidden">
        {indeterminate ? (
          <div className="h-full w-1/3 bg-[#0078d4] rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
        ) : (
          <div
            className="h-full bg-[#0078d4] rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, percentage))}%`,
            }}
          />
        )}
      </div>
      {sublabel && (
        <p className="text-xs text-[#888] dark:text-[#777] mt-1">{sublabel}</p>
      )}
    </div>
  )
}
