# Electron Browser

A modern cross-platform web browser built with Electron, TypeScript, and React.

## Features

- 🌐 **Full Web Browsing**: Browse any website with a fully functional web view
- 📑 **Tab Management**: Create, close, and switch between multiple tabs
- 🔍 **Address Bar**: Navigate to URLs or search directly
- ⬅️ **Navigation Controls**: Back, forward, reload, and home buttons
- ⭐ **Bookmarks**: Save your favorite websites for quick access
- 🕒 **History Tracking**: View and revisit your browsing history
- ⚙️ **Settings Page**: Customize your browsing experience
- 🎨 **Modern UI**: Clean, responsive interface that works on desktop
- 🔒 **Secure**: Built with Electron's security best practices

## Technology Stack

- **Electron**: Desktop application framework
- **TypeScript**: Type-safe JavaScript
- **React**: UI component library
- **Webpack**: Module bundler
- **Node.js**: Runtime environment

## Project Structure

```
Browser/
├── src/
│   ├── main/               # Electron main process
│   │   ├── main.ts         # Main entry point
│   │   ├── TabManager.ts   # Tab management logic
│   │   ├── DataManager.ts  # Data persistence
│   │   └── preload.ts      # Preload script for IPC
│   ├── renderer/           # React UI
│   │   ├── components/     # React components
│   │   │   ├── Toolbar.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── Bookmarks.tsx
│   │   │   ├── History.tsx
│   │   │   └── Settings.tsx
│   │   ├── App.tsx         # Main React app
│   │   ├── index.tsx       # React entry point
│   │   ├── index.html      # HTML template
│   │   └── styles.css      # Application styles
│   └── types/
│       └── index.ts        # TypeScript type definitions
├── dist/                   # Compiled output
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## Installation

### For End Users (Windows Executable)

**No installation required!** Just run the executable:

1. Navigate to `release\Electron Browser-win32-x64\`
2. Double-click `Electron Browser.exe`

Or use the convenient launcher:
- Double-click `Launch Browser.bat` in the root folder

### For Developers

1. **Install dependencies**:
   ```bash
   npm install
   ```

## Development

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Start the browser**:
   ```bash
   npm start
   ```

3. **Development mode** (with watch):
   ```bash
   npm run watch
   ```
   Then in another terminal:
   ```bash
   npm run dev
   ```

## Building for Production

### Create Windows Executable

To create a standalone Windows executable:

```bash
npm run package
```

This creates: `release/Electron Browser-win32-x64/Electron Browser.exe`

### Build for All Platforms

To create installers for your current platform:

```bash
npm run package:all
```

This will create executables for Windows, Mac, and Linux in the `release/` directory.

The packaged app is fully portable and doesn't require Node.js or npm to run!

## Usage

### Basic Navigation
- Enter a URL in the address bar and press Enter
- Use the back (←), forward (→), and reload (↻) buttons
- Click the home (🏠) button to go to the home page

### Tab Management
- Click the "+" button to create a new tab
- Click on a tab to switch to it
- Click the "×" on a tab to close it

### Bookmarks
- Click the star (⭐) button to bookmark the current page
- Click the bookmarks (📚) button to view all bookmarks
- Click a bookmark to navigate to it
- Click the trash icon to remove a bookmark

### History
- Click the history (🕒) button to view your browsing history
- Click any history item to revisit that page
- Use "Clear All" to delete your history

### Settings
- Click the settings (⚙️) button to open settings
- Configure your home page, search engine, zoom level, and more
- Click "Save Settings" to apply changes

## Security Features

- Context isolation enabled
- Node integration disabled in renderer
- Preload script for safe IPC communication
- Content Security Policy enforced

## Data Storage

Browser data is stored in your user data directory:
- **Windows**: `%APPDATA%/electron-browser/browser-data/`
- **macOS**: `~/Library/Application Support/electron-browser/browser-data/`
- **Linux**: `~/.config/electron-browser/browser-data/`

Files stored:
- `bookmarks.json` - Your saved bookmarks
- `history.json` - Browsing history (last 1000 items)
- `settings.json` - User preferences

## Scripts

- `npm start` - Build and run the application
- `npm run dev` - Run in development mode
- `npm run build` - Build main and renderer processes
- `npm run build:main` - Build Electron main process
- `npm run build:renderer` - Build React renderer
- `npm run watch` - Watch for changes and rebuild
- `npm run clean` - Clean the dist directory
- `npm run package` - Create distributable packages

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
