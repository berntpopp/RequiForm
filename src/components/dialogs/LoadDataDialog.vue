<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="headline">Load Form Data</v-card-title>
      <v-card-text>
        <p>Select a JSON file to import:</p>
        <v-file-input
          v-model="file"
          label="Select file"
          accept=".json"
          prepend-icon="mdi-file-import"
          show-size
          truncate-length="30"
          :error-messages="errorMessage"
        />
        <v-alert v-if="error" type="error" class="mt-2">
          {{ error }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="primary" text @click="confirm" :disabled="!file">Import</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * LoadDataDialog component provides a UI for loading form data from a JSON file.
 * @file LoadDataDialog.vue - Dialog for importing form data from a file
 * @module components/dialogs/LoadDataDialog
 */
import { ref, watch } from 'vue';

const props = defineProps({
  /**
   * Controls dialog visibility
   * @type {Boolean}
   */
  modelValue: {
    type: Boolean,
    required: true
  },
  
  /**
   * Error message to display when file loading fails
   * @type {String}
   */
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'confirm'
]);

// Internal state for the file input and validation
const file = ref(null);
const errorMessage = ref('');

// Reset file input and error when dialog opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    file.value = null;
    errorMessage.value = '';
  }
});

/**
 * Handles the cancel action
 */
function cancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

/**
 * Handles the confirm action with the provided file
 */
function confirm() {
  if (!file.value) {
    errorMessage.value = 'Please select a file';
    return;
  }
  
  emit('confirm', file.value);
  // Note: We don't close the dialog here as loading might fail
  // The parent component should close it after successful loading
}
</script>
