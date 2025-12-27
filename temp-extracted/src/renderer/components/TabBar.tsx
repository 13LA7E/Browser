import React from 'react';
import { Tab } from '../../types';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onNewTab: () => void;
  onCloseTab: (tabId: string) => void;
  onSwitchTab: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onNewTab,
  onCloseTab,
  onSwitchTab
}) => {
  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onSwitchTab(tab.id)}
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
  );
};

export default TabBar;
