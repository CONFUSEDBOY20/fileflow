export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatNumber(num: number): string {
  return num.toLocaleString()
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 1) {
    const diffMin = Math.floor(diffMs / (1000 * 60))
    return diffMin <= 1 ? 'Just now' : `${diffMin} minutes ago`
  }

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString()
}

export function formatRelativeDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dateDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )

  if (dateDay.getTime() === today.getTime()) return 'Today'
  if (dateDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return date.toLocaleDateString()
}
