<template>
  <!-- Accessibility attributes are fixed directly on the mounted VDateInput component -->
  <VDateInput
    ref="dateInput"
    density="compact"
    prepend-icon=""
    prepend-inner-icon="$calendar"
    v-model="internalDate"
    :label="label"
    :locale="locale"
    dense
    outlined
    :error="error"
    :error-messages="errorMessages"
  />
</template>

<script setup>
import { ref, watch, onMounted, onUpdated } from 'vue'
import { VDateInput } from 'vuetify/labs/VDateInput'

/**
 * LocaleDatePicker component using Vuetify's experimental VDateInput.
 *
 * Props:
 * - modelValue: ISO date string (YYYY-MM-DD) used as the v-model value.
 * - label: Field label for the date input.
 */
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Birthdate'
  },
  error: {
    type: Boolean,
    default: false
  },
  errorMessages: {
    type: [String, Array],
    default: ''
  }
})
const emit = defineEmits(['update:modelValue'])

// Use the browser's locale for date formatting.
const locale = navigator.language

/**
 * Converts an ISO date string (YYYY-MM-DD) to a Date object.
 * Returns null if the string is invalid.
 *
 * @param {string} isoString - The ISO date string.
 * @return {Date|null}
 */
function parseISODate(isoString) {
  if (!isoString) return null
  const date = new Date(isoString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Converts a Date object to an ISO date string (YYYY-MM-DD).
 *
 * @param {Date|null} dateObj - The Date object.
 * @return {string} - The ISO date string, or an empty string if null.
 */
function formatISO(dateObj) {
  if (!dateObj) return ''
  return dateObj.toISOString().split('T')[0]
}

// Internal state: the date as a Date object.
const internalDate = ref(parseISODate(props.modelValue))

// Watch for external changes to the modelValue prop.
watch(
  () => props.modelValue,
  (newVal) => {
    internalDate.value = parseISODate(newVal)
  }
)

// When internalDate changes, update the parent via v-model.
watch(internalDate, (newVal) => {
  const isoString = formatISO(newVal)
  emit('update:modelValue', isoString)
})

// Reference to the date input component
const dateInput = ref(null)

// Simple function to fix ARIA attributes on date fields
function fixAriaAttributes() {
  // Use a small delay to ensure the component is fully rendered
  setTimeout(() => {
    // Get the element containing the date input
    const el = dateInput.value?.$el
    if (!el) return
    
    // Find all field elements with problematic attributes
    const fields = el.querySelectorAll('.v-field')
    fields.forEach(field => {
      // Remove aria-selected attribute which causes role mismatches
      if (field.hasAttribute('aria-selected')) {
        field.removeAttribute('aria-selected')
      }
      
      // Fix aria-haspopup attribute for date fields (should be dialog, not listbox)
      if (field.hasAttribute('aria-haspopup') && field.getAttribute('aria-haspopup') === 'listbox') {
        field.setAttribute('aria-haspopup', 'dialog')
      }
      
      // Fix any other ARIA attribute that might not match its role
      // These are common attributes that cause Lighthouse errors in date fields
      ['aria-autocomplete', 'aria-multiselectable'].forEach(attr => {
        if (field.hasAttribute(attr)) {
          field.removeAttribute(attr)
        }
      })
    })
  }, 100) // Short delay to ensure the DOM is ready
}

// Apply the fix when the component is mounted
onMounted(() => {
  fixAriaAttributes()
  
  // Create an observer to continuously monitor for ARIA attribute changes
  // This ensures the fix is applied even if Vuetify re-adds attributes
  const observer = new MutationObserver(() => {
    fixAriaAttributes()
  })
  
  // Start observing after a small delay to ensure component is rendered
  setTimeout(() => {
    if (dateInput.value?.$el) {
      observer.observe(dateInput.value.$el, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-selected', 'aria-haspopup']
      })
    }
  }, 200)
})

// Also apply the fix when the component is updated
onUpdated(fixAriaAttributes)
</script>

<style scoped>
/* Add any component-specific styles if needed */
</style>
