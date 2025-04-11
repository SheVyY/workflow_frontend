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
      },
      output: {
        // Ensure chunks have predictable names
        manualChunks: undefined,
        // Configure asset file names
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        // Configure chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // Configure entry files
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    }
  }
}); 