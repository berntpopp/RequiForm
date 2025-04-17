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
            v-model="unifiedPatientData.selectedPanels"
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
          v-model="unifiedPatientData.selectedPanels"
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
import logService from '@/services/logService';

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

// Inject the unified patient data and update functions
const unifiedPatientData = inject('patientData', { selectedPanels: ref([]) }); // Provide default structure
const updateCategory = inject('updateCategory', null);

const categories = ref([]);
const selectedCategory = ref('');

// Create computed properties to track changes in the unified data model
const unifiedCategory = computed(() => unifiedPatientData?.category || '');
const unifiedSelectedPanels = computed(() => unifiedPatientData?.selectedPanels || []);

const tab = ref('Category Selection');

onMounted(() => {
  // Load categories first
  categories.value = testsData.categories;
  
  // PRIORITY 1: Check for panels in the global data store from URL parser
  // Use unified data directly
  if (window.requiFormData?.directPanels?.length > 0) {
    logService.debug('TestSelector: Setting panels from directPanels:', window.requiFormData.directPanels);
    // v-model handles the update, no need to call updateSelectedPanels here
    
    // Set category based on the first panel found
    const panelId = window.requiFormData.directPanels[0];
    for (const category of categories.value) {
      const found = category.tests.some(test => test.id === panelId);
      if (found) {
        logService.debug('TestSelector: Auto-selecting category from panel:', category.id);
        selectedCategory.value = category.id;
        break;
      }
    }
  }
  // PRIORITY 2: Check for panels in the component-level global store (less likely now)
  else if (window.requiFormData?.selectedPanels?.length > 0) {
    logService.debug('TestSelector: Setting panels from window.requiFormData.selectedPanels:', window.requiFormData.selectedPanels);
    // v-model handles update
    
    // Set category based on the first panel found
    const panelId = window.requiFormData.selectedPanels[0];
    for (const category of categories.value) {
      const found = category.tests.some(test => test.id === panelId);
      if (found) {
        logService.debug('TestSelector: Auto-selecting category from panel:', category.id);
        selectedCategory.value = category.id;
        break;
      }
    }
  }
  // PRIORITY 3: Check unified model from Pinia store (most common case)
  else if (unifiedSelectedPanels.value.length > 0) {
    logService.debug('TestSelector: Setting panels from unifiedPatientData:', unifiedSelectedPanels.value);
    // Panels are already in unifiedPatientData.selectedPanels via injection/v-model
    
    // Set category based on the first panel found
    const panelId = unifiedSelectedPanels.value[0];
    for (const category of categories.value) {
      const found = category.tests.some(test => test.id === panelId);
      if (found) {
        logService.debug('TestSelector: Auto-selecting category from panel:', category.id);
        selectedCategory.value = category.id;
        break;
      }
    }
  }
  // PRIORITY 4: Check unified model for category (if no panels selected)
  else if (unifiedCategory.value) {
    logService.debug('TestSelector: Setting initial category from unified model:', unifiedCategory.value);
    selectedCategory.value = unifiedCategory.value;
  }
  
  // Force UI update after component is mounted
  nextTick(() => {
    // Make sure selected panels are displayed by forcing the correct tab
    if (unifiedSelectedPanels.value.length > 0) { // Check unified store
      logService.debug('TestSelector: Forcing Category Selection tab to show selected panels');
      tab.value = 'Category Selection';
    }
  }); // Removed timeout, nextTick is usually sufficient
});

// Special domain-specific handler for nephronophthise -> nephrology mapping
watch(unifiedSelectedPanels, (newTests) => { // Watch unified store state
  if (newTests && newTests.includes('nephronophthise') && (!selectedCategory.value || selectedCategory.value !== 'nephrology')) {
    logService.debug('TestSelector: Auto-setting category to nephrology based on nephronophthise panel');
    const categoryValue = 'nephrology';
    selectedCategory.value = categoryValue;
    
    // Also propagate to the data model
    if (updateCategory) {
      updateCategory(categoryValue);
    }
  }
}, { immediate: true });

// Move the auto-selection logic to a watch instead of computed property
watch([unifiedSelectedPanels, categories], ([newTests, newCategories]) => { // Watch unified store state
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
      logService.debug('TestSelector: Auto-selecting category based on selected test:', foundCategory);
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
  logService.debug('Panel selection changed in UI:', newValue);
  
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
          logService.debug('TestSelector: Auto-selecting category from panel:', category.id);
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
