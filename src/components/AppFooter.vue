<template>
  <v-footer app padless class="footer">
    <div class="content-wrapper">
      <span class="versions flex-grow-1">
        App: v{{ version }} | Test schema: v{{ testSchemaVersion }} | PDF schema: v{{ pdfSchemaVersion }}
      </span>
      <v-tooltip v-if="props.disclaimerAcknowledged" location="top">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            icon="mdi-shield-check"
            color="green"
            variant="text"
            size="small"
            class="ml-2"
            v-bind="tooltipProps"
            @click="emit('reopen-disclaimer')"
            aria-label="Disclaimer Acknowledged - Click to reopen"
          ></v-btn>
        </template>
        <span>Disclaimer Acknowledged: {{ props.acknowledgmentTime }}</span>
      </v-tooltip>
      <v-tooltip location="top">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            icon="mdi-math-log"
            variant="text"
            size="small"
            class="ml-2"
            v-bind="tooltipProps"
            @click="uiStore.toggleLogViewer"
            aria-label="Toggle Log Viewer"
          ></v-btn>
        </template>
        <span>Toggle Log Viewer</span>
      </v-tooltip>
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
