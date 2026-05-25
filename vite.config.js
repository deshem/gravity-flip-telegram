import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        studio: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game/index.html')
      }
    },
    chunkSizeWarningLimit: 1200
  }
});
