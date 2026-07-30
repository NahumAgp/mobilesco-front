import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/components/auth/**/*.{js,jsx}',
        'src/modules/auth/services/**/*.js',
        'src/modules/insumos/utils/**/*.js',
        'src/modules/compras/services/**/*.js',
        'src/modules/cotizaciones/services/**/*.js'
      ],
      thresholds: {
        statements: 45,
        branches: 60,
        functions: 40,
        lines: 45
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,  // 👈 FORZAR al puerto del frontend
      clientPort: 5173
    },
    cors: true
  },
  preview: {
    port: 5173
  }
})
