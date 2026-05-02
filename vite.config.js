import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig(() => {
    // ✅ HARDCODED für benchboss.de - ignoriert ENV
    const base = '/';
    return {
        base,
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                strategies: 'injectManifest',
                srcDir: 'src',
                filename: 'sw.ts',
                manifest: {
                    name: 'BenchBoss - Basketball Team Manager',
                    short_name: 'BenchBoss',
                    description: 'Team Management & Lineup Planung für Basketball-Trainer',
                    id: '/',
                    orientation: 'portrait',
                    theme_color: '#1e3a8a',
                    background_color: '#ffffff',
                    display: 'standalone',
                    scope: base,
                    start_url: base,
                    icons: []
                },
                injectManifest: {
                    globPatterns: [],
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
