import { defineConfig } from 'vite';

export default defineConfig({
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
