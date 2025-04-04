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
            :return-object="false"
            multiple
            chips
            closable-chips
            @update:model-value="forceUiUpdate"
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
          <!-- Custom chip slot for v-autocomplete -->
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
import { ref, onMounted, watch, computed, inject, nextTick } from 'vue';
import testsData from '../data/tests.json';

/**
 * Custom filter function for autocomplete.
 * Returns true if the item’s search text includes the query.
 *
 * @param {string} itemTitle - The title of the item.
 * @param {string} queryText - The search query text.
 * @param {Object} item - The item object.
 * @return {boolean} Whether the item matches the query.
 */
const customFilter = (itemTitle, queryText, item) => {
  if (!queryText) return true;
  const searchValue =
    (item && (item.searchText || (item.raw && item.raw.searchText))) || itemTitle;
  return searchValue.toLowerCase().includes(queryText.toLowerCase());
};

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

// Inject the unified patient data and update functions
const unifiedPatientData = inject('patientData', null);
const updateSelectedPanels = inject('updateSelectedPanels', null);
const updateCategory = inject('updateCategory', null);

const categories = ref([]);
const selectedTests = ref([]);
const selectedCategory = ref('');

// Create computed property to track category changes in the unified data model
const unifiedCategory = computed(() => unifiedPatientData?.category || '');

/**
 * Proxy computed property for search selection.
 * Provides two-way binding between the search selection and selected tests.
 *
 * @type {import('vue').ComputedRef<Array>}
 */
const searchSelection = computed({
  get() {
    return selectedTests.value;
  },
  set(val) {
    selectedTests.value = val;
  }
});

const tab = ref('Category Selection');

onMounted(() => {
  // Load categories first
  categories.value = testsData.categories;
  
  // PRIORITY 1: Check for panels in the global data store from URL parser
  // This handles URL parameters with highest priority
  if (window.requiFormData && window.requiFormData.directPanels && window.requiFormData.directPanels.length > 0) {
    const panelIds = window.requiFormData.directPanels;
    console.log('TestSelector found panels in URL parser store:', panelIds);
    
    // Set panels directly with primitive array
    selectedTests.value = [...panelIds];
    
    // Force category selection tab
    tab.value = 'Category Selection';
    
    // Set unified model (belt and suspenders approach)
    if (updateSelectedPanels) {
      console.log('Updating unified model with panels from URL');
      updateSelectedPanels([...panelIds]);
    }
    
    // Set initial category based on the first panel
    if (panelIds.length > 0 && categories.value.length > 0) {
      const panelId = panelIds[0];
      
      // Find which category contains this panel
      for (const category of categories.value) {
        const found = category.tests.some(test => test.id === panelId);
        if (found) {
          console.log('Auto-selecting category from panel:', category.id);
          selectedCategory.value = category.id;
          break;
        }
      }
    }
  }
  // PRIORITY 2: Check for panels in the component-level global store
  else if (window.requiFormData && window.requiFormData.selectedPanels && window.requiFormData.selectedPanels.length > 0) {
    const panelIds = window.requiFormData.selectedPanels;
    console.log('TestSelector found panels in component global store:', panelIds);
    selectedTests.value = [...panelIds];
  }
  // PRIORITY 3: Check for panels in the unified data model
  else if (unifiedPatientData && unifiedPatientData.selectedPanels && unifiedPatientData.selectedPanels.length > 0) {
    console.log('TestSelector initializing with unified panels:', unifiedPatientData.selectedPanels);
    selectedTests.value = [...unifiedPatientData.selectedPanels];
  }
  // PRIORITY 4: Fall back to the legacy model value
  else {
    selectedTests.value = [...props.modelValue];
  }
  
  // If category is set in unified model, initialize it
  if (unifiedPatientData && unifiedPatientData.category) {
    console.log('Setting initial category from unified model:', unifiedPatientData.category);
    selectedCategory.value = unifiedPatientData.category;
  }
  
  // Force UI update after component is mounted
  nextTick(() => {
    // Make sure selected panels are displayed by forcing the correct tab
    if (selectedTests.value && selectedTests.value.length > 0) {
      console.log('Forcing Category Selection tab to show selected panels');
      tab.value = 'Category Selection';
    }
  });
  
  // Run another check after a short delay to ensure UI updates
  setTimeout(() => {
    if (window.requiFormData && window.requiFormData.directPanels && selectedTests.value.length === 0) {
      console.log('Delayed initialization with URL panels');
      selectedTests.value = [...window.requiFormData.directPanels];
      tab.value = 'Category Selection';
      
      // Set unified model if needed
      if (updateSelectedPanels) {
        updateSelectedPanels([...window.requiFormData.directPanels]);
      }
    }
  }, 500);
});

