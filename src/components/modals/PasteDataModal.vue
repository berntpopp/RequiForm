<template>
  <v-dialog v-model="isOpen" max-width="700" persistent>
    <v-card>
      <v-card-title class="headline">
        Paste and Import Data
      </v-card-title>
      
      <v-card-text>
        <p class="mb-4">
          Paste your data in the text area below. The data should be formatted as key-value pairs,
          with each pair on a new line and separated by a colon.
        </p>
        
        <v-textarea
          v-model="pastedText"
          outlined
          rows="10"
          label="Paste your data here"
          :placeholder="placeholder"
          :error-messages="errorMessage"
          auto-grow
          class="mb-3"
        ></v-textarea>
        
        <v-alert
          v-if="showExample"
          type="info"
          text
          class="mb-3"
        >
          <p class="mb-1"><strong>Example format:</strong></p>
          <pre class="text-body-2">{{ exampleText }}</pre>
          <v-btn
            x-small
            text
            color="primary"
            @click="populateWithExample"
            class="mt-2"
          >
            Use Example Data
          </v-btn>
        </v-alert>
        
        <v-alert
          v-if="parseResult && !parseResult.success"
          type="error"
          text
          class="mb-3"
        >
          {{ parseResult.error }}
        </v-alert>
        
        <v-alert
          v-if="parseResult && parseResult.success"
          type="success"
          text
          class="mb-3"
        >
          Data successfully parsed! Click "Import Data" to apply these changes.
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>
      
      <v-card-actions>
        <v-btn
          color="primary"
          text
          @click="showExample = !showExample"
        >
          {{ showExample ? 'Hide Example' : 'Show Example' }}
        </v-btn>
        
        <v-spacer></v-spacer>
        
        <v-btn
          text
          @click="$emit('close')"
        >
          Cancel
        </v-btn>
        
        <v-btn
          color="primary"
          text
          @click="parseData"
          :disabled="!pastedText.trim()"
        >
          Parse Data
        </v-btn>
        
        <v-btn
          color="success"
          text
          @click="importData"
          :disabled="!parseResult || !parseResult.success"
        >
          Import Data
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * PasteDataModal component
 * 
 * This component provides a modal dialog where users can paste normalized data
 * that gets parsed into the structured patient data format. This allows data import
 * without having to generate links or use other file-based import methods.
 * 
 * Props:
 *   modelValue {Boolean} - Controls the visibility of the modal dialog.
 * 
 * Emits:
 *   update:modelValue - For v-model binding.
 *   close - When the dialog is closed without applying changes.
 *   import - When the parsed data is to be imported into the application.
 *           The event payload is the structured patient data object.
 */
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
import { parsePastedData, generateExampleData } from '../../utils/dataParser';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'close', 'import']);

// Internal state
const pastedText = ref('');
const parseResult = ref(null);
const errorMessage = ref('');
const showExample = ref(false);

// Example data for the placeholder/tutorial
const exampleText = computed(() => generateExampleData());
const placeholder = 'First Name: John\nLast Name: Doe\nBirthdate: 1990-01-01\n...\n\nClick "Show Example" for a complete example.';

// Computed for v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Reset state when dialog is opened
watch(() => props.modelValue, (newVal) => {
  if (newVal === true) {
    resetForm();
  }
});

/**
 * Resets the form to its initial state
 */
function resetForm() {
  pastedText.value = '';
  parseResult.value = null;
  errorMessage.value = '';
  showExample.value = false;
}

/**
 * Parses the pasted data and validates it
 */
function parseData() {
  if (!pastedText.value.trim()) {
    errorMessage.value = 'Please paste data before parsing.';
    return;
  }
  
  console.log('PasteDataModal: Parsing data:', pastedText.value.substring(0, 100) + '...');
  parseResult.value = parsePastedData(pastedText.value);
  console.log('PasteDataModal: Parse result:', parseResult.value);
  
  errorMessage.value = parseResult.value.success ? '' : parseResult.value.error;
}

/**
 * Applies the parsed data to the application
 */
function importData() {
  if (parseResult.value && parseResult.value.success) {
    // Convert the parsed data object to a JSON string for compatibility with the importFromJson function
    const jsonString = JSON.stringify(parseResult.value.data);
    console.log('PasteDataModal: Sending data for import:', parseResult.value.data);
    emit('import', jsonString);
    
    // Manually close the dialog to ensure UI flow continues
    isOpen.value = false;
  }
}

/**
 * Populates the text area with example data for demonstration
 */
function populateWithExample() {
  pastedText.value = exampleText.value;
  parseResult.value = null;
  errorMessage.value = '';
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 0.5rem;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
}
</style>
