<template>
  <div class="selected-panels-summary mt-4" v-if="groupedPanelDetails.length">
    <h2>Selected Panels:</h2>
    <div v-for="group in groupedPanelDetails" :key="group.categoryTitle">
      <h3 class="category-header">{{ group.categoryTitle }}</h3>
      <ul>
        <li v-for="panel in group.tests" :key="panel.id" class="panel-item">
          <div class="panel-name">
            <strong>{{ panel.name }}</strong>
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
/**
 * SelectedPanelsSummary displays a summary of all selected test panels grouped by category.
 * @file SelectedPanelsSummary.vue - Summary component for displaying selected genetic panels
 * @module components/SelectedPanelsSummary
 */
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
