import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,  // Manifest wird separat generiert
      workbox: {
        // Service Worker nur mit Runtime Caching
        swDest: 'dist/sw.js',
        globDirectory: 'dist',
        globPatterns: [],  // Kein Precaching
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst'
          },
          {
            urlPattern: /\.(js|css|woff2?)$/,
            handler: 'CacheFirst'
          }
        ]
      },
      devOptions: {
        enabled: false,
        suppressWarnings: true
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
    sourcemap: false
  }
});
