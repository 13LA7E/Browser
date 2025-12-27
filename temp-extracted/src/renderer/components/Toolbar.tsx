import React, { useState } from 'react';

interface ToolbarProps {
  currentUrl: string;
  isLoading: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onAddBookmark: () => void;
  onShowBookmarks: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
  onShowDownloads: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleDevTools: () => void;
  onShowFindInPage: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentUrl,
  isLoading,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onAddBookmark,
  onShowBookmarks,
  onShowHistory,
  onShowSettings,
  onShowDownloads,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleDevTools,
  onShowFindInPage
}) => {
  const [urlInput, setUrlInput] = useState(currentUrl);

  React.useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onNavigate(urlInput.trim());
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-nav">
        <button className="nav-btn" onClick={onBack} title="Back (Alt+Left)">
          ←
        </button>
        <button className="nav-btn" onClick={onForward} title="Forward (Alt+Right)">
          →
        </button>
        <button className="nav-btn" onClick={onReload} title="Reload (Ctrl+R)">
          {isLoading ? '×' : '↻'}
        </button>
        <button className="nav-btn" onClick={onHome} title="Home (Alt+Home)">
          🏠
        </button>
      </div>

      <form className="address-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Enter URL or search..."
          className="url-input"
        />
      </form>

      <div className="toolbar-actions">
        <button className="action-btn" onClick={onAddBookmark} title="Add Bookmark (Ctrl+D)">
          ⭐
        </button>
        <button className="action-btn" onClick={onShowBookmarks} title="Bookmarks">
          📚
        </button>
        <button className="action-btn" onClick={onShowHistory} title="History">
          🕒
        </button>
        <button className="action-btn" onClick={onShowDownloads} title="Downloads">
          📥
        </button>
        <div className="toolbar-separator"></div>
        <button className="action-btn" onClick={onShowFindInPage} title="Find in Page (Ctrl+F)">
          🔍
        </button>
        <button className="action-btn" onClick={onZoomOut} title="Zoom Out (Ctrl+-)">
          −
        </button>
        <button className="action-btn" onClick={onZoomReset} title="Reset Zoom (Ctrl+0)">
          100%
        </button>
        <button className="action-btn" onClick={onZoomIn} title="Zoom In (Ctrl++)">
          +
        </button>
        <div className="toolbar-separator"></div>
        <button className="action-btn" onClick={onToggleDevTools} title="Developer Tools (F12)">
          🔧
        </button>
        <button className="action-btn" onClick={onShowSettings} title="Settings">
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
