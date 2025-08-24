import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// See https://vitejs.dev/config/ for details
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});