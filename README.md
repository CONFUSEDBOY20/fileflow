# FileFlow — Smart File Organizer

A professional Windows desktop application that automatically organizes messy files into separate folders based on their file type.

## Features

- **Smart Classification** — Automatically classifies files into 12 categories (Videos, Photos, Documents, Music, Archives, Code, Fonts, and more)
- **Preview Before Organizing** — See exactly what will happen before any files are moved
- **Undo System** — Reverse any organization operation with one click
- **Custom Categories** — Create your own file type categories with custom extensions
- **Smart Rules** — Define rules like "if filename contains 'invoice' → move to Documents/Invoices"
- **Dark/Light Mode** — Follows your Windows system theme, or set manually
- **Activity History** — Complete log of all organization operations with per-operation undo
- **File Search** — Search organized files by name
- **Safety First** — Protected system folders, duplicate handling, confirmation prompts
- **System Tray** — Minimize to tray, stays accessible without cluttering your taskbar
- **Auto Organize** — Optional scheduled organization (every 15 min / hourly / daily / on startup)
- **100% Local** — Your files stay on your computer. No uploads, no accounts, no tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron 28 |
| Frontend | React 18 + TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Build Tool | Vite 5 |
| IPC Bridge | Electron contextBridge |
| Packaging | electron-builder |
| Icons | Lucide React |

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later

### Setup

```bash
# Clone or navigate to the project
cd fileflow

# Install dependencies
npm install

# Start development
npm run dev
```

## Development

```bash
# Start in development mode (hot-reload)
npm run dev

# Type-check
npm run build
```

The development server starts Vite for the React renderer and compiles the Electron main process simultaneously. Changes to both renderer and main process code are hot-reloaded.

## Build & Package

```bash
# Build for production
npm run build

# Create Windows installer (.exe)
npm run package
```

The installer is output to the `release/` directory.

### Output

```
release/
├── FileFlow Setup 1.0.0.exe
└── ...
```

### Supported Platforms

- Windows 10
- Windows 11

## File Classification Rules

| Category | Extensions |
|----------|-----------|
| Videos | .mp4, .mkv, .avi, .mov, .wmv, .flv, .webm, .m4v, .3gp |
| Photos | .jpg, .jpeg, .png, .webp, .gif, .bmp, .tiff, .svg, .heic |
| Music | .mp3, .wav, .flac, .m4a, .aac, .ogg, .wma |
| Documents | .pdf, .doc, .docx, .txt, .rtf, .odt, .pages |
| Spreadsheets | .xls, .xlsx, .csv, .ods |
| Presentations | .ppt, .pptx, .odp |
| Archives | .zip, .rar, .7z, .tar, .gz, .bz2 |
| Applications | .exe, .msi, .msp, .bat, .cmd |
| Code | .js, .ts, .jsx, .tsx, .py, .cpp, .c, .java, .php, .html, .css, .json, .xml, .sql |
| Fonts | .ttf, .otf, .woff, .woff2 |
| Disk Images | .iso, .img |
| Others | Everything else |

All categories are fully customizable. Users can add, edit, or delete categories.

## Safety

### Protected Folders

The following folders are blocked by default:

- `C:\`
- `C:\Windows`
- `C:\Program Files`
- `C:\Program Files (x86)`
- `C:\ProgramData`

### Excluded Folders (during scan)

- `node_modules`
- `.git`
- `__pycache__`
- `$RECYCLE.BIN`
- `System Volume Information`

### Duplicate Handling

When a destination file already exists:

- **Rename automatically** (default) — Creates `file (1).ext`, `file (2).ext`, etc.
- **Skip** — Leaves the file in its original location
- **Replace** — Overwrites the existing file

### Privacy

FileFlow operates entirely offline. It does not:

- Upload files to any server
- Send filenames to external APIs
- Require an account or sign-in
- Collect any personal data

## Project Structure

```
fileflow/
├── electron/
│   ├── main.ts              # Electron main process + IPC handlers
│   ├── preload.ts            # Context bridge (secure IPC)
│   └── services/
│       ├── classifier.ts     # File type classification
│       ├── organizer.ts      # File move/copy operations
│       ├── scanner.ts        # Filesystem scanning
│       ├── store.ts          # Local JSON persistence
│       ├── rules.ts          # Smart rules engine
│       └── undo.ts           # Undo history management
├── src/
│   ├── App.tsx               # Root component + routing
│   ├── main.tsx              # React entry point
│   ├── index.css             # Global styles
│   ├── types.ts              # Shared TypeScript types
│   ├── components/
│   │   ├── FileTable.tsx     # Paginated, sortable file list
│   │   ├── Modal.tsx         # Dialog component
│   │   ├── ProgressBar.tsx   # Progress indicator
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── StatCard.tsx      # Statistics card
│   │   └── Toast.tsx         # Notification toasts
│   ├── pages/
│   │   ├── Activity.tsx      # Operation history
│   │   ├── Categories.tsx    # Category + rule management
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Organize.tsx      # Core scan → preview → organize flow
│   │   ├── Settings.tsx      # App configuration
│   │   └── Welcome.tsx       # First-launch experience
│   └── utils/
│       └── format.ts         # Number/size/date formatters
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── tsconfig.node.json
```

## Troubleshooting

### "Cannot find module" errors

```bash
rm -rf node_modules
npm install
```

### Electron doesn't start

Make sure the Vite dev server is running. The `npm run dev` command handles both automatically.

### Build fails on Windows

Ensure you have the necessary Windows build tools:

```bash
npm install --global windows-build-tools
```

### Files not being moved

- Check that the source files are not locked by another application
- Verify you have write permissions to the destination folder
- Check the Activity page for detailed error messages

## License

MIT
