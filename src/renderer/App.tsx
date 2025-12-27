import React, { useState, useEffect } from 'react';
import { Tab, Bookmark, HistoryItem } from '../types';
import Toolbar from './components/Toolbar';
import TabBar from './components/TabBar';
import Bookmarks from './components/Bookmarks';
import History from './components/History';
import Settings from './components/Settings';
import Downloads from './components/Downloads';
import FindInPage from './components/FindInPage';

declare global {
  interface Window {
    electronAPI: any;
  }
}

type View = 'browser' | 'bookmarks' | 'history' | 'settings' | 'downloads';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentView, setCurrentView] = useState<View>('browser');
  const [showFindInPage, setShowFindInPage] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

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
        prevTabs.map(tab => 
          tab.id === tabId ? { ...tab, title } : tab
        )
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
        prevTabs.map(tab => 
          tab.id === tabId ? updatedTab : tab
        )
      );
      // Add to history
      window.electronAPI.addHistory(updatedTab.title, updatedTab.url);
    });

    // Listen for new tabs being created
    window.electronAPI.onTabCreated((newTab: Tab) => {
      setTabs(prevTabs => {
        // Check if tab already exists
        const exists = prevTabs.some(tab => tab.id === newTab.id);
        if (exists) {
          return prevTabs;
        }
        return [...prevTabs, newTab];
      });
      setActiveTabId(newTab.id);
    });

    // Load bookmarks
    loadBookmarks();

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

  // Hide/show BrowserView when switching views
  useEffect(() => {
    if (currentView === 'browser') {
      window.electronAPI.showBrowserView();
    } else {
      window.electronAPI.hideBrowserView();
    }
  }, [currentView]);

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
    window.electronAPI.createTab('https://www.google.com');
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(tabs.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId && tabs.length > 1) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs[0]?.id || null);
    }
    window.electronAPI.closeTab(tabId);
  };

  const handleSwitchTab = (tabId: string) => {
    setActiveTabId(tabId);
    window.electronAPI.switchTab(tabId);
  };

  const handleNavigate = (url: string) => {
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
    window.electronAPI.navigateTo('https://www.google.com');
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
        currentUrl={activeTab?.url || ''}
        isLoading={activeTab?.isLoading || false}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onHome={handleHome}
        onAddBookmark={handleAddBookmark}
        onShowBookmarks={() => {
          setCurrentView('bookmarks');
          loadBookmarks();
        }}
        onShowHistory={() => {
          setCurrentView('history');
          loadHistory();
        }}
        onShowSettings={() => setCurrentView('settings')}
        onShowDownloads={() => {
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
        <Settings onClose={() => setCurrentView('browser')} />
      )}

      {currentView === 'downloads' && (
        <Downloads onClose={() => setCurrentView('browser')} />
      )}

      {showFindInPage && (
        <FindInPage onClose={handleCloseFindInPage} />
      )}
    </div>
  );
};

export default App;