// Watch for changes in selected tests and update both models
watch(selectedTests, newVal => {
  // Update the legacy model via emit
  emit('update:modelValue', newVal);
  
  // Update the unified model if available
  if (updateSelectedPanels) {
    updateSelectedPanels(newVal);
  }
});

// Watch for changes in category and update the unified model
watch(selectedCategory, newVal => {
  if (updateCategory && newVal) {
    updateCategory(newVal);
  }
});

// Watch for changes in the unified model's category and update local state
watch(unifiedCategory, newVal => {
  if (newVal && newVal !== selectedCategory.value) {
    console.log('Updating TestSelector category from unified model:', newVal);
    selectedCategory.value = newVal;
  }
});

// We'll handle panel updates in onMounted and use a simpler approach

/**
 * Filters tests based on the selected category.
 *
 * @return {Array<Object>} Array of tests for the selected category.
 */
// Move the auto-selection logic to a watch instead of computed property
watch([selectedTests, categories], ([newTests, newCategories]) => {
  // If we have tests but no selected category yet,
  // find the category containing the selected test and set it
  if (newTests && newTests.length > 0 && !selectedCategory.value && newCategories.length > 0) {
    const testId = newTests[0];
    let foundCategory = null;
    
    // Find which category contains this test
    for (const category of newCategories) {
      const found = category.tests.some(test => test.id === testId);
      if (found) {
        foundCategory = category.id;
        break;
      }
    }
    
    // If we found the category, set it
    if (foundCategory) {
      console.log('Auto-selecting category based on selected test:', foundCategory);
      selectedCategory.value = foundCategory;
    }
  }
}, { immediate: true });

// Pure computed property with no side effects
const filteredTests = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value);
  return cat ? cat.tests : [];
});

/**
 * Builds a list of search items with combined panel and gene names.
 *
 * @return {Array<Object>} Array of search items.
 */
const searchItems = computed(() => {
  const items = [];
  categories.value.forEach(cat => {
    cat.tests.forEach(test => {
      let searchText = test.name;
      if (test.genes && Array.isArray(test.genes)) {
        searchText += ' ' + test.genes.join(' ');
      }
      items.push({
        label: test.name,
        value: test.id,
        searchText
      });
    });
  });
  return items;
});

const palette = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];

/**
 * Maps each category id to a Vuetify color.
 *
 * @return {Object} Mapping of category id to color.
 */
const categoryColorMapping = computed(() =>
  testsData.categories.reduce((mapping, category, index) => {
    mapping[category.id] = palette[index % palette.length];
    return mapping;
  }, {})
);

/**
 * Maps each test id to its corresponding category id.
 *
 * @return {Object} Mapping of test id to category id.
 */
const testToCategory = computed(() =>
  testsData.categories.reduce((mapping, category) => {
    category.tests.forEach(test => {
      mapping[test.id] = category.id;
    });
    return mapping;
  }, {})
);

/**
 * Returns the chip color based on the test item.
 *
 * @param {Object} item - The test object.
 * @return {string} The chip color (e.g., "primary").
 */
function getChipColor(item) {
  const testId = item.id || item.value;
  const catId = testToCategory.value[testId];
  return categoryColorMapping.value[catId] || 'default';
}

/**
 * Force UI update when panel selection changes
 * This helps ensure the visual representation matches the data model
 * 
 * @param {Array} newValue - The new selected panel IDs
 */
function forceUiUpdate(newValue) {
  console.log('Panel selection changed in UI:', newValue);
  
  // Force the selection tab to be active when panels are selected
  if (newValue && newValue.length > 0) {
    tab.value = 'Category Selection';
    
    // If we don't have a category selected yet, try to find one based on the panel
    if (!selectedCategory.value && categories.value.length > 0) {
      const panelId = newValue[0];
      
      // Find which category contains this panel
      for (const category of categories.value) {
        const found = category.tests.some(test => test.id === panelId);
        if (found) {
          console.log('Auto-selecting category from panel:', category.id);
          selectedCategory.value = category.id;
          break;
        }
      }
    }
  }
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}
</style>
