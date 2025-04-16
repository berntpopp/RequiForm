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
    initializeFromExternalData,
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
    
    // Update phenotype data
    updatePhenotypeData(
      phenotypeDataObj.value ? 
      Object.values(phenotypeDataObj.value) : []
    );
    
    // Update category if present - check multiple possible locations
    const categoryValue = patientData.category || patientData.personalInfo.category || '';
    if (categoryValue) {
      console.log('Syncing category:', categoryValue);
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
    console.log('Syncing unified → legacy data model');
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
    console.log('formStore: Importing data:', data);
    
    try {
      // Special case for data copied from the URL hash format
      // This format has a nested structure with fields at the top level as well
      const isHashFormatData = data.patientData && 
                             (data.selectedPanels || data.phenotypeData || 
                              typeof data.showPedigree === 'boolean' ||
                              data.category);
      
      if (isHashFormatData) {
        console.log('formStore: Detected hash format data with nested structure');
        
        // Handle the nested patientData structure
        if (data.patientData) {
          console.log('formStore: Initializing from nested patientData:', data.patientData);
          initializeFromExternalData(data.patientData, overwrite);
        }
        
        // Handle top-level fields that might override nested ones
        // For hash format, we prioritize the top-level fields as they're more current
        
        // Handle selected panels from top level
        if (data.selectedPanels && Array.isArray(data.selectedPanels)) {
          console.log('formStore: Setting top-level selected panels:', data.selectedPanels);
          updateSelectedPanels(data.selectedPanels);
        }
        
        // Handle top-level phenotype data
        if (data.phenotypeData) {
          console.log('formStore: Processing phenotype data', 
                     Array.isArray(data.phenotypeData) ? 'array format' : 'object format');
          
          // CRITICAL FIX: Handle both array and object formats of phenotype data
          if (Array.isArray(data.phenotypeData)) {
            // Handle special flat array format: [{"phenotype1":"present","phenotype2":"absent",...}]
            if (data.phenotypeData.length > 0 && !data.phenotypeData[0].categoryId && !data.phenotypeData[0].phenotypeId) {
              console.log('formStore: Detected flat phenotype array format');
              
              // Convert direct object keys-values to categoryId/phenotypeId/status format
              const categoryId = data.category || 'nephrology'; // Default to nephrology if no category
              const phenotypeArray = [];
              
              // First, convert to object format for phenotypeDataObj
              const phenotypeObj = { [categoryId]: {} };
              
              // Process all phenotype entries from the flat format
              Object.entries(data.phenotypeData[0]).forEach(([phenotypeId, status]) => {
                // Add to the array format for UI components
                phenotypeArray.push({
                  categoryId: categoryId,
                  phenotypeId: phenotypeId,
                  status: status
                });
                
                // Also add to the object format
                phenotypeObj[categoryId][phenotypeId] = status;
              });
              
              // Set both formats
              phenotypeDataObj.value = phenotypeObj;
              updatePhenotypeData(phenotypeArray);
              
              console.log('formStore: Converted flat phenotype data to', phenotypeArray.length, 'items');
            } else {
              // Standard array format with {categoryId, phenotypeId, status} objects
              console.log('formStore: Using standard phenotype array format');
              updatePhenotypeData(data.phenotypeData);
              
              // Also convert to object format
              const phenotypeObj = {};
              data.phenotypeData.forEach(item => {
                if (item.categoryId && item.phenotypeId) {
                  if (!phenotypeObj[item.categoryId]) {
                    phenotypeObj[item.categoryId] = {};
                  }
                  phenotypeObj[item.categoryId][item.phenotypeId] = item.status;
                }
              });
              phenotypeDataObj.value = phenotypeObj;
            }
          } else {
            // Object format like {nephrology: {phenotype1: "present", ...}}
            console.log('formStore: Setting top-level phenotype data object:', data.phenotypeData);
            phenotypeDataObj.value = { ...data.phenotypeData };
            
            // Convert from object format to array format for UI components
            if (Object.keys(data.phenotypeData).length > 0) {
              // Check if we have a category-based structure like {nephrology: {...}}
              const categoryId = data.category || Object.keys(data.phenotypeData)[0];
              const phenotypesToUse = data.phenotypeData[categoryId] || {};
              
              if (Object.keys(phenotypesToUse).length > 0) {
                console.log('formStore: Converting phenotype object to array format for UI');
                const phenotypeArray = [];
                
                // Convert to {categoryId, phenotypeId, status} format for UI components
                Object.entries(phenotypesToUse).forEach(([phenotypeId, status]) => {
                  phenotypeArray.push({
                    categoryId: categoryId,
                    phenotypeId: phenotypeId,
                    status: status
                  });
                });
                
                updatePhenotypeData(phenotypeArray);
                console.log('formStore: Phenotype data converted to array format with', 
                           phenotypeArray.length, 'items');
              }
            }
          }
        }
        
        // Handle top-level category
        if (data.category) {
          console.log('formStore: Setting top-level category:', data.category);
          updateCategory(data.category);
          
          // Set category in all possible locations for maximum compatibility
          patientData.category = data.category;
          
          // Also ensure it's set in personal info for UI components
          if (!patientData.personalInfo) {
            patientData.personalInfo = {};
          }
          patientData.personalInfo.category = data.category;
          
          console.log('formStore: Category set in multiple locations for compatibility');
        }
        
        // Handle pedigree display flag
        if (typeof data.showPedigree === 'boolean') {
          console.log('formStore: Setting top-level show pedigree:', data.showPedigree);
          showPedigree.value = data.showPedigree;
        }
      } else {
        // Standard import path for non-hash data
        
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
          updateSelectedPanels(data.selectedPanels);
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
      }
      
      // Synchronize data models in both directions to ensure all UI components update
      console.log('formStore: Synchronizing data models');
      syncUnifiedPatientData();
      syncLegacyPatientData();
      
      // Force a Vue reactivity update on the main objects
      patientData.personalInfo = { ...patientData.personalInfo };
      
      return true;
    } catch (error) {
      console.error('formStore: Error importing data:', error);
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
