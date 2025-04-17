/**
 * @fileoverview Composable for handling data persistence operations.
 * 
 * This composable encapsulates logic for saving and loading form data to/from
 * files and handling pasted data imports. It provides a unified interface for 
 * all data import/export functionality throughout the application.
 * 
 * Key responsibilities:
 * - Saving form data to JSON files
 * - Loading form data from JSON files
 * - Processing and validating pasted data from different formats
 * - Validating data structure before import
 * - Providing feedback on import/export operations
 */

import { ref } from 'vue';
import { downloadJsonFile, readJsonFile } from '../utils/fileUtils';
import { parsePastedData } from '../utils/dataParser';
import { useUiStore } from '../stores/uiStore';
import { useFormStore } from '../stores/formStore';
import logService from '../services/logService'; // Import log service

/**
 * Vue composable that provides data persistence functionality for the application.
 * Uses Vue's Composition API to manage data import/export state and operations.
 * 
 * @returns {Object} Object containing the following:
 *   @returns {Ref<File>} importedFile - Reference to the file being imported
 *   @returns {Function} saveToFile - Function to save current form data to a file
 *   @returns {Function} loadFromFile - Function to load form data from a file
 *   @returns {Function} processPastedData - Function to process pasted text data
 *   @returns {Function} importFromJson - Function to import data from JSON string or formatted text
 *   @returns {Function} isValidFormData - Function to validate form data structure
 */
