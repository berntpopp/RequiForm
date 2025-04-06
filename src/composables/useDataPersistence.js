/**
 * @fileoverview Composable for handling data persistence operations.
 * 
 * This composable encapsulates logic for saving and loading form data to/from
 * files and handling pasted data imports.
 */

import { ref } from 'vue';
import { downloadJsonFile, readJsonFile } from '../utils/fileUtils';
import { parsePastedData } from '../utils/dataParser';
import { useUiStore } from '../stores/uiStore';
import { useFormStore } from '../stores/formStore';

/**
 * Composable for data persistence functionality
 * @returns {Object} Data persistence methods
 */
export function useDataPersistence() {
  // Reference to the file being imported
  const importedFile = ref(null);
  
  // Get stores
  const uiStore = useUiStore();
  const formStore = useFormStore();
  
  /**
   * Saves the current form data to a file
   * @param {string} fileName - Name to use for the saved file
   * @returns {boolean} Success status
   */
  function saveToFile(fileName) {
    try {
      // Get the current form data
      const exportData = formStore.exportFormData();
      
      // Download as JSON file
      const result = downloadJsonFile(exportData, fileName);
      
      if (result) {
        uiStore.showSnackbar("Data saved successfully!");
        return true;
      } else {
        uiStore.showSnackbar("Error saving data to file.");
        return false;
      }
    } catch (error) {
      console.error('Error saving data to file:', error);
      uiStore.showSnackbar("Error saving data to file.");
      return false;
    }
  }
  
  /**
   * Loads form data from a file
   * @param {File} file - The file to load data from
   * @returns {Promise<boolean>} Success status
   */
  async function loadFromFile(file) {
    try {
      if (!file) {
        uiStore.setLoadDataError("No file selected.");
        return false;
      }
      
      importedFile.value = file;
      
      // Read and parse the file
      const jsonData = await readJsonFile(file);
      
      // Check if the data contains expected fields
      if (!isValidFormData(jsonData)) {
        uiStore.setLoadDataError("Invalid data format. The file does not contain valid RequiForm data.");
        return false;
      }
      
      // Import the data
      formStore.importFormData(jsonData, true);
      
      uiStore.showSnackbar("Data loaded successfully!");
      return true;
    } catch (error) {
      console.error('Error loading data from file:', error);
      uiStore.setLoadDataError(`Error loading data: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Processes pasted data and imports it if valid
   * @param {string} pastedText - The pasted text data
   * @returns {boolean} Success status
   */
  function processPastedData(pastedText) {
    try {
      if (!pastedText || typeof pastedText !== 'string') {
        console.error('Process error: No valid data provided');
        uiStore.showSnackbar("No valid data provided.");
        return false;
      }
      
      console.log('Processing pasted data:', pastedText.substring(0, 100) + '...');
      
      // Parse the formatted text data using the imported utility
      const parseResult = parsePastedData(pastedText);
      console.log('Parse result:', parseResult);
      
      if (!parseResult.success) {
        console.error('Parse failed:', parseResult.error);
        uiStore.showSnackbar(parseResult.error || "Invalid data format.");
        return false;
      }
      
      // Import the successfully parsed data
      console.log('Importing parsed data:', parseResult.data);
      formStore.importFormData(parseResult.data, true);
      
      // Force a UI update cycle by triggering a sync
      formStore.syncLegacyPatientData();
      formStore.syncUnifiedPatientData();
      
      // Log the resulting form state for debugging
      console.log('Form state after import:', {
        patientData: formStore.patientData,
        selectedTests: formStore.selectedTests,
        phenotypeDataObj: formStore.phenotypeDataObj
      });
      
      uiStore.showSnackbar("Data imported successfully!");
      return true;
    } catch (error) {
      console.error('Error processing pasted data:', error);
      uiStore.showSnackbar("Error processing pasted data. Please check the format.");
      return false;
    }
  }
  
  /**
   * Validates that the data contains expected form data fields
   * @param {Object} data - The data to validate
   * @returns {boolean} Whether the data is valid form data
   */
  function isValidFormData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check for at least one of the key data structures
    return (
      (data.patientData && typeof data.patientData === 'object') ||
      (data.selectedTests && Array.isArray(data.selectedTests)) ||
      (data.phenotypeData && typeof data.phenotypeData === 'object')
    );
  }
  
  /**
   * Imports data from either JSON string or formatted text (used by paste data modal)
   * @param {string} inputData - Data to import (either JSON string or formatted text)
   * @returns {Promise<boolean>} Success status
   */
  async function importFromJson(inputData) {
    if (!inputData || typeof inputData !== 'string') {
      console.error('Import error: No valid data provided', inputData);
      uiStore.showSnackbar("No valid data provided.");
      return false;
    }

    console.log('Attempting to import data:', inputData.substring(0, 100) + '...');

    try {
      // First try to parse as JSON
      const jsonData = JSON.parse(inputData);
      console.log('Successfully parsed as JSON:', jsonData);
      
      // If it's valid JSON and has the expected structure, import it directly
      if (isValidFormData(jsonData)) {
        console.log('Valid form data format detected, importing directly');
        // Import the data directly with debug logging
        const result = formStore.importFormData(jsonData, true);
        console.log('Import result:', result, 'Current form state:', {
          patientData: formStore.patientData,
          selectedTests: formStore.selectedTests,
          phenotypeDataObj: formStore.phenotypeDataObj
        });
        
        // Force a UI update cycle by triggering a sync
        formStore.syncLegacyPatientData();
        formStore.syncUnifiedPatientData();
        
        uiStore.showSnackbar("Data imported successfully!");
        return true;
      } else {
        console.error('Invalid data format:', jsonData);
        uiStore.showSnackbar("Invalid data format. The JSON does not contain valid RequiForm data.");
        return false;
      }
    } catch (error) {
      // If JSON parsing fails, try to process it as formatted text
      console.log('Not valid JSON, trying formatted text processing:', error.message);
      return processPastedData(inputData);
    }
  }

  return {
    // State
    importedFile,
    
    // Methods
    saveToFile,
    loadFromFile,
    processPastedData,
    importFromJson, // Add new method for the paste data modal
    isValidFormData,
  };
}
