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

    // Configure the build process with comprehensive optimizations for better Lighthouse scores
    build: {
      // Performance settings
      chunkSizeWarningLimit: 1500,
      
      // Disable source maps in production for smaller build size
      sourcemap: false,
      
      // CSS optimization
      cssCodeSplit: true,
      // Use the default CSS minifier instead of lightningcss to avoid platform compatibility issues
      cssMinify: true,
      
      // Rollup build options
      rollupOptions: {
        output: {
          // Extract CSS into separate files for better caching
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff|woff2/i.test(extType)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            if (/css/i.test(extType)) {
              // Split CSS by purpose to enable tree-shaking
              if (assetInfo.name.includes('vuetify')) {
                return `assets/css/framework-[hash][extname]`;
              }
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          
          // Better JavaScript chunking strategy
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          
          // Improved code splitting strategy based on module size and usage patterns
          manualChunks: (id) => {
            // Critical first load modules - keep small
            if (id.includes('node_modules/vue/') && 
                !id.includes('vue-router')) {
              return 'critical';
            }
            
            // Vue and related packages for deferred loading
            if (id.includes('node_modules/vue-i18n/')) {
              return 'vendor-vue';
            }
            
            // Vuetify library - separate from styles
            if (id.includes('node_modules/vuetify/') && 
                !id.includes('styles')) {
              return 'vendor-vuetify-core';
            }
            
            // Vuetify styles - can be loaded with less priority
            if (id.includes('node_modules/vuetify/styles')) {
              return 'vendor-vuetify-styles';
            }
            
            // Font libraries - can be deferred
            if (id.includes('node_modules/@mdi/font') || 
                id.includes('fortawesome')) {
              return 'vendor-fonts';
            }
            
            // Utility libraries
            if (id.includes('node_modules/crypto-js/') ||
                id.includes('node_modules/qrcode')) {
              return 'vendor-utils';
            }
            
            // PDF generation related - can be lazy-loaded
            if (id.includes('node_modules/jspdf') ||
                id.includes('node_modules/html2canvas')) {
              return 'vendor-pdf';
            }
            
            // All other dependencies stay in vendor chunk
          }
        }
      },
      
      // Advanced minification options
      minify: 'terser',
      terserOptions: {
        ecma: 2020,
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info'],
          passes: 2 // Multiple compression passes
        },
        format: {
          comments: false // Remove comments
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
