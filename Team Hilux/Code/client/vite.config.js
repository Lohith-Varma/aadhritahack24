import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true,
        type: 'module',
      },

      includeAssets: [
        'favicon.ico',
        'offline.html',
        'icons/*.png',
      ],

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'http://localhost:5000' &&
              url.pathname.startsWith('/api/logs'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'loom-api-logs',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, 
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/], 
      },

      manifest: {
        name: 'Loom — Student Wellness Intelligence',
        short_name: 'Loom',
        description: 'AI-powered behavioural wellness and focus tracking for students',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['health', 'education', 'productivity'],

        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ],

        shortcuts: [
          {
            name: 'Log Today',
            short_name: 'Log',
            description: "Log today's wellness data",
            url: '/log',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
          },
          {
            name: 'AI Coach',
            short_name: 'Coach',
            description: 'Chat with your wellness coach',
            url: '/coach',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
          },
        ],

        screenshots: [
          {
            src: '/screenshots/dashboard.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Loom Dashboard',
          },
        ],
      },
    }),
  ],
  server: { port: 3000 },
});
