/**
 * Service Worker Unregister Script
 * 
 * Füge dieses Script am Anfang deiner main.tsx ein (NUR im Dev-Mode!)
 * Es deregistriert automatisch alle Service Worker
 */

// Service Worker Cleanup (nur in Development)
if (import.meta.env.DEV) {
  // Deregistriere alle Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🧹 Service Worker deregistriert:', registration.scope);
      });
    });
  }

  // Lösche alle Caches
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        console.log('🧹 Cache gelöscht:', cacheName);
      });
    });
  }

  console.log('✅ Development Mode: Service Worker & Caches bereinigt');
}
