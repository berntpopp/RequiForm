<template>
  <v-footer app padless class="footer">
    <v-col class="text-center" cols="12">
      <span class="app-version">Version: {{ version }}</span>
      <v-btn
        v-if="disclaimerAcknowledged"
        small
        outlined
        class="ml-2 disclaimer-btn"
        @click="$emit('reopen-disclaimer')"
      >
        Disclaimer Acknowledged: {{ acknowledgmentTime }}
      </v-btn>
    </v-col>
  </v-footer>
</template>

<script>
import appConfig from '../config/appConfig.js';

export default {
  name: 'Footer',
  props: {
    disclaimerAcknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgmentTime: {
      type: String,
      default: '',
    },
  },
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

.ml-2 {
  margin-left: 8px;
}

.disclaimer-btn {
  font-size: 0.75rem;
  text-transform: none;
}
</style>
