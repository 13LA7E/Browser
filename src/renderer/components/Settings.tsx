import React, { useState, useEffect } from 'react';
import { Settings as SettingsType } from '../../types';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<SettingsType>({
    homePage: 'https://www.google.com',
    searchEngine: 'https://www.google.com/search?q=',
    defaultZoom: 1.0,
    enableJavaScript: true,
    enableImages: true,
    downloadPath: '',
    restoreSession: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await window.electronAPI.getSettings();
    setSettings(loadedSettings);
  };

  const handleSave = async () => {
    await window.electronAPI.updateSettings(settings);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="panel">
        <div className="panel-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="panel-content">
          <div className="settings-form">
            <div className="setting-group">
              <label>Home Page</label>
              <input
                type="text"
                value={settings.homePage}
                onChange={(e) => setSettings({ ...settings, homePage: e.target.value })}
              />
            </div>

            <div className="setting-group">
              <label>Search Engine URL</label>
              <input
                type="text"
                value={settings.searchEngine}
                onChange={(e) => setSettings({ ...settings, searchEngine: e.target.value })}
              />
            </div>

            <div className="setting-group">
              <label>Default Zoom</label>
              <input
                type="number"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.defaultZoom}
                onChange={(e) => setSettings({ ...settings, defaultZoom: parseFloat(e.target.value) })}
              />
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableJavaScript}
                  onChange={(e) => setSettings({ ...settings, enableJavaScript: e.target.checked })}
                />
                Enable JavaScript
              </label>
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableImages}
                  onChange={(e) => setSettings({ ...settings, enableImages: e.target.checked })}
                />
                Enable Images
              </label>
            </div>

            <div className="setting-group">
              <label>Download Location</label>
              <input
                type="text"
                value={settings.downloadPath}
                onChange={(e) => setSettings({ ...settings, downloadPath: e.target.value })}
                placeholder="Default downloads folder"
              />
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.restoreSession}
                  onChange={(e) => setSettings({ ...settings, restoreSession: e.target.checked })}
                />
                Restore tabs on startup
              </label>
            </div>

            <button className="save-btn" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
