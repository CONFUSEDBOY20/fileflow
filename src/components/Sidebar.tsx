import React from 'react'
import {
  Home,
  FolderOpen,
  BarChart3,
  Grid3X3,
  Settings,
  Info,
} from 'lucide-react'

type Page = 'dashboard' | 'organize' | 'activity' | 'categories' | 'settings'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  {
    page: 'organize',
    label: 'Organize Files',
    icon: <FolderOpen size={18} />,
  },
  { page: 'activity', label: 'Activity', icon: <BarChart3 size={18} /> },
  { page: 'categories', label: 'Categories', icon: <Grid3X3 size={18} /> },
  { page: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-white dark:bg-[#2d2d2d] border-r border-[#e0e0e0] dark:border-[#404040] flex flex-col select-none shrink-0">
      {/* App Title */}
      <div className="px-4 py-5 border-b border-[#e0e0e0] dark:border-[#404040]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#0078d4] flex items-center justify-center">
            <FolderOpen size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">FileFlow</h1>
            <p className="text-[10px] text-[#666] dark:text-[#999] -mt-0.5">
              Smart File Organizer
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2">
        {navItems.map(item => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors duration-100 mb-0.5
              ${
                currentPage === item.page
                  ? 'bg-[#e8f4fd] dark:bg-[#0078d4]/20 text-[#0078d4] dark:text-[#4cc2ff] font-medium'
                  : 'text-[#444] dark:text-[#bbb] hover:bg-[#f0f0f0] dark:hover:bg-[#383838]'
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#e0e0e0] dark:border-[#404040]">
        <div className="flex items-center gap-2 text-[11px] text-[#999] dark:text-[#666]">
          <Info size={12} />
          <span>v1.0.0</span>
        </div>
        <p className="text-[10px] text-[#bbb] dark:text-[#555] mt-1">
          Files stay on your computer
        </p>
      </div>
    </aside>
  )
}
