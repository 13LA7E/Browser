import { app, BrowserWindow, BrowserView, ipcMain, session, shell, Menu, globalShortcut, screen } from 'electron';
import * as path from 'path';
import { TabManager } from './TabManager';
import { DataManager } from './DataManager';
import { IPC, Download } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Suppress harmless Chromium warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
app.commandLine.appendSwitch('--disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('--disable-site-isolation-trials');

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(' ');
  // Suppress known harmless warnings
  if (message.includes('interface_endpoint_client.cc') ||
      message.includes('interface blink.mojom.Widget') ||
      message.includes('ssl_client_socket_impl.cc') ||
      message.includes('handshake failed') ||
      message.includes('googleapis.com') ||
      message.includes('getExperiment') ||
      message.includes('experiment isn\'t registered') ||
      message.includes('ERR_BLOCKED_BY_RESPONSE') ||
      message.includes('ERR_NAME_NOT_RESOLVED')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

let mainWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;
let dataManager: DataManager | null = null;

// Track all browser windows and their managers
const browserWindows: Map<BrowserWindow, { tabManager: TabManager, dataManager: DataManager }> = new Map();

function createNewWindow(initialUrl?: string) {
  const newWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    backgroundColor: '#1c1c1c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the renderer
  newWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Create new tab manager and data manager for this window
  const newTabManager = new TabManager(newWindow);
  const newDataManager = new DataManager();
  
  browserWindows.set(newWindow, { tabManager: newTabManager, dataManager: newDataManager });

  // Setup keyboard shortcuts
  setupGlobalShortcuts();

  // Setup downloads
  setupDownloads();

  // Setup window snapping
  setupWindowSnapping(newWindow);

  // Create initial tab once renderer is loaded
  newWindow.webContents.once('did-finish-load', () => {
    const tab = newTabManager.createTab(initialUrl || 'https://www.google.com');
    newWindow.webContents.send(IPC.CREATE_TAB, tab);
  });

  newWindow.on('closed', () => {
    browserWindows.delete(newWindow);
  });

  return newWindow;
}

function createWindow() {
  mainWindow = createNewWindow();
  tabManager = browserWindows.get(mainWindow)!.tabManager;
  dataManager = browserWindows.get(mainWindow)!.dataManager;
  
  // Set up IPC handlers (only once for all windows)
  setupIpcHandlers();

  // Wait for renderer to be ready before creating tabs
  mainWindow.webContents.once('did-finish-load', () => {
    // Restore session if enabled
    const settings = dataManager!.getSettings();
    if (settings.restoreSession) {
      const session = dataManager!.restoreSession();
      if (session && session.tabs.length > 0) {
        session.tabs.forEach((tab, index) => {
          tabManager?.createTab(tab.url);
        });
      }
    }

    // Create initial tab if no tabs exist  
    if (tabManager && mainWindow) {
      const tabs = Array.from(tabManager['tabs'].keys());
      if (tabs.length === 0) {
        const initialTab = tabManager.createTab('https://www.google.com');
        // Send initial tab to renderer
        mainWindow.webContents.send(IPC.CREATE_TAB, initialTab);
      }
    }
  });

  mainWindow.on('closed', () => {
    // Save session before closing
    if (tabManager && dataManager) {
      const tabs = tabManager.getAllTabs();
      dataManager.saveSession({
        tabs: tabs.map(tab => ({ url: tab.url, title: tab.title })),
        activeTabIndex: 0
      });
    }
    
    // Unregister shortcuts
    globalShortcut.unregisterAll();
    
    mainWindow = null;
    tabManager = null;
  });
}

function setupWindowSnapping(window: BrowserWindow) {
  let isMoving = false;
  let windowState: { isMaximized: boolean, bounds?: Electron.Rectangle } = { isMaximized: false };

  // Track window movement
  window.on('will-move', () => {
    isMoving = true;
    // Save bounds before moving if not already maximized
    if (!window.isMaximized()) {
      windowState.bounds = window.getBounds();
    }
  });

  window.on('moved', () => {
    if (isMoving && !window.isMaximized()) {
      const cursorPos = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(cursorPos);
      const workArea = display.workArea;
      
      const snapThreshold = 20; // pixels from edge to trigger snap
      const cornerThreshold = 100; // pixels from corner to trigger corner snap
      
      // Check distance from edges
      const distFromLeft = cursorPos.x - workArea.x;
      const distFromRight = (workArea.x + workArea.width) - cursorPos.x;
      const distFromTop = cursorPos.y - workArea.y;
      const distFromBottom = (workArea.y + workArea.height) - cursorPos.y;
      
      // Top edge - maximize
      if (distFromTop < snapThreshold && distFromTop >= 0) {
        window.maximize();
        windowState.isMaximized = true;
      }
      // Top-left corner - quarter snap
      else if (distFromLeft < cornerThreshold && distFromTop < cornerThreshold) {
        window.setBounds({
          x: workArea.x,
          y: workArea.y,
          width: Math.floor(workArea.width / 2),
          height: Math.floor(workArea.height / 2)
        });
      }
      // Top-right corner - quarter snap
      else if (distFromRight < cornerThreshold && distFromTop < cornerThreshold) {
        window.setBounds({
          x: workArea.x + Math.floor(workArea.width / 2),
          y: workArea.y,
          width: Math.floor(workArea.width / 2),
          height: Math.floor(workArea.height / 2)
        });
      }
      // Bottom-left corner - quarter snap
      else if (distFromLeft < cornerThreshold && distFromBottom < cornerThreshold) {
        window.setBounds({
          x: workArea.x,
          y: workArea.y + Math.floor(workArea.height / 2),
          width: Math.floor(workArea.width / 2),
          height: Math.floor(workArea.height / 2)
        });
      }
      // Bottom-right corner - quarter snap
      else if (distFromRight < cornerThreshold && distFromBottom < cornerThreshold) {
        window.setBounds({
          x: workArea.x + Math.floor(workArea.width / 2),
          y: workArea.y + Math.floor(workArea.height / 2),
          width: Math.floor(workArea.width / 2),
          height: Math.floor(workArea.height / 2)
        });
      }
      // Left edge - half screen
      else if (distFromLeft < snapThreshold) {
        window.setBounds({
          x: workArea.x,
          y: workArea.y,
          width: Math.floor(workArea.width / 2),
          height: workArea.height
        });
      }
      // Right edge - half screen
      else if (distFromRight < snapThreshold) {
        window.setBounds({
          x: workArea.x + Math.floor(workArea.width / 2),
          y: workArea.y,
          width: Math.floor(workArea.width / 2),
          height: workArea.height
        });
      }
    }
    
    setTimeout(() => {
      isMoving = false;
    }, 100);
  });

  // Restore previous size when unmaximizing by dragging
  window.on('unmaximize', () => {
    if (windowState.bounds && isMoving) {
      // When dragging from maximized, restore to saved bounds
      window.setBounds(windowState.bounds);
    }
    windowState.isMaximized = false;
  });
}

function setupIpcHandlers() {
  // Helper to get managers for the window that sent the event
  const getManagers = (event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    return browserWindows.get(window);
  };

  // Navigation handlers
  ipcMain.on(IPC.NAVIGATE_TO, (event, url: string) => {
    const managers = getManagers(event);
    managers?.tabManager.navigateTo(url);
  });

  ipcMain.on(IPC.NAVIGATE_BACK, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.goBack();
  });

  ipcMain.on(IPC.NAVIGATE_FORWARD, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.goForward();
  });

  ipcMain.on(IPC.RELOAD, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.reload();
  });

  ipcMain.on(IPC.STOP, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.stop();
  });

  // Window controls
  ipcMain.on('minimize-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  ipcMain.on('maximize-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.on('close-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  // Tab handlers
  ipcMain.on(IPC.CREATE_TAB, (event, url?: string) => {
    const managers = getManagers(event);
    if (managers) {
      const tab = managers.tabManager.createTab(url);
      event.reply(IPC.CREATE_TAB, tab);
    }
  });

  ipcMain.on(IPC.CLOSE_TAB, (event, tabId: string) => {
    const managers = getManagers(event);
    managers?.tabManager.closeTab(tabId);
  });

  ipcMain.on(IPC.SWITCH_TAB, (event, tabId: string) => {
    const managers = getManagers(event);
    managers?.tabManager.switchTab(tabId);
  });

  // Bookmark handlers
  ipcMain.handle(IPC.ADD_BOOKMARK, async (event, title: string, url: string) => {
    const managers = getManagers(event);
    return managers?.dataManager.addBookmark(title, url);
  });

  ipcMain.handle(IPC.REMOVE_BOOKMARK, async (event, id: string) => {
    const managers = getManagers(event);
    return managers?.dataManager.removeBookmark(id);
  });

  ipcMain.handle(IPC.GET_BOOKMARKS, async (event) => {
    const managers = getManagers(event);
    return managers?.dataManager.getBookmarks();
  });

  // History handlers
  ipcMain.on(IPC.ADD_HISTORY, (event, title: string, url: string) => {
    const managers = getManagers(event);
    managers?.dataManager.addHistory(title, url);
  });

  ipcMain.handle(IPC.GET_HISTORY, async (event) => {
    const managers = getManagers(event);
    return managers?.dataManager.getHistory();
  });

  ipcMain.handle(IPC.CLEAR_HISTORY, async (event) => {
    const managers = getManagers(event);
    return managers?.dataManager.clearHistory();
  });

  // Settings handlers
  ipcMain.handle(IPC.GET_SETTINGS, async (event) => {
    const managers = getManagers(event);
    return managers?.dataManager.getSettings();
  });

  ipcMain.handle(IPC.UPDATE_SETTINGS, async (event, settings: any) => {
    const managers = getManagers(event);
    return managers?.dataManager.updateSettings(settings);
  });

  // Advanced features
  ipcMain.on(IPC.ZOOM_IN, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.zoomIn();
  });

  ipcMain.on(IPC.ZOOM_OUT, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.zoomOut();
  });

  ipcMain.on(IPC.ZOOM_RESET, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.zoomReset();
  });

  ipcMain.on(IPC.TOGGLE_DEVTOOLS, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.toggleDevTools();
  });

  ipcMain.on(IPC.FIND_IN_PAGE, (event, text: string) => {
    const managers = getManagers(event);
    managers?.tabManager.findInPage(text);
  });

  ipcMain.on(IPC.STOP_FIND_IN_PAGE, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.stopFindInPage();
  });

  ipcMain.on(IPC.HIDE_BROWSER_VIEW, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.hideBrowserView();
  });

  ipcMain.on(IPC.SHOW_BROWSER_VIEW, (event) => {
    const managers = getManagers(event);
    managers?.tabManager.showBrowserView();
  });

  ipcMain.on(IPC.DUPLICATE_TAB, (event, tabId: string) => {
    const managers = getManagers(event);
    if (managers) {
      const newTab = managers.tabManager.duplicateTab(tabId);
      if (newTab) {
        event.reply(IPC.CREATE_TAB, newTab);
      }
    }
  });

  ipcMain.handle(IPC.GET_DOWNLOADS, async (event) => {
    const managers = getManagers(event);
    return managers?.dataManager.getDownloads();
  });

  ipcMain.on(IPC.OPEN_DOWNLOAD, (event, filepath: string) => {
    shell.openPath(filepath);
  });

  ipcMain.on(IPC.SHOW_DOWNLOAD_FOLDER, (event) => {
    const managers = getManagers(event);
    const settings = managers?.dataManager.getSettings();
    if (settings) {
      shell.openPath(settings.downloadPath);
    }
  });

  // Window management handlers
  ipcMain.on(IPC.DETACH_TAB, (event, tabId: string, url: string, title: string) => {
    const managers = getManagers(event);
    // Close tab in current window
    managers?.tabManager.closeTab(tabId);
    // Create new window with the tab
    createNewWindow(url);
  });

  ipcMain.on(IPC.CREATE_NEW_WINDOW, (event, url?: string) => {
    createNewWindow(url);
  });

  ipcMain.handle(IPC.GET_CAN_GO_BACK, async (event) => {
    const managers = getManagers(event);
    return managers?.tabManager.canGoBack();
  });

  ipcMain.handle(IPC.GET_CAN_GO_FORWARD, async (event) => {
    const managers = getManagers(event);
    return managers?.tabManager.canGoForward();
  });
}

