/**
 * @fileoverview UI store for managing UI-related state using Pinia.
 * 
 * This store centralizes all UI-related state, such as theme preferences,
 * snackbar notifications, and dialog visibility states.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * UI store for application-wide UI state management
 */
export const useUiStore = defineStore('ui', () => {
  // Theme state
  const isDark = ref(false);
  
  // Snackbar state
  const snackbar = ref(false);
  const snackbarMessage = ref('');
  
  // Dialog visibility states
  const encryptionDialog = ref(false);
  const decryptionDialog = ref(false);
  const showFAQModal = ref(false);
  const resetConfirmationDialog = ref(false);
  const saveDataDialog = ref(false);
  const loadDataDialog = ref(false);
  const pasteDataDialog = ref(false);
  const showDisclaimerModal = ref(false);
  
  // Error states
  const decryptionError = ref('');
  const loadDataError = ref('');
  
  // Pending encrypted data for decryption
  const pendingEncryptedValue = ref('');
  
  /**
   * Toggles the light/dark theme
   */
  function toggleTheme() {
    isDark.value = !isDark.value;
  }
  
  /**
   * Shows a snackbar notification with the given message
   * @param {string} message - Message to display in the snackbar
   */
  function showSnackbar(message) {
    snackbarMessage.value = message;
    snackbar.value = true;
  }
  
  /**
   * Opens the encryption dialog
   */
  function openEncryptionDialog() {
    encryptionDialog.value = true;
  }
  
  /**
   * Closes the encryption dialog
   */
  function closeEncryptionDialog() {
    encryptionDialog.value = false;
  }
  
  /**
   * Opens the decryption dialog with the given encrypted value
   * @param {string} encryptedValue - The encrypted data to decrypt
   */
  function openDecryptionDialog(encryptedValue = '') {
    pendingEncryptedValue.value = encryptedValue;
    decryptionError.value = '';
    decryptionDialog.value = true;
  }
  
  /**
   * Cancels the decryption operation and closes the dialog
   */
  function cancelDecryption() {
    decryptionDialog.value = false;
    decryptionError.value = '';
    pendingEncryptedValue.value = '';
  }
  
  /**
   * Sets the decryption error message
   * @param {string} error - Error message to display
   */
  function setDecryptionError(error) {
    decryptionError.value = error;
  }
  
  /**
   * Opens or closes the FAQ modal
   * @param {boolean} value - Whether to open (true) or close (false) the modal
   */
  function toggleFAQModal(value = true) {
    showFAQModal.value = value;
  }
  
  /**
   * Opens the reset confirmation dialog
   */
  function openResetConfirmationDialog() {
    resetConfirmationDialog.value = true;
  }
  
  /**
   * Closes the reset confirmation dialog
   */
  function closeResetConfirmationDialog() {
    resetConfirmationDialog.value = false;
  }
  
  /**
   * Opens the save data dialog
   */
  function openSaveDataDialog() {
    saveDataDialog.value = true;
  }
  
  /**
   * Closes the save data dialog
   */
  function closeSaveDataDialog() {
    saveDataDialog.value = false;
  }
  
  /**
   * Opens the load data dialog
   */
  function openLoadDataDialog() {
    loadDataError.value = '';
    loadDataDialog.value = true;
  }
  
  /**
   * Closes the load data dialog
   */
  function closeLoadDataDialog() {
    loadDataDialog.value = false;
    loadDataError.value = '';
  }
  
  /**
   * Sets the load data error message
   * @param {string} error - Error message to display
   */
  function setLoadDataError(error) {
    loadDataError.value = error;
  }
  
  /**
   * Opens the paste data dialog
   */
  function openPasteDataDialog() {
    pasteDataDialog.value = true;
  }
  
  /**
   * Closes the paste data dialog
   */
  function closePasteDataDialog() {
    pasteDataDialog.value = false;
  }
  
  /**
   * Opens the disclaimer modal
   */
  function openDisclaimerModal() {
    showDisclaimerModal.value = true;
  }
  
  /**
   * Closes the disclaimer modal
   */
  function closeDisclaimerModal() {
    showDisclaimerModal.value = false;
  }
  
  return {
    // State
    isDark,
    snackbar,
    snackbarMessage,
    encryptionDialog,
    decryptionDialog,
    showFAQModal,
    resetConfirmationDialog,
    saveDataDialog,
    loadDataDialog,
    pasteDataDialog,
    showDisclaimerModal,
    decryptionError,
    loadDataError,
    pendingEncryptedValue,
    
    // Actions
    toggleTheme,
    showSnackbar,
    openEncryptionDialog,
    closeEncryptionDialog,
    openDecryptionDialog,
    cancelDecryption,
    setDecryptionError,
    toggleFAQModal,
    openResetConfirmationDialog,
    closeResetConfirmationDialog,
    openSaveDataDialog,
    closeSaveDataDialog,
    openLoadDataDialog,
    closeLoadDataDialog,
    setLoadDataError,
    openPasteDataDialog,
    closePasteDataDialog,
    openDisclaimerModal,
    closeDisclaimerModal,
  };
});
