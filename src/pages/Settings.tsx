import React, { useState, useEffect } from 'react'
import { Save, Moon, Sun, Monitor } from 'lucide-react'

interface SettingsProps {
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
  addToast: (toast: { type: string; title: string; message: string }) => void
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  minimizeToTray: boolean
  confirmBeforeOrganizing: boolean
  showNotifications: boolean
  organizationMode: 'move' | 'copy'
  includeSubfolders: boolean
  autoCreateFolders: boolean
  duplicateHandling: 'skip' | 'replace' | 'rename'
  protectSystemFolders: boolean
  protectHiddenFiles: boolean
  confirmBulkOperation: boolean
  excludeHiddenFiles: boolean
  excludeSystemFiles: boolean
  excludedExtensions: string[]
  excludedFolders: string[]
  autoOrganize: {
    enabled: boolean
    interval: string
  }
}

export default function Settings({ onThemeChange, addToast }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsState | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    window.fileflow.getSettings().then(setSettings)
  }, [])

  if (!settings) return null

  const update = (key: string, value: unknown) => {
    setSettings(s => (s ? { ...s, [key]: value } : s))
    setHasChanges(true)
  }

  const updateNested = (parent: string, key: string, value: unknown) => {
    setSettings(s => {
      if (!s) return s
      const parentObj = s[parent as keyof SettingsState]
      if (typeof parentObj === 'object' && parentObj !== null) {
        return {
          ...s,
          [parent]: { ...parentObj, [key]: value },
        }
      }
      return s
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    await window.fileflow.saveSettings(settings)
    onThemeChange(settings.theme)
    setHasChanges(false)
    addToast({
      type: 'success',
      title: 'Settings saved',
      message: 'Your preferences have been saved',
    })
  }

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean
    onChange: (v: boolean) => void
    label: string
  }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer select-none">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-[#0078d4]' : 'bg-[#ccc] dark:bg-[#555]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </label>
  )

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold mb-1">Settings</h2>
          <p className="text-sm text-[#666] dark:text-[#999]">
            Configure FileFlow behavior and appearance.
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm rounded-md transition-colors flex items-center gap-1.5"
          >
            <Save size={14} />
            Save Changes
          </button>
        )}
      </div>

      {/* Appearance */}
      <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-4">
        <h3 className="text-sm font-semibold mb-4">Appearance</h3>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: 'light', label: 'Light', icon: <Sun size={16} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
              {
                value: 'system',
                label: 'System',
                icon: <Monitor size={16} />,
              },
            ] as const
          ).map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                update('theme', opt.value)
                onThemeChange(opt.value)
              }}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm border transition-colors ${
                settings.theme === opt.value
                  ? 'border-[#0078d4] bg-[#e8f4fd] dark:bg-[#0078d4]/20 text-[#0078d4] dark:text-[#4cc2ff]'
                  : 'border-[#e0e0e0] dark:border-[#404040] hover:bg-[#f5f5f5] dark:hover:bg-[#383838]'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* General */}
      <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">General</h3>
        <div className="divide-y divide-[#f0f0f0] dark:divide-[#353535]">
          <Toggle
            checked={settings.minimizeToTray}
            onChange={v => update('minimizeToTray', v)}
            label="Minimize to system tray"
          />
          <Toggle
            checked={settings.confirmBeforeOrganizing}
            onChange={v => update('confirmBeforeOrganizing', v)}
            label="Confirm before organizing"
          />
          <Toggle
            checked={settings.showNotifications}
            onChange={v => update('showNotifications', v)}
            label="Show notifications"
          />
        </div>
      </section>

      {/* Organization */}
      <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Organization</h3>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5 text-[#888]">
            Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['move', 'copy'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => update('organizationMode', mode)}
                className={`px-3 py-2 rounded-md text-sm border transition-colors capitalize ${
                  settings.organizationMode === mode
                    ? 'border-[#0078d4] bg-[#e8f4fd] dark:bg-[#0078d4]/20 text-[#0078d4]'
                    : 'border-[#e0e0e0] dark:border-[#404040] hover:bg-[#f5f5f5] dark:hover:bg-[#383838]'
                }`}
              >
                {mode} files
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5 text-[#888]">
            Duplicate Handling
          </label>
          <select
            value={settings.duplicateHandling}
            onChange={e => update('duplicateHandling', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
          >
            <option value="rename">Rename automatically</option>
            <option value="skip">Skip</option>
            <option value="replace">Replace</option>
          </select>
        </div>

        <div className="divide-y divide-[#f0f0f0] dark:divide-[#353535]">
          <Toggle
            checked={settings.includeSubfolders}
            onChange={v => update('includeSubfolders', v)}
            label="Include subfolders by default"
          />
          <Toggle
            checked={settings.autoCreateFolders}
            onChange={v => update('autoCreateFolders', v)}
            label="Auto-create category folders"
          />
        </div>
      </section>

      {/* Safety */}
      <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Safety</h3>
        <div className="divide-y divide-[#f0f0f0] dark:divide-[#353535]">
          <Toggle
            checked={settings.protectSystemFolders}
            onChange={v => update('protectSystemFolders', v)}
            label="Protect system folders"
          />
          <Toggle
            checked={settings.protectHiddenFiles}
            onChange={v => update('protectHiddenFiles', v)}
            label="Protect hidden files"
          />
          <Toggle
            checked={settings.confirmBulkOperation}
            onChange={v => update('confirmBulkOperation', v)}
            label="Confirm before bulk operations"
          />
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Filters</h3>
        <div className="divide-y divide-[#f0f0f0] dark:divide-[#353535] mb-4">
          <Toggle
            checked={settings.excludeHiddenFiles}
            onChange={v => update('excludeHiddenFiles', v)}
            label="Exclude hidden files"
          />
          <Toggle
            checked={settings.excludeSystemFiles}
            onChange={v => update('excludeSystemFiles', v)}
            label="Exclude system files"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5 text-[#888]">
            Excluded Extensions
          </label>
          <input
            type="text"
            value={settings.excludedExtensions.join(', ')}
            onChange={e =>
              update(
                'excludedExtensions',
                e.target.value
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder=".dll, .sys"
            className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-[#888]">
            Excluded Folders
          </label>
          <input
            type="text"
            value={settings.excludedFolders.join(', ')}
            onChange={e =>
              update(
                'excludedFolders',
                e.target.value
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder="node_modules, .git"
            className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
          />
        </div>
      </section>

      {/* Auto Organize */}
      <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Auto Organize</h3>
        <Toggle
          checked={settings.autoOrganize.enabled}
          onChange={v => updateNested('autoOrganize', 'enabled', v)}
          label="Enable automatic organization"
        />

        {settings.autoOrganize.enabled && (
          <div className="mt-3">
            <label className="block text-xs font-medium mb-1.5 text-[#888]">
              Interval
            </label>
            <select
              value={settings.autoOrganize.interval}
              onChange={e =>
                updateNested('autoOrganize', 'interval', e.target.value)
              }
              className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
            >
              <option value="startup">On application startup</option>
              <option value="15min">Every 15 minutes</option>
              <option value="1hour">Every hour</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        )}
      </section>

      {/* About */}
      <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-5">
        <h3 className="text-sm font-semibold mb-2">About FileFlow</h3>
        <p className="text-xs text-[#888] dark:text-[#777] mb-2">
          Version 1.0.0
        </p>
        <p className="text-xs text-[#999] dark:text-[#666]">
          Your files stay on your computer. FileFlow does not upload your
          files or send any data to external servers.
        </p>
      </section>
    </div>
  )
}
