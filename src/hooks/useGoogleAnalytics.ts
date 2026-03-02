import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = "G-6NT9QNTBSZ";

// Initialize Google Analytics
// NOTE: The gtag script is already loaded via index.html (deferred to window.load).
// This function only configures SPA page view tracking without loading the script again.
export const initGA = () => {
  if (typeof window === "undefined") return;

  // gtag and dataLayer are already initialized in index.html
  // Just ensure SPA config is set (send_page_view: false)
  if ((window as any).gtag) {
    (window as any).gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
    });
  }
};

// Track page views
export const trackPageView = (path: string) => {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  
  (window as any).gtag("event", "page_view", {
    page_path: path,
    page_title: document.title,
  });
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  
  (window as any).gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Hook to track page views on route changes
export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
};

// Extend window type for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
