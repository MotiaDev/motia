import { injectCssPlugin } from '@bosh-code/tsdown-plugin-inject-css'
import { tailwindPlugin } from '@bosh-code/tsdown-plugin-tailwindcss'
import pluginBabel from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    plugin: './src/plugin.ts',
  },
  format: 'esm',
  platform: 'neutral',
  external: [/^react($|\/)/, 'react/jsx-runtime'],
  dts: {
    build: true,
  },
  exports: {
    devExports: 'development',
  },
  clean: true,
  outDir: 'dist',
  sourcemap: true,
  unused: true,
  publint: true,
  plugins: [
    tailwindPlugin({
      minify: process.env.NODE_ENV === 'prod',
    }),
    injectCssPlugin(),
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
})
