import { defineConfig, loadEnv } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BRAND_LIGHT = '#eef5f1'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const backend = env.VITE_TEXT_SESSION_URL?.trim()
  // « npm run dev:phone » : HTTPS pour tester le micro sur téléphone (les navigateurs l'exigent hors localhost).
  const phone = mode === 'phone'

  return {
    server: {
      host: phone || undefined,
      // En développement, l'application appelle sa propre adresse et Vite relaie vers le backend :
      // pas de contenu mixte (page HTTPS → API HTTP) ni de CORS à configurer.
      proxy: backend ? { '/api': { target: backend, changeOrigin: true } } : undefined,
    },
    plugins: [
      react(),
      phone && basicSsl({ name: 'tontouma-dev' }),
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
          theme_color: BRAND_LIGHT,
          background_color: BRAND_LIGHT,
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
  }
})
