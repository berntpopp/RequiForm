<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="headline">Reset Application</v-card-title>
      <v-card-text>
        <p>Are you sure you want to reset the entire application? This will clear all form data and cannot be undone.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="error" text @click="confirm">Reset</v-btn>
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
// import { computed } from 'vue'; // Remove unused import

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
