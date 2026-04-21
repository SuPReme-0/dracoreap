import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path when served in production. 
  // Change this if deploying to a subfolder (e.g., '/portfolio/')
  base: '/',
  
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    // Warn if the dragon model pushes the bundle size too high
    chunkSizeWarningLimit: 2000, 
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap']
        }
      }
    }
  }
});