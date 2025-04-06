/**
 * @fileoverview Composable for handling URL-related operations.
 * 
 * This composable encapsulates URL handling logic, including parsing URL parameters,
 * generating shareable URLs, and handling encrypted data from URLs. It provides a unified
 * interface for all URL-related functionality throughout the application.
 * 
 * Key responsibilities:
 * - Initializing application state from URL parameters
 * - Creating shareable URLs with patient data
 * - Encrypting and decrypting data in URLs
 * - Copying URLs to clipboard
 * - Processing and cleaning data for URL inclusion
 */

import { ref } from 'vue';
import { parsePatientDataFromUrl, clearUrlParameters, getUrlParameter } from '../utils/urlUtils';
import { encryptData, decryptData } from '../utils/cryptoUtils';
import { useUiStore } from '../stores/uiStore';
import { useFormStore } from '../stores/formStore';

/**
 * Vue composable that provides URL handling functionality for the application.
 * Uses Vue's Composition API to manage URL-related state and operations.
 * 
 * @returns {Object} Object containing the following:
 *   @returns {Ref<string>} pendingEncryptedValue - Reference to encrypted data pending decryption
 *   @returns {Function} initializeFromUrl - Function to initialize app state from URL parameters
 *   @returns {Function} createShareableUrl - Function to generate a shareable URL with patient data
 *   @returns {Function} copyShareableUrl - Function to copy the shareable URL to clipboard
 *   @returns {Function} createEncryptedUrl - Function to create an encrypted URL
 *   @returns {Function} copyEncryptedUrl - Function to copy the encrypted URL to clipboard
 *   @returns {Function} decryptUrlData - Function to decrypt data from URL parameters
 */
