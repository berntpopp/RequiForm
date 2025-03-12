<template>
  <div>
    <h2>Select Panels / Tests</h2>
    
    <!-- Tabs: Category Selection and Search -->
    <v-tabs v-model="tab" bg-color="primary">
      <v-tab value="Category Selection">Category Selection</v-tab>
      <v-tab value="Search">Search</v-tab>
    </v-tabs>
    
    <v-tabs-window v-model="tab">
      <!-- Category Selection Tab -->
      <v-tabs-window-item value="Category Selection">
        <v-select
          dense
          outlined
          label="Category"
          :items="categories"
          item-title="title"
          item-value="id"
          v-model="selectedCategory"
          class="mt-2"
        />
        <div v-if="selectedCategory" class="mb-4">
          <v-select
            dense
            outlined
            label="Select Panels"
            :items="filteredTests"
            item-title="name"
            item-value="id"
            v-model="selectedTests"
            multiple
            chips
            closable-chips
          >
            <!-- Custom chip slot for v-select -->
            <template #chip="{ props, item }">
              <v-chip
                variant="flat"
                v-bind="{ ...props, color: getChipColor(item) }"
                @click="props.onClick"
                @keydown="props.onKeydown"
                close
                @click:close="props.onClose"
              >
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>
        </div>
      </v-tabs-window-item>
      
      <!-- Search Tab -->
      <v-tabs-window-item value="Search">
        <v-autocomplete
          dense
          outlined
          label="Type a panel or gene name"
          :items="searchItems"
          item-title="label"
          item-value="value"
          v-model="searchSelection"
          :custom-filter="customFilter"
          multiple
          chips
          closable-chips
          hide-selected
          class="mt-2"
        >
          <!-- Custom chip slot for v-select -->
          <template #chip="{ props, item }">
            <v-chip
                variant="flat"
              v-bind="{ ...props, color: getChipColor(item) }"
              @click="props.onClick"
              @keydown="props.onKeydown"
              close
              @click:close="props.onClose"
            >
              {{ item.title }}
            </v-chip>
          </template>
        </v-autocomplete>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import testsData from '../data/tests.json'

// Custom filter function for autocomplete.
// Expected signature: (itemTitle, queryText, item)
const customFilter = (itemTitle, queryText, item) => {
  if (!queryText) return true;
  // Vuetify might wrap our item in a "raw" property.
  const searchValue =
    (item && (item.searchText || (item.raw && item.raw.searchText))) ||
    itemTitle;
  return searchValue.toLowerCase().includes(queryText.toLowerCase());
};

// Props: external v-model for selected panel IDs.
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
});

// Emit changes to parent.
const emit = defineEmits(['update:modelValue']);

// Local state.
const categories = ref([]);
const selectedTests = ref([]);
const selectedCategory = ref('');
// Instead of a separate ref for search selection, we use a computed property that directly gets and sets selectedTests.
const searchSelection = computed({
  get() {
    return selectedTests.value;
  },
  set(val) {
    selectedTests.value = val;
  }
});
// Active tab: default to "Category Selection".
const tab = ref("Category Selection");

onMounted(() => {
  categories.value = testsData.categories;
  selectedTests.value = [...props.modelValue];
});

// Watch selectedTests to update parent.
watch(selectedTests, (newVal) => {
  emit('update:modelValue', newVal);
});

// Computed: panels for the selected category.
const filteredTests = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value);
  return cat ? cat.tests : [];
});

// Computed: Build search items as one object per panel with combined searchText.
const searchItems = computed(() => {
  const items = [];
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
});

// Define a palette of Vuetify color names.
const palette = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];

// Computed: Map each category id to a color.
const categoryColorMapping = computed(() => {
  const mapping = {};
  testsData.categories.forEach((category, index) => {
    mapping[category.id] = palette[index % palette.length];
  });
  return mapping;
});


// Computed: Map each test id to its category id.
const testToCategory = computed(() => {
  const mapping = {};
  testsData.categories.forEach(category => {
    category.tests.forEach(test => {
      mapping[test.id] = category.id;
    });
  });
  return mapping;
});

/**
 * Returns the chip color based on the test item.
 *
 * @param {Object} item - The test object.
 * @return {string} - The chip color (e.g. "primary").
 */
function getChipColor(item) {
  const testId = item.id || item.value;
  const catId = testToCategory.value[testId];
  return categoryColorMapping.value[catId] || 'default';
};
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
</style>
