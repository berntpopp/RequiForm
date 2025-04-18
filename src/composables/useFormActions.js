/**
 * @fileoverview Composable for handling general application actions.
 * 
 * This composable encapsulates logic for high-level application actions
 * such as resetting the form and managing theme. It provides a unified interface
 * for common application-wide actions that affect multiple components.
 * 
 * Key responsibilities:
 * - Managing the form reset workflow (confirmation and execution)
 * - Controlling the application theme
 * - Centralizing UI action handlers for consistency
 */

import { useUiStore } from '../stores/uiStore';
import { useI18n } from 'vue-i18n';
import { useFormStore } from '../stores/formStore';

/**
 * Vue composable that provides general application action handlers.
 * Uses the Pinia stores to perform these actions while maintaining
 * proper separation of concerns between UI and business logic.
 * 
 * @returns {Object} Object containing the following:
 *   @returns {Function} initiateReset - Function to start the form reset process
 *   @returns {Function} cancelReset - Function to cancel the reset operation
 *   @returns {Function} confirmReset - Function to confirm and execute the reset
 *   @returns {Function} toggleTheme - Function to toggle light/dark theme
 */
export function useFormActions() {
  // Get store instances
  const uiStore = useUiStore();
  const formStore = useFormStore();
  const { t } = useI18n();
  
  /**
   * Initiates the form reset process by showing the confirmation dialog.
   * This is the first step in the reset workflow, giving users a chance
   * to confirm or cancel the operation before data is actually cleared.
   * 
   * @returns {void}
   */
  function initiateReset() {
    uiStore.openResetConfirmationDialog();
  }
  
  /**
   * Cancels the form reset operation by closing the confirmation dialog.
   * This allows users to safely abort the reset process without losing any data.
   * 
   * @returns {void}
   */
  function cancelReset() {
    uiStore.closeResetConfirmationDialog();
  }
  
  /**
   * Confirms and performs the application form reset.
   * This function:
   * 1. Closes the confirmation dialog
   * 2. Triggers the form data reset in the form store
   * 3. Shows a success notification to confirm completion
   * 
   * After this action, all form fields will be returned to their default state.
   * 
   * @returns {void}
   */
  function confirmReset() {
    // Close the dialog
    uiStore.closeResetConfirmationDialog();
    
    // Reset the form data
    formStore.resetForm();
    
    // Show success notification
    uiStore.showSnackbar(t('app.toasts.formReset'));
  }
  
  /**
   * Toggles the application theme between light and dark mode.
   * This function uses the UI store to manage theme state and persistence.
   * The theme change is immediate and affects the entire application.
   * 
   * @returns {void}
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
