/**
 * @fileoverview Composable for handling URL-related operations.
 * 
 * This composable encapsulates URL handling logic, including parsing URL parameters,
 * generating shareable URLs, and handling encrypted data from URLs.
 */

import { ref } from 'vue';
import { parsePatientDataFromUrl, clearUrlParameters, getUrlParameter } from '../utils/urlUtils';
import { encryptData, decryptData } from '../utils/cryptoUtils';
import { useUiStore } from '../stores/uiStore';
import { useFormStore } from '../stores/formStore';

/**
 * Composable for URL handling functionality
 * @returns {Object} URL handling methods
 */
export function useUrlHandler() {
  // Reference to the pending encrypted value from URL
  const pendingEncryptedValue = ref('');
  
  // Get stores
  const uiStore = useUiStore();
  const formStore = useFormStore();
  
  /**
   * Initializes the application state from URL parameters if present
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
        (parsedData.phenotypeData && parsedData.phenotypeData.length > 0);
      
      if (hasPatientData) {
        console.log('Initializing from URL data');
        // Initialize with overwrite=true to ensure a clean state
        formStore.importFormData({
          patientData: parsedData,
        }, true);
        
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
   * Creates a shareable URL with patient data encoded in the URL hash
   * @returns {string} The shareable URL
   */
  function createShareableUrl() {
    try {
      // Get the current form data
      const exportData = formStore.exportFormData();
      
      // Stringify the data
      const jsonData = JSON.stringify(exportData);
      
      // Create the base URL (current location without parameters)
      const baseUrl = window.location.protocol + '//' + 
                      window.location.host + 
                      window.location.pathname;
      
      // Encode the data and add it to the hash
      const encodedData = encodeURIComponent(jsonData);
      const shareableUrl = `${baseUrl}#data=${encodedData}`;
      
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
   * Copies the shareable URL to the clipboard
   * @returns {Promise<boolean>} Success status
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
   * Creates an encrypted URL using the provided password
   * @param {string} password - Password for encryption
   * @returns {string|null} The encrypted URL or null if encryption failed
   */
  function createEncryptedUrl(password) {
    try {
      // Get the current form data
      const exportData = formStore.exportFormData();
      
      // Stringify the data
      const jsonData = JSON.stringify(exportData);
      
      // Encrypt the data
      const encryptedData = encryptData(jsonData, password);
      
      // Create the base URL (current location without parameters)
      const baseUrl = window.location.protocol + '//' + 
                      window.location.host + 
                      window.location.pathname;
      
      // Add the encrypted data as a query parameter
      return `${baseUrl}?encrypted=${encodeURIComponent(encryptedData)}`;
    } catch (error) {
      console.error('Error creating encrypted URL:', error);
      uiStore.showSnackbar("Error creating encrypted URL.");
      return null;
    }
  }
  
  /**
   * Copies the encrypted URL to the clipboard
   * @param {string} password - Password for encryption
   * @returns {Promise<boolean>} Success status
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
   * Decrypts data from the URL using the provided password
   * @param {string} password - Password for decryption
   * @returns {boolean} Success status
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
