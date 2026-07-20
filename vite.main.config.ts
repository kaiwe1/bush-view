import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
});
