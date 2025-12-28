// Content script to inject into Chrome Web Store pages
// This enables native "Add to Chrome" button functionality

export const webStoreInjectorScript = `
(function() {
  console.log('Lunis Browser: Chrome Web Store integration active');

  function extractExtensionId(url) {
    const match = url.match(/[a-z]{32}/);
    return match ? match[0] : null;
  }

  // Intercept clicks on the "Add to Chrome" button
  document.addEventListener('click', function(e) {
    let target = e.target;
    
    // Walk up the DOM tree to find the install button
    for (let i = 0; i < 5 && target; i++) {
      const text = target.textContent || '';
      const classes = target.className || '';
      
      if (text.includes('Add to Chrome') || 
          text.includes('Add to Chromium') ||
          classes.includes('webstore-test-button') ||
          classes.includes('dd-button')) {
        
        e.preventDefault();
        e.stopPropagation();
        
        const extensionId = extractExtensionId(window.location.href);
        if (extensionId) {
          console.log('Lunis Browser: Installing extension', extensionId);
          
          // Show loading state
          const originalText = target.textContent;
          const originalBg = target.style.background;
          target.textContent = 'Installing...';
          target.style.opacity = '0.6';
          target.style.pointerEvents = 'none';

          // Trigger installation via window message
          window.postMessage({
            type: 'LUNIS_INSTALL_EXTENSION',
            extensionId: extensionId,
            url: window.location.href
          }, '*');

          // Listen for result
          const resultHandler = (event) => {
            if (event.data && event.data.type === 'LUNIS_EXTENSION_INSTALLED') {
              console.log('Extension installed successfully:', event.data.extensionName);
              target.textContent = 'Added to Lunis Browser ✓';
              target.style.background = '#4CAF50';
              target.style.color = 'white';
              target.style.opacity = '1';
              
              // Show notification
              const notification = document.createElement('div');
              notification.textContent = event.data.extensionName + ' has been added to Lunis Browser';
              notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 999999;
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
              \`;
              document.body.appendChild(notification);
              setTimeout(() => notification.remove(), 3000);
              
              window.removeEventListener('message', resultHandler);
            } else if (event.data && event.data.type === 'LUNIS_EXTENSION_INSTALL_FAILED') {
              console.error('Extension installation failed:', event.data.error);
              target.textContent = originalText;
              target.style.opacity = '1';
              target.style.pointerEvents = 'auto';
              target.style.background = originalBg;
              alert('Failed to install extension: ' + event.data.error);
              window.removeEventListener('message', resultHandler);
            }
          };
          window.addEventListener('message', resultHandler);
        }
        
        return false;
      }
      
      target = target.parentElement;
    }
  }, true);

  console.log('Lunis Browser: Web Store install handlers registered');
})();
`;
