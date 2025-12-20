import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config.base.mjs'


export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: [ '**/test/**/*.{test,spec}.{ts,mts}' ],
      coverage: {
        provider: 'v8',
      },
    },
  }),
)
