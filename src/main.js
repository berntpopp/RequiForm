// src/main.js
import { createApp } from 'vue';
import App from './App.vue';

// Import the CSS file for the main application
import '@fortawesome/fontawesome-free/css/all.css';

// Import Vuetify, its components, and directives
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Import Pinia for state management
import { createPinia } from 'pinia';

// Import Vuetify styles and Material Design Icons
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

// Import the initializer and the config object
import { initializeBranding, brandingConfig } from '@/services/brandingConfigService';
import logService from '@/services/logService'; // Import logService
import i18n from './i18n'; // Import i18n instance

// Wrap initialization and mounting in an async function
async function startApp() {
  try {
    await initializeBranding(); // Wait for branding config to load/initialize

    // Create Vuetify instance AFTER branding is loaded
    const vuetify = createVuetify({
      components,
      directives,
      theme: { // Add theme configuration
        themes: {
          light: { // Configure light theme
            dark: false, // Specify this is not a dark theme
            colors: {
              ...brandingConfig.themeColors // Spread configured colors
            },
          },
          dark: { // Configure dark theme
            dark: true, // Specify this IS a dark theme
            colors: {
              ...brandingConfig.darkThemeColors // Spread configured dark theme colors
            }
          }
        },
      },
    });

    // Create Pinia instance
    const pinia = createPinia();

    // Create Vue app and use plugins
    const app = createApp(App);
    app.use(vuetify); // Use the configured Vuetify instance
    app.use(pinia);
    app.use(i18n); // Use the i18n plugin
    app.mount('#app');

    logService.info("Application mounted.");

  } catch (error) {
    // Handle error
    logService.error("Failed during application startup:", error); // Log the error
    // Optionally display an error message to the user on the page
    document.getElementById('app').innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>Application Initialization Failed</h2>
        <p>Could not load critical configuration. Please check the console or contact support.</p>
      </div>
    `;
  }
}

// Start the application
startApp();
