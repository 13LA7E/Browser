export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    tabBarBg: string;
    toolbarBg: string;
    addressBarBg: string;
    addressBarBorder: string;
    buttonHover: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export interface Extension {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  path: string;
}

export interface BrowserState {
  tabs: Tab[];
  activeTabId: string | null;
  bookmarks: Bookmark[];
  history: HistoryItem[];
}

export interface NavigationAction {
  type: 'back' | 'forward' | 'reload' | 'home' | 'stop';
}

export interface IpcChannels {
  // Navigation
  NAVIGATE_TO: 'navigate-to';
  NAVIGATE_BACK: 'navigate-back';
  NAVIGATE_FORWARD: 'navigate-forward';
  RELOAD: 'reload';
  STOP: 'stop';
  
  // Tabs
  CREATE_TAB: 'create-tab';
  CLOSE_TAB: 'close-tab';
  SWITCH_TAB: 'switch-tab';
  DUPLICATE_TAB: 'duplicate-tab';
  DETACH_TAB: 'detach-tab';
  CREATE_NEW_WINDOW: 'create-new-window';
  
  // Page events
  PAGE_TITLE_UPDATED: 'page-title-updated';
  PAGE_FAVICON_UPDATED: 'page-favicon-updated';
  PAGE_LOADING: 'page-loading';
  PAGE_LOADED: 'page-loaded';
  PAGE_LOADING_PROGRESS: 'page-loading-progress';
  
  // Bookmarks
  ADD_BOOKMARK: 'add-bookmark';
  REMOVE_BOOKMARK: 'remove-bookmark';
  GET_BOOKMARKS: 'get-bookmarks';
  
  // History
  ADD_HISTORY: 'add-history';
  GET_HISTORY: 'get-history';
  CLEAR_HISTORY: 'clear-history';
  
  // Settings
  GET_SETTINGS: 'get-settings';
  UPDATE_SETTINGS: 'update-settings';
  
  // Advanced features
  ZOOM_IN: 'zoom-in';
  ZOOM_OUT: 'zoom-out';
  ZOOM_RESET: 'zoom-reset';
  TOGGLE_DEVTOOLS: 'toggle-devtools';
  FIND_IN_PAGE: 'find-in-page';
  STOP_FIND_IN_PAGE: 'stop-find-in-page';
  DOWNLOAD_ITEM: 'download-item';
  DOWNLOAD_PROGRESS: 'download-progress';
  DOWNLOAD_COMPLETE: 'download-complete';
  GET_DOWNLOADS: 'get-downloads';
  OPEN_DOWNLOAD: 'open-download';
  SHOW_DOWNLOAD_FOLDER: 'show-download-folder';
  SAVE_SESSION: 'save-session';
  RESTORE_SESSION: 'restore-session';
  GET_CAN_GO_BACK: 'get-can-go-back';
  GET_CAN_GO_FORWARD: 'get-can-go-forward';
  HIDE_BROWSER_VIEW: 'hide-browser-view';
  SHOW_BROWSER_VIEW: 'show-browser-view';
}

export const IPC: IpcChannels = {
  NAVIGATE_TO: 'navigate-to',
  NAVIGATE_BACK: 'navigate-back',
  NAVIGATE_FORWARD: 'navigate-forward',
  RELOAD: 'reload',
  STOP: 'stop',
  CREATE_TAB: 'create-tab',
  CLOSE_TAB: 'close-tab',
  SWITCH_TAB: 'switch-tab',
  DUPLICATE_TAB: 'duplicate-tab',
  DETACH_TAB: 'detach-tab',
  CREATE_NEW_WINDOW: 'create-new-window',
  PAGE_TITLE_UPDATED: 'page-title-updated',
  PAGE_FAVICON_UPDATED: 'page-favicon-updated',
  PAGE_LOADING: 'page-loading',
  PAGE_LOADED: 'page-loaded',
  PAGE_LOADING_PROGRESS: 'page-loading-progress',
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
  DOWNLOAD_ITEM: 'download-item',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETE: 'download-complete',
  GET_DOWNLOADS: 'get-downloads',
  OPEN_DOWNLOAD: 'open-download',
  SHOW_DOWNLOAD_FOLDER: 'show-download-folder',
  SAVE_SESSION: 'save-session',
  RESTORE_SESSION: 'restore-session',
  GET_CAN_GO_BACK: 'get-can-go-back',
  GET_CAN_GO_FORWARD: 'get-can-go-forward',
  HIDE_BROWSER_VIEW: 'hide-browser-view',
  SHOW_BROWSER_VIEW: 'show-browser-view'
};

export interface Settings {
  homePage: string;
  searchEngine: string;
  defaultZoom: number;
  enableJavaScript: boolean;
  enableImages: boolean;
  downloadPath: string;
  restoreSession: boolean;
  theme: string;
  installedExtensions: Extension[];
}

export interface Download {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  savePath: string;
}

export interface SessionData {
  tabs: Array<{
    url: string;
    title: string;
  }>;
  activeTabIndex: number;
}
