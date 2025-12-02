import { tailwindPlugin } from '@bosh-code/tsdown-plugin-tailwindcss'
import pluginBabel from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

export default defineConfig([
  // Main JavaScript/TypeScript build
  {
    entry: {
      index: './src/index.ts',
    },
    format: 'esm',
    platform: 'neutral',
    external: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      /^@radix-ui\//,
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'zustand',
      'react-resizable-panels',
      'react-use-resizable',
    ],
    dts: {
      build: true,
    },
    clean: true,
    outDir: 'dist',
    sourcemap: true,
    unbundle: true,
    copy: {
      from: './src/styles/globals.css',
      to: './dist/globals.css',
    },
    plugins: [
      pluginBabel({
        babelHelpers: 'bundled',
        parserOpts: {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        },
        plugins: ['babel-plugin-react-compiler'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
    ],
  },
  // Separate CSS build
  {
    entry: {
      styles: './src/styles/globals.css',
    },
    format: 'esm',
    platform: 'neutral',
    outDir: 'dist',
    clean: false,
    plugins: [
      tailwindPlugin({
        minify: process.env.NODE_ENV === 'prod',
        sourcemap: false,
      }),
    ],
  },
])
