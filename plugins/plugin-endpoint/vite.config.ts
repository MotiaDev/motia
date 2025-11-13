import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), tailwindcss(), dts({ insertTypesEntry: true })],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        plugin: resolve(__dirname, 'src/plugin.ts'),
      },
      name: 'MotiaPluginEndpoint',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@motiadev/core', '@motiadev/ui', '@motiadev/stream-client-react'],
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'lucide-react/icons': fileURLToPath(new URL('./node_modules/lucide-react/dist/esm/icons', import.meta.url)),
    },
  },
})
