<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)" :aria-labelledby="dialogTitleId">
    <v-card>
      <v-card-title :id="dialogTitleId" class="headline">{{ t('decryptionDialog.title') }}</v-card-title>
      <v-card-text>
        <v-text-field 
          ref="passwordInputRef" 
          v-model="password" 
          type="password" 
          :label="t('decryptionDialog.labels.password')" 
          autocomplete="off"
          @keyup.enter="confirm"
        />
        <v-alert v-if="error" type="error" class="mt-3">
          {{ error }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">{{ t('decryptionDialog.buttons.cancel') }}</v-btn>
        <v-btn color="primary" text @click="confirm">{{ t('decryptionDialog.buttons.confirm') }}</v-btn>
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
import { ref, watch, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Generate a unique ID for the dialog title for accessibility
const dialogTitleId = computed(() => 'decryption-dialog-title');

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
const passwordInputRef = ref(null);

// Reset password and error when dialog opens, and focus input
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    password.value = '';
    // Use nextTick to ensure the input element is potentially available
    nextTick(() => {
      let inputElement = null;

      // Vuetify 3 v-text-field often exposes the input element via ref.input
      // or sometimes nested within ref.value.$el or similar structure.
      if (passwordInputRef.value) {
        if (passwordInputRef.value.input && typeof passwordInputRef.value.input.focus === 'function') {
          // Common Vuetify 3 pattern
          inputElement = passwordInputRef.value.input;
        } else if (passwordInputRef.value.$el && typeof passwordInputRef.value.$el.querySelector === 'function') {
          // Fallback using querySelector on the component's root element
          inputElement = passwordInputRef.value.$el.querySelector('input');
        } else if (typeof passwordInputRef.value.focus === 'function') {
          // Less likely: component itself has focus?
          inputElement = passwordInputRef.value; // Treat component as focusable
        }
      }

      if (inputElement && typeof inputElement.focus === 'function') {
        inputElement.focus();
      } else {
        // AS A LAST RESORT: Try with a small delay after nextTick
        // setTimeout(() => {
        //    const delayedInputElement = passwordInputRef.value?.input || passwordInputRef.value?.$el?.querySelector('input');
        //    if (delayedInputElement && typeof delayedInputElement.focus === 'function') {
        //        delayedInputElement.focus();
        //    }
        // }, 100); // e.g., 100ms delay
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
  // Note: Don't close the dialog here, as decryption might fail
  // The parent component should close it after successful decryption
}
</script>
