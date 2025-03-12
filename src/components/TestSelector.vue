<template>
  <div>
    <h2>Select Panels / Tests</h2>
    <!-- Loop over categories -->
    <div v-for="category in categories" :key="category.id" class="mb-6">
      <h3 class="text-h5 mb-2">{{ category.title }}</h3>
      <!-- For each test, display a checkbox -->
      <v-checkbox
        v-for="test in category.tests"
        :key="test.id"
        :label="test.name"
        :value="test.id"
        v-model="selectedTests"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import testsData from '../data/tests.json'

// Capture the incoming prop using defineProps
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

// Set up the emit function
const emit = defineEmits(['update:modelValue'])

// Local reactive state
const categories = ref([])
const selectedTests = ref([])

// Load categories and initialize selected tests from prop on mount
onMounted(() => {
  categories.value = testsData.categories
  selectedTests.value = [...props.modelValue]
})

// Watch for changes in selectedTests and emit updates
watch(selectedTests, (newVal) => {
  emit('update:modelValue', newVal)
})
</script>

<style scoped>
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
</style>
