import React, { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Save, BookOpen } from 'lucide-react'
import Modal from '../components/Modal'

interface Category {
  id: string
  name: string
  extensions: string[]
  folder: string
  isCustom?: boolean
}

interface SmartRule {
  id: string
  enabled: boolean
  condition: { type: string; value: string }
  destination: string
  priority: number
}

interface CategoriesProps {
  addToast: (toast: { type: string; title: string; message: string }) => void
}

const conditionLabels: Record<string, string> = {
  extension: 'Extension equals',
  'filename-contains': 'Filename contains',
  'filename-starts': 'Filename starts with',
  'filename-ends': 'Filename ends with',
  'size-gt': 'File size greater than (bytes)',
  'size-lt': 'File size less than (bytes)',
}

export default function Categories({ addToast }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<SmartRule[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<SmartRule | null>(null)

  // Category form
  const [catName, setCatName] = useState('')
  const [catExtensions, setCatExtensions] = useState('')
  const [catFolder, setCatFolder] = useState('')

  // Rule form
  const [ruleType, setRuleType] = useState('extension')
  const [ruleValue, setRuleValue] = useState('')
  const [ruleDestination, setRuleDestination] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const cats = await window.fileflow.getCategories()
    const rls = await window.fileflow.getRules()
    setCategories(cats)
    setRules(rls)
  }

  // ── Category operations ────────────────────────────────────────────────

  const openNewCategory = () => {
    setEditingCategory(null)
    setCatName('')
    setCatExtensions('')
    setCatFolder('')
    setShowCategoryModal(true)
  }

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatExtensions(cat.extensions.join(', '))
    setCatFolder(cat.folder)
    setShowCategoryModal(true)
  }

  const saveCategory = async () => {
    if (!catName.trim() || !catExtensions.trim() || !catFolder.trim()) {
      addToast({
        type: 'error',
        title: 'Validation error',
        message: 'All fields are required',
      })
      return
    }

    const extensions = catExtensions
      .split(',')
      .map(e => {
        const trimmed = e.trim().toLowerCase()
        return trimmed.startsWith('.') ? trimmed : `.${trimmed}`
      })
      .filter(Boolean)

    let updated: Category[]
    if (editingCategory) {
      updated = categories.map(c =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: catName.trim(),
              extensions,
              folder: catFolder.trim(),
            }
          : c
      )
    } else {
      const newCat: Category = {
        id: Date.now().toString(36),
        name: catName.trim(),
        extensions,
        folder: catFolder.trim(),
        isCustom: true,
      }
      updated = [...categories, newCat]
    }

    await window.fileflow.saveCategories(updated)
    setCategories(updated)
    setShowCategoryModal(false)
    addToast({
      type: 'success',
      title: 'Category saved',
      message: `${catName.trim()} has been saved`,
    })
  }

  const deleteCategory = async (id: string) => {
    const updated = categories.filter(c => c.id !== id)
    await window.fileflow.saveCategories(updated)
    setCategories(updated)
    addToast({
      type: 'info',
      title: 'Category deleted',
      message: 'Category has been removed',
    })
  }

  // ── Rule operations ────────────────────────────────────────────────────

  const openNewRule = () => {
    setEditingRule(null)
    setRuleType('extension')
    setRuleValue('')
    setRuleDestination('')
    setShowRuleModal(true)
  }

  const openEditRule = (rule: SmartRule) => {
    setEditingRule(rule)
    setRuleType(rule.condition.type)
    setRuleValue(rule.condition.value)
    setRuleDestination(rule.destination)
    setShowRuleModal(true)
  }

  const saveRule = async () => {
    if (!ruleValue.trim() || !ruleDestination.trim()) {
      addToast({
        type: 'error',
        title: 'Validation error',
        message: 'All fields are required',
      })
      return
    }

    let updated: SmartRule[]
    if (editingRule) {
      updated = rules.map(r =>
        r.id === editingRule.id
          ? {
              ...r,
              condition: { type: ruleType, value: ruleValue.trim() },
              destination: ruleDestination.trim(),
            }
          : r
      )
    } else {
      const newRule: SmartRule = {
        id: Date.now().toString(36),
        enabled: true,
        condition: { type: ruleType, value: ruleValue.trim() },
        destination: ruleDestination.trim(),
        priority: rules.length,
      }
      updated = [...rules, newRule]
    }

    await window.fileflow.saveRules(updated)
    setRules(updated)
    setShowRuleModal(false)
    addToast({
      type: 'success',
      title: 'Rule saved',
      message: 'Smart rule has been saved',
    })
  }

  const deleteRule = async (id: string) => {
    const updated = rules.filter(r => r.id !== id)
    await window.fileflow.saveRules(updated)
    setRules(updated)
    addToast({
      type: 'info',
      title: 'Rule deleted',
      message: 'Smart rule has been removed',
    })
  }

  const toggleRule = async (id: string) => {
    const updated = rules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
    await window.fileflow.saveRules(updated)
    setRules(updated)
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Categories */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Categories</h2>
          <p className="text-sm text-[#666] dark:text-[#999]">
            File type classifications used during organization.
          </p>
        </div>
        <button
          onClick={openNewCategory}
          className="px-3 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs rounded-md transition-colors flex items-center gap-1.5"
        >
          <Plus size={13} />
          Add Category
        </button>
      </div>

      <div className="space-y-2 mb-8">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] px-4 py-3 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{cat.name}</span>
                {cat.isCustom && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e8f4fd] dark:bg-[#0078d4]/20 text-[#0078d4] dark:text-[#4cc2ff]">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-[#888] dark:text-[#777] mt-0.5 truncate">
                {cat.extensions.join(', ')} → {cat.folder}/
              </p>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <button
                onClick={() => openEditCategory(cat)}
                className="p-1.5 text-[#888] hover:text-[#0078d4] hover:bg-[#e8f4fd] dark:hover:bg-[#0078d4]/20 rounded transition-colors"
              >
                <Edit3 size={13} />
              </button>
              {cat.isCustom && (
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-[#888] hover:text-[#d13438] hover:bg-[#fdf2f2] dark:hover:bg-[#3d2020] rounded transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Rules */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Smart Rules</h3>
          <p className="text-sm text-[#666] dark:text-[#999]">
            Custom rules that override default category matching.
          </p>
        </div>
        <button
          onClick={openNewRule}
          className="px-3 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs rounded-md transition-colors flex items-center gap-1.5"
        >
          <Plus size={13} />
          Add Rule
        </button>
      </div>

      {rules.length === 0 && (
        <div className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] p-6 text-center">
          <BookOpen
            size={28}
            className="mx-auto mb-2 text-[#ccc] dark:text-[#555]"
          />
          <p className="text-sm text-[#999]">No smart rules configured</p>
          <p className="text-xs text-[#bbb] dark:text-[#666] mt-1">
            Rules let you customize where specific files go
          </p>
        </div>
      )}

      <div className="space-y-2">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#e0e0e0] dark:border-[#404040] px-4 py-3 flex items-center justify-between ${
              !rule.enabled ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => toggleRule(rule.id)}
                className="rounded"
              />
              <div>
                <p className="text-sm">
                  IF{' '}
                  <span className="font-medium text-[#0078d4] dark:text-[#4cc2ff]">
                    {conditionLabels[rule.condition.type] ||
                      rule.condition.type}
                  </span>{' '}
                  &quot;
                  <span className="font-mono text-xs">
                    {rule.condition.value}
                  </span>
                  &quot;
                </p>
                <p className="text-xs text-[#888] mt-0.5">
                  → Move to{' '}
                  <span className="font-medium">{rule.destination}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <button
                onClick={() => openEditRule(rule)}
                className="p-1.5 text-[#888] hover:text-[#0078d4] hover:bg-[#e8f4fd] dark:hover:bg-[#0078d4]/20 rounded transition-colors"
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={() => deleteRule(rule.id)}
                className="p-1.5 text-[#888] hover:text-[#d13438] hover:bg-[#fdf2f2] dark:hover:bg-[#3d2020] rounded transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              placeholder="e.g., College Files"
              className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Extensions
            </label>
            <input
              type="text"
              value={catExtensions}
              onChange={e => setCatExtensions(e.target.value)}
              placeholder="e.g., .pdf, .docx, .pptx"
              className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
            />
            <p className="text-xs text-[#999] mt-1">
              Separate extensions with commas
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Destination Folder
            </label>
            <input
              type="text"
              value={catFolder}
              onChange={e => setCatFolder(e.target.value)}
              placeholder="e.g., College Files"
              className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="px-4 py-2 text-sm bg-[#f0f0f0] dark:bg-[#404040] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveCategory}
              className="px-4 py-2 text-sm bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-md transition-colors flex items-center gap-1.5"
            >
              <Save size={13} />
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Rule Modal */}
      <Modal
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={editingRule ? 'Edit Rule' : 'New Smart Rule'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Condition
            </label>
            <select
              value={ruleType}
              onChange={e => setRuleType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
            >
              {Object.entries(conditionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Value</label>
            <input
              type="text"
              value={ruleValue}
              onChange={e => setRuleValue(e.target.value)}
              placeholder={
                ruleType === 'extension'
                  ? '.mp4'
                  : ruleType.includes('size')
                    ? '1048576'
                    : 'screenshot'
              }
              className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Move to folder
            </label>
            <input
              type="text"
              value={ruleDestination}
              onChange={e => setRuleDestination(e.target.value)}
              placeholder="e.g., Screenshots"
              className="w-full px-3 py-2 text-sm bg-[#f5f5f5] dark:bg-[#383838] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded-md focus:border-[#0078d4]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowRuleModal(false)}
              className="px-4 py-2 text-sm bg-[#f0f0f0] dark:bg-[#404040] hover:bg-[#e0e0e0] dark:hover:bg-[#4a4a4a] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveRule}
              className="px-4 py-2 text-sm bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-md transition-colors flex items-center gap-1.5"
            >
              <Save size={13} />
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
