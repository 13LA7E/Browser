import React, { useState, useEffect } from 'react';
import { Settings as SettingsType, Extension } from '../../types';
import { getAllThemes, applyTheme } from '../themes';

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
    restoreSession: true,
    theme: 'dark',
    installedExtensions: []
  });
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'extensions'>('general');
  const [webStoreUrl, setWebStoreUrl] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installMessage, setInstallMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await window.electronAPI.getSettings();
    setSettings(loadedSettings);
    applyTheme(loadedSettings.theme || 'dark');
  };

  const handleSave = async () => {
    await window.electronAPI.updateSettings(settings);
    applyTheme(settings.theme);
    onClose();
  };

  const handleThemeChange = (themeId: string) => {
    setSettings({ ...settings, theme: themeId });
    applyTheme(themeId);
  };

  const handleInstallExtension = async () => {
    const result = await window.electronAPI.selectExtensionFolder();
    if (result) {
      loadSettings();
    }
  };

  const handleToggleExtension = async (extensionId: string, enabled: boolean) => {
    await window.electronAPI.toggleExtension(extensionId, enabled);
    loadSettings();
  };

  const handleRemoveExtension = async (extensionId: string) => {
    await window.electronAPI.removeExtension(extensionId);
    loadSettings();
  };

  const handleInstallFromWebStore = async () => {
    if (!webStoreUrl.trim()) {
      setInstallMessage({ type: 'error', text: 'Please enter a Chrome Web Store URL' });
      return;
    }

    setIsInstalling(true);
    setInstallMessage(null);

    try {
      const result = await window.electronAPI.installFromWebStore(webStoreUrl);
      if (result.success) {
        setInstallMessage({ type: 'success', text: `Successfully installed ${result.extension.name}` });
        setWebStoreUrl('');
        await loadSettings();
      } else {
        setInstallMessage({ type: 'error', text: result.error || 'Failed to install extension' });
      }
    } catch (error: any) {
      setInstallMessage({ type: 'error', text: error.message || 'Failed to install extension' });
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="settings-tabs">
        <button 
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'extensions' ? 'active' : ''}`}
          onClick={() => setActiveTab('extensions')}
        >
          Extensions
        </button>
      </div>
      <div className="settings-content">
        {activeTab === 'general' && (
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
        )}

        {activeTab === 'appearance' && (
          <div className="settings-form">
            <div className="setting-group">
              <label>Theme</label>
              <div className="theme-grid">
                {getAllThemes().map(theme => (
                  <div
                    key={theme.id}
                    className={`theme-card ${settings.theme === theme.id ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="theme-preview" style={{
                      background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.toolbarBg} 100%)`,
                      border: `2px solid ${theme.colors.accent}`
                    }}>
                      <div className="theme-preview-bar" style={{ background: theme.colors.toolbarBg }}>
                        <div className="theme-preview-dot" style={{ background: theme.colors.accent }}></div>
                        <div className="theme-preview-dot" style={{ background: theme.colors.accent }}></div>
                        <div className="theme-preview-dot" style={{ background: theme.colors.accent }}></div>
                      </div>
                    </div>
                    <div className="theme-name">{theme.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="save-btn" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        )}

        {activeTab === 'extensions' && (
          <div className="settings-form">
            <div className="setting-group">
              <div className="extensions-header">
                <h3>Chrome Extensions</h3>
                <button className="add-extension-btn" onClick={handleInstallExtension}>
                  + Install from Folder
                </button>
              </div>
              
              <div className="webstore-install-section">
                <h4>Install from Chrome Web Store</h4>
                <div className="webstore-install-form">
                  <input
                    type="text"
                    placeholder="Paste Chrome Web Store URL (e.g., https://chromewebstore.google.com/detail/...)"
                    value={webStoreUrl}
                    onChange={(e) => setWebStoreUrl(e.target.value)}
                    disabled={isInstalling}
                  />
                  <button 
                    className="install-webstore-btn"
                    onClick={handleInstallFromWebStore}
                    disabled={isInstalling || !webStoreUrl.trim()}
                  >
                    {isInstalling ? 'Installing...' : 'Install'}
                  </button>
                </div>
                {installMessage && (
                  <div className={`install-message ${installMessage.type}`}>
                    {installMessage.text}
                  </div>
                )}
              </div>
              
              {settings.installedExtensions.length === 0 ? (
                <div className="empty-message">
                  No extensions installed. Install extensions from Chrome Web Store or local folder.
                </div>
              ) : (
                <div className="extensions-list">
                  {settings.installedExtensions.map(ext => (
                    <div key={ext.id} className="extension-item">
                      <div className="extension-info">
                        <div className="extension-name">{ext.name}</div>
                        <div className="extension-version">v{ext.version}</div>
                      </div>
                      <div className="extension-actions">
                        <label className="extension-toggle">
                          <input
                            type="checkbox"
                            checked={ext.enabled}
                            onChange={(e) => handleToggleExtension(ext.id, e.target.checked)}
                          />
                          <span>Enabled</span>
                        </label>
                        <button 
                          className="extension-remove-btn"
                          onClick={() => handleRemoveExtension(ext.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
