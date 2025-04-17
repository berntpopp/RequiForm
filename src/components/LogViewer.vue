<template>
  <v-card
    class="log-viewer-card"
    elevation="8"
    max-width="500"
    max-height="400"
  >
    <v-card-title class="d-flex justify-space-between align-center py-2">
      <span>{{ t('logViewer.title') }}</span>
      <div class="log-header-controls">
        <v-select
          v-model="currentLogLevel"
          :items="logLevelOptions"
          density="compact"
          hide-details
          variant="plain"
          class="log-level-select"
          :class="logLevelColorClass"
        ></v-select>
        <v-btn icon="mdi-download" variant="text" size="small" @click="downloadLogs" :title="t('logViewer.buttons.download')" :disabled="!logEntries.length"></v-btn>
        <v-btn icon="mdi-delete-sweep" variant="text" size="small" @click="clearLogs" :title="t('logViewer.buttons.clear')" :disabled="!logEntries.length"></v-btn>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeViewer" :title="t('logViewer.buttons.close')"></v-btn>
      </div>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="log-list pa-0">
      <v-list density="compact" class="py-0">
        <v-list-item
          v-for="(entry, index) in logEntries"
          :key="index"
          :class="['log-entry', `log-${entry.level.toLowerCase()}`]"
          class="py-1 px-3"
        >
          <div class="d-flex align-center">
            <span class="timestamp mr-2">{{ formatTimestamp(entry.timestamp) }}</span>
            <span class="level mr-2">[{{ entry.level }}]</span>
            <span class="message flex-grow-1">{{ entry.displayMessage }}</span>
            <v-btn
              v-if="entry.rawData !== null"
              :icon="isExpanded(index) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              variant="text"
              size="x-small"
              @click="toggleExpand(index)"
              class="ml-1"
              :title="t('logViewer.buttons.toggleDetails')"
            ></v-btn>
          </div>
          <v-expand-transition>
            <div v-if="isExpanded(index)" class="log-details mt-1">
              <pre>{{ formatRawData(entry.rawData) }}</pre>
            </div>
          </v-expand-transition>
        </v-list-item>
        <v-list-item v-if="!logEntries.length" class="text-center text-disabled py-2">
            {{ t('logViewer.emptyState') }}
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, nextTick, watch, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import logService, { LogLevel } from '@/services/logService';
import { useUiStore } from '@/stores/uiStore'; // Assuming uiStore is setup with Pinia

const { t } = useI18n();
const uiStore = useUiStore();

// Use computed ref to react to changes in log entries
const logEntries = computed(() => logService.entries);

const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const closeViewer = () => {
  uiStore.toggleLogViewer(); // Assuming toggleLogViewer action exists
};

const downloadLogs = () => {
  if (!logEntries.value || logEntries.value.length === 0) {
    // Optionally show a message or just do nothing
    logService.warn('LogViewer: No logs to download.');
    return;
  }

  try {
    // Format logs as JSON
    const logsJson = JSON.stringify(logEntries.value, null, 2); // Pretty print
    const blob = new Blob([logsJson], { type: 'application/json' });

    // Create a filename with a timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `requiform-logs-${timestamp}.json`;

    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link); // Required for Firefox
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    logService.info('LogViewer: Logs downloaded successfully.');
  } catch (error) {
    logService.error('LogViewer: Failed to download logs:', error);
    // Optionally, notify the user via UI
  }
};

const clearLogs = () => {
  logService.clear();
};

// --- Log Level Selection ---
const logLevelOptions = computed(() => [
  { title: t('logViewer.levels.debug'), value: LogLevel.DEBUG },
  { title: t('logViewer.levels.info'), value: LogLevel.INFO },
  { title: t('logViewer.levels.warn'), value: LogLevel.WARN },
  { title: t('logViewer.levels.error'), value: LogLevel.ERROR },
]);

