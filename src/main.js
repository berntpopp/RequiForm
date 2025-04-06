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

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
});

// Create Pinia instance
const pinia = createPinia();

// Create Vue app and use plugins
const app = createApp(App);
app.use(vuetify);
app.use(pinia);
app.mount('#app');
