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
                @change="handlePhenotypeChange(group.id, phenotype.id)"
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
import { ref, computed, watch, inject } from 'vue'
import testsData from '../data/tests.json'

// Props for backward compatibility
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

// Emit for backward compatibility
const emit = defineEmits(['update:modelValue'])

// Inject the unified patient data and update functions
const unifiedPatientData = inject('patientData', null)
const updatePhenotypeData = inject('updatePhenotypeData', null)

const showPanel = ref(false)

/**
 * localPhenotypeData stores selections in the format:
 * { categoryId: { phenotypeId: 'no input' | 'present' | 'absent', ... }, ... }
 */
const localPhenotypeData = ref({})

// Initialize from unified model if available
if (unifiedPatientData && unifiedPatientData.phenotypeData && unifiedPatientData.phenotypeData.length > 0) {
  // Convert array format to map format for internal use
  unifiedPatientData.phenotypeData.forEach(item => {
    if (!localPhenotypeData.value[item.categoryId]) {
      localPhenotypeData.value[item.categoryId] = {}
    }
    localPhenotypeData.value[item.categoryId][item.phenotypeId] = item.status
  })
}

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
    updateBothModels()
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

function handlePhenotypeChange() {
  // The v-model already updates localPhenotypeData, but we need to update both models
  updateBothModels()
}

/**
 * Updates both the legacy model (via emit) and the unified model (via inject)
 */
function updateBothModels() {
  // Update legacy model via emit
  emit('update:modelValue', localPhenotypeData.value)
  
  // Update unified model if available
  if (updatePhenotypeData) {
    // Convert from map format to array format for the unified model
    const phenotypeArray = []
    Object.entries(localPhenotypeData.value).forEach(([categoryId, phenotypes]) => {
      Object.entries(phenotypes).forEach(([phenotypeId, status]) => {
        phenotypeArray.push({
          categoryId,
          phenotypeId,
          status
        })
      })
    })
    updatePhenotypeData(phenotypeArray)
  }
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