const currentLogLevel = computed({
  get: () => logService.currentLogLevel, // Read from service getter
  set: (newValue) => {
    logService.setLevel(newValue); // Set via service method (which handles localStorage)
  },
});

const logLevelColorClass = computed(() => {
  switch (currentLogLevel.value) {
    case LogLevel.DEBUG: return 'text-log-debug';
    case LogLevel.INFO: return 'text-log-info';
    case LogLevel.WARN: return 'text-log-warn';
    case LogLevel.ERROR: return 'text-log-error';
    default: return '';
  }
});

// --- State for expanded entries ---
const expandedEntries = ref(new Set());

// --- Expand/Collapse Methods ---
const toggleExpand = (index) => {
  if (expandedEntries.value.has(index)) {
    expandedEntries.value.delete(index);
  } else {
    expandedEntries.value.add(index);
  }
};

const isExpanded = (index) => {
  return expandedEntries.value.has(index);
};

const formatRawData = (data) => {
  try {
    return JSON.stringify(data, null, 2); // Pretty print JSON
  } catch (e) {
    return `Error formatting data: ${e.message}`;
  }
};

// Scroll to bottom when new logs are added
watch(logEntries, async () => {
  await nextTick(); // Wait for DOM update
  const container = document.querySelector('.log-list'); // More robust selector might be needed
  if (container) {
      container.scrollTop = container.scrollHeight;
  }
}, { deep: true });

// Initial scroll to bottom on mount if needed
onMounted(async () => {
  await nextTick();
  const container = document.querySelector('.log-list');
  if (container) {
      container.scrollTop = container.scrollHeight;
  }
});

</script>

<style scoped>
.log-viewer-card {
  position: fixed;
  bottom: 60px; /* Adjust as needed based on footer height */
  left: 10px;
  right: 10px;
  max-height: 30vh; /* Limit height to 30% of viewport height */
  overflow-y: auto; /* Enable vertical scrolling */
  z-index: 1000; /* Ensure it's above most other elements */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Softer shadow */
}

.log-list {
  padding: 0;
  font-family: monospace;
  font-size: 0.8rem;
  overflow-y: auto;
}

.log-header-controls {
  display: flex;
  align-items: center; /* Vertically align items */
  gap: 4px;
}

.log-level-select {
  max-width: 110px;
  min-width: 110px;
  margin-right: 4px;
}

.log-entry {
  border-bottom: 1px solid #eee;
  font-family: monospace;
  font-size: 0.8rem;
  line-height: 1.4;
}

.log-entry:last-child {
  border-bottom: none;
}

.timestamp {
  color: #999;
  min-width: 130px; /* Ensure timestamp alignment */
  display: inline-block;
}

.level {
  font-weight: bold;
  min-width: 60px; /* Ensure level alignment */
  display: inline-block;
  text-align: right;
  margin-right: 5px;
}

.log-debug .level { color: #6c757d; } /* Bootstrap secondary */
.log-info .level { color: #17a2b8; } /* Bootstrap info */
.log-warn .level { color: #ffc107; } /* Bootstrap warning */
.log-error .level { color: #dc3545; } /* Bootstrap danger */

.message {
  word-break: break-word; /* Allow long messages to wrap */
}

.text-log-debug {
  color: #6c757d !important; /* Bootstrap secondary */
}
.text-log-info {
  color: #17a2b8 !important; /* Bootstrap info */
}
.text-log-warn {
  color: #ffc107 !important; /* Bootstrap warning */
}
.text-log-error {
  color: #dc3545 !important; /* Bootstrap danger */
}

.log-details pre {
  background-color: #f8f9fa; /* Light background */
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6; /* Light border */
  color: #212529; /* Dark text */
  white-space: pre-wrap; /* Wrap long lines */
  word-break: break-all; /* Break long words/strings */
  max-height: 200px; /* Limit height and add scroll */
  overflow-y: auto;
  font-size: 0.75rem; /* Smaller font for details */
}
</style>
