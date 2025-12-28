import { contextBridge, ipcRenderer } from 'electron';

// Define IPC channels directly to avoid import issues
const IPC = {
  NAVIGATE_TO: 'navigate-to',
  NAVIGATE_BACK: 'navigate-back',
  NAVIGATE_FORWARD: 'navigate-forward',
  RELOAD: 'reload',
  STOP: 'stop',
  CREATE_TAB: 'create-tab',
  CLOSE_TAB: 'close-tab',
  SWITCH_TAB: 'switch-tab',
  PAGE_TITLE_UPDATED: 'page-title-updated',
  PAGE_FAVICON_UPDATED: 'page-favicon-updated',
  PAGE_LOADING: 'page-loading',
  PAGE_LOADED: 'page-loaded',
  ADD_BOOKMARK: 'add-bookmark',
  REMOVE_BOOKMARK: 'remove-bookmark',
  GET_BOOKMARKS: 'get-bookmarks',
  ADD_HISTORY: 'add-history',
  GET_HISTORY: 'get-history',
  CLEAR_HISTORY: 'clear-history',
  GET_SETTINGS: 'get-settings',
  UPDATE_SETTINGS: 'update-settings',
  ZOOM_IN: 'zoom-in',
  ZOOM_OUT: 'zoom-out',
  ZOOM_RESET: 'zoom-reset',
  TOGGLE_DEVTOOLS: 'toggle-devtools',
  FIND_IN_PAGE: 'find-in-page',
  STOP_FIND_IN_PAGE: 'stop-find-in-page',
  DUPLICATE_TAB: 'duplicate-tab',
  DOWNLOAD_ITEM: 'download-item',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETE: 'download-complete',
  GET_DOWNLOADS: 'get-downloads',
  OPEN_DOWNLOAD: 'open-download',
  SHOW_DOWNLOAD_FOLDER: 'show-download-folder',
  GET_CAN_GO_BACK: 'get-can-go-back',
  GET_CAN_GO_FORWARD: 'get-can-go-forward',
  HIDE_BROWSER_VIEW: 'hide-browser-view',
  SHOW_BROWSER_VIEW: 'show-browser-view',
  DETACH_TAB: 'detach-tab',
  CREATE_NEW_WINDOW: 'create-new-window'
} as const;

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  navigateTo: (url: string) => ipcRenderer.send(IPC.NAVIGATE_TO, url),
  navigateBack: () => ipcRenderer.send(IPC.NAVIGATE_BACK),
  navigateForward: () => ipcRenderer.send(IPC.NAVIGATE_FORWARD),
  reload: () => ipcRenderer.send(IPC.RELOAD),
  stop: () => ipcRenderer.send(IPC.STOP),

  // Tabs
  createTab: (url?: string) => ipcRenderer.send(IPC.CREATE_TAB, url),
  closeTab: (tabId: string) => ipcRenderer.send(IPC.CLOSE_TAB, tabId),
  switchTab: (tabId: string) => ipcRenderer.send(IPC.SWITCH_TAB, tabId),
  onTabCreated: (callback: (tab: any) => void) => {
    ipcRenderer.on(IPC.CREATE_TAB, (event, tab) => callback(tab));
  },

  // Page events
  onPageTitleUpdated: (callback: (tabId: string, title: string) => void) => {
    ipcRenderer.on(IPC.PAGE_TITLE_UPDATED, (event, tabId, title) => callback(tabId, title));
  },
  onPageFaviconUpdated: (callback: (tabId: string, favicon: string) => void) => {
    ipcRenderer.on(IPC.PAGE_FAVICON_UPDATED, (event, tabId, favicon) => callback(tabId, favicon));
  },
  onPageLoading: (callback: (tabId: string) => void) => {
    ipcRenderer.on(IPC.PAGE_LOADING, (event, tabId) => callback(tabId));
  },
  onPageLoaded: (callback: (tabId: string, tab: any) => void) => {
    ipcRenderer.on(IPC.PAGE_LOADED, (event, tabId, tab) => callback(tabId, tab));
  },

  // Bookmarks
  addBookmark: (title: string, url: string) => ipcRenderer.invoke(IPC.ADD_BOOKMARK, title, url),
  removeBookmark: (id: string) => ipcRenderer.invoke(IPC.REMOVE_BOOKMARK, id),
  getBookmarks: () => ipcRenderer.invoke(IPC.GET_BOOKMARKS),

  // History
  addHistory: (title: string, url: string) => ipcRenderer.send(IPC.ADD_HISTORY, title, url),
  getHistory: () => ipcRenderer.invoke(IPC.GET_HISTORY),
  clearHistory: () => ipcRenderer.invoke(IPC.CLEAR_HISTORY),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  updateSettings: (settings: any) => ipcRenderer.invoke(IPC.UPDATE_SETTINGS),

  // Advanced features
  zoomIn: () => ipcRenderer.send(IPC.ZOOM_IN),
  zoomOut: () => ipcRenderer.send(IPC.ZOOM_OUT),
  zoomReset: () => ipcRenderer.send(IPC.ZOOM_RESET),
  toggleDevTools: () => ipcRenderer.send(IPC.TOGGLE_DEVTOOLS),
  findInPage: (text: string) => ipcRenderer.send(IPC.FIND_IN_PAGE, text),
  stopFindInPage: () => ipcRenderer.send(IPC.STOP_FIND_IN_PAGE),
  duplicateTab: (tabId: string) => ipcRenderer.send(IPC.DUPLICATE_TAB, tabId),

  // Downloads
  onDownloadItem: (callback: (download: any) => void) => {
    ipcRenderer.on(IPC.DOWNLOAD_ITEM, (event, download) => callback(download));
  },
  onDownloadProgress: (callback: (download: any) => void) => {
    ipcRenderer.on(IPC.DOWNLOAD_PROGRESS, (event, download) => callback(download));
  },
  onDownloadComplete: (callback: (download: any) => void) => {
    ipcRenderer.on(IPC.DOWNLOAD_COMPLETE, (event, download) => callback(download));
  },
  getDownloads: () => ipcRenderer.invoke(IPC.GET_DOWNLOADS),
  openDownload: (filepath: string) => ipcRenderer.send(IPC.OPEN_DOWNLOAD, filepath),
  showDownloadFolder: () => ipcRenderer.send(IPC.SHOW_DOWNLOAD_FOLDER),

  // Navigation state
  getCanGoBack: () => ipcRenderer.invoke(IPC.GET_CAN_GO_BACK),
  getCanGoForward: () => ipcRenderer.invoke(IPC.GET_CAN_GO_FORWARD),

  // Shortcuts
  onShowFindInPage: (callback: () => void) => {
    ipcRenderer.on('show-find-in-page', () => callback());
  },
  onAddBookmarkShortcut: (callback: () => void) => {
    ipcRenderer.on('add-bookmark-shortcut', () => callback());
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // BrowserView visibility
  hideBrowserView: () => ipcRenderer.send(IPC.HIDE_BROWSER_VIEW),
  showBrowserView: () => ipcRenderer.send(IPC.SHOW_BROWSER_VIEW),

  // Window management
  detachTab: (tabId: string, url: string, title: string) => ipcRenderer.send(IPC.DETACH_TAB, tabId, url, title),
  createNewWindow: (url?: string) => ipcRenderer.send(IPC.CREATE_NEW_WINDOW, url),

  // Extensions
  selectExtensionFolder: () => ipcRenderer.invoke('select-extension-folder'),
  toggleExtension: (extensionId: string, enabled: boolean) => ipcRenderer.invoke('toggle-extension', extensionId, enabled),
  removeExtension: (extensionId: string) => ipcRenderer.invoke('remove-extension', extensionId),
  installFromWebStore: (url: string) => ipcRenderer.invoke('install-from-webstore', url)
});
