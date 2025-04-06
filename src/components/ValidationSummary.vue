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
 * Shows ALL errors without filtering to match previous behavior.
 */
const errors = computed(() => {
  if (!validationErrors || !validationErrors.value) return [];
  
  // Get all errors, including section prefixes
  return Object.entries(validationErrors.value)
    // Only take errors that don't have a section prefix to avoid duplicates
    .filter(([field]) => !field.includes('.'))
    .map(([field, message]) => ({
      field,
      message
    }));
});

/**
 * Scrolls to the field with the given name
 * @param {string} fieldName - The name of the field to scroll to
 */
function scrollToField(fieldName) {
  // Field name mapping for compatibility with previous implementation
  const fieldMapping = {
    'firstName': 'givenName',
    'lastName': 'familyName',
    'referrer': 'physicianName'
  };
  
  // Get the mapped field name if available
  const mappedFieldName = fieldMapping[fieldName] || fieldName;
  
  // Try different selector strategies to find the element
  const element = 
    document.getElementById(mappedFieldName) ||
    document.getElementById(fieldName) ||
    document.querySelector(`[name="${mappedFieldName}"]`) ||
    document.querySelector(`[name="${fieldName}"]`) ||
    document.querySelector(`[data-field="${mappedFieldName}"]`) ||
    document.querySelector(`[data-field="${fieldName}"]`) ||
    // Try by label (for radio buttons, etc.)
    document.querySelector(`label[for="${mappedFieldName}"]`) ||
    document.querySelector(`label[for="${fieldName}"]`);
  
  if (element) {
    // Scroll to the element and make it visible
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Focus the element after scrolling (with slight delay to ensure UI is ready)
    setTimeout(() => {
      element.focus();
    }, 500);
  } else {
    console.log(`Field not found: ${fieldName} / ${mappedFieldName}`);
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
