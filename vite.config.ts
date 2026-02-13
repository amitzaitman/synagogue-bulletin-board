/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'לוח מודעות דיגיטלי',
        short_name: 'לוח מודעות',
        description: 'לוח מודעות דיגיטלי לבית הכנסת',
        theme_color: '#F5F1E9',
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
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  base: '/',
  resolve: {
    alias: {
      '@csstools/css-calc': './src/__mocks__/css-calc.js',
    },
  },
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    server: {
      deps: {
        inline: ['@asamuzakjp/css-color'],
      },
    },
  },
})
