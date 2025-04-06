/**
 * @fileoverview Form store for managing all form-related data and validation using Pinia.
 * 
 * This store centralizes all form-related state, utilizing the existing usePatientData
 * composable internally for the unified data model and validation logic.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { usePatientData } from '../composables/usePatientData';

/**
 * Form store for application-wide form data management
 */
export const useFormStore = defineStore('form', () => {
  // Initialize the usePatientData composable
  const {
    patientData,
    updatePersonalInfo,
    updateSelectedPanels,
    updatePhenotypeData,
    updateCategory,
    updateConsent, // Keep this for potential future use with consent forms
    resetPatientData,
    initializeFromExternalData,
    exportPatientData,
    isValid,
    validationErrors,
    sectionValidation,
    validateForm,
    // We're defining our own getFieldErrors function
  } = usePatientData();
  
  // Additional form-related state
  const selectedTests = ref([]);
  const phenotypeDataObj = ref({});
  const showPedigree = ref(false);
  const pedigreeDataUrl = ref('');
  const showValidation = ref(false);
  
  // Save data dialog state
  const saveDataName = computed(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    return `requiform-data-${dateStr}.json`;
  });
  
  /**
   * Synchronizes the legacy patient data format with the unified model
   */
  function syncUnifiedPatientData() {
    console.log('Syncing legacy → unified data model');
    // Map the legacy patient data to the unified format
    updatePersonalInfo({
      firstName: patientData.personalInfo.givenName || patientData.personalInfo.firstName || '',
      lastName: patientData.personalInfo.familyName || patientData.personalInfo.lastName || '',
      birthdate: patientData.personalInfo.birthdate || '',
      sex: patientData.personalInfo.sex || '',
      insurance: patientData.personalInfo.insurance || '',
      referrer: patientData.personalInfo.physicianName || patientData.personalInfo.referrer || '',
      diagnosis: patientData.personalInfo.diagnosis || ''
    });
    
    // Update selected panels
    updateSelectedPanels(selectedTests.value || []);
    
    // Update phenotype data
    updatePhenotypeData(
      phenotypeDataObj.value ? 
      Object.values(phenotypeDataObj.value) : []
    );
    
    // Update category if present
    if (patientData.personalInfo.category) {
      updateCategory(patientData.personalInfo.category);
    }
  }
  
  /**
   * Synchronizes the unified patient data model with the legacy format
   */
  function syncLegacyPatientData() {
    console.log('Syncing unified → legacy data model');
    // Map unified model back to legacy format
    patientData.personalInfo.givenName = patientData.personalInfo.firstName || '';
    patientData.personalInfo.familyName = patientData.personalInfo.lastName || '';
    patientData.personalInfo.birthdate = patientData.personalInfo.birthdate || '';
    patientData.personalInfo.sex = patientData.personalInfo.sex || '';
    patientData.personalInfo.insurance = patientData.personalInfo.insurance || '';
    patientData.personalInfo.physicianName = patientData.personalInfo.referrer || '';
    patientData.personalInfo.diagnosis = patientData.personalInfo.diagnosis || '';
    
    // Also ensure the original fields are populated for bidirectional compatibility
    patientData.personalInfo.firstName = patientData.personalInfo.firstName || patientData.personalInfo.givenName || '';
    patientData.personalInfo.lastName = patientData.personalInfo.lastName || patientData.personalInfo.familyName || '';
    patientData.personalInfo.referrer = patientData.personalInfo.referrer || patientData.personalInfo.physicianName || '';
    
    // Update selected tests
    if (patientData.selectedPanels) {
      selectedTests.value = [...patientData.selectedPanels];
    }
    
    // Process phenotype data
    if (patientData.phenotypeData && patientData.phenotypeData.length > 0) {
      // Convert array format to object format expected by legacy code
      const newPhenotypeData = {};
      patientData.phenotypeData.forEach(item => {
        if (item.id) {
          newPhenotypeData[item.id] = item;
        }
      });
      phenotypeDataObj.value = newPhenotypeData;
    }
    
    // Trigger reactivity with a deep copy of the personal info object
    patientData.personalInfo = { ...patientData.personalInfo };
  }
  
  /**
   * Updates the patient data object
   * @param {Object} newData - New patient data
   */
  function updatePatientData(newData) {
    // Update patient data
    Object.assign(patientData.personalInfo, newData);
    
    // Synchronize with unified data model
    syncUnifiedPatientData();
  }
  
  /**
   * Updates the selected tests
   * @param {Array} tests - Array of test IDs
   */
  function updateSelectedTests(tests) {
    selectedTests.value = [...tests];
    
    // Synchronize with unified data model
    syncUnifiedPatientData();
  }
  
  /**
   * Updates the phenotype data
   * @param {Object} data - Phenotype data object
   */
  function updatePhenotypeDataObj(data) {
    phenotypeDataObj.value = { ...data };
    
    // Synchronize with unified data model
    syncUnifiedPatientData();
  }
  
  /**
   * Updates the pedigree data URL
   * @param {string} url - Data URL for the pedigree image
   */
  function updatePedigreeDataUrl(url) {
    pedigreeDataUrl.value = url;
  }
  
  /**
   * Sets the showPedigree flag
   * @param {boolean} value - Whether to show the pedigree
   */
  function setShowPedigree(value) {
    showPedigree.value = value;
  }
  
  /**
   * Resets the form validation state
   */
  function resetValidation() {
    showValidation.value = false;
  }
  
  /**
   * Explicitly shows validation
   */
  function setShowValidation(show = true) {
    showValidation.value = show;
  }
  

  
  /**
   * Performs validation and optionally shows validation errors
   * @param {boolean} show - Whether to show validation errors
   * @returns {boolean} Whether the form is valid
   */
  function performValidation(show = true) {
    showValidation.value = show;
    return validateForm(show);
  }
  
  /**
   * Resets all form data to initial values
   */
  function resetForm() {
    resetPatientData();
    selectedTests.value = [];
    phenotypeDataObj.value = {};
    showPedigree.value = false;
    pedigreeDataUrl.value = '';
    showValidation.value = false;
  }
  
  /**
   * Exports the current form data for saving
   * @returns {Object} Form data object
   */
  function exportFormData() {
    // Ensure unified data model is up to date
    syncUnifiedPatientData();
    
    // Create a combined export object
    return {
      patientData: exportPatientData(),
      selectedTests: selectedTests.value,
      phenotypeData: phenotypeDataObj.value,
      showPedigree: showPedigree.value
    };
  }
  
  /**
   * Imports form data from an external source
   * @param {Object} data - Form data object
   * @param {boolean} overwrite - Whether to overwrite existing data
   * @returns {boolean} Success status
   */
  function importFormData(data, overwrite = true) {
    console.log('formStore: Importing data:', data);
    
    try {
      // Handle personalInfo directly - this structure might come from the paste modal
      if (data.personalInfo) {
        console.log('formStore: Updating personal info:', data.personalInfo);
        // Direct update to the personal info object
        Object.assign(patientData.personalInfo, data.personalInfo);
      }
      
      // Handle patientData from file imports
      if (data.patientData) {
        console.log('formStore: Initializing from external data:', data.patientData);
        initializeFromExternalData(data.patientData, overwrite);
      }
      
      // Handle selected panels/tests
      if (data.selectedPanels && Array.isArray(data.selectedPanels)) {
        console.log('formStore: Setting selected panels:', data.selectedPanels);
        selectedTests.value = [...data.selectedPanels];
      } else if (data.selectedTests && Array.isArray(data.selectedTests)) {
        console.log('formStore: Setting selected tests:', data.selectedTests);
        selectedTests.value = [...data.selectedTests];
      }
      
      // Handle phenotype data
      if (data.phenotypeData) {
        // Check if it's an array (from paste modal) or object (from file import)
        if (Array.isArray(data.phenotypeData)) {
          console.log('formStore: Converting phenotype array to object:', data.phenotypeData);
          // Convert array to object format
          const phenotypeObj = {};
          data.phenotypeData.forEach(item => {
            if (item && item.id) {
              phenotypeObj[item.id] = item;
            }
          });
          phenotypeDataObj.value = phenotypeObj;
        } else {
          console.log('formStore: Setting phenotype data object:', data.phenotypeData);
          phenotypeDataObj.value = { ...data.phenotypeData };
        }
      }
      
      // Handle pedigree display flag
      if (typeof data.showPedigree === 'boolean') {
        console.log('formStore: Setting show pedigree:', data.showPedigree);
        showPedigree.value = data.showPedigree;
      }
      
      // Synchronize data models in both directions to ensure all UI components update
      console.log('formStore: Synchronizing data models');
      syncUnifiedPatientData();
      syncLegacyPatientData();
      
      return true;
    } catch (error) {
      console.error('formStore: Error importing data:', error);
      return false;
    }
  }
  
  /**
   * Converts phenotype data from object format to array format
   * @param {Object} phenotypeDataObj - Phenotype data object
   * @returns {Array} Array of phenotype data items
   */
  function convertPhenotypeDataToUnifiedFormat(phenotypeDataObj) {
    if (!phenotypeDataObj) return [];
    
    return Object.values(phenotypeDataObj).filter(item => item && item.id);
  }
  
  return {
    // State from usePatientData
    patientData,
    isValid,
    validationErrors,
    sectionValidation,
    
    // Additional state
    selectedTests,
    phenotypeDataObj,
    showPedigree,
    pedigreeDataUrl,
    showValidation,
    saveDataName,
    
    // Methods from usePatientData
    validateForm: performValidation,
    updateConsent, // Included for consent form handling
    
    // Error handling methods
    getFieldErrors: (section = null) => {
      // If validation isn't showing, return empty object
      if (!showValidation.value || !validationErrors.value) {
        return {};
      }
      
      // If no section is specified, return all errors
      if (!section) {
        return validationErrors.value;
      }
      
      // Filter errors for the specified section
      // This includes both direct field names and prefixed field names
      const sectionErrors = {};
      
      Object.entries(validationErrors.value).forEach(([field, message]) => {
        // Include errors that belong to this section (with or without prefix)
        if (field.startsWith(section + '.')) {
          // For prefixed fields (e.g., personalInfo.firstName), get just the field name
          const fieldName = field.substring(section.length + 1);
          sectionErrors[fieldName] = message;
        } else if (!field.includes('.')) {
          // Also include non-prefixed fields (direct field names)
          // We need to check if they're actually in this section
          const prefixedField = `${section}.${field}`;
          if (validationErrors.value[prefixedField]) {
            sectionErrors[field] = message;
          }
        }
      });
      
      return sectionErrors;
    },
    
    // Additional methods
    updatePatientData,
    updateSelectedTests,
    updatePhenotypeDataObj,
    updatePedigreeDataUrl,
    setShowPedigree,
    resetValidation,
    setShowValidation,
    resetForm,
    syncUnifiedPatientData,
    syncLegacyPatientData,
    exportFormData,
    importFormData,
    convertPhenotypeDataToUnifiedFormat,
  };
});
