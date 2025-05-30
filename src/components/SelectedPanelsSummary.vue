<template>
  <div class="selected-panels-summary mt-4" v-if="groupedPanelDetails.length">
    <h2 :key="`summary-title-${i18nKey}`">{{ t('selectedPanelsSummary.title') }}</h2>
    <div v-for="group in groupedPanelDetails" :key="group.id || group.categoryTitle">
      <h3 class="category-header">{{ getCategoryTitle(group) }}</h3>
      <ul>
        <li v-for="panel in group.tests" :key="panel.id" class="panel-item">
          <div class="panel-name">
            <strong>{{ getTestName(panel) }}</strong>
          </div>
          <div class="panel-genes" v-if="panel.genes && panel.genes.length">
            <em>{{ panel.genes.join(', ') }}</em>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

const { t } = useI18n();
const i18n = useI18n();
const locale = computed(() => i18n.locale.value);

// Create a reactivity key to force UI updates when language changes
const i18nKey = ref(0);

// Handle language changes with a custom event listener
const handleI18nUpdate = () => {
  // Increment the reactivity key to force UI updates
  i18nKey.value++;
};

onMounted(() => {
  // Listen for language change events
  window.addEventListener('i18n-updated', handleI18nUpdate);
  window.addEventListener('i18n-locale-changed', handleI18nUpdate);
});

onBeforeUnmount(() => {
  // Clean up event listeners
  window.removeEventListener('i18n-updated', handleI18nUpdate);
  window.removeEventListener('i18n-locale-changed', handleI18nUpdate);
});

/**
 * SelectedPanelsSummary displays a summary of all selected test panels grouped by category.
 * @file SelectedPanelsSummary.vue - Summary component for displaying selected genetic panels
 * @module components/SelectedPanelsSummary
 */

/**
 * Gets the test name in the current language if available, falls back to default
 * @param {Object} test - The test object
 * @returns {string} The localized test name
 */
function getTestName(test) {
  // Force reactivity when locale changes by using i18nKey
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  
  // If the test has a names object with the current locale, use that
  if (test.names && test.names[locale.value]) {
    return test.names[locale.value];
  }
  // Otherwise fall back to the name property
  return test.name;
}

/**
 * Gets the category title in the current language if available, falls back to default
 * @param {Object} category - The category object with titles or title
 * @returns {string} The localized category title
 */
function getCategoryTitle(category) {
  // Force reactivity when locale changes by using i18nKey
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  
  // If the category has a titles object with the current locale, use that
  if (category.titles && category.titles[locale.value]) {
    return category.titles[locale.value];
  }
  // Otherwise fall back to the title property
  return category.categoryTitle;
}

defineProps({
  /**
   * Array of grouped panel details
   * @type {Array<{categoryTitle: string, tests: Array<{id: string, name: string, genes: Array<string>}>}>}
   */
  groupedPanelDetails: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.selected-panels-summary {
  margin-top: 1rem;
}
.category-header {
  font-size: 1.1rem;
  margin: 1rem 0 0.5rem;
  border-bottom: 2px solid #000;
  font-weight: bold;
}
.panel-item {
  margin-bottom: 0.75rem;
}
.panel-name {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}
.panel-genes {
  font-size: 0.85rem;
  color: #555;
}
</style>
