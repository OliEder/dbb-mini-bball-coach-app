/**
 * Main Entry Point
 * 
 * React App Initialization
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Development: Cleanup Service Worker & Caches
if (import.meta.env.DEV) {
  // Deregistriere alle Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🧹 DEV: Service Worker deregistriert');
      });
    });
  }

  // Lösche alle Caches
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        console.log('🧹 DEV: Cache gelöscht:', cacheName);
      });
    });
  }
}

// Production: Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ PROD: Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('❌ PROD: Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
