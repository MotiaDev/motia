import pluginBabel from '@rollup/plugin-babel'
import url from '@rollup/plugin-url'
import { defineConfig } from 'tsdown'

const sharedExternal = [
  /^react($|\/)/,
  'react/jsx-runtime',
  // React and related
  '@xyflow/react',
  // Workspace dependencies
  '@motiadev/core',
  '@motiadev/stream-client-react',
  '@motiadev/ui',
  '@radix-ui/*',
  // Build tools
  'vite',
  'express',
  '@vitejs/plugin-react',
  'virtual:motia-plugins',
  // Node.js built-ins
  'fs',
  'path',
  'url',
  'http',
  'https',
  'stream',
  'util',
  'events',
  'crypto',
  'buffer',
  'querystring',
  'os',
  'child_process',
  'net',
  'tls',
  'zlib',
  'assert',
  'constants',
  'module',
  'perf_hooks',
  'readline',
  'repl',
  'string_decoder',
  'sys',
  'timers',
  'tty',
  'vm',
  'worker_threads',
  'fs/promises',
  'node:fs',
  'node:path',
  'node:url',
  'node:http',
  'node:https',
  'node:stream',
  'node:util',
  'node:events',
  'node:crypto',
  'node:buffer',
  'node:querystring',
  'node:os',
  'node:child_process',
  'node:net',
  'node:tls',
  'node:zlib',
]

export default defineConfig([
  {
    entry: { index: './index.tsx' },
    tsconfig: './tsconfig.app.json',
    target: 'es2020',
    format: 'esm',
    platform: 'browser',
    external: sharedExternal,
    dts: {
      build: true,
    },
    clean: true,
    outDir: 'dist',
    plugins: [
      url({
        include: ['**/*.png'],
        limit: 8192, // Inline files smaller than 8kb as data URLs
      }),
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
  // Node middleware entry (middleware.ts)
  {
    entry: { middleware: './middleware.ts' },
    tsconfig: './tsconfig.node.json',
    target: 'es2022',
    format: 'esm',
    platform: 'neutral',
    external: sharedExternal,
    dts: {
      build: true,
    },
    outDir: 'dist',
    copy: [
      'README.md',
      'index.html',
      'components.json',
      'public',
      'src',
      'tailwind.config.js',
      'postcss.config.mjs',
      'motia-plugin',
    ],
  },
])
