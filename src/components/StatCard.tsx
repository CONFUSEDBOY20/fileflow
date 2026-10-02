import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: string
}

export default function StatCard({
  label,
  value,
  icon,
  color = '#0078d4',
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#888] dark:text-[#777] mb-1">{label}</p>
          <p className="text-xl font-semibold" style={{ color }}>
            {value}
          </p>
        </div>
        {icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color + '15' }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
