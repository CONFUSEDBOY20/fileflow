import React from 'react'
import { FolderOpen, Scan, Eye, CheckCircle2 } from 'lucide-react'

interface WelcomeProps {
  onComplete: () => void
  onSelectFolder: (folder: string) => void
}

export default function Welcome({ onComplete, onSelectFolder }: WelcomeProps) {
  const handleSelectFolder = async () => {
    const result = await window.fileflow.selectFolder()
    if (result?.path) {
      onSelectFolder(result.path)
    }
  }

  const steps = [
    {
      icon: <FolderOpen size={20} />,
      title: 'Select folder',
      desc: 'Choose a folder to organize',
    },
    {
      icon: <Scan size={20} />,
      title: 'Scan files',
      desc: 'Identify and classify files',
    },
    {
      icon: <Eye size={20} />,
      title: 'Review organization',
      desc: 'Preview before making changes',
    },
    {
      icon: <CheckCircle2 size={20} />,
      title: 'Organize safely',
      desc: 'Files are moved, never deleted',
    },
  ]

  return (
    <div className="h-screen bg-[#f5f5f5] dark:bg-[#1e1e1e] flex items-center justify-center text-[#1a1a1a] dark:text-[#e0e0e0]">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-[#0078d4] flex items-center justify-center mx-auto mb-5">
          <FolderOpen size={28} className="text-white" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">
          Welcome to FileFlow 👋
        </h1>
        <p className="text-sm text-[#666] dark:text-[#999] mb-8">
          Organize your files automatically.
        </p>

        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-6 text-left">
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e8f4fd] dark:bg-[#0078d4]/20 flex items-center justify-center text-[#0078d4] dark:text-[#4cc2ff] flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-[#888] dark:text-[#777]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSelectFolder}
          className="px-6 py-2.5 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm rounded-md transition-colors w-full mb-3"
        >
          Choose Folder
        </button>

        <button
          onClick={onComplete}
          className="text-xs text-[#999] hover:text-[#666] transition-colors"
        >
          Skip for now
        </button>

        <p className="text-[10px] text-[#bbb] dark:text-[#555] mt-6">
          Your files stay on your computer. FileFlow does not upload your
          files.
        </p>
      </div>
    </div>
  )
}
