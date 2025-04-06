<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="headline">Enter Password for Decryption</v-card-title>
      <v-card-text>
        <v-text-field 
          v-model="password" 
          type="password" 
          label="Password" 
          autocomplete="off"
          @keyup.enter="confirm"
        />
        <v-alert v-if="error" type="error" class="mt-3">
          {{ error }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="primary" text @click="confirm">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * DecryptionDialog component provides a UI for entering a password to decrypt form data.
 * @file DecryptionDialog.vue - Dialog for decrypting encrypted form data
 * @module components/dialogs/DecryptionDialog
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
   * Error message to display when decryption fails
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

// Internal state for the password input
const password = ref('');

// Reset password and error when dialog opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    password.value = '';
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
 * Handles the confirm action with the provided password
 */
function confirm() {
  if (password.value.trim() === '') {
    return; // Don't proceed with empty password
  }
  emit('confirm', password.value);
  // Note: Don't close the dialog here, as decryption might fail
  // The parent component should close it after successful decryption
}
</script>
