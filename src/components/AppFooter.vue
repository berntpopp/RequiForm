<template>
  <v-footer app padless class="footer">
    <div class="content-wrapper">
      <span class="versions flex-grow-1">
        App: v{{ version }} | Test schema: v{{ testSchemaVersion }} | PDF schema: v{{ pdfSchemaVersion }}
      </span>
      <v-btn
        v-if="props.disclaimerAcknowledged"
        small
        variant="outlined"
        class="ml-2 disclaimer-btn"
        @click="emit('reopen-disclaimer')"
      >
        Disclaimer Acknowledged: {{ props.acknowledgmentTime }}
      </v-btn>
      <v-btn
        icon="mdi-math-log"
        variant="text"
        size="small"
        class="ml-2"
        title="Toggle Logs"
        @click="uiStore.toggleLogViewer"
      ></v-btn>
    </div>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/uiStore';
import appConfig from '../config/appConfig.js';
import pdfConfig from '../data/pdfConfig.json';
import testsData from '../data/tests.json';

const props = defineProps({
  disclaimerAcknowledged: {
    type: Boolean,
    default: false,
  },
  acknowledgmentTime: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['reopen-disclaimer']);

const uiStore = useUiStore();

const version = computed(() => appConfig.version);
const pdfSchemaVersion = computed(() => (pdfConfig.schema && pdfConfig.schema.version) || 'N/A');
const testSchemaVersion = computed(() => (testsData.schema && testsData.schema.version) || 'N/A');

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
  max-width: 1200px; /* Adjust as needed */
  margin: 0 auto;
  padding: 4px 16px; /* Reduced padding */
}

.versions {
  font-size: 0.8rem;
  color: #555;
  white-space: nowrap;
  margin-right: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.disclaimer-btn {
  font-size: 0.75rem;
  text-transform: none;
}
</style>
