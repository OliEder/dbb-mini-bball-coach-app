// Simple service worker: precaches build assets at install and serves cached responses.
// You may want to adapt the cache strategy for your app.
const CACHE_NAME = 'bb-manager-v1'
const PRECACHE_URLS = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Try cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // Optionally cache new requests for same-origin GETs
        if (request.method === 'GET' && response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      }).catch(() => {
        // fallback: if navigation, return cached index.html
        if (request.mode === 'navigate') {
          return caches.match('/index.html')
        }
      })
    })
  )
})