export function useUrlHandler() {
  // Reference to the pending encrypted value from URL
  const pendingEncryptedValue = ref('');
  
  // Get stores
  const uiStore = useUiStore();
  const formStore = useFormStore();
  
  /**
   * Initializes the application state from URL parameters if present.
   * This function parses URL parameters (both query and hash) and populates 
   * the application state with any valid patient data found.
   * 
   * The function handles multiple data formats:
   * - Nested patientData structure from full form exports
   * - Legacy flat structure from older URLs
   * - Special case handling for specific panels like nephrology
   * 
   * @returns {void}
   */
  function initializeFromUrl() {
    // Parse data from URL
    const parsedData = parsePatientDataFromUrl();
    console.log('Parsed data from URL:', parsedData);
    
    if (Object.keys(parsedData).length > 0) {
      // Check if we have actual patient data vs empty structure
      const hasPatientData = 
        (parsedData.personalInfo && Object.values(parsedData.personalInfo).some(val => val)) ||
        (parsedData.selectedPanels && parsedData.selectedPanels.length > 0) ||
        (parsedData.phenotypeData && parsedData.phenotypeData.length > 0) ||
        (parsedData.patientData && parsedData.patientData.personalInfo && 
          Object.values(parsedData.patientData.personalInfo).some(val => val)) ||
        parsedData.category;  // Check for category field
      
      if (hasPatientData) {
        console.log('Initializing from URL data');
        
        // Handle the new data format where all data is inside a nested 'patientData' property
        // This comes from the hash format with the full form export
        if (parsedData.patientData) {
          console.log('Found nested data structure, importing from patientData');
          
          // Check for a category in multiple possible locations
          let categoryValue = parsedData.category || '';
          
          // Look in nested personalInfo for category (legacy format inside nested structure)
          if (!categoryValue && parsedData.patientData.personalInfo && parsedData.patientData.personalInfo.category) {
            categoryValue = parsedData.patientData.personalInfo.category;
            console.log('Found category in nested personalInfo:', categoryValue);
          }
          
          // Look for a direct category field in nested patientData
          if (!categoryValue && parsedData.patientData.category) {
            categoryValue = parsedData.patientData.category;
            console.log('Found category in nested patientData:', categoryValue);
          }
          
          // If the URL contained the 'nephrology' panel, set the category to nephrology
          // This is a domain-specific fix for the main use case
          if (!categoryValue && 
              parsedData.selectedTests && 
              parsedData.selectedTests.includes('nephronophthise')) {
            categoryValue = 'nephrology';
            console.log('Setting category based on selected test (nephronophthise):', categoryValue);
          }
          
          // Propagate the found category to all locations for maximum compatibility
          if (categoryValue) {
            console.log('Propagating category to all data locations:', categoryValue);
            parsedData.category = categoryValue;
            
            // Ensure it's in the nested patientData too
            if (!parsedData.patientData.category) {
              parsedData.patientData.category = categoryValue;
            }
            
            // Also ensure it's in the nested personalInfo for full compatibility
            if (!parsedData.patientData.personalInfo) {
              parsedData.patientData.personalInfo = {};
            }
            parsedData.patientData.personalInfo.category = categoryValue;
          }
          
          formStore.importFormData(parsedData, true);
        } else {
          // This is the legacy format where patient data is at the root
          console.log('Found legacy data structure, importing directly');
          formStore.importFormData({
            patientData: parsedData,
          }, true);
        }
        
        // Clean up URL parameters
        clearUrlParameters();
        
        // Notify the user
        uiStore.showSnackbar("Data loaded from URL successfully!");
      }
    } else {
      // Check for encrypted data
      const encryptedValue = getUrlParameter('encrypted');
      if (encryptedValue) {
        pendingEncryptedValue.value = encryptedValue;
        uiStore.openDecryptionDialog(encryptedValue);
      }
    }
  }
  
  /**
   * Creates a shareable URL with patient data encoded in the URL hash.
   * The function exports the current form data, removes empty values for compactness,
   * and encodes the data as a JSON string in the URL hash fragment.
   * 
   * The URL format uses a single 'data' parameter in the hash to contain all patient data:
   * http://example.com/#data={...encoded JSON data...}
   * 
   * @returns {string} The complete URL with patient data in the hash fragment
   */
  function createShareableUrl() {
    try {
      // Get the current form data
      const fullData = formStore.exportFormData();
      
      // Create a compact version by removing empty fields
      const compactData = removeEmptyValues(fullData);
      console.log('Creating URL with compact data format');
      
      // Stringify the data
      const jsonData = JSON.stringify(compactData);
      
      // Create the base URL (current location without parameters)
      const baseUrl = window.location.protocol + '//' + 
                      window.location.host + 
                      window.location.pathname;
      
      // Encode the data and add it to the hash
      const encodedData = encodeURIComponent(jsonData);
      const shareableUrl = `${baseUrl}#data=${encodedData}`;
      
      console.log(`Generated URL length: ${shareableUrl.length} characters`);
      
      // Check if the URL exceeds browser limits (typically ~2048 chars)
      if (shareableUrl.length > 2000) {
        uiStore.showSnackbar("Warning: URL is very long and may not work in all browsers.");
      }
      
      return shareableUrl;
    } catch (error) {
      console.error('Error creating shareable URL:', error);
      uiStore.showSnackbar("Error creating shareable URL.");
      return window.location.href;
    }
  }
  
  /**
   * Removes empty values from an object to create more compact URLs.
   * This recursive function processes objects and arrays, removing:
   * - Empty strings
   * - Empty arrays
   * - Empty objects
   * - null values
   * - undefined values
   * 
   * For arrays, it preserves the array structure while removing empty elements.
   * For objects, it removes properties with empty values entirely.
   * 
   * @param {Object|Array} obj - The object or array to process
   * @returns {Object|Array} A new object or array with empty values removed
   */
  function removeEmptyValues(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      // Filter out empty objects and recursively process non-empty items
      return obj
        .filter(item => {
          if (typeof item !== 'object') return true;
          const processed = removeEmptyValues(item);
          return Object.keys(processed).length > 0;
        })
        .map(item => removeEmptyValues(item));
    }
    
    // Handle objects
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // For primitive values
      if (value === null || value === undefined) continue;
      if (value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      
      // Handle nested objects
      if (typeof value === 'object') {
        const processed = removeEmptyValues(value);
        if (Object.keys(processed).length > 0) {
          result[key] = processed;
        }
      } else {
        // Include non-empty primitive values
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Copies the shareable URL to the clipboard.
   * Generates a shareable URL using createShareableUrl() and copies it to the
   * system clipboard using the Clipboard API. Shows feedback via a snackbar.
   * 
   * @returns {Promise<boolean>} Promise resolving to true if copy was successful, false otherwise
   * @throws {Error} May throw if clipboard operations are not supported or fail
   */
  async function copyShareableUrl() {
    try {
      const url = createShareableUrl();
      await navigator.clipboard.writeText(url);
      uiStore.showSnackbar("URL copied to clipboard!");
      return true;
    } catch (error) {
      console.error('Error copying URL to clipboard:', error);
      uiStore.showSnackbar("Error copying URL to clipboard.");
      return false;
    }
  }
  
  /**
   * Creates an encrypted URL using the provided password.
   * This function:
   * 1. Exports the current form data
   * 2. Compacts it by removing empty values
   * 3. Encrypts the data using the provided password
   * 4. Creates a URL with the encrypted data as a query parameter
   * 
   * The resulting URL format is: 
   * http://example.com/?encrypted={...encrypted data...}
   * 
   * @param {string} password - Password to use for encryption
   * @returns {string|null} The complete URL with encrypted data, or null if encryption failed
   */
  function createEncryptedUrl(password) {
    try {
      // Get the current form data
      const fullData = formStore.exportFormData();
      
      // Create a compact version by removing empty fields
      const compactData = removeEmptyValues(fullData);
      console.log('Creating encrypted URL with compact data format');
      
      // Stringify the data
      const jsonData = JSON.stringify(compactData);
      console.log(`JSON data length before encryption: ${jsonData.length} characters`);
      
      // Encrypt the data
      const encryptedData = encryptData(jsonData, password);
      
      // Create the base URL (current location without parameters)
      const baseUrl = window.location.protocol + '//' + 
                      window.location.host + 
                      window.location.pathname;
      
      // Add the encrypted data as a query parameter
      const url = `${baseUrl}?encrypted=${encodeURIComponent(encryptedData)}`;
      console.log(`Encrypted URL length: ${url.length} characters`);
      
      return url;
    } catch (error) {
      console.error('Error creating encrypted URL:', error);
      uiStore.showSnackbar("Error creating encrypted URL.");
      return null;
    }
  }
  
  /**
   * Copies the encrypted URL to the clipboard.
   * Generates an encrypted URL using createEncryptedUrl() and copies it to the
   * system clipboard. Shows user feedback via a snackbar notification.
   * 
   * @param {string} password - Password to use for encryption
   * @returns {Promise<boolean>} Promise resolving to true if copy was successful, false otherwise
   * @throws {Error} May throw if clipboard operations are not supported or fail
   */
  async function copyEncryptedUrl(password) {
    try {
      const url = createEncryptedUrl(password);
      if (!url) return false;
      
      await navigator.clipboard.writeText(url);
      uiStore.showSnackbar("Encrypted URL copied to clipboard!");
      return true;
    } catch (error) {
      console.error('Error copying encrypted URL to clipboard:', error);
      uiStore.showSnackbar("Error copying encrypted URL to clipboard.");
      return false;
    }
  }
  
  /**
   * Decrypts data from the URL using the provided password.
   * This function:
   * 1. Retrieves encrypted data from URL parameters
   * 2. Attempts to decrypt it using the provided password
   * 3. Parses the decrypted JSON data
   * 4. Imports the data into the application state
   * 5. Clears the URL parameters for security
   * 
   * If decryption fails, it sets an error message in the UI store.
   * 
   * @param {string} password - Password for decryption
   * @returns {boolean} True if decryption and data import were successful, false otherwise
   */
  function decryptUrlData(password) {
    try {
      if (!pendingEncryptedValue.value) {
        pendingEncryptedValue.value = getUrlParameter('encrypted');
        if (!pendingEncryptedValue.value) {
          uiStore.showSnackbar("No encrypted data found in URL.");
          return false;
        }
      }
      
      // Decrypt the data
      const decryptedJson = decryptData(pendingEncryptedValue.value, password);
      
      // Parse the JSON data
      const decryptedData = JSON.parse(decryptedJson);
      
      // Import the data
      formStore.importFormData(decryptedData, true);
      
      // Clear the URL parameters
      clearUrlParameters();
      
      // Reset the pending value
      pendingEncryptedValue.value = '';
      
      // Success!
      uiStore.showSnackbar("Data decrypted and loaded successfully!");
      return true;
    } catch (error) {
      console.error('Error decrypting data:', error);
      uiStore.setDecryptionError("Decryption failed. Please check your password and try again.");
      return false;
    }
  }
  
  return {
    // State
    pendingEncryptedValue,
    
    // Methods
    initializeFromUrl,
    createShareableUrl,
    copyShareableUrl,
    createEncryptedUrl,
    copyEncryptedUrl,
    decryptUrlData,
  };
}
