import { BrowserWindow, BrowserView, Menu, MenuItem } from 'electron';
import { Tab, IPC } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TabManager {
  private window: BrowserWindow;
  private tabs: Map<string, BrowserView> = new Map();
  private activeTabId: string | null = null;
  private tabData: Map<string, Tab> = new Map();
  private zoomLevels: Map<string, number> = new Map();

  constructor(window: BrowserWindow) {
    this.window = window;
    // Don't create initial tab here - let main.ts handle it
  }

  createTab(url: string = 'https://www.google.com'): Tab {
    const tabId = uuidv4();
    const browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const tab: Tab = {
      id: tabId,
      title: 'New Tab',
      url: url,
      isLoading: false
    };

    this.tabs.set(tabId, browserView);
    this.tabData.set(tabId, tab);

    // Set up event handlers for the browser view
    const sendNavUpdate = () => {
      const currentUrl = browserView.webContents.getURL();
      const currentTitle = browserView.webContents.getTitle();
      tab.url = currentUrl;
      tab.title = currentTitle;
      tab.isLoading = browserView.webContents.isLoading();
      
      // Only send update if this is the active tab
      if (this.activeTabId === tabId) {
        this.window.webContents.send(IPC.PAGE_LOADED, tabId, {
          id: tabId,
          url: currentUrl,
          title: currentTitle,
          favicon: tab.favicon,
          isLoading: tab.isLoading
        });
      }
    };

    browserView.webContents.on('did-start-loading', () => {
      tab.isLoading = true;
      if (this.activeTabId === tabId) {
        this.window.webContents.send(IPC.PAGE_LOADING, tabId);
      }
    });

    browserView.webContents.on('did-stop-loading', () => {
      tab.isLoading = false;
      sendNavUpdate();
    });

    browserView.webContents.on('did-finish-load', () => {
      sendNavUpdate();
    });

    browserView.webContents.on('did-navigate', () => {
      sendNavUpdate();
    });

    browserView.webContents.on('did-navigate-in-page', () => {
      sendNavUpdate();
    });

    browserView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      if (errorCode !== -3) { // Ignore aborted
        console.error('Page load failed:', errorDescription);
      }
    });

    browserView.webContents.on('page-title-updated', (event, title) => {
      sendNavUpdate();
    });

    browserView.webContents.on('page-favicon-updated', (event, favicons) => {
      if (favicons.length > 0) {
        tab.favicon = favicons[0];
        if (this.activeTabId === tabId) {
          this.window.webContents.send(IPC.PAGE_FAVICON_UPDATED, tabId, favicons[0]);
        }
      }
    });

    // Context menu
    browserView.webContents.on('context-menu', (event, params) => {
      this.showContextMenu(params, browserView);
    });

    // New window handling
    browserView.webContents.setWindowOpenHandler(({ url }) => {
      // Open in new tab instead of new window
      this.createTab(url);
      return { action: 'deny' };
    });

    // Load the URL
    browserView.webContents.loadURL(url);

    // Switch to the new tab
    this.switchTab(tabId);

    return tab;
  }

  closeTab(tabId: string) {
    const browserView = this.tabs.get(tabId);
    if (browserView) {
      if (this.activeTabId === tabId) {
        this.window.removeBrowserView(browserView);
      }
      // Destroy the browser view (not webContents directly)
      (browserView as any).webContents.destroy();
      this.tabs.delete(tabId);
      this.tabData.delete(tabId);

      // If closing active tab, switch to another tab
      if (this.activeTabId === tabId) {
        const remainingTabs = Array.from(this.tabs.keys());
        if (remainingTabs.length > 0) {
          this.switchTab(remainingTabs[0]);
        } else {
          this.activeTabId = null;
        }
      }
    }
  }

  switchTab(tabId: string) {
    const browserView = this.tabs.get(tabId);
    if (!browserView) return;

    // Remove current active tab
    if (this.activeTabId) {
      const currentView = this.tabs.get(this.activeTabId);
      if (currentView) {
        this.window.removeBrowserView(currentView);
      }
    }

    // Add and position the new tab
    this.window.addBrowserView(browserView);
    this.updateBrowserViewBounds(browserView);
    this.activeTabId = tabId;
    
    // Send current tab data to renderer to update address bar
    const tab = this.tabData.get(tabId);
    if (tab) {
      const currentUrl = browserView.webContents.getURL();
      const currentTitle = browserView.webContents.getTitle();
      this.window.webContents.send(IPC.PAGE_LOADED, tabId, {
        id: tabId,
        url: currentUrl,
        title: currentTitle,
        favicon: tab.favicon,
        isLoading: browserView.webContents.isLoading()
      });
    }
  }

  navigateTo(url: string) {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      // Trim whitespace
      url = url.trim();
      
      // Check if it's a valid URL or needs to be searched
      const isURL = this.isValidURL(url);
      
      if (isURL) {
        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        browserView.webContents.loadURL(url);
      } else {
        // Treat as search query
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        browserView.webContents.loadURL(searchUrl);
      }
    }
  }

  private isValidURL(str: string): boolean {
    // Check if it's already a full URL
    if (str.startsWith('http://') || str.startsWith('https://')) {
      return true;
    }
    
    // Check if it looks like a domain (has a dot and valid TLD)
    const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    if (domainPattern.test(str)) {
      return true;
    }
    
    // Check if it's localhost or an IP address
    if (str.startsWith('localhost') || /^(\d{1,3}\.){3}\d{1,3}/.test(str)) {
      return true;
    }
    
    // Everything else is a search query
    return false;
  }

  goBack() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView && browserView.webContents.canGoBack()) {
      browserView.webContents.goBack();
    }
  }

  goForward() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView && browserView.webContents.canGoForward()) {
      browserView.webContents.goForward();
    }
  }

  reload() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      browserView.webContents.reload();
    }
  }

  stop() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      browserView.webContents.stop();
    }
  }

  zoomIn() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      const currentZoom = this.zoomLevels.get(this.activeTabId) || 1.0;
      const newZoom = Math.min(currentZoom + 0.1, 3.0);
      browserView.webContents.setZoomFactor(newZoom);
      this.zoomLevels.set(this.activeTabId, newZoom);
    }
  }

  zoomOut() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      const currentZoom = this.zoomLevels.get(this.activeTabId) || 1.0;
      const newZoom = Math.max(currentZoom - 0.1, 0.3);
      browserView.webContents.setZoomFactor(newZoom);
      this.zoomLevels.set(this.activeTabId, newZoom);
    }
  }

  zoomReset() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      browserView.webContents.setZoomFactor(1.0);
      this.zoomLevels.set(this.activeTabId, 1.0);
    }
  }

  toggleDevTools() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      if (browserView.webContents.isDevToolsOpened()) {
        browserView.webContents.closeDevTools();
      } else {
        browserView.webContents.openDevTools();
      }
    }
  }

  findInPage(text: string) {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView && text) {
      browserView.webContents.findInPage(text);
    }
  }

  stopFindInPage() {
    if (!this.activeTabId) return;
    const browserView = this.tabs.get(this.activeTabId);
    if (browserView) {
      browserView.webContents.stopFindInPage('clearSelection');
    }
  }

  duplicateTab(tabId: string) {
    const tab = this.tabData.get(tabId);
    if (tab) {
      return this.createTab(tab.url);
    }
    return null;
  }

  canGoBack(): boolean {
    if (!this.activeTabId) return false;
    const browserView = this.tabs.get(this.activeTabId);
    return browserView ? browserView.webContents.canGoBack() : false;
  }

  canGoForward(): boolean {
    if (!this.activeTabId) return false;
    const browserView = this.tabs.get(this.activeTabId);
    return browserView ? browserView.webContents.canGoForward() : false;
  }

  getCurrentUrl(): string {
    if (!this.activeTabId) return '';
    const browserView = this.tabs.get(this.activeTabId);
    return browserView ? browserView.webContents.getURL() : '';
  }

  getAllTabs() {
    const tabs: Tab[] = [];
    this.tabData.forEach((tab, tabId) => {
      const browserView = this.tabs.get(tabId);
      if (browserView) {
        tab.url = browserView.webContents.getURL();
        tab.title = browserView.webContents.getTitle();
      }
      tabs.push({ ...tab });
    });
    return tabs;
  }

  private showContextMenu(params: any, browserView: BrowserView) {
    const menu = new Menu();

    // Back/Forward
    if (browserView.webContents.canGoBack()) {
      menu.append(new MenuItem({
        label: 'Back',
        click: () => browserView.webContents.goBack()
      }));
    }
    if (browserView.webContents.canGoForward()) {
      menu.append(new MenuItem({
        label: 'Forward',
        click: () => browserView.webContents.goForward()
      }));
    }
    menu.append(new MenuItem({
      label: 'Reload',
      click: () => browserView.webContents.reload()
    }));
    menu.append(new MenuItem({ type: 'separator' }));

    // Text actions
    if (params.selectionText) {
      menu.append(new MenuItem({
        label: 'Copy',
        role: 'copy'
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    if (params.isEditable) {
      menu.append(new MenuItem({
        label: 'Cut',
        role: 'cut'
      }));
      menu.append(new MenuItem({
        label: 'Copy',
        role: 'copy'
      }));
      menu.append(new MenuItem({
        label: 'Paste',
        role: 'paste'
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Link actions
    if (params.linkURL) {
      menu.append(new MenuItem({
        label: 'Open Link in New Tab',
        click: () => this.createTab(params.linkURL)
      }));
      menu.append(new MenuItem({
        label: 'Copy Link Address',
        click: () => {
          const { clipboard } = require('electron');
          clipboard.writeText(params.linkURL);
        }
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Image actions
    if (params.hasImageContents) {
      menu.append(new MenuItem({
        label: 'Copy Image',
        click: () => browserView.webContents.copyImageAt(params.x, params.y)
      }));
      menu.append(new MenuItem({
        label: 'Copy Image Address',
        click: () => {
          const { clipboard } = require('electron');
          clipboard.writeText(params.srcURL);
        }
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Developer tools
    menu.append(new MenuItem({
      label: 'Inspect Element',
      click: () => {
        browserView.webContents.inspectElement(params.x, params.y);
        if (!browserView.webContents.isDevToolsOpened()) {
          browserView.webContents.openDevTools();
        }
      }
    }));

    menu.popup();
  }

  hideBrowserView() {
    if (this.activeTabId) {
      const currentView = this.tabs.get(this.activeTabId);
      if (currentView) {
        this.window.removeBrowserView(currentView);
      }
    }
  }

  showBrowserView() {
    if (this.activeTabId) {
      const currentView = this.tabs.get(this.activeTabId);
      if (currentView) {
        this.window.addBrowserView(currentView);
        this.updateBrowserViewBounds(currentView);
      }
    }
  }

  private updateBrowserViewBounds(browserView: BrowserView) {
    const bounds = this.window.getContentBounds();
    // Reserve space for tabs (38px) and toolbar (44px) = 82px from top
    browserView.setBounds({
      x: 0,
      y: 82,
      width: bounds.width,
      height: bounds.height - 82
    });
    browserView.setAutoResize({
      width: true,
      height: true
    });
  }
}
