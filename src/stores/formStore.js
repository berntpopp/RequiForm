/**
 * @fileoverview Form store for managing all form-related data and validation using Pinia.
 * 
 * This store centralizes all form-related state, utilizing the existing usePatientData
 * composable internally for the unified data model and validation logic. It serves as the
 * single source of truth for form data across the entire application.
 * 
 * Key responsibilities:
 * - Managing and synchronizing patient data in multiple formats
 * - Tracking and validating form state
 * - Handling form submission and reset operations
 * - Importing and exporting form data
 * - Converting between different data formats (e.g., phenotype data)
 * - Providing validation feedback to UI components
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { usePatientData } from '../composables/usePatientData';
import logService from '@/services/logService'; // Import log service

/**
 * Pinia store for application-wide form data management.
 * Uses the Composition API to define state and methods for form handling.
 * This store integrates with usePatientData composable to leverage its
 * validation and data model capabilities while adding form-specific functionality.
 * 
 * @returns {Object} A store object containing state properties and methods
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
    exportPatientData,
    isValid,
    validationErrors,
    sectionValidation,
    validateForm,
    // We're defining our own getFieldErrors function
  } = usePatientData();
  
  // Additional form-related state
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
   * Synchronizes the legacy patient data format with the unified model.
   * This function maps data from the older format fields to the newer unified model,
   * ensuring compatibility and data consistency across the application.
   * 
   * Specifically handles:
   * - Personal information fields (name, birthdate, etc.)
   * - Selected panels/tests
   * - Phenotype data
   * - Category information
   * 
   * @returns {void}
   */
  function syncUnifiedPatientData() {
    logService.debug('Syncing legacy → unified data model');
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
    
    // Update phenotype data
    updatePhenotypeData(
      phenotypeDataObj.value ? 
      Object.values(phenotypeDataObj.value) : []
    );
    
    // Update category if present - check multiple possible locations
    const categoryValue = patientData.category || patientData.personalInfo.category || '';
    if (categoryValue) {
      logService.debug('Syncing category:', categoryValue);
      updateCategory(categoryValue);
    }
  }
  
  /**
   * Synchronizes the unified patient data model with the legacy format.
   * This function maps data from the newer unified model back to the older format fields,
   * ensuring backward compatibility with components that expect the legacy structure.
   * 
   * Handles synchronization of:
   * - Personal information fields
   * - Category information
   * - Phenotype data (converting unified array to legacy object)
   * 
   * @returns {void}
   */
  function syncLegacyPatientData() {
    logService.debug('Syncing unified → legacy data model');
    // Map unified model back to legacy format
    patientData.personalInfo.givenName = patientData.personalInfo.firstName || '';
    patientData.personalInfo.familyName = patientData.personalInfo.lastName || '';
    patientData.personalInfo.birthdate = patientData.personalInfo.birthdate || '';
    patientData.personalInfo.sex = patientData.personalInfo.sex || '';
    patientData.personalInfo.insurance = patientData.personalInfo.insurance || '';
    patientData.personalInfo.physicianName = patientData.personalInfo.referrer || '';
    patientData.personalInfo.diagnosis = patientData.personalInfo.diagnosis || '';
    
    // Ensure category is synchronized in both places for maximum compatibility
    if (patientData.category) {
      patientData.personalInfo.category = patientData.category;
    } else if (patientData.personalInfo.category) {
      patientData.category = patientData.personalInfo.category;
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
   * Updates the patient data object with new values.
   * This function updates the personalInfo data and ensures
   * synchronization with the unified data model.
   * 
   * @param {Object} newData - New patient personal information data
   * @returns {void}
   */
  function updatePatientData(newData) {
    // Update patient data
    Object.assign(patientData.personalInfo, newData);
    
    // Synchronize with unified data model
    syncUnifiedPatientData();
  }
  
  /**
   * Updates the phenotype data object.
   * This function updates the phenotypeDataObj reactive reference and
   * ensures synchronization with the unified data model.
   * 
   * @param {Object} data - Phenotype data object where keys are HPO IDs
   * @returns {void}
   */
  function updatePhenotypeDataObj(data) {
    phenotypeDataObj.value = { ...data };
    
    // Synchronize with unified data model
    syncUnifiedPatientData();
  }
  
  /**
   * Updates the pedigree data URL.
   * This function sets the data URL for the pedigree image representation,
   * typically a base64-encoded image string.
   * 
   * @param {string} url - Data URL for the pedigree image (base64 format)
   * @returns {void}
   */
  function updatePedigreeDataUrl(url) {
    pedigreeDataUrl.value = url;
  }
  
  /**
   * Sets the showPedigree flag.
   * This function controls whether the pedigree section should be displayed
   * in the UI and included in data exports.
   * 
   * @param {boolean} value - Whether to show the pedigree
   * @returns {void}
   */
  function setShowPedigree(value) {
    showPedigree.value = value;
  }
  
  /**
   * Resets the form validation state.
   * This function hides validation errors and clears the validation display state,
   * useful when transitioning between forms or after successful submission.
   * 
   * @returns {void}
   */
  function resetValidation() {
    showValidation.value = false;
  }
  
  /**
   * Explicitly shows or hides validation errors.
   * This function controls the visibility of validation error messages in the UI,
   * typically called before form submission or when resetting a form.
   * 
   * @param {boolean} [show=true] - Whether to show validation errors
   * @returns {void}
   */
  function setShowValidation(show = true) {
    showValidation.value = show;
  }
  

  
  /**
   * Performs validation and optionally shows validation errors.
   * This function validates the entire form and can simultaneously update the UI
   * to display error messages. It's typically called before form submission.
   * 
   * @param {boolean} [show=true] - Whether to show validation errors in the UI
   * @returns {boolean} Whether the form is valid (true if valid, false otherwise)
   */
  function performValidation(show = true) {
    showValidation.value = show;
    return validateForm(show);
  }
  
  /**
   * Resets all form data to initial values.
   * This function clears all form fields, validation state, and returns the form
   * to its default empty state. Used when starting a new form or after a completed submission.
   * 
   * @returns {void}
   */
  function resetForm() {
    resetPatientData();
    phenotypeDataObj.value = {};
    showPedigree.value = false;
    pedigreeDataUrl.value = '';
    showValidation.value = false;
  }
  
  /**
   * Exports the current form data for saving or sharing.
   * This function creates a complete data object containing all form data,
   * suitable for saving to a file, storing in localStorage, or including in a URL.
   * 
   * The exported data includes:
   * - Patient personal information
   * - Selected tests/panels
   * - Phenotype data
   * - Pedigree display settings
   * - Category information
   * 
   * @returns {Object} Complete form data object ready for export
   */
  function exportFormData() {
    // Ensure unified data model is up to date
    syncUnifiedPatientData();
    
    // Get the current category if available
    const category = patientData.category || '';
    
    // Create a combined export object
    return {
      patientData: exportPatientData(),
      selectedPanels: patientData.selectedPanels || [], // Export from unified model
      phenotypeData: convertPhenotypeDataToUnifiedFormat(phenotypeDataObj.value), // Use unified format
      showPedigree: showPedigree.value,
      category: category // Include the category field for URL sharing
    };
  }
  
  /**
   * Imports form data from an external source.
   * This function populates the form with data from an imported file, URL parameters,
   * or other external sources. It handles multiple data formats and ensures all
   * components of the form are properly updated.
   * 
   * Key features:
   * - Supports both complete and partial data imports
   * - Handles different phenotype data formats (array or object)
   * - Processes nested patient data structures
   * - Ensures data model synchronization after import
   * - Performs Vue reactivity updates on imported objects
   * 
   * @param {Object} data - Form data object to import
   * @param {boolean} [overwrite=true] - Whether to overwrite existing data
   * @returns {boolean} Success status (true if import successful, false otherwise)
   */
  function importFormData(data, overwrite = true) {
    logService.debug('formStore: Starting importFormData', { data: JSON.stringify(data).substring(0, 200) + '...', overwrite });
    
    // --- Input Validation --- 
    if (!data || typeof data !== 'object') {
      logService.error('formStore: Invalid input data for import.', data);
      return false;
    }
    // Data should already be sanitized by the caller (useUrlHandler, useDataPersistence)
    // ------------------------

    try {
      if (overwrite) {
        logService.debug('formStore: Resetting form before import (overwrite=true)');
        resetForm(); // Reset only if overwriting
      }

      // --- Explicit Data Mapping & Validation --- 

      // Determine the source object for patient-related data (nested or flat)
      const sourcePatientData = data.patientData && typeof data.patientData === 'object' ? data.patientData : data;
      logService.debug('formStore: Determined sourcePatientData for import.', sourcePatientData);

      // 1. Personal Info
      const newPersonalInfo = {};
      const sourcePersonalInfo = sourcePatientData.personalInfo && typeof sourcePatientData.personalInfo === 'object' ? sourcePatientData.personalInfo : {};
      const personalInfoFields = ['firstName', 'lastName', 'birthdate', 'sex', 'insurance', 'referrer', 'diagnosis'];
      
      // Handle legacy field names
      if (!sourcePersonalInfo.firstName && sourcePersonalInfo.givenName) sourcePersonalInfo.firstName = sourcePersonalInfo.givenName;
      if (!sourcePersonalInfo.lastName && sourcePersonalInfo.familyName) sourcePersonalInfo.lastName = sourcePersonalInfo.familyName;
      if (!sourcePersonalInfo.referrer && sourcePersonalInfo.physicianName) sourcePersonalInfo.referrer = sourcePersonalInfo.physicianName;

      personalInfoFields.forEach(field => {
        if (sourcePersonalInfo[field] && typeof sourcePersonalInfo[field] === 'string') {
          // Basic length check (e.g., 1000 chars) - adjust if needed
          newPersonalInfo[field] = sourcePersonalInfo[field].substring(0, 1000);
        } else {
            newPersonalInfo[field] = ''; // Ensure all fields exist on the target object
        }
      });
      logService.debug('formStore: Mapped newPersonalInfo:', newPersonalInfo);
      updatePersonalInfo(newPersonalInfo); // Use the store action to update

      // 2. Category (check multiple locations)
      let categoryValue = '';
      if (data.category && typeof data.category === 'string') {
        categoryValue = data.category;
      } else if (sourcePatientData.category && typeof sourcePatientData.category === 'string') {
        categoryValue = sourcePatientData.category;
      } else if (sourcePersonalInfo.category && typeof sourcePersonalInfo.category === 'string') {
        categoryValue = sourcePersonalInfo.category;
      }
      // Special case from URL handler logic (might need adjustment)
      if (!categoryValue && data.selectedTests && data.selectedTests.includes('nephronophthise')) {
          categoryValue = 'nephrology';
      }
      if (categoryValue) {
        logService.debug('formStore: Setting category:', categoryValue.substring(0, 100));
        updateCategory(categoryValue.substring(0, 100));
      }

      // 3. Selected Panels/Tests (check multiple locations)
      let sourceSelectedPanels = [];
      if (Array.isArray(sourcePatientData.selectedPanels)) {
        sourceSelectedPanels = sourcePatientData.selectedPanels;
      } else if (Array.isArray(data.selectedTests)) { // Legacy
        sourceSelectedPanels = data.selectedTests;
      }
      if (sourceSelectedPanels.length > 0) {
        const newSelectedPanels = sourceSelectedPanels
          .filter(panel => typeof panel === 'string')
          .map(panel => panel.substring(0, 100)); // Limit length
         logService.debug('formStore: Setting selected panels:', newSelectedPanels);
        updateSelectedPanels(newSelectedPanels);
      }
      
      // 4. Phenotype Data (Handle array or object format)
      let sourcePhenotypes = null;
      if (sourcePatientData.phenotypeData) {
          sourcePhenotypes = sourcePatientData.phenotypeData;
      } else if (data.phenotypeData) { // Check root level if not in patientData
          sourcePhenotypes = data.phenotypeData;
      }

      if (sourcePhenotypes) {
          const newPhenotypeObj = {};
          if (Array.isArray(sourcePhenotypes)) {
              logService.debug('formStore: Importing phenotype data from ARRAY format');
              sourcePhenotypes.forEach(item => {
                  if (item && typeof item === 'object' && item.id && typeof item.id === 'string') {
                      // Validate status
                      let status = 'no_input';
                      if (typeof item.status === 'string' && ['present', 'absent'].includes(item.status.toLowerCase())) {
                          status = item.status.toLowerCase();
                      }
                      newPhenotypeObj[item.id.substring(0, 50)] = {
                          id: item.id.substring(0, 50),
                          label: typeof item.label === 'string' ? item.label.substring(0, 200) : '',
                          status: status
                      };
                  }
              });
          } else if (typeof sourcePhenotypes === 'object') {
              logService.debug('formStore: Importing phenotype data from OBJECT format');
              Object.entries(sourcePhenotypes).forEach(([id, item]) => {
                  if (item && typeof item === 'object' && id && typeof id === 'string') {
                       // Validate status
                      let status = 'no_input';
                      if (typeof item.status === 'string' && ['present', 'absent'].includes(item.status.toLowerCase())) {
                          status = item.status.toLowerCase();
                      }
                      newPhenotypeObj[id.substring(0, 50)] = {
                          id: id.substring(0, 50),
                          label: typeof item.label === 'string' ? item.label.substring(0, 200) : '',
                          status: status
                      };
                  }
              });
          }
          logService.debug('formStore: Setting phenotype data object:', newPhenotypeObj);
          updatePhenotypeDataObj(newPhenotypeObj); // Update the legacy object directly
          // Unified format will be updated via syncUnifiedPatientData
      }

      // 5. Pedigree Display Flag
      if (typeof data.showPedigree === 'boolean') {
        logService.debug('formStore: Setting show pedigree:', data.showPedigree);
        setShowPedigree(data.showPedigree); // Use action
      }

      // --- End Explicit Mapping --- 

      // Synchronize data models in both directions AFTER explicit mapping
      logService.debug('formStore: Synchronizing data models post-import');
      syncUnifiedPatientData();
      syncLegacyPatientData();
      
      // Force a Vue reactivity update on the main objects (might still be needed)
      // patientData.personalInfo = { ...patientData.personalInfo };
      // phenotypeDataObj.value = { ...phenotypeDataObj.value }; // Handled by updatePhenotypeDataObj

      logService.info('formStore: Data import successful.');
      return true;
    } catch (error) {
      logService.error('formStore: Error during importFormData:', error);
      // Optionally show an error message to the user via uiStore
      // uiStore.showSnackbar('An unexpected error occurred during data import.', 'error');
      return false;
    }
  }
  
  /**
   * Converts phenotype data from object format to array format.
   * This function transforms the phenotype data from a keyed object structure
   * (used for efficient lookups) to an array structure (used for iteration and display).
   * 
   * The resulting array contains only valid phenotype items that have an ID property.
   * 
   * @param {Object} phenotypeDataObj - Phenotype data in object format where keys are IDs
   * @returns {Array} Array of phenotype data items, each containing at minimum an id property
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
