<template>
  <VDateInput
    density="compact"
    prepend-icon=""
    prepend-inner-icon="$calendar"
    v-model="internalDate"
    :label="label"
    :locale="locale"
    dense
    outlined
  />
</template>

<script setup>
import { ref, watch } from 'vue'
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
</script>

<style scoped>
/* Add any component-specific styles if needed */
</style>
