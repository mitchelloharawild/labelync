import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/labelync/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'release-notes.json'],
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Labelync',
        short_name: 'Labelync',
        description: 'Print custom stickers with Phomemo label printers',
        theme_color: '#333333',
        background_color: '#333333',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // Don't cache release-notes.json so we always fetch the latest
        navigateFallbackDenylist: [/\/release-notes\.json$/],
        runtimeCaching: [
          {
            // Ensure release-notes.json is always fetched fresh
            urlPattern: /\/release-notes\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'release-notes-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 // 1 minute
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ]
})
