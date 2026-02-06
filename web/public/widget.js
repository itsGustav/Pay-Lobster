(function() {
  'use strict';

  // Widget version
  const VERSION = '1.0.0';
  const API_BASE = 'https://paylobster.com';
  
  // Tier definitions
  const TIERS = {
    ELITE: { min: 750, label: '★ ELITE ★', color: '#FFD700' },
    TRUSTED: { min: 500, label: '✓ TRUSTED', color: '#4CAF50' },
    EMERGING: { min: 250, label: '↗ EMERGING', color: '#2196F3' },
    NEW: { min: 0, label: '◆ NEW', color: '#9E9E9E' }
  };

  function getTier(score) {
    if (score >= TIERS.ELITE.min) return TIERS.ELITE;
    if (score >= TIERS.TRUSTED.min) return TIERS.TRUSTED;
    if (score >= TIERS.EMERGING.min) return TIERS.EMERGING;
    return TIERS.NEW;
  }

  function renderWidget(data, theme, size, showLink) {
    const tier = getTier(data.score);
    const isDark = theme === 'dark';
    
    // Color scheme
    const bgColor = isDark ? '#111827' : '#FFFFFF';
    const borderColor = isDark ? '#1F2937' : '#E5E7EB';
    const textColor = isDark ? '#FFFFFF' : '#111827';
    const mutedColor = isDark ? '#9CA3AF' : '#6B7280';
    
    // Size configs
    const sizes = {
      compact: { padding: '12px', fontSize: '14px', scoreSize: '24px' },
      standard: { padding: '20px', fontSize: '16px', scoreSize: '48px' },
      full: { padding: '24px', fontSize: '18px', scoreSize: '56px' }
    };
    
    const config = sizes[size] || sizes.standard;
    
    const html = `
      <div class="lobster-widget" style="
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 12px;
        padding: ${config.padding};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        max-width: 320px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <div style="
          color: ${mutedColor};
          font-size: ${config.fontSize};
          margin-bottom: 12px;
          font-weight: 600;
        ">
          🦞 LOBSTER Score
        </div>
        
        <div style="
          font-size: ${config.scoreSize};
          font-weight: bold;
          color: ${textColor};
          margin: 16px 0;
        ">
          ${data.score}
        </div>
        
        <div style="
          font-size: ${config.fontSize};
          font-weight: 600;
          color: ${tier.color};
          margin: 12px 0;
          letter-spacing: 1px;
        ">
          ${tier.label}
        </div>
        
        ${showLink ? `
          <a 
            href="${API_BASE}/agent/${data.address}" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              display: inline-block;
              margin-top: 16px;
              color: #3B82F6;
              text-decoration: none;
              font-size: 14px;
              transition: opacity 0.2s;
            "
            onmouseover="this.style.opacity='0.7'"
            onmouseout="this.style.opacity='1'"
          >
            Verify on Pay Lobster →
          </a>
        ` : ''}
        
        ${size === 'full' && data.transactions !== undefined ? `
          <div style="
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid ${borderColor};
            color: ${mutedColor};
            font-size: 14px;
          ">
            <div>${data.transactions} transactions</div>
            ${data.registered ? `<div style="margin-top: 4px;">Since ${new Date(data.registered).toLocaleDateString()}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    return html;
  }

  function renderError(message, theme) {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1F2937' : '#FEE2E2';
    const textColor = isDark ? '#FCA5A5' : '#991B1B';
    
    return `
      <div style="
        background: ${bgColor};
        border: 2px solid ${textColor};
        border-radius: 12px;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        max-width: 320px;
        color: ${textColor};
      ">
        <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
        <div style="font-size: 14px;">${message}</div>
      </div>
    `;
  }

  function renderLoading(theme) {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#111827' : '#FFFFFF';
    const borderColor = isDark ? '#1F2937' : '#E5E7EB';
    
    return `
      <div style="
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 12px;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        max-width: 320px;
        color: #9CA3AF;
      ">
        <div style="font-size: 24px; animation: pulse 2s infinite;">🦞</div>
        <div style="font-size: 14px; margin-top: 8px;">Loading...</div>
      </div>
    `;
  }

  async function fetchScoreData(address) {
    try {
      // Try the API endpoint first
      const response = await fetch(`${API_BASE}/api/badge/${address}?format=json`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Widget fetch error:', error);
      throw error;
    }
  }

  async function initWidget(element) {
    const address = element.getAttribute('data-lobster-score');
    const theme = element.getAttribute('data-theme') || 'dark';
    const size = element.getAttribute('data-size') || 'standard';
    const showLink = element.getAttribute('data-show-link') !== 'false';
    
    // Validate address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      element.innerHTML = renderError('Invalid wallet address', theme);
      return;
    }
    
    // Show loading state
    element.innerHTML = renderLoading(theme);
    
    try {
      const data = await fetchScoreData(address);
      element.innerHTML = renderWidget(data, theme, size, showLink);
    } catch (error) {
      element.innerHTML = renderError('Failed to load score', theme);
    }
  }

  // Initialize all widgets on the page
  function init() {
    const elements = document.querySelectorAll('[data-lobster-score]');
    
    if (elements.length === 0) {
      console.warn('Pay Lobster Widget: No elements found with data-lobster-score attribute');
      return;
    }
    
    elements.forEach(element => {
      // Skip if already initialized
      if (element.getAttribute('data-lobster-initialized') === 'true') {
        return;
      }
      
      element.setAttribute('data-lobster-initialized', 'true');
      initWidget(element);
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global API for manual initialization
  window.PayLobsterWidget = {
    version: VERSION,
    init: init,
    initElement: initWidget
  };

  console.log(`Pay Lobster Widget v${VERSION} loaded`);
})();
