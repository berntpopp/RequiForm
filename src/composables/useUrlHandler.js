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
import { parsePatientDataFromUrl, clearUrlParameters } from '../utils/urlUtils';
import { encryptData, decryptData } from '../utils/cryptoUtilsWebCrypto'; // Import new crypto functions
import { useUiStore } from '../stores/uiStore';
import { useFormStore } from '../stores/formStore';
import logService from '@/services/logService';
import { sanitizeParsedJson } from '../utils/jsonSanitizer'; // Import the sanitizer

// --- Configuration Constants ---
const MAX_URL_LENGTH = 20 * 1024; // 20 KB limit for the entire URL
const MAX_PARAM_LENGTH = 100 * 1024; // 100 KB limit for individual 'data' or decrypted 'encrypted' parameters
// -----------------------------

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
 *   @returns {Function} handlePasswordSubmit - Function to handle password submission for decryption
 */
export function useUrlHandler() {
  // Reference to the pending encrypted value from URL
  const pendingEncryptedValue = ref('');
  
  // Get stores
  const uiStore = useUiStore();
  const formStore = useFormStore();
  
  /**
   * Helper function to get a parameter from the hash fragment
   * 
   * @param {string} name - Name of the parameter to retrieve
   * @returns {string|null} The value of the parameter, or null if not found
   */
  function getParameterFromHash(name) {
    if (window.location.hash && window.location.hash.length > 1) {
      // Remove leading '#' and parse
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.has(name)) {
        // URLSearchParams automatically decodes, but our encrypted data might have chars
        // that need double encoding/decoding depending on how it was encoded.
        // Let's return the raw value from the hash first. Decoding happens later.
        // Need to reconstruct the raw value if URLSearchParams decoded it.
        const hash = window.location.hash.substring(1);
        const parts = hash.split('&');
        for (const part of parts) {
          const [key, value] = part.split('=');
          if (key === name) {
            // Return the raw, potentially encoded value
            return value;
          }
        }
        // Fallback if direct split fails but hashParams found it (less likely for our case)
        return hashParams.get(name);
      }
    }
    return null;
  }
  
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
   * @param {string} passwordParam - Optional password from URL parameter.
   * @returns {void}
   */
  async function initializeFromUrl() {
    // --- URL Length Check ---
    if (window.location.href.length > MAX_URL_LENGTH) {
      logService.warn(`[URL Handler] Incoming URL length (${window.location.href.length}) exceeds maximum allowed (${MAX_URL_LENGTH}). Aborting initialization.`);
      uiStore.showSnackbar('Error: URL is too long to process.', 'error');
      // Optionally clear parameters or navigate away
      // clearUrlParameters(); 
      return; // Stop processing
    }
    // ------------------------

    // Parse data from URL (Handles both query and hash)
    const dataParam = getParameterFromHash('data');
    const encryptedParam = getParameterFromHash('encrypted');

    if (dataParam) {
      // Parameter Length Check
      if (dataParam.length > MAX_PARAM_LENGTH) {
        logService.warn(`[URL Handler] Incoming 'data' parameter length (${dataParam.length}) exceeds maximum allowed (${MAX_PARAM_LENGTH}). Aborting processing.`);
        uiStore.showSnackbar('Error: Input data is too large.', 'error');
        clearUrlParameters(); // Clear potentially harmful param
        return; // Stop processing
      }
      logService.debug('Found "data" parameter in URL hash.');
      try {
        // Decode the parameter value (URLSearchParams/manual split might have partially decoded)
        // Use decodeURIComponent to handle potential double encoding
        const decodedDataParam = decodeURIComponent(dataParam);

        // --- Parameter Length Check ---
        if (decodedDataParam.length > MAX_PARAM_LENGTH) {
          logService.warn(`[URL Handler] Incoming 'data' parameter length (${decodedDataParam.length}) exceeds maximum allowed (${MAX_PARAM_LENGTH}). Aborting processing.`);
          uiStore.showSnackbar('Error: Input data is too large.', 'error');
          clearUrlParameters(); // Clear potentially harmful param
          return; // Stop processing
        }
        // ----------------------------

        // Parse the JSON data
        let parsedJsonData = JSON.parse(decodedDataParam);

        // --- Sanitize Parsed JSON ---
        parsedJsonData = sanitizeParsedJson(parsedJsonData);
        logService.debug('Sanitized JSON data from "data" parameter.');
        // ---------------------------

        // Import the sanitized data
        formStore.importFormData(parsedJsonData, true); // Pass true to indicate URL import

        // Clear URL parameters after successful import
        clearUrlParameters();
        uiStore.showSnackbar('Data loaded successfully from URL!');

      } catch (error) {
        logService.error('Error processing "data" parameter from URL:', error);
        uiStore.showSnackbar('Error loading data from URL. The data might be corrupted.', 'error');
        // Clear potentially corrupted params
        clearUrlParameters();
      }
    } else if (encryptedParam) {
      // Parameter Length Check (Encrypted Data)
      if (encryptedParam.length > MAX_PARAM_LENGTH) {
        logService.warn(`[URL Handler] Incoming 'encrypted' parameter length (${encryptedParam.length}) exceeds maximum allowed (${MAX_PARAM_LENGTH}). Aborting decryption.`);
        uiStore.showSnackbar("Error: Encrypted data is too large.", 'error');
        clearUrlParameters(); // Clear potentially harmful param
        return; // Stop processing before decryption
      }
      logService.debug('Found "encrypted" parameter in URL hash. Prompting for password.');
      // Store the raw encrypted value 
      const encryptedDataFromUrl = encryptedParam; 
      const passwordParam = getParameterFromHash('password');

      if (passwordParam) {
        logService.debug('Found password parameter. Attempting direct decryption.');
        // Immediately try decrypting if password is also provided
        await handlePasswordSubmit(passwordParam);
      } else {
        // Show password dialog if no password provided in URL
        logService.debug('Password not found in URL. Showing password dialog.');
        uiStore.openDecryptionDialog();
        pendingEncryptedValue.value = encryptedDataFromUrl;
      }

    } else {
      // Fallback for legacy query parameters (optional, based on parsePatientDataFromUrl's capability)
      const legacyData = parsePatientDataFromUrl(); // Ensure this doesn't re-parse hash
      if (Object.keys(legacyData).length > 0) {
        logService.debug('Found legacy query parameters. Importing...');
        // NOTE: Legacy data might also need sanitization if it involves JSON parsing internally
        // Assuming parsePatientDataFromUrl returns a safe structure or we trust its source.
        // If parsePatientDataFromUrl uses JSON.parse, sanitization should be added there.
        formStore.importFormData(legacyData, true);
        clearUrlParameters();
        uiStore.showSnackbar('Legacy data loaded successfully from URL!');
      } else {
        logService.debug('No relevant data parameters found in URL.');
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
      logService.debug('Creating URL with compact data format');
      
      // Stringify the data
      const jsonData = JSON.stringify(compactData);
      
      // Create the base URL (current location without parameters)
      const baseUrl = window.location.protocol + '//' + 
                      window.location.host + 
                      window.location.pathname;
      
      // Encode the data and add it to the hash
      const encodedData = encodeURIComponent(jsonData);
      const shareableUrl = `${baseUrl}#data=${encodedData}`;
      
      logService.debug(`Generated URL length: ${shareableUrl.length} characters`);
      
      // Check if the URL exceeds browser limits (typically ~2048 chars)
      if (shareableUrl.length > 2000) {
        logService.warn(`[URL Handler] Generated plain data URL length (${shareableUrl.length}) exceeds 2000 characters. This may cause issues in some browsers or tools.`);
        uiStore.showSnackbar('Warning: Generated URL is very long and might not work everywhere.', 'warning', { timeout: 7000 });
      }
      
      return shareableUrl;
    } catch (error) {
      logService.error('Error creating shareable URL:', error);
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
      logService.error('Error copying URL to clipboard:', error);
      uiStore.showSnackbar("Error copying URL to clipboard.");
      return false;
    }
  }
  
  /**
   * Creates an encrypted URL with the current application state using AES-GCM.
   * The result is a URL with the encrypted data in the hash fragment.
   * e.g., http://example.com/#encrypted={...encrypted data...}
   * 
   * @param {string} password - Password to use for encryption.
   * @returns {Promise<string|null>} A promise resolving to the complete URL with encrypted data, or null if encryption failed.
   */
  async function createEncryptedUrl(password) {
    try {
      // Get the current form data
      const fullData = formStore.exportFormData();
      
      // Compact the data if necessary, or decide which parts to include
      const compactData = {
          patientData: fullData.patientData,
          phenotypeData: fullData.phenotypeData,
          showPedigree: fullData.showPedigree,
      };
      const jsonData = JSON.stringify(compactData);
      logService.debug(`JSON data length before encryption: ${jsonData.length} characters`);
      
      // Encrypt the data
      const encryptedData = await encryptData(jsonData, password);
      
      // Create the base URL (current location without parameters)
      const baseUrl = window.location.protocol + '//' + 
                      window.location.host + 
                      window.location.pathname;
      
      // Add the encrypted data as a HASH parameter
      // No need to encodeURIComponent for hash fragment according to standards,
      // but Base64 might contain '+' which needs encoding. Let's keep encodeURIComponent.
      const url = `${baseUrl}#encrypted=${encodeURIComponent(encryptedData)}`;
      logService.debug(`Encrypted URL (hash) length: ${url.length} characters`);
      
      // Check if the generated URL exceeds a reasonable length
      if (url.length > 2000) {
        logService.warn(`[URL Handler] Generated encrypted URL length (${url.length}) exceeds 2000 characters. This may cause issues in some browsers or tools.`);
        uiStore.showSnackbar('Warning: Generated encrypted URL is very long and might not work everywhere.', 'warning', { timeout: 7000 });
      }
      
      return url;
    } catch (error) { // Catch errors from encryptData
      console.error('Error creating encrypted URL:', error);
      uiStore.showSnackbar('error', `Encryption failed: ${error.message || 'Unknown error'}`);
      // Re-throw a more generic error or specific known ones
      throw new Error('Failed to create encrypted URL.'); 
    }
  }
  
  /**
   * Prompts the user for a password and copies the resulting AES-GCM encrypted URL
   * to the clipboard.
   * 
   * @param {string} password - Password obtained from the user for encryption.
   * @returns {Promise<boolean>} A promise resolving to true if the URL was successfully generated and copied, false otherwise.
   */
  async function copyEncryptedUrl(password) {
    try {
      const url = await createEncryptedUrl(password);
      if (!url) return false;
      
      await navigator.clipboard.writeText(url);
      uiStore.showSnackbar("Encrypted URL copied to clipboard!");
      return true;
    } catch (error) {
      // Error is already logged and shown by createEncryptedUrl
      // uiStore.showSnackbar('error', `Failed to copy encrypted link: ${error.message}`);
      console.error('Failed to generate or copy encrypted link:', error);
      return false;
    }
  }
  
  /**
   * Decrypts data from an encrypted URL parameter using AES-GCM.
   * @param {string} encryptedPayload - The encrypted data string from the URL.
   * @param {string} password - The password for decryption.
   * @returns {Promise<object|null>} A promise resolving to the decrypted data object or null on failure.
   */
  async function decryptUrlData(encryptedPayload, password) {
    if (!encryptedPayload || !password) {
      console.warn('Decryption skipped: Missing encrypted data or password.');
      uiStore.setDecryptionError('Missing data or password.'); // Inform UI store
      return null;
    }
    uiStore.setDecryptionError(null); // Clear previous errors

    try {
      // Use the new AES-GCM decryption function
      const decryptedJsonString = await decryptData(encryptedPayload, password);
      
      // Sanitize before parsing JSON to prevent prototype pollution
      const parsedData = JSON.parse(decryptedJsonString);
      // IMPORTANT: Sanitize the parsed object
      sanitizeParsedJson(parsedData);

      // Basic validation of the decrypted structure (optional but recommended)
      if (typeof parsedData !== 'object' || parsedData === null || !parsedData.patientData || !parsedData.phenotypeData) {
          throw new Error('Decrypted data has an invalid structure.');
      }
      
      console.log('Decryption successful.');
      return parsedData;

    } catch (error) {
      console.error('Decryption failed:', error);
      // Set specific error message in UI store for feedback
      uiStore.setDecryptionError(error.message || 'Decryption failed. Check password or link.');
      return null; // Indicate failure
    }
  }

  /**
   * Handles the submission of the password from the dialog or URL.
   * It attempts to decrypt the pending encrypted data using the provided password
   * and imports the data if successful.
   * @param {string} password - The submitted password.
   * @returns {Promise<void>} A promise that resolves when the handling is complete.
   */
  const handlePasswordSubmit = async (password) => {
    // Check if there's pending encrypted data AND a password
    if (pendingEncryptedValue.value && password) {
      logService.debug('Password submitted. Attempting decryption.');
      
      // Pass both the pending encrypted data and the password
      // Capture the actual data object returned by decryptUrlData
      const decryptedData = await decryptUrlData(pendingEncryptedValue.value, password);

      if (decryptedData) { // Check if decryption returned data (not null)
        logService.debug('Decryption successful, importing data.');
        // ---> CORRECTLY IMPORT THE DATA <--- 
        formStore.importFormData(decryptedData, true); // Pass true for URL import
        
        // ---> CLEAR STATE/URL AFTER SUCCESS <--- 
        pendingEncryptedValue.value = null; // Clear pending data *after* successful import
        clearUrlParameters(); // Clear URL params after successful load
        
        uiStore.cancelDecryption(); // Close dialog and clear error state
        uiStore.showSnackbar("Data decrypted and loaded successfully!"); 
      } else {
        // Decryption failed (decryptUrlData returned null and set error in uiStore)
        logService.warn('Decryption attempt failed with submitted password.');
        // The error message should already be set in uiStore by decryptUrlData
        // Do not clear pendingEncryptedValue here, user might retry password
      }
    } else {
       // This log message indicates a problem - e.g. handler called twice?
       // Check UI component logic if this repeats unexpectedly.
      logService.warn('Password submission handler called without pending encrypted data or password.');
    }
  };

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
    handlePasswordSubmit,
  };
}
