import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'


export default defineConfig({
  test: {
    globals: false,
    root: './',
    coverage: {
      provider: 'v8',
    },
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
})
