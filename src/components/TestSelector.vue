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
import { ref, onMounted, watch, computed } from 'vue';
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

const categories = ref([]);
const selectedTests = ref([]);
const selectedCategory = ref('');

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
  categories.value = testsData.categories;
  selectedTests.value = [...props.modelValue];
});

watch(selectedTests, newVal => {
  emit('update:modelValue', newVal);
});

/**
 * Filters tests based on the selected category.
 *
 * @return {Array<Object>} Array of tests for the selected category.
 */
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
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}
</style>
