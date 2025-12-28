import React, { useState, useEffect } from 'react';
import { Tab, Bookmark, HistoryItem } from '../types';
import Toolbar from './components/Toolbar';
import TabBar from './components/TabBar';
import Bookmarks from './components/Bookmarks';
import History from './components/History';
import Settings from './components/Settings';
import Downloads from './components/Downloads';
import FindInPage from './components/FindInPage';
import HomePage from './components/HomePage';
import { applyTheme } from './themes';

declare global {
  interface Window {
    electronAPI: any;
  }
}

type View = 'browser' | 'bookmarks' | 'history' | 'settings' | 'downloads' | 'home';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [showFindInPage, setShowFindInPage] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [showHomePage, setShowHomePage] = useState(true);

  // Handle drag and drop for URLs and files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (currentView !== 'browser') return;

      // Handle URL drops
      const url = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain');
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        window.electronAPI.navigateTo(url);
      }
      // Handle file drops
      else if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const filePath = file.path || `file://${file.name}`;
        window.electronAPI.navigateTo(filePath);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [currentView]);

  useEffect(() => {
    // Set up page event listeners
    window.electronAPI.onPageTitleUpdated((tabId: string, title: string) => {
      setTabs(prevTabs => 
        prevTabs.map(tab => {
          // Don't update title if we're on the homepage (keep "Home" title)
          if (tab.id === tabId && (tab.url === '' || tab.url === 'about:blank')) {
            return { ...tab, title: 'Home' };
          }
          return tab.id === tabId ? { ...tab, title } : tab;
        })
      );
    });

    window.electronAPI.onPageFaviconUpdated((tabId: string, favicon: string) => {
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === tabId ? { ...tab, favicon } : tab
        )
      );
    });

    window.electronAPI.onPageLoading((tabId: string) => {
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === tabId ? { ...tab, isLoading: true } : tab
        )
      );
    });

    window.electronAPI.onPageLoaded((tabId: string, updatedTab: Tab) => {
      setTabs(prevTabs => 
        prevTabs.map(tab => {
          if (tab.id === tabId) {
            // If loading about:blank, keep it as Home page
            if (updatedTab.url === 'about:blank' || updatedTab.url === '') {
              return { ...tab, title: 'Home', url: '', isLoading: false };
            }
            return updatedTab;
          }
          return tab;
        })
      );
      // Don't add about:blank to history
      if (updatedTab.url !== 'about:blank' && updatedTab.url !== '') {
        window.electronAPI.addHistory(updatedTab.title, updatedTab.url);
      }
    });

    // Listen for new tabs being created
    window.electronAPI.onTabCreated((newTab: Tab) => {
      setTabs(prevTabs => {
        // Check if tab already exists
        const exists = prevTabs.some(tab => tab.id === newTab.id);
        if (exists) {
          return prevTabs;
        }
        // Set title and URL to Home for new tabs (since they start on homepage)
        return [...prevTabs, { ...newTab, title: 'Home', url: '', isLoading: false }];
      });
      setActiveTabId(newTab.id);
      // Ensure homepage is shown for new tabs
      setShowHomePage(true);
      setCurrentView('home');
    });

    // Load bookmarks and apply theme
    loadBookmarks();
    loadInitialTheme();

    // Listen for keyboard shortcuts
    window.electronAPI.onShowFindInPage(() => {
      setShowFindInPage(true);
    });

    window.electronAPI.onAddBookmarkShortcut(() => {
      handleAddBookmark();
    });

    // Listen for downloads
    window.electronAPI.onDownloadItem(() => {
      setDownloadCount(prev => prev + 1);
    });
  }, []);

  const loadInitialTheme = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      if (settings && settings.theme) {
        applyTheme(settings.theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  // Hide/show BrowserView when switching views
  useEffect(() => {
    if (currentView === 'browser' && !showHomePage) {
      window.electronAPI.showBrowserView();
    } else {
      window.electronAPI.hideBrowserView();
    }
  }, [currentView, showHomePage]);

  const loadBookmarks = async () => {
    try {
      const bookmarksList = await window.electronAPI.getBookmarks();
      setBookmarks(bookmarksList || []);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      setBookmarks([]);
    }
  };

  const loadHistory = async () => {
    try {
      const historyList = await window.electronAPI.getHistory();
      setHistory(historyList || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    }
  };

  const handleNewTab = () => {
    // Don't create tab in renderer - let main process do it
    window.electronAPI.createTab('about:blank');
    setShowHomePage(true);
    setCurrentView('home');
  };

  const handleCloseTab = (tabId: string) => {
    const remainingTabs = tabs.filter(tab => tab.id !== tabId);
    
    // Close browser if this is the last tab
    if (remainingTabs.length === 0) {
      window.electronAPI.closeWindow();
      return;
    }
    
    setTabs(remainingTabs);
    if (activeTabId === tabId) {
      setActiveTabId(remainingTabs[0]?.id || null);
    }
    window.electronAPI.closeTab(tabId);
  };

  const handleSwitchTab = (tabId: string) => {
    setActiveTabId(tabId);
    const switchedTab = tabs.find(tab => tab.id === tabId);
    if (switchedTab && (switchedTab.url === '' || switchedTab.url === 'about:blank')) {
      setShowHomePage(true);
      setCurrentView('home');
    } else {
      setShowHomePage(false);
      setCurrentView('browser');
    }
    window.electronAPI.switchTab(tabId);
  };

  const handleNavigate = (url: string) => {
    setShowHomePage(false);
    setCurrentView('browser');
    window.electronAPI.navigateTo(url);
  };

  const handleBack = () => {
    window.electronAPI.navigateBack();
  };

  const handleForward = () => {
    window.electronAPI.navigateForward();
  };

  const handleReload = () => {
    window.electronAPI.reload();
  };

  const handleHome = () => {
    setCurrentView('home');
    setShowHomePage(true);
    // Update active tab to show Home
    if (activeTabId) {
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId ? { ...tab, title: 'Home', url: '', isLoading: false } : tab
        )
      );
    }
  };

  const handleHomePageNavigate = (url: string) => {
    setShowHomePage(false);
    setCurrentView('browser');
    // Update the active tab's title temporarily (will be updated by page load)
    if (activeTabId) {
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId ? { ...tab, title: 'Loading...', url: url, isLoading: true } : tab
        )
      );
    }
    window.electronAPI.navigateTo(url);
  };

  const handleZoomIn = () => {
    window.electronAPI.zoomIn();
  };

  const handleZoomOut = () => {
    window.electronAPI.zoomOut();
  };

  const handleZoomReset = () => {
    window.electronAPI.zoomReset();
  };

  const handleToggleDevTools = () => {
    window.electronAPI.toggleDevTools();
  };

  const handleShowFindInPage = () => {
    setShowFindInPage(true);
  };

  const handleCloseFindInPage = () => {
    setShowFindInPage(false);
  };

  const handleAddBookmark = async () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      await window.electronAPI.addBookmark(activeTab.title, activeTab.url);
      loadBookmarks();
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    await window.electronAPI.removeBookmark(id);
    loadBookmarks();
  };

  const handleBookmarkClick = (url: string) => {
    setCurrentView('browser');
    handleNavigate(url);
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="app">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onSwitchTab={handleSwitchTab}
      />
      
      <Toolbar
        currentUrl={showHomePage ? '' : (activeTab?.url || '')}
        isLoading={activeTab?.isLoading || false}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onHome={handleHome}
        onAddBookmark={handleAddBookmark}
        onShowBookmarks={() => {
          setShowHomePage(false);
          setCurrentView('bookmarks');
          loadBookmarks();
        }}
        onShowHistory={() => {
          setShowHomePage(false);
          setCurrentView('history');
          loadHistory();
        }}
        onShowSettings={() => {
          setShowHomePage(false);
          setCurrentView('settings');
        }}
        onShowDownloads={() => {
          setShowHomePage(false);
          setCurrentView('downloads');
          setDownloadCount(0);
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onToggleDevTools={handleToggleDevTools}
        onShowFindInPage={handleShowFindInPage}
      />

      {currentView === 'bookmarks' && (
        <Bookmarks
          bookmarks={bookmarks}
          onClose={() => setCurrentView('browser')}
          onBookmarkClick={handleBookmarkClick}
          onRemoveBookmark={handleRemoveBookmark}
        />
      )}

      {currentView === 'history' && (
        <History
          history={history}
          onClose={() => setCurrentView('browser')}
          onHistoryClick={(url: string) => {
            setCurrentView('browser');
            handleNavigate(url);
          }}
          onClearHistory={async () => {
            await window.electronAPI.clearHistory();
            loadHistory();
          }}
        />
      )}

      {currentView === 'settings' && (
        <Settings onClose={() => {
          setCurrentView('home');
          setShowHomePage(true);
        }} />
      )}

      {currentView === 'downloads' && (
        <Downloads onClose={() => setCurrentView('browser')} />
      )}

      {showHomePage && (
        <HomePage onNavigate={handleHomePageNavigate} />
      )}

      {showFindInPage && (
        <FindInPage onClose={handleCloseFindInPage} />
      )}
    </div>
  );
};

export default App;
