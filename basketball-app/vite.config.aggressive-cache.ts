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
        
        // Inkludiere alle generierten Assets explizit
        includeAssets: ['**/*'],
        
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
          // AGGRESSIVE PRECACHING - Cache alles beim Start
          globDirectory: 'dist',
          globPatterns: [
            'index.html',
            'assets/*.js',
            'assets/*.css',
            '**/*.{png,jpg,jpeg,gif,svg,ico,webp}',
            '**/*.{woff,woff2,ttf,eot}'
          ],
          
          // Ignoriere Source Maps
          globIgnores: [
            '**/*.map',
            '**/node_modules/**/*'
          ],
          
          // Erlaube größere Files (bis 5MB)
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          
          // Runtime Caching nur für externe Resources
          runtimeCaching: [
            {
              // Basketball-Bund API
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
            },
            {
              // Externe CDNs (falls genutzt)
              urlPattern: /^https:\/\/cdn\./,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 604800 // 7 days
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
