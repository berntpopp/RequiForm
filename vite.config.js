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
    css: {
      postcss: {
        plugins: [
          {
            // This is a placeholder - postcss-purgecss needs to be installed
            // npm install --save-dev postcss-purgecss
            postcssPlugin: 'postcss-purgecss',
            options: {
              // Scan all Vue files, JS files, and HTML templates for class usage
              content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
              // Safelist patterns for dynamically generated classes
              safelist: [
                // Vuetify classes
                /^v-/,
                // Material Design Icons
                /^mdi-/,
                // FontAwesome Icons
                /^fa-/,
                // Critical utility classes that might be added dynamically
                /^text-/,
                /^bg-/,
                // Animation classes
                /^animate/,
                // Dialog and other dynamic components
                /dialog-transition/,
                /tab-transition/,
                /^theme--/
              ],
              // Don't remove unused CSS variables as they might be referenced dynamically
              variables: true
            }
          }
        ]
      }
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

    // Configure the build process with optimizations for perfect Lighthouse scores
    build: {
      // Performance settings
      chunkSizeWarningLimit: 1500,
      
      // Disable source maps in production for smaller build size
      sourcemap: false,
      
      // CSS optimization
      cssCodeSplit: true,
      cssMinify: true,
      
      // Commonjs optimization for better tree-shaking
      commonjsOptions: {
        requireReturnsDefault: 'auto'
      },
      
      // Rollup build options with aggressive tree shaking
      rollupOptions: {
        // Enable aggressive tree shaking at rollup level
        treeshake: {
          preset: 'recommended',
          moduleSideEffects: false,
          tryCatchDeoptimization: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        },
        output: {
          // Extract CSS into separate files for better caching
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            // Fonts need special handling to ensure they're accessible
            if (/woff|woff2|ttf|eot/i.test(extType)) {
              // Keep Material Design Icons font names intact to maintain references
              if (assetInfo.name.includes('materialdesignicons')) {
                return `assets/fonts/[name][extname]`;
              }
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
          
          // Optimized JavaScript chunking with content hashing for better caching
          chunkFileNames: 'assets/js/[name].[hash].js',
          entryFileNames: 'assets/js/[name].[hash].js',
          
          // Improved code splitting strategy based on module size and usage patterns
          manualChunks: (id) => {
            // Vue and related packages for deferred loading
            if (id.includes('node_modules/vue-i18n/')) {
              return 'vendor-vue';
            }
            
            // Only truly critical modules for first paint
            if (id.includes('node_modules/vue/runtime-dom') || 
                id.includes('node_modules/vue/runtime-core')) {
              return 'critical';
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
