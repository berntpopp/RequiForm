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
 * Handles duplicate errors and special formatting for array fields.
 */
const errors = computed(() => {
  if (!validationErrors || !validationErrors.value) return [];
  
  // Track seen messages to avoid duplicates
  const seenMessages = new Set();
  const result = [];
  
  // Helper to format phenotype error fields into a more readable format
  const formatFieldName = (field) => {
    // Format phenotype data array errors
    if (field.match(/phenotypeData\[(\d+)\]/)) {
      return 'phenotypeData';
    }
    return field;
  };
  
  // Process all errors
  Object.entries(validationErrors.value).forEach(([field, message]) => {
    // Skip duplicate field paths (we get both prefixed and non-prefixed versions)
    if (field.includes('.')) return;
    
    // Create a unique key from the message to avoid duplicates
    const uniqueKey = `${formatFieldName(field)}: ${message}`;
    
    // Only add if we haven't seen this message before
    if (!seenMessages.has(uniqueKey)) {
      seenMessages.add(uniqueKey);
      result.push({
        field: formatFieldName(field),
        message: formatFieldName(field) === 'phenotypeData' ? 
          'Phenotype data: Some fields need to be completed' : message
      });
    }
  });
  
  return result;
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
