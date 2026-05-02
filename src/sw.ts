/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

// Precache static assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api/, /\.(js|css|png|jpg|jpeg|svg)$/],
  })
);

// Runtime caching for BBB API
registerRoute(
  ({ url }) => url.origin === 'https://www.basketball-bund.net',
  new NetworkFirst({
    cacheName: 'bbb-api',
    networkTimeoutSeconds: 10,
    plugins: [],
  })
);
