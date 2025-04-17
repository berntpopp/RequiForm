<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="headline">Enter Password for Encryption</v-card-title>
      <v-card-text>
        <v-text-field 
          ref="passwordInputRef" 
          v-model="password" 
          type="password" 
          label="Password" 
          autocomplete="off"
          @keyup.enter="confirm"
        />
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
 * EncryptionDialog component provides a UI for entering a password to encrypt form data.
 * @file EncryptionDialog.vue - Dialog for encrypting form data
 * @module components/dialogs/EncryptionDialog
 */
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  /**
   * Controls dialog visibility
   * @type {Boolean}
   */
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'confirm'
]);

// Internal state for the password input
const password = ref('');
const passwordInputRef = ref(null);

// Reset password when dialog opens and focus input
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    password.value = '';
    // Use nextTick to ensure the input element is mounted before focusing
    nextTick(() => {
      let inputElement = null;
      if (passwordInputRef.value) {
        if (passwordInputRef.value.input && typeof passwordInputRef.value.input.focus === 'function') {
          inputElement = passwordInputRef.value.input;
        } else if (passwordInputRef.value.$el && typeof passwordInputRef.value.$el.querySelector === 'function') {
          inputElement = passwordInputRef.value.$el.querySelector('input');
        } else if (typeof passwordInputRef.value.focus === 'function') {
          inputElement = passwordInputRef.value;
        }
      }

      if (inputElement && typeof inputElement.focus === 'function') {
        inputElement.focus();
      } 
    });
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
  emit('update:modelValue', false);
}
</script>
