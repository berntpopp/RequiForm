<template>
  <v-alert
    v-if="showValidation && !isValid && errors.length > 0"
    type="error"
    density="compact"
    variant="tonal"
    class="validation-summary"
    border="start"
    role="alert"
    aria-live="assertive"
  >
    <h3>Please correct the following errors:</h3>
    <v-list density="compact" class="error-list">
      <v-list-item
        v-for="(error, index) in errors"
        :key="index"
        density="compact"
        class="error-item"
        @click="scrollToField(error.field)"
      >
        <v-list-item-title>{{ error.message }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-alert>
</template>

<script setup>
/**
 * ValidationSummary component displays a summary of all validation errors
 * in the form. It also provides functionality to scroll to the field with the error.
 */
import { computed, inject } from 'vue';

defineProps({
  /**
   * Whether to show the validation summary
   */
  showValidation: {
    type: Boolean,
    default: false
  }
});

// Inject validation-related data and methods from the patient data composable
const isValid = inject('isValid');
const validationErrors = inject('validationErrors');

/**
 * Converts the validation errors object into an array of error objects
 * with field names and messages for easier rendering.
 */
const errors = computed(() => {
  if (!validationErrors || !validationErrors.value) return [];
  
  return Object.entries(validationErrors.value).map(([field, message]) => ({
    field,
    message
  }));
});

/**
 * Scrolls to the field with the given name
 * @param {string} fieldName - The name of the field to scroll to
 */
function scrollToField(fieldName) {
  // Get the field element by ID or name
  const element = document.getElementById(fieldName) ||
                 document.querySelector(`[name="${fieldName}"]`) || 
                 document.querySelector(`[data-field="${fieldName}"]`);
  
  if (element) {
    // Scroll to the element
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Focus the element after scrolling
    setTimeout(() => {
      element.focus();
    }, 500);
  }
}
</script>

<style scoped>
.validation-summary {
  margin-bottom: 1rem;
}

.error-list {
  margin-top: 0.5rem;
  background-color: transparent;
}

.error-item {
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.error-item:hover {
  background-color: rgba(var(--v-theme-error), 0.1);
}

.error-item:before {
  content: '•';
  margin-right: 8px;
  color: rgb(var(--v-theme-error));
}
</style>
