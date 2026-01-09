import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = "G-6NT9QNTBSZ";

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === "undefined") return;
  
  // Add gtag script
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually for SPA
  });
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
