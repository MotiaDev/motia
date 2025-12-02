import react from '@vitejs/plugin-react'
import path from 'path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

/**
 * Plugin that provides an empty placeholder for virtual:motia-plugins.
 * In production, plugins are loaded via window.__MOTIA_PLUGINS__.
 */
function emptyPluginsPlugin(): Plugin {
  const VIRTUAL_MODULE_ID = 'virtual:motia-plugins'
  const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID

  return {
    name: 'vite-plugin-empty-motia-plugins',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_ID
      }
    },

    load(id) {
      if (id === RESOLVED_ID) {
        // In production, plugins are loaded from window.__MOTIA_PLUGINS__
        return `
          // Production mode: plugins are injected via window global
          export const plugins = window.__MOTIA_PLUGINS__ || [];
        `
      }
    },
  }
}

/**
 * Vite build configuration for pre-building the workbench.
 *
 * This builds the React app, CSS, and assets at package build time,
 * eliminating the need for Vite at runtime.
 *
 * At runtime, only esbuild is used for plugin bundling.
 */
export default defineConfig({
  root: __dirname,
  base: './', // Relative paths for portable output

  plugins: [react(), emptyPluginsPlugin()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },

  build: {
    outDir: 'dist/client',
    emptyOutDir: true,

    // Generate manifest for asset mapping
    manifest: true,

    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Predictable asset names for easier serving
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    // Optimize chunk splitting
    chunkSizeWarningLimit: 1000,
  },

  // CSS processing happens at build time
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.mjs'),
  },
})
