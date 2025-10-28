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
        
        // 🔥 Scope für GitHub Pages Subdirectory
        scope: base,
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
          // FIX: Explizit globDirectory und globPatterns setzen
          globDirectory: 'dist',
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'
          ],
          
          // Oder alternativ: globPatterns komplett deaktivieren
          // globPatterns: [],
          
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 86400 // 24h
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
          clientsClaim: true,
          
          // FIX: Explizit navigateFallback deaktivieren, wenn nicht benötigt
          navigateFallback: null,
          navigateFallbackDenylist: [/^\/(api|admin)\/.*/]
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
