import React, { useState, useRef } from 'react';
import { Tab } from '../../types';

declare global {
  interface Window {
    electronAPI: any;
  }
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onNewTab: () => void;
  onCloseTab: (tabId: string) => void;
  onSwitchTab: (tabId: string) => void;
}

interface DragState {
  tabId: string | null;
  startX: number;
  startY: number;
  isDragging: boolean;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onNewTab,
  onCloseTab,
  onSwitchTab
}) => {
  const [dragState, setDragState] = useState<DragState>({
    tabId: null,
    startX: 0,
    startY: 0,
    isDragging: false
  });
  const dragThreshold = 30; // pixels to drag before detaching

  const handleTabDragStart = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/tab-id', tabId);
    setDragState({
      tabId,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true
    });
  };

  const handleTabDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || !dragState.tabId) return;
    
    const deltaY = Math.abs(e.clientY - dragState.startY);
    
    // If dragged out of window vertically, detach tab
    if (deltaY > dragThreshold && e.clientY < 0) {
      const tab = tabs.find(t => t.id === dragState.tabId);
      if (tab && window.electronAPI?.detachTab) {
        window.electronAPI.detachTab(tab.id, tab.url, tab.title);
        setDragState({ tabId: null, startX: 0, startY: 0, isDragging: false });
      }
    }
  };

  const handleTabDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || !dragState.tabId) return;
    
    // Check if dragged significantly outside window bounds
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaY = e.clientY - dragState.startY;
    
    if (deltaY < -dragThreshold || e.clientY < 0) {
      const tab = tabs.find(t => t.id === dragState.tabId);
      if (tab && window.electronAPI?.detachTab) {
        window.electronAPI.detachTab(tab.id, tab.url, tab.title);
      }
    }
    
    setDragState({ tabId: null, startX: 0, startY: 0, isDragging: false });
  };

  const handleMinimize = () => {
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''} ${dragState.tabId === tab.id ? 'dragging' : ''}`}
            onClick={() => onSwitchTab(tab.id)}
            draggable={true}
            onDragStart={(e) => handleTabDragStart(e, tab.id)}
            onDrag={handleTabDrag}
            onDragEnd={handleTabDragEnd}
          >
            {tab.favicon && <img src={tab.favicon} alt="" className="tab-favicon" />}
            <span className="tab-title">
              {tab.isLoading ? 'Loading...' : tab.title || 'New Tab'}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button className="new-tab-btn" onClick={onNewTab}>
          +
        </button>
      </div>
      <div className="window-controls">
        <button className="window-btn" onClick={handleMinimize} title="Minimize">−</button>
        <button className="window-btn" onClick={handleMaximize} title="Maximize">□</button>
        <button className="window-btn close-btn-window" onClick={handleClose} title="×">×</button>
      </div>
    </div>
  );
};

export default TabBar;
