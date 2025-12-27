import React from 'react';
import { Bookmark } from '../../types';

interface BookmarksProps {
  bookmarks: Bookmark[];
  onClose: () => void;
  onBookmarkClick: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
}

const Bookmarks: React.FC<BookmarksProps> = ({
  bookmarks,
  onClose,
  onBookmarkClick,
  onRemoveBookmark
}) => {
  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-header">
          <h2>Bookmarks</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="panel-content">
          {bookmarks.length === 0 ? (
            <p className="empty-message">No bookmarks yet. Add some!</p>
          ) : (
            <div className="bookmark-list">
              {bookmarks.map(bookmark => (
                <div key={bookmark.id} className="bookmark-item">
                  <div
                    className="bookmark-info"
                    onClick={() => onBookmarkClick(bookmark.url)}
                  >
                    <div className="bookmark-title">{bookmark.title}</div>
                    <div className="bookmark-url">{bookmark.url}</div>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveBookmark(bookmark.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
