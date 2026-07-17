import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        entryFileNames: 'hero-gallery.js',
        assetFileNames: 'hero-gallery.[ext]',
        format: 'iife',
        name: 'HeroGallery',
      }
    }
  }
});
