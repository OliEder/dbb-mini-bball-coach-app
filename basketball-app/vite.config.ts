import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Service Worker nur in Production registrieren
      registerType: 'autoUpdate',
      // WICHTIG: Deaktiviere Dev-Optionen
      devOptions: {
        enabled: false, // Service Worker im Dev-Mode deaktiviert
      },
      // Keine includeAssets - Icons fehlen aktuell
      manifest: {
        name: 'Basketball Team Manager',
        short_name: 'BBall Manager',
        description: 'Basketball Team Management für Trainer',
        theme_color: '#1e3a8a',
        background_color: '#ffffff',
        display: 'standalone',
        // Icons temporär entfernt - müssen noch erstellt werden
        icons: []
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.basketball-bund\.net\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bbb-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
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
  // Build-Optionen: Source-Maps nur in Development
  build: {
    sourcemap: false, // Keine Source-Maps in Production (reduziert Bundle-Größe)
  },
  // Optimizations für Dependencies
  optimizeDeps: {
    exclude: ['lucide-react'], // Kann Probleme mit Tree-Shaking haben
  }
});
