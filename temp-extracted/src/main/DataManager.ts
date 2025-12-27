import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Bookmark, HistoryItem, Settings, Download, SessionData } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DataManager {
  private dataPath: string;
  private bookmarksFile: string;
  private historyFile: string;
  private settingsFile: string;
  private downloadsFile: string;
  private sessionFile: string;
  
  private bookmarks: Bookmark[] = [];
  private history: HistoryItem[] = [];
  private downloads: Download[] = [];
  private settings: Settings = {
    homePage: 'https://www.google.com',
    searchEngine: 'https://www.google.com/search?q=',
    defaultZoom: 1.0,
    enableJavaScript: true,
    enableImages: true,
    downloadPath: app.getPath('downloads'),
    restoreSession: true
  };

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'browser-data');
    this.bookmarksFile = path.join(this.dataPath, 'bookmarks.json');
    this.historyFile = path.join(this.dataPath, 'history.json');
    this.settingsFile = path.join(this.dataPath, 'settings.json');
    this.downloadsFile = path.join(this.dataPath, 'downloads.json');
    this.sessionFile = path.join(this.dataPath, 'session.json');
    
    this.ensureDataDirectory();
    this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadData() {
    // Load bookmarks
    if (fs.existsSync(this.bookmarksFile)) {
      try {
        const data = fs.readFileSync(this.bookmarksFile, 'utf-8');
        this.bookmarks = JSON.parse(data);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    }

    // Load history
    if (fs.existsSync(this.historyFile)) {
      try {
        const data = fs.readFileSync(this.historyFile, 'utf-8');
        this.history = JSON.parse(data);
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }

    // Load settings
    if (fs.existsSync(this.settingsFile)) {
      try {
        const data = fs.readFileSync(this.settingsFile, 'utf-8');
        this.settings = { ...this.settings, ...JSON.parse(data) };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    // Load downloads
    if (fs.existsSync(this.downloadsFile)) {
      try {
        const data = fs.readFileSync(this.downloadsFile, 'utf-8');
        this.downloads = JSON.parse(data);
      } catch (error) {
        console.error('Error loading downloads:', error);
      }
    }
  }

  private saveBookmarks() {
    try {
      fs.writeFileSync(this.bookmarksFile, JSON.stringify(this.bookmarks, null, 2));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }

  private saveHistory() {
    try {
      // Keep only last 1000 history items
      if (this.history.length > 1000) {
        this.history = this.history.slice(-1000);
      }
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  addBookmark(title: string, url: string): Bookmark {
    const bookmark: Bookmark = {
      id: uuidv4(),
      title,
      url,
      createdAt: Date.now()
    };
    this.bookmarks.push(bookmark);
    this.saveBookmarks();
    return bookmark;
  }

  removeBookmark(id: string): boolean {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bookmarks.splice(index, 1);
      this.saveBookmarks();
      return true;
    }
    return false;
  }

  getBookmarks(): Bookmark[] {
    return this.bookmarks;
  }

  addHistory(title: string, url: string) {
    const historyItem: HistoryItem = {
      id: uuidv4(),
      title,
      url,
      visitedAt: Date.now()
    };
    this.history.push(historyItem);
    this.saveHistory();
  }

  getHistory(): HistoryItem[] {
    return this.history.slice().reverse(); // Return most recent first
  }

  clearHistory(): boolean {
    this.history = [];
    this.saveHistory();
    return true;
  }

  getSettings(): Settings {
    return this.settings;
  }

  updateSettings(newSettings: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    return this.settings;
  }

  // Downloads
  addDownload(download: Download): Download {
    this.downloads.push(download);
    this.saveDownloads();
    return download;
  }

  updateDownload(id: string, updates: Partial<Download>): void {
    const download = this.downloads.find(d => d.id === id);
    if (download) {
      Object.assign(download, updates);
      this.saveDownloads();
    }
  }

  getDownloads(): Download[] {
    return this.downloads;
  }

  private saveDownloads() {
    try {
      fs.writeFileSync(this.downloadsFile, JSON.stringify(this.downloads, null, 2));
    } catch (error) {
      console.error('Error saving downloads:', error);
    }
  }

  // Session management
  saveSession(sessionData: SessionData): void {
    try {
      fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  restoreSession(): SessionData | null {
    if (fs.existsSync(this.sessionFile)) {
      try {
        const data = fs.readFileSync(this.sessionFile, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Error restoring session:', error);
      }
    }
    return null;
  }
}
