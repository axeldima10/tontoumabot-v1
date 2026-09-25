import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Icônes de l'application installable, générées depuis le logo (npx pwa-assets-generator).
// Les marges gardent le logo (432 px) à sa taille d'origine ou en dessous : aucun agrandissement flou.
const BRAND_DARK = '#050d09'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0.16 },
    // Android : zone de sécurité des icônes adaptatives (le système peut rogner jusqu'à 20 % de chaque côté).
    maskable: { ...minimal2023Preset.maskable, padding: 0.32, resizeOptions: { background: BRAND_DARK } },
    // iOS n'accepte pas la transparence : fond sombre de la marque.
    apple: { ...minimal2023Preset.apple, padding: 0.3, resizeOptions: { background: BRAND_DARK } },
  },
  images: ['public/tontuma-bot.png'],
})
