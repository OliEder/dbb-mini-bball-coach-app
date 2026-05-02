import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const base = process.env.BASE_URL || '/dbb-mini-bball-coach-app/';
  
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        
        manifest: {
          name: 'Basketball Team Manager',
          short_name: 'BBall Manager',
          description: 'Basketball Team Management für Trainer',
          theme_color: '#1e3a8a',
          background_color: '#ffffff',
          display: 'standalone',
          scope: base,
          start_url: base,
          icons: []
        },
        
        workbox: {
          // MINIMAL CONFIG - Keine Glob-Operationen!
          globPatterns: [], // Explizit leer = keine automatischen Precache
          
          // Nur Runtime Caching, kein Precaching
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 86400
                }
              }
            },
            {
              urlPattern: /\.(js|css|png|jpg|jpeg|svg|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 604800 // 7 days
                }
              }
            },
            {
              urlPattern: /^https:\/\/www\.basketball-bund\.net\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'bbb-api',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 86400
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ],
          
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@domains': path.resolve(__dirname, './src/domains'),
        '@shared': path.resolve(__dirname, './src/shared')
      }
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            dexie: ['dexie'],
            ui: ['lucide-react']
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    }
  };
});
