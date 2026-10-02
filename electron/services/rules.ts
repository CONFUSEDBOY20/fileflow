import path from 'path'

export interface SmartRule {
  id: string
  enabled: boolean
  condition: {
    type: 'extension' | 'filename-contains' | 'filename-starts' | 'filename-ends' | 'size-gt' | 'size-lt'
    value: string
  }
  destination: string
  priority: number
}

export function applyRules(
  fileName: string,
  fileSize: number,
  rules: SmartRule[]
): { matched: boolean; destination: string } | null {
  const sortedRules = [...rules]
    .filter(r => r.enabled)
    .sort((a, b) => a.priority - b.priority)

  for (const rule of sortedRules) {
    const { type, value } = rule.condition
    const nameLower = fileName.toLowerCase()
    const valueLower = value.toLowerCase()

    let matched = false

    switch (type) {
      case 'extension': {
        const ext = path.extname(fileName).toLowerCase()
        const normalizedValue = valueLower.startsWith('.') ? valueLower : `.${valueLower}`
        matched = ext === normalizedValue
        break
      }
      case 'filename-contains':
        matched = nameLower.includes(valueLower)
        break
      case 'filename-starts':
        matched = nameLower.startsWith(valueLower)
        break
      case 'filename-ends': {
        const nameNoExt = path.parse(fileName).name.toLowerCase()
        matched = nameNoExt.endsWith(valueLower)
        break
      }
      case 'size-gt':
        matched = fileSize > parseInt(value, 10)
        break
      case 'size-lt':
        matched = fileSize < parseInt(value, 10)
        break
    }

    if (matched) {
      return { matched: true, destination: rule.destination }
    }
  }

  return null
}
