import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@codegen/schema': path.resolve(__dirname, '.codegen/schema.ts'),
      '@codegen': path.resolve(__dirname, '.codegen'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
