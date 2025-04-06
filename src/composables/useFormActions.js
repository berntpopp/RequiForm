/**
 * @fileoverview Composable for handling general application actions.
 * 
 * This composable encapsulates logic for high-level application actions
 * such as resetting the form and managing theme.
 */

import { useUiStore } from '../stores/uiStore';
import { useFormStore } from '../stores/formStore';

/**
 * Composable for general application actions
 * @returns {Object} Application action methods
 */
export function useFormActions() {
  // Get stores
  const uiStore = useUiStore();
  const formStore = useFormStore();
  
  /**
   * Shows the reset confirmation dialog
   */
  function initiateReset() {
    uiStore.openResetConfirmationDialog();
  }
  
  /**
   * Cancels the reset operation
   */
  function cancelReset() {
    uiStore.closeResetConfirmationDialog();
  }
  
  /**
   * Confirms and performs the application reset
   */
  function confirmReset() {
    // Close the dialog
    uiStore.closeResetConfirmationDialog();
    
    // Reset the form data
    formStore.resetForm();
    
    // Show success notification
    uiStore.showSnackbar("Form has been reset!");
  }
  
  /**
   * Toggles the application theme between light and dark mode
   */
  function toggleTheme() {
    uiStore.toggleTheme();
  }
  
  return {
    // Methods
    initiateReset,
    cancelReset,
    confirmReset,
    toggleTheme,
  };
}
