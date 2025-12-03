import { tailwindPlugin } from '@bosh-code/tsdown-plugin-tailwindcss'
import pluginBabel from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
      plugin: './src/plugin.ts',
    },
    format: 'esm',
    platform: 'browser',
    external: [/^react($|\/)/, 'react/jsx-runtime'],
    dts: {
      build: true,
    },
    exports: {
      devExports: 'development',
    },
    clean: true,
    outDir: 'dist',
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
  {
    entry: {
      index: './src/styles.css',
    },
    format: 'esm',
    platform: 'browser',
    outDir: 'dist',
    clean: false,
    plugins: [
      tailwindPlugin({
        minify: process.env.NODE_ENV === 'prod',
      }),
    ],
  },
])
