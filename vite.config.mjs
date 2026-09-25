import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BRAND_DARK = '#050d09'

export default defineConfig({
  plugins: [
    react(),
    // Application installable (PWA) : manifeste + service worker générés au build.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Tontouma Bot — Assistant administratif',
        short_name: 'Tontouma',
        description: 'Votre assistant d’accueil, d’orientation et d’accompagnement dans les démarches administratives, en français, wolof et anglais.',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: BRAND_DARK,
        background_color: BRAND_DARK,
        categories: ['productivity', 'utilities', 'government'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Raccourcis (appui long sur l'icône) vers les deux usages principaux.
        shortcuts: [
          { name: 'Discuter avec Tontouma', short_name: 'Discussion', url: '/#discussion', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Parler à Tontouma', short_name: 'Mode vocal', url: '/#vocal', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Seuls les fichiers de l'application sont mis en cache (pas les maquettes .jpg du dossier public).
        globPatterns: ['**/*.{js,css,html,woff2}', 'assets/*.png', 'pwa-*.png', 'maskable-icon-*.png', 'apple-touch-icon-*.png', 'favicon.ico', 'tontuma-bot.png'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Les appels à l'API (texte, voix, audio) passent toujours par le réseau : jamais de réponse périmée.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
