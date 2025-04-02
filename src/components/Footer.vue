<template>
  <v-footer app padless class="footer">
    <v-col class="text-center" cols="12">
      <span class="app-version">Version: {{ version }}</span>
    </v-col>
  </v-footer>
</template>

<script>
import appConfig from '../config/appConfig.js';

export default {
  name: 'Footer',
  data() {
    return {
      version: appConfig.version,
    };
  },
};
</script>

<style scoped>
.footer {
  background-color: #f5f5f5;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.app-version {
  font-size: 0.8rem;
  color: #555;
  padding: 8px;
}
</style>
