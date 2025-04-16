// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';
import vuetify from 'vite-plugin-vuetify';

/* global process */
export default defineConfig(({ mode }) => {
  // Load all environment variables for the current mode (e.g. development, production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Now the base uses the value from your .env file, e.g. VITE_ASSET_URL
    base: env.VITE_ASSET_URL,
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      'process.env.VUE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
      // Add other environment variables if needed
    },
    server: {
      watch: {
        usePolling: true,
      },
    },
  };
});
