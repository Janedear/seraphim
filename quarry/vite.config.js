import platformPlugin from '@base44/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createLocalApiMiddleware } from './server/http.js';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}', 'server/**/*.test.js'],
  },
  logLevel: 'error',
  plugins: [
    {
      name: 'seraphim-local-backend',
      configureServer(server) {
        server.middlewares.use(createLocalApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createLocalApiMiddleware());
      },
    },
    platformPlugin({
      legacySDKImports: process.env.SERAPHIM_LEGACY_SDK_IMPORTS === 'true',
    }),
    react(),
  ],
});
