/**
 * @fileoverview Composable function for managing unified patient data.
 * 
 * This composable uses Vue's Composition API to provide a reactive
 * interface for working with patient data and includes validation utilities.
 */

import { ref, reactive, computed } from 'vue';
import { createDefaultPatientData, mergePatientData } from '../data/patientData';
import {
  validatePatientData,
  validatePersonalInfo,
  validateSelectedPanels,
  validatePhenotypeData,
  validateCategory,
  validateConsent
} from '../utils/validation';

/**
 * Composable for managing unified patient data
 * @return {Object} Patient data state and methods
 */
export function usePatientData() {
  // Create reactive patient data state
  const patientData = reactive(createDefaultPatientData());
  
  // Track if the data was initialized from URL
  const initializedFromUrl = ref(false);
  
  // Validation state
  const validationState = reactive({
    // Whether the validation has been triggered yet
    touched: false,
    // Current validation results
    results: validatePatientData(patientData),
    // Whether to show validation errors
    showErrors: false
  });
  
  /**
   * Check if the entire form is valid
   */
  const isValid = computed(() => validationState.results.valid);
  
  /**
   * Get validation errors for the entire form
   */
  const validationErrors = computed(() => validationState.results.errors);
  
  /**
   * Get section-specific validation status
   */
  const sectionValidation = computed(() => validationState.results.sections);
  
  /**
   * Updates the validation results
   */
  function validateForm(showErrors = false) {
    validationState.touched = true;
    validationState.showErrors = showErrors;
    validationState.results = validatePatientData(patientData);
    return validationState.results.valid;
  }
  
  /**
   * Gets field-level errors for a specific section
   * @param {string} section - The section name (e.g., 'personalInfo')
   * @return {Object} Field-level errors
   */
  function getFieldErrors(section) {
    if (!validationState.showErrors) return {};
    
    const errorsObj = {};
    const sectionPrefix = section === 'personalInfo' ? 'personalInfo.' : '';
    
    Object.entries(validationState.results.errors).forEach(([key, value]) => {
      if (key.startsWith(sectionPrefix)) {
        // Extract the field name from the key (e.g., personalInfo.firstName -> firstName)
        const fieldName = key.replace(sectionPrefix, '');
        errorsObj[fieldName] = value;
      } else if (section === 'root' && !key.includes('.')) {
        // Root level errors that don't belong to a specific section
        errorsObj[key] = value;
      }
    });
    
    return errorsObj;
  }
  
  /**
   * Updates patient personal information
   * @param {Object} personalInfo - New personal information
   * @return {Object} Validation result for the personal info section
   */
  function updatePersonalInfo(personalInfo) {
    Object.assign(patientData.personalInfo, personalInfo);
    
    // Perform validation if the form has been touched
    if (validationState.touched) {
      const fieldValidation = validatePersonalInfo(patientData.personalInfo);
      // Update the overall validation results
      validateForm(validationState.showErrors);
      return fieldValidation;
    }
    
    return { valid: true, errors: {} };
  }
  
  /**
   * Updates selected test panels
   * @param {Array<string>} panels - Array of panel IDs
   * @return {Object} Validation result for the selected panels
   */
  function updateSelectedPanels(panels) {
    patientData.selectedPanels = [...panels];
    
    // Perform validation if the form has been touched
    if (validationState.touched) {
      const fieldValidation = validateSelectedPanels(patientData.selectedPanels);
      // Update the overall validation results
      validateForm(validationState.showErrors);
      return fieldValidation;
    }
    
    return { valid: true, errors: {} };
  }
  
  /**
   * Updates phenotype data
   * @param {Array<Object>} phenotypes - New phenotype data
   * @return {Object} Validation result for the phenotype data
   */
  function updatePhenotypeData(phenotypes) {
    patientData.phenotypeData = [...phenotypes];
    
    // Perform validation if the form has been touched
    if (validationState.touched) {
      const fieldValidation = validatePhenotypeData(patientData.phenotypeData);
      // Update the overall validation results
      validateForm(validationState.showErrors);
      return fieldValidation;
    }
    
    return { valid: true, errors: {} };
  }
  
  /**
   * Updates category
   * @param {string} category - New category
   * @return {Object} Validation result for the category
   */
  function updateCategory(category) {
    patientData.category = category;
    
    // Perform validation if the form has been touched
    if (validationState.touched) {
      const fieldValidation = validateCategory(patientData.category);
      // Update the overall validation results
      validateForm(validationState.showErrors);
      return fieldValidation;
    }
    
    return { valid: true, errors: {} };
  }
  
  /**
   * Updates consent information
   * @param {Object} consentData - New consent data
   * @return {Object} Validation result for the consent data
   */
  function updateConsent(consentData) {
    Object.assign(patientData.consent, consentData);
    
    // Perform validation if the form has been touched
    if (validationState.touched) {
      const fieldValidation = validateConsent(patientData.consent);
      // Update the overall validation results
      validateForm(validationState.showErrors);
      return fieldValidation;
    }
    
    return { valid: true, errors: {} };
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
    
    // Reset validation state
    validationState.touched = false;
    validationState.showErrors = false;
    validationState.results = validatePatientData(patientData);
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
    // Validation related exports
    isValid,
    validationErrors,
    sectionValidation,
    validateForm,
    getFieldErrors,
  };
}
