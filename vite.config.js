import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path when served in production
  base: './',
  
  // Configure env variables
  define: {
    'process.env': process.env
  },
  
  // Development server settings
  server: {
    port: 3000,
    open: true
  },
  
  // Build settings
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
}); 