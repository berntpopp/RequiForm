<template>
  <v-footer app padless class="footer">
    <div class="content-wrapper">
      <v-col class="text-center" cols="12">
        <span class="versions">
          App: v{{ version }} | Test schema: v{{ testSchemaVersion }} | PDF schema: v{{ pdfSchemaVersion }}:
        </span>
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
    </div>
  </v-footer>
</template>

<script>
import { defineComponent } from 'vue';
import appConfig from '../config/appConfig.js';
import pdfConfig from '../data/pdfConfig.json';
import testsData from '../data/tests.json';

export default defineComponent({
  name: 'AppFooter',
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
      pdfSchemaVersion: (pdfConfig.schema && pdfConfig.schema.version) || 'N/A',
      testSchemaVersion: (testsData.schema && testsData.schema.version) || 'N/A',
    };
  },
});
</script>

<style scoped>
.footer {
  background-color: #f5f5f5;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 16px;
}

.versions {
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
