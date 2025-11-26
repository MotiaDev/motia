import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  format: 'esm',
  platform: 'node',
  external: ['@motiadev/core', 'motia', 'jest', 'redis', 'supertest'],
  dts: {
    build: true,
  },
  clean: true,
  outDir: 'dist',
  sourcemap: true,
  unbundle: true,
})
