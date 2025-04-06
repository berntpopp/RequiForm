<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="headline">Export Form Data</v-card-title>
      <v-card-text>
        <p>Save your form data for later use. You can name the file to identify it easily.</p>
        <v-text-field 
          v-model="fileName" 
          label="File Name" 
          placeholder="requiform-data"
          hint="Filename will be appended with .json"
          persistent-hint
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="primary" text @click="confirm">Export</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * SaveDataDialog component provides a UI for saving form data to a file.
 * @file SaveDataDialog.vue - Dialog for exporting form data to a JSON file
 * @module components/dialogs/SaveDataDialog
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
   * Default filename (without extension)
   * @type {String}
   */
  defaultFileName: {
    type: String,
    default: 'requiform-data'
  }
});

const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'confirm'
]);

// Internal state for the file name input
const fileName = ref(props.defaultFileName);

// Reset filename when dialog opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    fileName.value = props.defaultFileName;
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
 * Handles the confirm action with the provided filename
 */
function confirm() {
  emit('confirm', fileName.value);
  emit('update:modelValue', false);
}
</script>
