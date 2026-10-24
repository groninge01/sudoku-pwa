import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        play: fileURLToPath(new URL('./play.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Sudoku',
        short_name: 'Sudoku',
        description: 'A clean, offline-first sudoku game. No ads, no rewards, no limits.',
        display: 'standalone',
        orientation: 'any',
        id: './',
        start_url: './play.html',
        scope: './',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        icons: [
          // ?v=2: identical icon URLs keep an installed WebAPK from ever
          // refetching; bump this when the artwork changes again.
          { src: 'icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        ignoreURLParametersMatching: [/^home$/, /^utm_/, /^fbclid$/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'play.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  worker: { format: 'es' },
});
