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
            includeAssets: [], // Keine Assets zum Einschließen
            manifest: {
                name: 'Basketball Team Manager',
                short_name: 'BBall Manager',
                description: 'Basketball Team Management für Trainer',
                theme_color: '#1e3a8a',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/dbb-mini-bball-coach-app/',
                icons: [] // Noch keine Icons
            },
            workbox: {
                // Explizit leeres Array, um den Glob-Fehler zu vermeiden
                globPatterns: [],
                // Navigation fallback
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [/^\/api/],
                // Cache-Strategien für Runtime
                runtimeCaching: [
                    {
                        // HTML-Seiten
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages-cache',
                            networkTimeoutSeconds: 3
                        }
                    },
                    {
                        // JS und CSS
                        urlPattern: /\.(js|css)$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'assets-cache'
                        }
                    },
                    {
                        // BBB API
                        urlPattern: /^https:\/\/www\.basketball-bund\.net\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'bbb-api-cache',
                            networkTimeoutSeconds: 10,
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 24 Stunden
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ],
                // Allgemeine Workbox-Optionen
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true
            },
            devOptions: {
                enabled: false, // Service Worker in Development deaktiviert
                navigateFallback: 'index.html',
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
        sourcemap: false, // Keine Source-Maps in Production
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
});
