import { session, OnBeforeRequestListenerDetails } from 'electron';

export class AdBlocker {
  private blockedDomains: Set<string> = new Set();
  private blockedPatterns: RegExp[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializeBlockLists();
  }

  private initializeBlockLists() {
    // Common ad and tracker domains
    const commonAdDomains = [
      'doubleclick.net',
      'googlesyndication.com',
      'googleadservices.com',
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.net',
      'connect.facebook.net',
      'ads.yahoo.com',
      'adserver.yahoo.com',
      'advertising.com',
      'analytics.twitter.com',
      'ads-twitter.com',
      'static.ads-twitter.com',
      'ads.linkedin.com',
      'adnxs.com',
      'adsrvr.org',
      'advertising.microsoft.com',
      'scorecardresearch.com',
      'outbrain.com',
      'taboola.com',
      'zedo.com',
      'serving-sys.com',
      'criteo.com',
      'rubiconproject.com',
      'pubmatic.com',
      'openx.net',
      'adk2x.com',
      'bidswitch.net',
      'adsafeprotected.com'
    ];

    commonAdDomains.forEach(domain => this.blockedDomains.add(domain));

    // Common ad URL patterns
    this.blockedPatterns = [
      /\/ads?\//i,
      /\/advert/i,
      /\/banner/i,
      /\/tracking/i,
      /\/analytics/i,
      /\/pixel/i,
      /\/impression/i,
      /\/click/i,
      /\/beacon/i
    ];
  }

  shouldBlock(url: string): boolean {
    if (!this.isEnabled) return false;

    try {
      const urlObj = new URL(url);
      
      // Check if domain is in blocked list
      for (const domain of this.blockedDomains) {
        if (urlObj.hostname.includes(domain)) {
          return true;
        }
      }

      // Check if URL matches blocked patterns
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }
    } catch (error) {
      // Invalid URL, don't block
      return false;
    }

    return false;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  isActive(): boolean {
    return this.isEnabled;
  }

  // Setup request interception for ad blocking
  setupAdBlocking(ses: Electron.Session = session.defaultSession) {
    ses.webRequest.onBeforeRequest((details, callback) => {
      if (this.shouldBlock(details.url)) {
        console.log('Blocked:', details.url);
        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });
  }

  // Add custom domain to block list
  addBlockedDomain(domain: string) {
    this.blockedDomains.add(domain);
  }

  // Remove domain from block list
  removeBlockedDomain(domain: string) {
    this.blockedDomains.delete(domain);
  }
}
