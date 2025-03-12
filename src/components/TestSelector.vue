<template>
  <div>
    <h2>Select Panels / Tests</h2>
    
    <!-- Tabs: one for Category Selection and one for Search -->
    <v-tabs v-model="tab" bg-color="primary">
      <v-tab value="Category Selection">Category Selection</v-tab>
      <v-tab value="Search">Search</v-tab>
    </v-tabs>
    
    <v-tabs-window v-model="tab">
      <!-- Category Selection Tab -->
      <v-tabs-window-item value="Category Selection">
        <v-select
          label="Category"
          :items="categories"
          item-title="title"
          item-value="id"
          v-model="selectedCategory"
          class="mt-4"
        />
        <div v-if="selectedCategory" class="mb-6">
          <h3 class="text-h6">{{ currentCategoryTitle }}</h3>
          <div
            v-for="test in filteredTests"
            :key="test.id"
            class="d-flex align-center"
          >
            <v-checkbox
              :label="test.name"
              :value="test.id"
              v-model="selectedTests"
            />
          </div>
        </div>
      </v-tabs-window-item>
      
      <!-- Search Tab -->
      <v-tabs-window-item value="Search">
        <v-autocomplete
          label="Type a panel or gene name"
          :items="searchItems"
          item-title="label"
          item-value="value"
          v-model="searchSelection"
          :custom-filter="customFilter"
          multiple
          chips
          hide-selected
          class="mt-4"
        />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import testsData from '../data/tests.json'

// Utility: Compare two arrays (order-insensitive)
function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  return a.every(item => b.includes(item))
}

// Custom filter function for Vuetify autocomplete.
// Expected signature: (itemTitle, queryText, item)
const customFilter = (itemTitle, queryText, item) => {
  if (!queryText) return true;
  if (item && item.raw && item.raw.searchText) {
    return item.raw.searchText.toLowerCase().includes(queryText.toLowerCase());
  }
  return itemTitle.toLowerCase().includes(queryText.toLowerCase());
}

// Props: external v-model for selected panel IDs
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

// Emit changes to parent
const emit = defineEmits(['update:modelValue'])

// Local state
const categories = ref([])
const selectedTests = ref([])
const selectedCategory = ref('')
const searchSelection = ref([])
// Active tab: default to "Category Selection"
const tab = ref("Category Selection")

// On mount: load categories and initialize arrays from props
onMounted(() => {
  categories.value = testsData.categories
  selectedTests.value = [...props.modelValue]
  searchSelection.value = [...props.modelValue]
})

// Watch selectedTests -> update parent and sync searchSelection if needed
watch(selectedTests, (newVal) => {
  emit('update:modelValue', newVal)
  if (!arraysEqual(newVal, searchSelection.value)) {
    searchSelection.value = [...newVal]
  }
})

// Watch searchSelection -> merge into selectedTests if needed
watch(searchSelection, (newVal) => {
  const merged = new Set([...selectedTests.value, ...newVal])
  const mergedArr = [...merged]
  if (!arraysEqual(mergedArr, selectedTests.value)) {
    selectedTests.value = mergedArr
  }
})

// Computed: panels for the selected category
const filteredTests = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value)
  return cat ? cat.tests : []
})

// Computed: current category title for display
const currentCategoryTitle = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value)
  return cat ? cat.title : ''
})

// Computed: Build search items as one object per panel with combined searchText.
const searchItems = computed(() => {
  const items = []
  for (const cat of categories.value) {
    for (const test of cat.tests) {
      let searchText = test.name;
      if (test.genes && Array.isArray(test.genes)) {
        searchText += ' ' + test.genes.join(' ');
      }
      items.push({
        label: test.name,
        value: test.id,
        searchText
      });
    }
  }
  return items;
})
</script>

<style scoped>
.mb-6 {
  margin-bottom: 1.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
</style>
