/**
 * @fileoverview UI store for managing UI-related state using Pinia.
 * 
 * This store centralizes all UI-related state, such as theme preferences,
 * snackbar notifications, and dialog visibility states. It provides a unified
 * interface for controlling the application's user interface elements.
 * 
 * Key responsibilities:
 * - Managing theme preferences (light/dark mode)
 * - Controlling dialog and modal visibility
 * - Providing user feedback via snackbar notifications
 * - Handling UI error states
 * - Managing encryption/decryption dialogs
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Pinia store for application-wide UI state management.
 * Uses the Composition API to define state and methods for UI control.
 * This store ensures consistent UI behavior across all components by
 * centralizing UI state management.
 * 
 * @returns {Object} A store object containing UI state properties and methods
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
   * Toggles the application between light and dark theme.
   * This function inverts the current theme state, allowing users to
   * switch between light and dark UI modes with a single action.
   * 
   * @returns {void}
   */
  function toggleTheme() {
    isDark.value = !isDark.value;
  }
  
  /**
   * Shows a snackbar notification with the given message.
   * This function displays a temporary feedback message to the user
   * for actions like successful saves, errors, or important information.
   * 
   * @param {string} message - Message text to display in the snackbar
   * @returns {void}
   */
  function showSnackbar(message) {
    snackbarMessage.value = message;
    snackbar.value = true;
  }
  
  /**
   * Opens the encryption dialog.
   * This function makes the encryption dialog visible, allowing users
   * to encrypt their form data with a password for secure sharing.
   * 
   * @returns {void}
   */
  function openEncryptionDialog() {
    encryptionDialog.value = true;
  }
  
  /**
   * Closes the encryption dialog.
   * This function hides the encryption dialog, typically called
   * after encryption is complete or when the user cancels.
   * 
   * @returns {void}
   */
  function closeEncryptionDialog() {
    encryptionDialog.value = false;
  }
  
  /**
   * Opens the decryption dialog with the given encrypted value.
   * This function makes the decryption dialog visible and sets the
   * encrypted data to be decrypted, resetting any previous error state.
   * 
   * @param {string} [encryptedValue=''] - The encrypted data string to decrypt
   * @returns {void}
   */
  function openDecryptionDialog(encryptedValue = '') {
    pendingEncryptedValue.value = encryptedValue;
    decryptionError.value = '';
    decryptionDialog.value = true;
  }
  
  /**
   * Cancels the decryption operation and closes the dialog.
   * This function cleans up the decryption state, clearing error messages
   * and pending encrypted data before closing the dialog.
   * 
   * @returns {void}
   */
  function cancelDecryption() {
    decryptionDialog.value = false;
    decryptionError.value = '';
    pendingEncryptedValue.value = '';
  }
  
  /**
   * Sets the decryption error message.
   * This function updates the error message shown in the decryption dialog
   * when there's a problem with the decryption process.
   * 
   * @param {string} error - Error message text to display
   * @returns {void}
   */
  function setDecryptionError(error) {
    decryptionError.value = error;
  }
  
  /**
   * Opens or closes the FAQ modal.
   * This function controls the visibility of the FAQ dialog that shows
   * frequently asked questions and answers to help users.
   * 
   * @param {boolean} [value=true] - Whether to open (true) or close (false) the modal
   * @returns {void}
   */
  function toggleFAQModal(value = true) {
    showFAQModal.value = value;
  }
  
  /**
   * Opens the reset confirmation dialog.
   * This function displays a confirmation dialog before resetting form data,
   * preventing accidental data loss by requiring explicit confirmation.
   * 
   * @returns {void}
   */
  function openResetConfirmationDialog() {
    resetConfirmationDialog.value = true;
  }
  
  /**
   * Closes the reset confirmation dialog.
   * This function hides the reset confirmation dialog, typically when
   * the user cancels the reset operation or after completion.
   * 
   * @returns {void}
   */
  function closeResetConfirmationDialog() {
    resetConfirmationDialog.value = false;
  }
  
  /**
   * Opens the save data dialog.
   * This function displays the dialog that allows users to save their
   * form data to a file with a custom name.
   * 
   * @returns {void}
   */
  function openSaveDataDialog() {
    saveDataDialog.value = true;
  }
  
  /**
   * Closes the save data dialog.
   * This function hides the save data dialog, typically after a successful
   * save operation or when the user cancels.
   * 
   * @returns {void}
   */
  function closeSaveDataDialog() {
    saveDataDialog.value = false;
  }
  
  /**
   * Opens the load data dialog.
   * This function displays the dialog that allows users to load form data
   * from a previously saved file. It also resets any previous error state.
   * 
   * @returns {void}
   */
  function openLoadDataDialog() {
    loadDataError.value = '';
    loadDataDialog.value = true;
  }
  
  /**
   * Closes the load data dialog.
   * This function hides the load data dialog and clears any error messages,
   * typically called after successful data loading or when the user cancels.
   * 
   * @returns {void}
   */
  function closeLoadDataDialog() {
    loadDataDialog.value = false;
    loadDataError.value = '';
  }
  
  /**
   * Sets the load data error message.
   * This function updates the error message shown in the load data dialog
   * when there's a problem loading or parsing file data.
   * 
   * @param {string} error - Error message text to display
   * @returns {void}
   */
  function setLoadDataError(error) {
    loadDataError.value = error;
  }
  
  /**
   * Opens the paste data dialog.
   * This function displays the dialog that allows users to paste form data
   * directly from clipboard, supporting both JSON and formatted text.
   * 
   * @returns {void}
   */
  function openPasteDataDialog() {
    pasteDataDialog.value = true;
  }
  
  /**
   * Closes the paste data dialog.
   * This function hides the paste data dialog, typically after successful
   * data import or when the user cancels.
   * 
   * @returns {void}
   */
  function closePasteDataDialog() {
    pasteDataDialog.value = false;
  }
  
  /**
   * Opens the disclaimer modal.
   * This function displays the legal disclaimer dialog that contains
   * important information about the application's use and limitations.
   * 
   * @returns {void}
   */
  function openDisclaimerModal() {
    showDisclaimerModal.value = true;
  }
  
  /**
   * Closes the disclaimer modal.
   * This function hides the legal disclaimer dialog after the user
   * has acknowledged its contents.
   * 
   * @returns {void}
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
