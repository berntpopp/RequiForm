<template>
  <div class="phenotype-selector">
    <v-btn color="primary" small @click="togglePanel">
      {{ showPanel ? 'Hide Phenotype Options' : 'Add Phenotypes' }}
    </v-btn>

    <v-expand-transition>
      <div v-if="showPanel" class="phenotype-panel">
        <h2 class="title">Select Phenotype States</h2>
        <!-- Loop through each category with at least one selected panel -->
        <div
          v-for="group in groupedPanelDetails"
          :key="group.id"
          class="category-section"
        >
          <h3>{{ group.categoryTitle }}</h3>
          <div v-if="categoryPhenotypes(group.id)?.length">
            <div
              v-for="phenotype in categoryPhenotypes(group.id)"
              :key="phenotype.id"
              class="phenotype-item"
            >
              <div class="phenotype-info">
                <strong>{{ phenotype.name }}</strong>
                <span class="hpo">({{ phenotype.hpo }})</span>
                <p class="description">{{ phenotype.description }}</p>
              </div>
              <v-radio-group
                v-model="localPhenotypeData[group.id][phenotype.id]"
                inline
                density="compact"
                @change="updatePhenotypeData(group.id, phenotype.id)"
                class="radio-group"
              >
                <v-radio label="No Input" value="no input" density="compact" />
                <v-radio label="Present" value="present" density="compact" />
                <v-radio label="Absent" value="absent" density="compact" />
              </v-radio-group>
            </div>
          </div>
          <div v-else>
            <p>No predefined phenotypes available for this category.</p>
          </div>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import testsData from '../data/tests.json'

const props = defineProps({
  groupedPanelDetails: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(['update:modelValue'])

const showPanel = ref(false)

/**
 * localPhenotypeData stores selections in the format:
 * { categoryId: { phenotypeId: 'no input' | 'present' | 'absent', ... }, ... }
 */
const localPhenotypeData = ref({})

// Ensure each category in groupedPanelDetails has its phenotype states initialized to "no input".
watch(
  () => props.groupedPanelDetails,
  (newGroups) => {
    newGroups.forEach((group) => {
      if (!localPhenotypeData.value[group.id]) {
        const category = testsData.categories.find((cat) => cat.id === group.id)
        if (category && category.phenotypes && category.phenotypes.length) {
          const phenotypesState = {}
          category.phenotypes.forEach((phenotype) => {
            phenotypesState[phenotype.id] = 'no input'
          })
          localPhenotypeData.value[group.id] = phenotypesState
        }
      }
    })
    emit('update:modelValue', localPhenotypeData.value)
  },
  { immediate: true, deep: true }
)

function togglePanel() {
  showPanel.value = !showPanel.value
}

function categoryPhenotypes(categoryId) {
  const category = testsData.categories.find((cat) => cat.id === categoryId)
  return category?.phenotypes || []
}

function updatePhenotypeData(categoryId, phenotypeId) {
  // The v-model already updates localPhenotypeData.
  emit('update:modelValue', localPhenotypeData.value)
}

const groupedPanelDetails = computed(() => props.groupedPanelDetails)
</script>

<style scoped>
.phenotype-selector {
  margin-top: 0.5rem;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.phenotype-panel {
  margin-top: 0.5rem;
}
.title {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}
.category-section {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #ccc;
}
.phenotype-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}
.phenotype-info {
  flex: 1;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}
.hpo {
  margin-left: 0.25rem;
  color: #666;
}
.description {
  margin: 0;
  font-size: 0.8rem;
  color: #555;
}
.radio-group {
  margin: 0;
}
</style>
