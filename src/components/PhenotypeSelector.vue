<template>
  <div class="phenotype-selector">
    <v-btn color="primary" small @click="togglePanel" :key="`toggle-btn-${i18nKey}`">
      {{ t(showPanel ? 'phenotypeSelector.toggleButton.hide' : 'phenotypeSelector.toggleButton.add') }}
    </v-btn>

    <v-expand-transition>
      <div v-if="showPanel" class="phenotype-panel">
        <!-- Warning message when no phenotypes are selected -->
        <v-alert
          v-if="hasNoPhenotypeSelected"
          type="warning"
          density="compact"
          variant="tonal"
          class="warning-alert"
          :key="`warning-alert-${i18nKey}`"
        >
          {{ t('phenotypeSelector.warnings.noneSelected') }}
        </v-alert>

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
                <strong>{{ getPhenotypeName(phenotype) }}</strong>
                <span class="hpo">({{ phenotype.hpo }})</span>
                <p class="description">{{ getPhenotypeDescription(phenotype) }}</p>
              </div>
              <v-radio-group
                :model-value="getPhenotypeValue(group.id, phenotype.id)"
                @update:model-value="updatePhenotypeValue(group.id, phenotype.id, $event)"
                inline
                density="compact"
                class="radio-group"
                :key="`radio-group-${group.id}-${phenotype.id}-${i18nKey}`"
              >
                <v-radio :label="t('phenotypeSelector.radioLabels.noInput')" value="no input" density="compact" :key="`radio-no-input-${i18nKey}`" />
                <v-radio :label="t('phenotypeSelector.radioLabels.present')" value="present" density="compact" :key="`radio-present-${i18nKey}`" />
                <v-radio :label="t('phenotypeSelector.radioLabels.absent')" value="absent" density="compact" :key="`radio-absent-${i18nKey}`" />
              </v-radio-group>
            </div>
          </div>
          <div v-else>
            <p :key="`no-phenotypes-${group.id}-${i18nKey}`">{{ t('phenotypeSelector.noPhenotypesMessage') }}</p>
          </div>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, onMounted, onBeforeUnmount } from 'vue'
import testsData from '../data/tests.json'
import logService from '@/services/logService'
import { brandingConfig } from '@/services/brandingConfigService'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const i18n = useI18n()
const locale = computed(() => i18n.locale.value)

// Create a reactivity key to force UI updates when language changes
const i18nKey = ref(0)

// Handle language changes with a custom event listener
const handleI18nUpdate = () => {
  // Increment the reactivity key to force UI updates
  i18nKey.value++
  // Log the language change
  logService.debug('PhenotypeSelector: Language updated, refreshing component')
}

onMounted(() => {
  // Listen for language change events
  window.addEventListener('i18n-updated', handleI18nUpdate)
  window.addEventListener('i18n-locale-changed', handleI18nUpdate)
})

onBeforeUnmount(() => {
  // Clean up event listeners
  window.removeEventListener('i18n-updated', handleI18nUpdate)
  window.removeEventListener('i18n-locale-changed', handleI18nUpdate)
})

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

// Emit for backward compatibility and panel state
const emit = defineEmits(['update:modelValue', 'panel-state-change'])

// Inject the unified patient data and update functions
const unifiedPatientData = inject('patientData', null)
const updatePhenotypeData = inject('updatePhenotypeData', null)

const showPanel = ref(false)

/**
 * localPhenotypeData stores selections in the format:
 * { categoryId: { phenotypeId: 'no input' | 'present' | 'absent', ... }, ... }
 */
const localPhenotypeData = ref({})

/**
 * Computed property that checks if any phenotype has been selected as present/absent
 * Returns true if all phenotypes are set to "no input" or if there are no phenotypes
 */
