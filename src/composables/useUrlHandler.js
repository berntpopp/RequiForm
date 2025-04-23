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
import { useI18n } from 'vue-i18n';
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
  // Get store and i18n instances
  const uiStore = useUiStore();
  const { t } = useI18n();
  const pendingEncryptedValue = ref('');
  
  // Get stores
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
   * - Legacy flat structure from older URLs (including direct hash parameters like #givenName=Jane)
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
    
    // Check if we have legacy hash parameters (like #givenName=Jane) - detect by looking for hash with parameters but no 'data' or 'encrypted' key
    const hasLegacyHashParams = window.location.hash && 
                                window.location.hash.length > 1 && 
                                !dataParam && 
                                !encryptedParam && 
                                window.location.hash.includes('=');

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

        // Clear URL parameters after successful import for privacy enhancement
        logService.debug('Cleaning URL after successful data load from hash.');
        clearUrlParameters();
        uiStore.showSnackbar('Data loaded successfully from URL!');

      } catch (error) {
        logService.error('Error processing "data" parameter from URL:', error);
        uiStore.showSnackbar('Error loading data from URL. The data might be corrupted.', 'error');
        // Clear potentially corrupted params for privacy and security
        logService.debug('Cleaning URL after failed data processing attempt.');
        clearUrlParameters();
      }
    } else if (encryptedParam) {
      // Parameter Length Check (Encrypted Data)
      if (encryptedParam.length > MAX_PARAM_LENGTH) {
        logService.warn(`[URL Handler] Incoming 'encrypted' parameter length (${encryptedParam.length}) exceeds maximum allowed (${MAX_PARAM_LENGTH}). Aborting decryption.`);
        uiStore.showSnackbar("Error: Encrypted data is too large.", 'error');
        logService.debug('Cleaning URL for excessive encrypted parameter size.');
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
      // Detect and handle legacy hash parameters first (like #givenName=Jane) 
      if (hasLegacyHashParams) {
        logService.debug('Found legacy hash parameters in URL format, processing...', window.location.hash);
      }
      
      // Fallback for legacy query parameters or legacy hash parameters
      const legacyData = parsePatientDataFromUrl(); // This handles both query params and hash params
      if (Object.keys(legacyData).length > 0) {
        logService.debug('Found legacy parameters. Importing...');
        // NOTE: Legacy data might also need sanitization if it involves JSON parsing internally
        // Assuming parsePatientDataFromUrl returns a safe structure or we trust its source.
        // If parsePatientDataFromUrl uses JSON.parse, sanitization should be added there.
        formStore.importFormData(legacyData, true);
        
        // Always clean the URL if we found and processed any parameters, especially hash parameters
        if (hasLegacyHashParams || window.location.search) {
          logService.debug('Cleaning URL after successful legacy data load.');
          clearUrlParameters(); // This removes the hash fragment
        }
        
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
      
      // Debug log to check if comments exist in the exported data
      logService.debug('Comments in exported data:', fullData.patientData?.personalInfo?.comments);
      
      // Check if comments field exceeds maximum length (50 chars) and truncate if necessary
      let commentsTruncated = false;
      const MAX_COMMENT_LENGTH = 50;
      let originalLength = 0; // Initialize this variable in the broader scope
      
      if (fullData.patientData?.personalInfo?.comments && 
          fullData.patientData.personalInfo.comments.length > MAX_COMMENT_LENGTH) {
        originalLength = fullData.patientData.personalInfo.comments.length;
        fullData.patientData.personalInfo.comments = 
          fullData.patientData.personalInfo.comments.substring(0, MAX_COMMENT_LENGTH) + '...';
        commentsTruncated = true;
        logService.debug(`Comments field truncated from ${originalLength} to ${MAX_COMMENT_LENGTH} characters for URL sharing`);
      }
      
      // Create a compact version by removing empty fields
      const compactData = removeEmptyValues(fullData);
      logService.debug('Creating URL with compact data format');
      
      // Debug log to check if comments exist after removing empty values
      const commentsAfterProcessing = compactData.patientData?.personalInfo?.comments;
      logService.debug('Comments after removeEmptyValues:', commentsAfterProcessing);
      logService.debug('Comments preservation status:', {
        originalExists: fullData.patientData?.personalInfo && Object.prototype.hasOwnProperty.call(fullData.patientData.personalInfo, 'comments'),
        originalValue: fullData.patientData?.personalInfo?.comments,
        afterProcessingExists: compactData.patientData?.personalInfo && Object.prototype.hasOwnProperty.call(compactData.patientData.personalInfo, 'comments'),
        afterProcessingValue: commentsAfterProcessing,
        isEmpty: commentsAfterProcessing === ''
      });
      
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
      
      // Show notification if comments were truncated
      if (commentsTruncated) {
        // Use a warning level snackbar with longer duration for better visibility
        uiStore.showSnackbar(
          `Comment text was shortened from ${originalLength} to ${MAX_COMMENT_LENGTH} characters for URL sharing.`, 
          'warning', 
          { timeout: 8000 }
        );
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
      // Special case: preserve comments field even when empty
      if (key === 'comments' && value === '') {
        result[key] = value;
        continue;
      }
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
      // When calling createShareableUrl, we need to capture if comments were truncated
      let commentsTruncated = false;
      let originalLength = 0;
      const MAX_COMMENT_LENGTH = 50;
      
      // Get the current form data to check comment length before calling createShareableUrl
      const fullData = formStore.exportFormData();
      if (fullData.patientData?.personalInfo?.comments && 
          fullData.patientData.personalInfo.comments.length > MAX_COMMENT_LENGTH) {
        commentsTruncated = true;
        originalLength = fullData.patientData.personalInfo.comments.length;
      }
      
      const url = createShareableUrl();
      await navigator.clipboard.writeText(url);
      
      // Include comment shortening information in the success message if needed
      if (commentsTruncated) {
        uiStore.showSnackbar(`${t('app.toasts.urlCopied')} Comment text was shortened from ${originalLength} to ${MAX_COMMENT_LENGTH} characters.`);
      } else {
        uiStore.showSnackbar(t('app.toasts.urlCopied'));
      }
      return true;
    } catch (error) {
      logService.error('Error copying URL to clipboard:', error);
      uiStore.showSnackbar(t('app.toasts.urlCopyError', 'Error copying URL to clipboard.'));
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
      
      // Check if comments field exceeds maximum length (50 chars) and truncate if necessary
      let commentsTruncated = false;
      const MAX_COMMENT_LENGTH = 50;
      let originalLength = 0; // Initialize this variable in the broader scope
      
      if (fullData.patientData?.personalInfo?.comments && 
          fullData.patientData.personalInfo.comments.length > MAX_COMMENT_LENGTH) {
        originalLength = fullData.patientData.personalInfo.comments.length;
        fullData.patientData.personalInfo.comments = 
          fullData.patientData.personalInfo.comments.substring(0, MAX_COMMENT_LENGTH) + '...';
        commentsTruncated = true;
        logService.debug(`Comments field truncated from ${originalLength} to ${MAX_COMMENT_LENGTH} characters for encrypted URL sharing`);
      }
      
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
      
      // Show notification if comments were truncated in the encrypted URL
      if (commentsTruncated) {
        // Use a warning level snackbar with longer duration for better visibility
        uiStore.showSnackbar(
          `Comment text was shortened from ${originalLength} to ${MAX_COMMENT_LENGTH} characters for encrypted URL sharing.`, 
          'warning', 
          { timeout: 8000 }
        );
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
      // Check if comments will be truncated before creating the URL
      let commentsTruncated = false;
      let originalLength = 0;
      const MAX_COMMENT_LENGTH = 50;
      
      // Get the current form data to check comment length
      const fullData = formStore.exportFormData();
      if (fullData.patientData?.personalInfo?.comments && 
          fullData.patientData.personalInfo.comments.length > MAX_COMMENT_LENGTH) {
        commentsTruncated = true;
        originalLength = fullData.patientData.personalInfo.comments.length;
      }
      
      const url = await createEncryptedUrl(password);
      if (!url) return false;
      
      await navigator.clipboard.writeText(url);
      
      // Include comment shortening information in the success message if needed
      if (commentsTruncated) {
        uiStore.showSnackbar(`${t('app.toasts.encryptedUrlCopied')} Comment text was shortened from ${originalLength} to ${MAX_COMMENT_LENGTH} characters.`);
      } else {
        uiStore.showSnackbar(t('app.toasts.encryptedUrlCopied'));
      }
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
        logService.debug('Cleaning URL after successful data decryption.');
        clearUrlParameters(); // Clear URL params after successful load
        
        uiStore.cancelDecryption(); // Close dialog and clear error state
        uiStore.showSnackbar("Data decrypted and loaded successfully!"); 
      } else {
        // Decryption failed (decryptUrlData returned null and set error in uiStore)
        logService.warn('Decryption attempt failed with submitted password.');
        // The error message should already be set in uiStore by decryptUrlData
        
        // Still clean the URL for privacy even when decryption fails
        logService.debug('Cleaning URL after failed decryption attempt for privacy.');
        clearUrlParameters();
        
        // Do not clear pendingEncryptedValue here, user might retry password in the dialog
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