function setupGlobalShortcuts() {
  if (!mainWindow) return;

  // New tab
  globalShortcut.register('CommandOrControl+T', () => {
    mainWindow?.webContents.send(IPC.CREATE_TAB);
  });

  // Close tab
  globalShortcut.register('CommandOrControl+W', () => {
    // Send signal to close active tab
    mainWindow?.webContents.send(IPC.CLOSE_TAB);
  });

  // Reload
  globalShortcut.register('CommandOrControl+R', () => {
    tabManager?.reload();
  });

  // Hard reload
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    tabManager?.reload();
  });

  // Zoom in
  globalShortcut.register('CommandOrControl+Plus', () => {
    tabManager?.zoomIn();
  });

  globalShortcut.register('CommandOrControl+=', () => {
    tabManager?.zoomIn();
  });

  // Zoom out
  globalShortcut.register('CommandOrControl+-', () => {
    tabManager?.zoomOut();
  });

  // Reset zoom
  globalShortcut.register('CommandOrControl+0', () => {
    tabManager?.zoomReset();
  });

  // DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    tabManager?.toggleDevTools();
  });

  globalShortcut.register('F12', () => {
    tabManager?.toggleDevTools();
  });

  // Find in page
  globalShortcut.register('CommandOrControl+F', () => {
    mainWindow?.webContents.send('show-find-in-page');
  });

  // Back/Forward
  globalShortcut.register('Alt+Left', () => {
    tabManager?.goBack();
  });

  globalShortcut.register('Alt+Right', () => {
    tabManager?.goForward();
  });

  // Home
  globalShortcut.register('Alt+Home', () => {
    const settings = dataManager?.getSettings();
    if (settings) {
      tabManager?.navigateTo(settings.homePage);
    }
  });

  // Bookmarks
  globalShortcut.register('CommandOrControl+D', () => {
    mainWindow?.webContents.send('add-bookmark-shortcut');
  });
}

