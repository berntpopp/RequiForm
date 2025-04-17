<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="headline">{{ t('resetConfirmationDialog.title') }}</v-card-title>
      <v-card-text>
        <p>{{ t('resetConfirmationDialog.confirmationText') }}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">{{ t('resetConfirmationDialog.buttons.cancel') }}</v-btn>
        <v-btn color="error" text @click="confirm">{{ t('resetConfirmationDialog.buttons.reset') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * ResetConfirmationDialog component provides a confirmation dialog for resetting the application.
 * @file ResetConfirmationDialog.vue - Dialog for confirming application reset
 * @module components/dialogs/ResetConfirmationDialog
 */
import { useI18n } from 'vue-i18n'; 

const { t } = useI18n(); 

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  /**
   * Controls dialog visibility
   * @type {Boolean}
   */
  modelValue: Boolean
});

const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'confirm'
]);

/**
 * Handles the cancel action
 */
function cancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

/**
 * Handles the confirm action
 */
function confirm() {
  emit('confirm');
  emit('update:modelValue', false);
}
</script>
