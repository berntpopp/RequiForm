<template>
  <div>
    <!-- The Consent select -->
    <v-select
      label="Consent"
      :items="consentOptions"
      item-title="text"
      item-value="value"
      v-model="localData.provided"
      dense
      outlined
      class="mt-2"
    />
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';

/**
 * ConsentForm component.
 * modelValue should be an object with the following structure:
 * {
 *   provided: "provided" | "fill",
 * }
 */
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      provided: 'provided'
    })
  }
});
const emits = defineEmits(['update:modelValue']);

/** Create a local copy for two‑way binding */
const localData = ref({ ...props.modelValue });

/** Options for the Consent select */
const consentOptions = [
  { text: 'Already Provided', value: 'provided' },
  { text: 'Fill Form', value: 'fill' }
];

/** Watch for changes in localData and emit updates */
watch(
  localData,
  (newVal) => {
    emits('update:modelValue', newVal);
  },
  { deep: true }
);
</script>

<style scoped>
.mt-2 {
  margin-top: 0.5rem;
}
.my-3 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
