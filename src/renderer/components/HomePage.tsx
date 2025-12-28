import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    electronAPI: any;
  }
}

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface HomePageProps {
  onNavigate: (url: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([
    { id: '1', title: 'YouTube', url: 'https://www.youtube.com', icon: '🎥' },
    { id: '2', title: 'GitHub', url: 'https://github.com', icon: '💻' },
    { id: '3', title: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
    { id: '4', title: 'Reddit', url: 'https://reddit.com', icon: '🔴' },
    { id: '5', title: 'Netflix', url: 'https://netflix.com', icon: '🎬' },
    { id: '6', title: 'Amazon', url: 'https://amazon.com', icon: '📦' },
    { id: '7', title: 'Wikipedia', url: 'https://wikipedia.org', icon: '📚' },
    { id: '8', title: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '💬' },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const isUrl = searchQuery.includes('.') && !searchQuery.includes(' ');
      const url = isUrl
        ? (searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`)
        : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      onNavigate(url);
      setSearchQuery('');
    }
  };

  const handleQuickLinkClick = (url: string) => {
    onNavigate(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="homepage">
      <div className="homepage-content">
        <div className="time-widget">
          <div className="time">{formatTime(currentTime)}</div>
          <div className="date">{formatDate(currentTime)}</div>
        </div>

        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              className="home-search-input"
              placeholder="Search the web or enter URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>

        <div className="quick-links">
          <h3 className="quick-links-title">Quick Links</h3>
          <div className="quick-links-grid">
            {quickLinks.map((link) => (
              <div
                key={link.id}
                className="quick-link-item"
                onClick={() => handleQuickLinkClick(link.url)}
              >
                <div className="quick-link-icon">{link.icon}</div>
                <div className="quick-link-title">{link.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="homepage-footer">
          <span className="brand">Lunis Browser</span>
          <span className="tagline">Browse with style</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
