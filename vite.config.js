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

    // Configure the build process with optimization
    build: {
      // Performance settings
      chunkSizeWarningLimit: 1500,
      
      // Enable source maps for production (optional, can be removed for smaller build size)
      sourcemap: false,
      
      // Rollup build options
      rollupOptions: {
        output: {
          // Better code splitting strategy based on module size and usage patterns
          manualChunks: (id) => {
            // Vue and related packages
            if (id.includes('node_modules/vue/') || 
                id.includes('node_modules/vue-i18n/')) {
              return 'vendor-vue';
            }
            
            // Vuetify and related UI
            if (id.includes('node_modules/vuetify/')) {
              return 'vendor-vuetify';
            }
            
            // Utility libraries
            if (id.includes('node_modules/crypto-js/') ||
                id.includes('node_modules/qrcode')) {
              return 'vendor-utils';
            }
            
            // PDF generation related
            if (id.includes('node_modules/jspdf') ||
                id.includes('node_modules/html2canvas')) {
              return 'vendor-pdf';
            }
            
            // All other dependencies stay in vendor chunk
          }
        }
      },
      
      // Minification options
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remove console.log in production
          drop_console: true,
          // Remove debugger statements
          drop_debugger: true
        }
      }
    },
    server: {
      watch: {
        usePolling: true,
      },
    }
  };
});
