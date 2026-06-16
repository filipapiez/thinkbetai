import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";

// Auto-reload when a lazy-loaded chunk fails (typically a stale hash after deploy).
const RELOAD_KEY = "__chunk_reload_at";
const handleChunkError = (msg: string) => {
  if (!/Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError/i.test(msg)) return;
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < 10000) return; // avoid infinite reload loop
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
};
window.addEventListener("error", (e) => handleChunkError(e.message || ""));
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const reason: any = e.reason;
  handleChunkError(typeof reason === "string" ? reason : reason?.message || "");
});
window.addEventListener("vite:preloadError", () => {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < 10000) return;
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
