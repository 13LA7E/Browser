import React, { useState, useEffect } from 'react';

interface Download {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  savePath: string;
}

interface DownloadsProps {
  onClose: () => void;
}

const Downloads: React.FC<DownloadsProps> = ({ onClose }) => {
  const [downloads, setDownloads] = useState<Download[]>([]);

  useEffect(() => {
    loadDownloads();

    // Listen for download events
    window.electronAPI.onDownloadItem((download: Download) => {
      setDownloads(prev => [download, ...prev]);
    });

    window.electronAPI.onDownloadProgress((download: Download) => {
      setDownloads(prev => 
        prev.map(d => d.id === download.id ? download : d)
      );
    });

    window.electronAPI.onDownloadComplete((download: Download) => {
      setDownloads(prev => 
        prev.map(d => d.id === download.id ? download : d)
      );
    });
  }, []);

  const loadDownloads = async () => {
    const downloadsList = await window.electronAPI.getDownloads();
    setDownloads(downloadsList);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getProgress = (download: Download) => {
    if (download.totalBytes === 0) return 0;
    return (download.receivedBytes / download.totalBytes) * 100;
  };

  const handleOpen = (filepath: string) => {
    window.electronAPI.openDownload(filepath);
  };

  const handleShowFolder = () => {
    window.electronAPI.showDownloadFolder();
  };

  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-header">
          <h2>Downloads</h2>
          <div>
            <button className="action-btn-small" onClick={handleShowFolder}>
              Open Folder
            </button>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        <div className="panel-content">
          {downloads.length === 0 ? (
            <p className="empty-message">No downloads yet.</p>
          ) : (
            <div className="downloads-list">
              {downloads.map(download => (
                <div key={download.id} className="download-item">
                  <div className="download-info">
                    <div className="download-filename">{download.filename}</div>
                    <div className="download-url">{download.url}</div>
                    <div className="download-meta">
                      {download.state === 'completed' && (
                        <>
                          <span>{formatBytes(download.totalBytes)}</span>
                          <span className="separator">•</span>
                          <span>{formatTime(download.startTime)}</span>
                        </>
                      )}
                      {download.state === 'progressing' && (
                        <>
                          <span>{formatBytes(download.receivedBytes)} / {formatBytes(download.totalBytes)}</span>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${getProgress(download)}%` }}
                            />
                          </div>
                        </>
                      )}
                      {download.state === 'interrupted' && (
                        <span className="error-text">Download interrupted</span>
                      )}
                      {download.state === 'cancelled' && (
                        <span className="error-text">Download cancelled</span>
                      )}
                    </div>
                  </div>
                  {download.state === 'completed' && (
                    <button
                      className="action-btn-small"
                      onClick={() => handleOpen(download.savePath)}
                    >
                      Open
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Downloads;
