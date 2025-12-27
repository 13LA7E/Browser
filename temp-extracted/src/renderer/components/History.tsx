import React from 'react';
import { HistoryItem } from '../../types';

interface HistoryProps {
  history: HistoryItem[];
  onClose: () => void;
  onHistoryClick: (url: string) => void;
  onClearHistory: () => void;
}

const History: React.FC<HistoryProps> = ({
  history,
  onClose,
  onHistoryClick,
  onClearHistory
}) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-header">
          <h2>History</h2>
          <div>
            <button className="clear-btn" onClick={onClearHistory}>
              Clear All
            </button>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        <div className="panel-content">
          {history.length === 0 ? (
            <p className="empty-message">No history yet.</p>
          ) : (
            <div className="history-list">
              {history.map(item => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => onHistoryClick(item.url)}
                >
                  <div className="history-info">
                    <div className="history-title">{item.title}</div>
                    <div className="history-url">{item.url}</div>
                  </div>
                  <div className="history-time">
                    {formatDate(item.visitedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
