import pluginBabel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss'
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
      postcss({
        extract: true,
        minimize: process.env.NODE_ENV === 'prod',
        plugins: [], // @tailwindcss/postcss is auto-loaded from postcss.config.js
      }),
    ],
  },
])
