// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';
import vuetify from 'vite-plugin-vuetify';

/* global process */

export default defineConfig(({ mode }) => {
  // Load all environment variables for the current mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Base path from .env file (for GitHub Pages)
    base: env.VITE_ASSET_URL || '/',

    plugins: [
      vue({
        script: {
          defineModel: true,
          propsDestructure: true
        },
        template: {
          compilerOptions: {
            whitespace: 'preserve'
          }
        }
      }),
      vuetify({ autoImport: true })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      // App version
      'process.env.VUE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '0.0.0'),
      
      // Vue i18n compiler flags
      '__VUE_I18N_FULL_INSTALL__': true,
      '__VUE_I18N_LEGACY_API__': false,
      '__INTLIFY_PROD_DEVTOOLS__': false,
      '__VUE_I18N_RUNTIME_ONLY__': false
    },

    // Configure the build process - simpler version
    build: {
      // Performance settings
      chunkSizeWarningLimit: 1200
    },
    server: {
      watch: {
        usePolling: true,
      },
    }
  };
});
