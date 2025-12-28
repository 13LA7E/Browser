import { BrowserView } from 'electron';

export class PerformanceManager {
  private suspendedTabs: Map<string, boolean> = new Map();
  private tabLastActive: Map<string, number> = new Map();
  private suspensionTimer: NodeJS.Timeout | null = null;
  private readonly SUSPENSION_DELAY = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Check for tabs to suspend every minute
    this.suspensionTimer = setInterval(() => {
      this.checkTabsForSuspension();
    }, 60 * 1000);
  }

  markTabActive(tabId: string) {
    this.tabLastActive.set(tabId, Date.now());
    this.suspendedTabs.set(tabId, false);
  }

  private checkTabsForSuspension() {
    const now = Date.now();
    for (const [tabId, lastActive] of this.tabLastActive.entries()) {
      if (now - lastActive > this.SUSPENSION_DELAY && !this.suspendedTabs.get(tabId)) {
        // Tab has been inactive for too long, could be suspended
        // This is a placeholder - actual suspension would need BrowserView reference
        this.suspendedTabs.set(tabId, true);
      }
    }
  }

  isSuspended(tabId: string): boolean {
    return this.suspendedTabs.get(tabId) || false;
  }

  // Apply performance settings to a BrowserView
  static applyPerformanceSettings(view: BrowserView) {
    const webContents = view.webContents;
    
    // Enable background throttling
    webContents.setBackgroundThrottling(true);
    
    // Set audio muted by default for background tabs (can be unmuted by user)
    // webContents.setAudioMuted(true);
  }

  // Reduce memory usage by clearing caches
  static async clearCaches(view: BrowserView) {
    try {
      await view.webContents.session.clearCache();
      await view.webContents.session.clearStorageData({
        storages: ['serviceworkers', 'cachestorage']
      });
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  destroy() {
    if (this.suspensionTimer) {
      clearInterval(this.suspensionTimer);
    }
  }
}
