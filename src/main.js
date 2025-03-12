// src/main.js
import { createApp } from 'vue';
import App from './App.vue';

// Import Vuetify, its components, and directives
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Import Vuetify styles and Material Design Icons
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  components,
  directives,
});

createApp(App).use(vuetify).mount('#app');
