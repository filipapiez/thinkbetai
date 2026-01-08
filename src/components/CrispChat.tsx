import { useEffect } from 'react';

// Your Crisp Website ID - get this from https://app.crisp.chat/settings/website/
const CRISP_WEBSITE_ID = 'YOUR_CRISP_WEBSITE_ID';

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export const CrispChat = () => {
  useEffect(() => {
    // Don't load if already loaded or no website ID configured
    if (window.$crisp || CRISP_WEBSITE_ID === 'YOUR_CRISP_WEBSITE_ID') {
      if (CRISP_WEBSITE_ID === 'YOUR_CRISP_WEBSITE_ID') {
        console.log('[Crisp] No website ID configured. Get yours at https://app.crisp.chat/settings/website/');
      }
      return;
    }

    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    // Load Crisp script
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    console.log('[Crisp] Chat widget loaded');

    return () => {
      // Cleanup on unmount (optional)
      const existingScript = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null; // Crisp injects its own UI
};
