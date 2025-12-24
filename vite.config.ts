import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        // Entry points are automatically handled by @crxjs/vite-plugin from manifest.json
        // This includes: content scripts, background worker, options page
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