const hasNoPhenotypeSelected = computed(() => {
  // If no phenotype data or empty object, return true
  if (!localPhenotypeData.value || Object.keys(localPhenotypeData.value).length === 0) {
    return true
  }
  
  // Check if at least one phenotype is set to present or absent
  for (const categoryId in localPhenotypeData.value) {
    const phenotypes = localPhenotypeData.value[categoryId];
    for (const phenotypeId in phenotypes) {
      if (phenotypes[phenotypeId] === 'present' || phenotypes[phenotypeId] === 'absent') {
        return false // Found at least one selected phenotype
      }
    }
  }
  
  // All phenotypes are "no input"
  return true
})

// Initialize from unified model if available
if (unifiedPatientData && unifiedPatientData.phenotypeData && unifiedPatientData.phenotypeData.length > 0) {
  logService.debug('PhenotypeSelector: initializing from unified data model with', unifiedPatientData.phenotypeData.length, 'phenotype items')
  logService.debug('PhenotypeSelector: phenotype data items:', unifiedPatientData.phenotypeData)
  
  // Convert array format to map format for internal use
  unifiedPatientData.phenotypeData.forEach(item => {
    // Debug each item as we process it
    logService.debug('PhenotypeSelector: processing phenotype item:', item)
    
    if (!localPhenotypeData.value[item.categoryId]) {
      logService.debug('PhenotypeSelector: creating new category map for', item.categoryId)
      localPhenotypeData.value[item.categoryId] = {}
    }
    localPhenotypeData.value[item.categoryId][item.phenotypeId] = item.status
    logService.debug(`PhenotypeSelector: set ${item.phenotypeId} to ${item.status} in category ${item.categoryId}`)
  })
  
  logService.debug('PhenotypeSelector: finished initialization, localPhenotypeData =', localPhenotypeData.value)
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

// Watch for changes in the unified phenotype data
watch(
  () => unifiedPatientData?.phenotypeData,
  (newPhenotypeData) => {
    logService.debug('PhenotypeSelector: watching unified phenotype data -', 
               newPhenotypeData?.length || 0, 'items');
    
    if (newPhenotypeData && newPhenotypeData.length > 0) {
      logService.debug('PhenotypeSelector: Found phenotype data in unified model:', 
                 newPhenotypeData);
      
      // CRITICAL FIX: Handle both standard format and direct object format 
      // from URL hash that doesn't have categoryId/phenotypeId structure
      
      // First, detect if we have a direct object with phenotype values
      const hasDirectFormat = newPhenotypeData.length === 1 && 
                            !newPhenotypeData[0].categoryId && 
                            !newPhenotypeData[0].phenotypeId;
      
      if (hasDirectFormat) {
        logService.debug('PhenotypeSelector: Detected direct format phenotype data');
        // Use the current category or default to nephrology
        const categoryId = unifiedPatientData?.category || 'nephrology';
        
        // Create the category if it doesn't exist
        if (!localPhenotypeData.value[categoryId]) {
          logService.debug(`PhenotypeSelector: Creating category ${categoryId} for direct format data`);
          localPhenotypeData.value[categoryId] = {};
        }
        
        // Process all properties in the direct object as phenotype values
        Object.entries(newPhenotypeData[0]).forEach(([phenotypeId, status]) => {
          localPhenotypeData.value[categoryId][phenotypeId] = status;
          logService.debug(`PhenotypeSelector: Set direct format ${phenotypeId} = ${status} in ${categoryId}`);
        });
      } else {
        // Standard format with categoryId and phenotypeId
        newPhenotypeData.forEach(item => {
          if (item.categoryId && item.phenotypeId && item.status) {
            // Create category if it doesn't exist yet
            if (!localPhenotypeData.value[item.categoryId]) {
              logService.debug(`PhenotypeSelector: Creating category ${item.categoryId}`);
              localPhenotypeData.value[item.categoryId] = {};
            }
            
            // Set the phenotype status in our local format
            localPhenotypeData.value[item.categoryId][item.phenotypeId] = item.status;
            logService.debug(`PhenotypeSelector: Set ${item.phenotypeId} = ${item.status} in ${item.categoryId}`);
          } else {
            logService.warn('PhenotypeSelector: Invalid phenotype item:', item);
          }
        });
      }
      
      // Force UI update by making a reactive change
      localPhenotypeData.value = { ...localPhenotypeData.value };
      logService.debug('PhenotypeSelector: Updated phenotype data:', localPhenotypeData.value);
      
      // Force the panel to open if we have phenotype data
      showPanel.value = true;
      logService.debug('PhenotypeSelector: Opening panel to show phenotype data');
    }
  },
  { immediate: true, deep: true }
)

function togglePanel() {
  const wasVisible = showPanel.value;
  showPanel.value = !showPanel.value;
  
  // If panel is being hidden, clear all phenotype selections
  if (wasVisible) {
    // Clear the phenotype data
    logService.debug('PhenotypeSelector: Clearing phenotype data as panel is being hidden');
    clearPhenotypeData();
  }
  
  // Emit the panel state change to parent components
  emit('panel-state-change', showPanel.value);
}

/**
 * Clears all phenotype selections by setting them all to "no input" or removing them
 */
function clearPhenotypeData() {
  // If using the unified model, clear via that
  if (updatePhenotypeData) {
    updatePhenotypeData([]);
  }
  
  // Clear the local data model
  localPhenotypeData.value = {};
  
  // Update both models to ensure synchronization
  updateBothModels();
}

/**
 * Safely get the value of a phenotype, ensuring the category exists in localPhenotypeData
 */
function getPhenotypeValue(categoryId, phenotypeId) {
  // Ensure the category exists in localPhenotypeData
  if (!localPhenotypeData.value[categoryId]) {
    localPhenotypeData.value[categoryId] = {}
  }
  
  // Return the value or default to "no input"
  return localPhenotypeData.value[categoryId][phenotypeId] || 'no input'
}

/**
 * Safely update the value of a phenotype, ensuring the category exists in localPhenotypeData
 */
function updatePhenotypeValue(categoryId, phenotypeId, value) {
  // Ensure the category exists in localPhenotypeData
  if (!localPhenotypeData.value[categoryId]) {
    localPhenotypeData.value[categoryId] = {}
  }
  
  // Update the value
  localPhenotypeData.value[categoryId][phenotypeId] = value
  
  // Call the original handler
  handlePhenotypeChange(categoryId, phenotypeId)
}

function categoryPhenotypes(categoryId) {
  const category = testsData.categories.find((cat) => cat.id === categoryId)
  return category?.phenotypes || []
}

/**
 * Gets the phenotype name in the current language if available, falls back to default
 * @param {Object} phenotype - The phenotype object
 * @returns {string} The localized phenotype name
 */
function getPhenotypeName(phenotype) {
  // Force reactivity when locale changes by using i18nKey
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value
  
  // If the phenotype has a names object with the current locale, use that
  if (phenotype.names && phenotype.names[locale.value]) {
    return phenotype.names[locale.value]
  }
  // Otherwise fall back to the name property
  return phenotype.name
}

/**
 * Gets the phenotype description in the current language if available, falls back to default
 * @param {Object} phenotype - The phenotype object
 * @returns {string} The localized phenotype description
 */
function getPhenotypeDescription(phenotype) {
  // Force reactivity when locale changes
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value
  
  // If the phenotype has a descriptions object with the current locale, use that
  if (phenotype.descriptions && phenotype.descriptions[locale.value]) {
    return phenotype.descriptions[locale.value]
  }
  // Otherwise fall back to the description property
  return phenotype.description
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
    
    // Also emit the current panel state so parent components know if phenotypes should be validated
    emit('panel-state-change', showPanel.value)
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

.warning-alert {
  margin-bottom: 1rem;
}
.phenotype-panel {
  margin-top: 0.5rem;
  background-color: v-bind('brandingConfig.styles.phenotypeSelectorBackgroundColor');
  padding: 0.5rem;
  border-radius: 4px;
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
