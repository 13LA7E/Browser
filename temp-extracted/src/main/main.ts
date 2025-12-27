import { app, BrowserWindow, BrowserView, ipcMain, session, shell, Menu, globalShortcut } from 'electron';
import * as path from 'path';
import { TabManager } from './TabManager';
import { DataManager } from './DataManager';
import { IPC, Download } from '../types';
import { v4 as uuidv4 } from 'uuid';

let mainWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;
let dataManager: DataManager | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#2c2c2c',
      symbolColor: '#ffffff',
      height: 40
    }
  });

  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Initialize managers
  tabManager = new TabManager(mainWindow);
  dataManager = new DataManager();

  // Set up IPC handlers
  setupIpcHandlers();

  // Setup keyboard shortcuts
  setupGlobalShortcuts();

  // Setup downloads
  setupDownloads();

  // Restore session if enabled
  const settings = dataManager.getSettings();
  if (settings.restoreSession) {
    const session = dataManager.restoreSession();
    if (session && session.tabs.length > 0) {
      session.tabs.forEach((tab, index) => {
        tabManager?.createTab(tab.url);
      });
    }
  }

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

function setupIpcHandlers() {
  if (!tabManager || !dataManager) return;

  // Navigation handlers
  ipcMain.on(IPC.NAVIGATE_TO, (event, url: string) => {
    tabManager?.navigateTo(url);
  });

  ipcMain.on(IPC.NAVIGATE_BACK, () => {
    tabManager?.goBack();
  });

  ipcMain.on(IPC.NAVIGATE_FORWARD, () => {
    tabManager?.goForward();
  });

  ipcMain.on(IPC.RELOAD, () => {
    tabManager?.reload();
  });

  ipcMain.on(IPC.STOP, () => {
    tabManager?.stop();
  });

  // Tab handlers
  ipcMain.on(IPC.CREATE_TAB, (event, url?: string) => {
    const tab = tabManager?.createTab(url);
    event.reply(IPC.CREATE_TAB, tab);
  });

  ipcMain.on(IPC.CLOSE_TAB, (event, tabId: string) => {
    tabManager?.closeTab(tabId);
  });

  ipcMain.on(IPC.SWITCH_TAB, (event, tabId: string) => {
    tabManager?.switchTab(tabId);
  });

  // Bookmark handlers
  ipcMain.handle(IPC.ADD_BOOKMARK, async (event, title: string, url: string) => {
    return dataManager?.addBookmark(title, url);
  });

  ipcMain.handle(IPC.REMOVE_BOOKMARK, async (event, id: string) => {
    return dataManager?.removeBookmark(id);
  });

  ipcMain.handle(IPC.GET_BOOKMARKS, async () => {
    return dataManager?.getBookmarks();
  });

  // History handlers
  ipcMain.on(IPC.ADD_HISTORY, (event, title: string, url: string) => {
    dataManager?.addHistory(title, url);
  });

  ipcMain.handle(IPC.GET_HISTORY, async () => {
    return dataManager?.getHistory();
  });

  ipcMain.handle(IPC.CLEAR_HISTORY, async () => {
    return dataManager?.clearHistory();
  });

  // Settings handlers
  ipcMain.handle(IPC.GET_SETTINGS, async () => {
    return dataManager?.getSettings();
  });

  ipcMain.handle(IPC.UPDATE_SETTINGS, async (event, settings: any) => {
    return dataManager?.updateSettings(settings);
  });

  // Advanced features
  ipcMain.on(IPC.ZOOM_IN, () => {
    tabManager?.zoomIn();
  });

  ipcMain.on(IPC.ZOOM_OUT, () => {
    tabManager?.zoomOut();
  });

  ipcMain.on(IPC.ZOOM_RESET, () => {
    tabManager?.zoomReset();
  });

  ipcMain.on(IPC.TOGGLE_DEVTOOLS, () => {
    tabManager?.toggleDevTools();
  });

  ipcMain.on(IPC.FIND_IN_PAGE, (event, text: string) => {
    tabManager?.findInPage(text);
  });

  ipcMain.on(IPC.STOP_FIND_IN_PAGE, () => {
    tabManager?.stopFindInPage();
  });

  ipcMain.on(IPC.DUPLICATE_TAB, (event, tabId: string) => {
    const newTab = tabManager?.duplicateTab(tabId);
    if (newTab) {
      event.reply(IPC.CREATE_TAB, newTab);
    }
  });

  ipcMain.handle(IPC.GET_DOWNLOADS, async () => {
    return dataManager?.getDownloads();
  });

  ipcMain.on(IPC.OPEN_DOWNLOAD, (event, filepath: string) => {
    shell.openPath(filepath);
  });

  ipcMain.on(IPC.SHOW_DOWNLOAD_FOLDER, () => {
    const settings = dataManager?.getSettings();
    if (settings) {
      shell.openPath(settings.downloadPath);
    }
  });

  ipcMain.handle(IPC.GET_CAN_GO_BACK, async () => {
    return tabManager?.canGoBack();
  });

  ipcMain.handle(IPC.GET_CAN_GO_FORWARD, async () => {
    return tabManager?.canGoForward();
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

app.on('ready', createWindow);

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
