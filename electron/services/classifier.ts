import path from 'path'

export interface Category {
  id: string
  name: string
  extensions: string[]
  folder: string
  isCustom?: boolean
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'videos',
    name: 'Videos',
    extensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp'],
    folder: 'Videos',
  },
  {
    id: 'photos',
    name: 'Photos',
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.svg', '.heic'],
    folder: 'Photos',
  },
  {
    id: 'music',
    name: 'Music',
    extensions: ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma'],
    folder: 'Music',
  },
  {
    id: 'documents',
    name: 'Documents',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'],
    folder: 'Documents',
  },
  {
    id: 'spreadsheets',
    name: 'Spreadsheets',
    extensions: ['.xls', '.xlsx', '.csv', '.ods'],
    folder: 'Spreadsheets',
  },
  {
    id: 'presentations',
    name: 'Presentations',
    extensions: ['.ppt', '.pptx', '.odp'],
    folder: 'Presentations',
  },
  {
    id: 'archives',
    name: 'Archives',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
    folder: 'Archives',
  },
  {
    id: 'applications',
    name: 'Applications',
    extensions: ['.exe', '.msi', '.msp', '.bat', '.cmd'],
    folder: 'Applications',
  },
  {
    id: 'code',
    name: 'Code',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.cpp', '.c', '.java', '.php', '.html', '.css', '.json', '.xml', '.sql'],
    folder: 'Code',
  },
  {
    id: 'fonts',
    name: 'Fonts',
    extensions: ['.ttf', '.otf', '.woff', '.woff2'],
    folder: 'Fonts',
  },
  {
    id: 'disk-images',
    name: 'Disk Images',
    extensions: ['.iso', '.img'],
    folder: 'Disk Images',
  },
]

export function classifyFile(
  fileName: string,
  categories: Category[]
): { category: string; folder: string } {
  const ext = path.extname(fileName).toLowerCase()

  for (const cat of categories) {
    if (cat.extensions.includes(ext)) {
      return { category: cat.name, folder: cat.folder }
    }
  }

  return { category: 'Others', folder: 'Others' }
}
