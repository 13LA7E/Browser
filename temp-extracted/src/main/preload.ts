import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../types';

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
  }
});