export function useDataPersistence() {
  // Reference to the file being imported
  const importedFile = ref(null);
  
  // Get stores
  const uiStore = useUiStore();
  const formStore = useFormStore();
  
  /**
   * Saves the current form data to a JSON file.
   * This function:
   * 1. Exports the current form data using the formStore
   * 2. Downloads it as a JSON file with the specified filename
   * 3. Provides user feedback via the UI store
   * 
   * @param {string} fileName - Name to use for the saved file (without extension)
   * @returns {boolean} True if save was successful, false otherwise
   */
  function saveToFile(fileName) {
    try {
      // Get the current form data
      const exportData = formStore.exportFormData();
      
      // Download as JSON file
      const result = downloadJsonFile(exportData, fileName);
      
      if (result) {
        uiStore.showSnackbar("Data saved successfully!");
        logService.debug('Data saved successfully to', fileName); // Replaced console.log
        return true;
      } else {
        uiStore.showSnackbar("Error saving data to file.");
        logService.error('Error saving data to file.'); // Replaced console.error
        return false;
      }
    } catch (error) {
      logService.error('Error saving data to file:', error); // Replaced console.error
      uiStore.showSnackbar("Error saving data to file.");
      return false;
    }
  }
  
  /**
   * Loads form data from a JSON file.
   * This function:
   * 1. Reads and parses the selected file
   * 2. Validates that it contains proper RequiForm data
   * 3. Imports the data into the application state
   * 4. Provides user feedback on success or failure
   * 
   * @param {File} file - The file object to load data from
   * @returns {Promise<boolean>} Promise resolving to true if load was successful, false otherwise
   * @throws {Error} May throw if file reading or parsing fails
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
      logService.debug('Data loaded from file:', file.name, jsonData); // Replaced console.log
      return true;
    } catch (error) {
      logService.error('Error loading data from file:', error); // Replaced console.error
      uiStore.setLoadDataError(`Error loading data: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Processes pasted data and imports it if valid.
   * This function handles formatted text data (non-JSON) by:
   * 1. Validating the input text
   * 2. Parsing it using the dedicated data parser utility
   * 3. Importing the parsed data if successful
   * 4. Performing additional syncing to ensure UI consistency
   * 5. Providing user feedback on the result
   * 
   * @param {string} pastedText - The pasted text data to process
   * @returns {boolean} True if processing and import were successful, false otherwise
   */
  function processPastedData(pastedText) {
    try {
      if (!pastedText || typeof pastedText !== 'string') {
        logService.error('Process error: No valid data provided'); // Replaced console.error
        uiStore.showSnackbar("No valid data provided.");
        return false;
      }
      
      logService.debug('Processing pasted data:', pastedText.substring(0, 100) + '...'); // Replaced console.log
      
      // Parse the formatted text data using the imported utility
      const parseResult = parsePastedData(pastedText);
      logService.debug('Parse result:', parseResult); // Replaced console.log
      
      if (!parseResult.success) {
        logService.error('Parse failed:', parseResult.error); // Replaced console.error
        uiStore.showSnackbar(parseResult.error || "Invalid data format.");
        return false;
      }
      
      // Import the successfully parsed data
      logService.debug('Importing parsed data:', parseResult.data); // Replaced console.log
      formStore.importFormData(parseResult.data, true);
      
      // Force a UI update cycle by triggering a sync
      formStore.syncLegacyPatientData();
      formStore.syncUnifiedPatientData();
      
      // Log the resulting form state for debugging
      logService.debug('Form state after import:', {
        patientData: formStore.patientData,
        selectedTests: formStore.selectedTests,
        phenotypeDataObj: formStore.phenotypeDataObj
      }); // Replaced console.log
      
      uiStore.showSnackbar("Data imported successfully!");
      return true;
    } catch (error) {
      logService.error('Error processing pasted data:', error); // Replaced console.error
      uiStore.showSnackbar("Error processing pasted data. Please check the format.");
      return false;
    }
  }
  
  /**
   * Validates that the data contains expected form data fields.
   * Performs basic structural validation to ensure the data contains
   * at least one of the main RequiForm data sections:
   * - patientData (object)
   * - selectedTests (array)
   * - phenotypeData (object)
   * 
   * @param {Object} data - The data object to validate
   * @returns {boolean} True if the data has valid RequiForm structure, false otherwise
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
   * Imports data from either JSON string or formatted text.
   * This versatile function:
   * 1. First attempts to parse the input as JSON
   * 2. If successful and valid, imports it directly
   * 3. If JSON parsing fails, tries to process it as formatted text
   * 4. Ensures UI synchronization after import
   * 5. Provides user feedback on the outcome
   * 
   * This function is primarily used by the paste data modal component.
   * 
   * @param {string} inputData - Data to import (either JSON string or formatted text)
   * @returns {Promise<boolean>} Promise resolving to true if import was successful, false otherwise
   */
  async function importFromJson(inputData) {
    if (!inputData || typeof inputData !== 'string') {
      logService.error('Import error: No valid data provided', inputData); // Replaced console.error
      uiStore.showSnackbar("No valid data provided.");
      return false;
    }

    logService.debug('Attempting to import data:', inputData.substring(0, 100) + '...'); // Replaced console.log

    try {
      // First try to parse as JSON
      const jsonData = JSON.parse(inputData);
      logService.debug('Successfully parsed as JSON:', jsonData); // Replaced console.log
      
      // If it's valid JSON and has the expected structure, import it directly
      if (isValidFormData(jsonData)) {
        logService.debug('Valid form data format detected, importing directly'); // Replaced console.log
        // Import the data directly with debug logging
        const result = formStore.importFormData(jsonData, true);
        logService.debug('Import result:', result, 'Current form state:', {
          patientData: formStore.patientData,
          selectedTests: formStore.selectedTests,
          phenotypeDataObj: formStore.phenotypeDataObj
        }); // Replaced console.log
        
        // Force a UI update cycle by triggering a sync
        formStore.syncLegacyPatientData();
        formStore.syncUnifiedPatientData();
        
        uiStore.showSnackbar("Data imported successfully!");
        return true;
      } else {
        logService.error('Invalid data format:', jsonData); // Replaced console.error
        uiStore.showSnackbar("Invalid data format. The JSON does not contain valid RequiForm data.");
        return false;
      }
    } catch (error) {
      // If JSON parsing fails, try to process it as formatted text
      logService.debug('Not valid JSON, trying formatted text processing:', error.message); // Replaced console.log
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
