<template>
  <v-dialog :model-value="modelValue" max-width="800" scrollable @update:model-value="$emit('update:modelValue', $event)" :aria-labelledby="dialogTitleId">
    <v-card>
      <v-card-title :id="dialogTitleId" class="headline">{{ t('faqDialog.title') }}</v-card-title>
      <v-card-text class="pt-4">
        <!-- Search Filter -->
        <v-text-field
          v-model="searchQuery"
          :label="t('faqDialog.searchLabel')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          hide-details
          class="mb-4"
        ></v-text-field>

        <!-- Expansion Panels - Grouped by Category -->
        <v-expansion-panels v-model="expandedPanels" multiple>
          <template v-for="(items, category) in groupedFaqItems" :key="category">
            <h3 v-if="category !== 'null' && items.length > 0" class="text-h6 my-3">{{ category }}</h3>
            <v-expansion-panel
              v-for="(item, i) in items"
              :key="`${category}-${i}`"
              :value="`${category}-${i}`" 
            >
              <v-expansion-panel-title>
                <v-icon start icon="mdi-help-circle-outline"></v-icon>
                {{ item.question }}
              </v-expansion-panel-title>
              <v-expansion-panel-text class="faq-answer">
                <p v-html="item.answer"></p>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </template>
          <v-alert v-if="!Object.keys(groupedFaqItems).length" type="info" variant="tonal" class="mt-4">
            {{ t('faqDialog.noResults') }}
          </v-alert>
        </v-expansion-panels>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">{{ t('faqDialog.buttons.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * FAQDialog component displays frequently asked questions in an accordion format,
 * grouped by category, with search functionality.
 * @file FAQDialog.vue - Dialog for displaying FAQ information
 * @module components/dialogs/FAQDialog
 */
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n'; // Import useI18n

const { t } = useI18n(); // Initialize translation function

// Generate a unique ID for the dialog title for accessibility
const dialogTitleId = computed(() => 'faq-dialog-title');

const props = defineProps({
  /**
   * Controls dialog visibility
   * @type {Boolean}
   */
  modelValue: {
    type: Boolean,
    required: true
  },
  
  /**
   * Array of FAQ items with category, question and answer properties
   * @type {Array<{category: string, question: string, answer: string}>}
   */
  faqItems: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  'update:modelValue',
  'close'
]);

// State for search and expansion
const searchQuery = ref('');
const expandedPanels = ref([]); // Use array for multiple expansion

// Filter FAQ items based on search query
const filteredFaqItems = computed(() => {
  if (!searchQuery.value) {
    return props.faqItems;
  }
  const lowerQuery = searchQuery.value.toLowerCase();
  return props.faqItems.filter(item => 
    item.question.toLowerCase().includes(lowerQuery) || 
    item.answer.toLowerCase().includes(lowerQuery) ||
    (item.category && item.category.toLowerCase().includes(lowerQuery)) // Also search category
  );
});

// Group filtered items by category
const groupedFaqItems = computed(() => {
  return filteredFaqItems.value.reduce((acc, item) => {
    const category = item.category || t('faqDialog.uncategorized'); // Use t() for default category
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
});

/**
 * Handles the close action
 */
function close() {
  emit('close');
  emit('update:modelValue', false);
  searchQuery.value = ''; // Reset search on close
  expandedPanels.value = []; // Reset expansion on close
}
</script>

<style scoped>
.faq-answer {
  /* Add some padding or styling for the answer section if desired */
  padding-top: 10px;
  padding-bottom: 10px;
}
/* Improve readability of lists inside answers */
.faq-answer ::v-deep(ul),
.faq-answer ::v-deep(ol) {
  padding-left: 25px; /* Indent lists */
  margin-top: 8px;
  margin-bottom: 8px;
}
.faq-answer ::v-deep(li) {
  margin-bottom: 4px;
}
</style>
