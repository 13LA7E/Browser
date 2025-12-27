import React, { useState, useEffect } from 'react';

interface FindInPageProps {
  onClose: () => void;
}

const FindInPage: React.FC<FindInPageProps> = ({ onClose }) => {
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    return () => {
      window.electronAPI.stopFindInPage();
    };
  }, []);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
      window.electronAPI.findInPage(text);
    } else {
      window.electronAPI.stopFindInPage();
    }
  };

  const handleClose = () => {
    window.electronAPI.stopFindInPage();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      if (searchText) {
        window.electronAPI.findInPage(searchText);
      }
    }
  };

  return (
    <div className="find-bar">
      <input
        type="text"
        value={searchText}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in page..."
        className="find-input"
        autoFocus
      />
      <button className="find-close-btn" onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export default FindInPage;
