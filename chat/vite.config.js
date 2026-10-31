import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'emoji-vendor': ['emoji-picker-react'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