function setupDownloads() {
  if (!mainWindow) return;

  session.defaultSession.on('will-download', (event, item, webContents) => {
    const settings = dataManager?.getSettings();
    if (!settings) return;

    const downloadId = uuidv4();
    const filename = item.getFilename();
    const savePath = path.join(settings.downloadPath, filename);
    
    item.setSavePath(savePath);

    const download: Download = {
      id: downloadId,
      filename,
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: 0,
      state: 'progressing',
      startTime: Date.now(),
      savePath
    };

    dataManager?.addDownload(download);
    mainWindow?.webContents.send(IPC.DOWNLOAD_ITEM, download);

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        download.state = 'interrupted';
      } else if (state === 'progressing') {
        download.state = 'progressing';
        download.receivedBytes = item.getReceivedBytes();
        download.totalBytes = item.getTotalBytes();
      }
      dataManager?.updateDownload(downloadId, download);
      mainWindow?.webContents.send(IPC.DOWNLOAD_PROGRESS, download);
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        download.state = 'completed';
        download.receivedBytes = download.totalBytes;
        dataManager?.updateDownload(downloadId, download);
        mainWindow?.webContents.send(IPC.DOWNLOAD_COMPLETE, download);
      } else if (state === 'cancelled') {
        download.state = 'cancelled';
        dataManager?.updateDownload(downloadId, download);
      }
    });
  });
}

app.on('ready', () => {
  // Suppress harmless console errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('interface_endpoint_client.cc') ||
        message.includes('Network location provider') ||
        message.includes('googleapis.com')) {
      return;
    }
    originalError.apply(console, args);
  };
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
