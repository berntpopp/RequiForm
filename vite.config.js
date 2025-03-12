// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import vuetify from 'vite-plugin-vuetify'; // Optional: helps with Vuetify support in Vite

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // This plugin is optional but can help with Vuetify’s auto-imports
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
