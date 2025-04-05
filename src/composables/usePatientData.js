/**
 * @fileoverview Composable function for managing unified patient data.
 * 
 * This composable uses Vue's Composition API to provide a reactive
 * interface for working with patient data.
 */

import { ref, reactive, watch } from 'vue';
import { createDefaultPatientData, mergePatientData } from '../data/patientData';

/**
 * Composable for managing unified patient data
 * @return {Object} Patient data state and methods
 */
export function usePatientData() {
  // Create reactive patient data state
  const patientData = reactive(createDefaultPatientData());
  
  // Track if the data was initialized from URL
  const initializedFromUrl = ref(false);
  
  /**
   * Updates patient personal information
   * @param {Object} personalInfo - New personal information
   */
  function updatePersonalInfo(personalInfo) {
    Object.assign(patientData.personalInfo, personalInfo);
  }
  
  /**
   * Updates selected test panels
   * @param {Array<string>} panels - Array of panel IDs
   */
  function updateSelectedPanels(panels) {
    patientData.selectedPanels = [...panels];
  }
  
  /**
   * Updates phenotype data
   * @param {Array<Object>} phenotypes - New phenotype data
   */
  function updatePhenotypeData(phenotypes) {
    patientData.phenotypeData = [...phenotypes];
  }
  
  /**
   * Updates category
   * @param {string} category - New category
   */
  function updateCategory(category) {
    patientData.category = category;
  }
  
  /**
   * Updates consent information
   * @param {Object} consentData - New consent data
   */
  function updateConsent(consentData) {
    Object.assign(patientData.consent, consentData);
  }
  
  /**
   * Resets patient data to default values
   */
  function resetPatientData() {
    const defaultData = createDefaultPatientData();
    Object.keys(defaultData).forEach(key => {
      patientData[key] = defaultData[key];
    });
    initializedFromUrl.value = false;
  }
  
  /**
   * Initializes patient data from an external source (like URL parameters)
   * @param {Object} data - Patient data to merge
   * @param {boolean} overwrite - Whether to overwrite existing data
   */
  function initializeFromExternalData(data, overwrite = false) {
    if (overwrite) {
      // Reset to default values first
      resetPatientData();
      
      // Then update with provided data
      if (data.personalInfo) {
        updatePersonalInfo(data.personalInfo);
      }
      
      if (data.selectedPanels) {
        updateSelectedPanels(data.selectedPanels);
      }
      
      if (data.phenotypeData) {
        updatePhenotypeData(data.phenotypeData);
      }
      
      if (data.category) {
        updateCategory(data.category);
      }
      
      if (data.consent) {
        updateConsent(data.consent);
      }
    } else {
      // Merge with existing data (for backward compatibility)
      const mergedData = mergePatientData(patientData, data);
      
      // Update each section individually
      updatePersonalInfo(mergedData.personalInfo);
      updateSelectedPanels(mergedData.selectedPanels);
      updatePhenotypeData(mergedData.phenotypeData);
      updateCategory(mergedData.category);
      updateConsent(mergedData.consent);
    }
    
    initializedFromUrl.value = true;
  }
  
  /**
   * Exports the current patient data as a plain object
   * @return {Object} Current patient data as a plain object
   */
  function exportPatientData() {
    return JSON.parse(JSON.stringify(patientData));
  }
  
  return {
    patientData,
    initializedFromUrl,
    updatePersonalInfo,
    updateSelectedPanels,
    updatePhenotypeData,
    updateCategory,
    updateConsent,
    resetPatientData,
    initializeFromExternalData,
    exportPatientData,
  };
}
