/**
 * @fileoverview Composable for managing FAQ functionality.
 * 
 * This composable encapsulates logic for managing the FAQ modal
 * and provides access to FAQ content. It serves as a central interface
 * for all FAQ-related operations throughout the application.
 * 
 * Key responsibilities:
 * - Providing access to the FAQ content items
 * - Managing the FAQ modal visibility
 * - Centralizing FAQ-related UI interactions
 */

// No longer using computed
import { useFaqService } from '../services/faqService';
import { useUiStore } from '../stores/uiStore';

/**
 * Vue composable that provides FAQ functionality for the application.
 * This composable uses the UI store for modal management and imports
 * FAQ content from a centralized data file.
 * 
 * @returns {Object} Object containing the following:
 *   @returns {Array<Object>} faqItems - Array of FAQ content items
 *   @returns {Function} openFaq - Function to open the FAQ modal
 *   @returns {Function} closeFaq - Function to close the FAQ modal
 */
export function useFaq() {
  // Get UI store for dialog management
  const uiStore = useUiStore();
  
  /**
   * FAQ content items from the centralized content file.
   * Note: We use a regular reference to the array instead of a computed property
   * to avoid Vue warning about passing a computed ref to a component expecting an array.
   * 
   * Each FAQ item contains:
   * - id: Unique identifier for the FAQ item
   * - question: The question text
   * - answer: The answer text, which may include HTML formatting
   * - category: Optional category for grouping related FAQs
   */
  // Get the reactive, localized FAQ items from the service composable
  const { localizedFaqContent } = useFaqService();
  
  /**
   * Opens the FAQ modal dialog.
   * This function uses the UI store to set the FAQ modal visibility state to true,
   * making the FAQ dialog visible to the user.
   * 
   * @returns {void}
   */
  function openFaq() {
    uiStore.toggleFAQModal(true);
  }
  
  /**
   * Closes the FAQ modal dialog.
   * This function uses the UI store to set the FAQ modal visibility state to false,
   * hiding the FAQ dialog from the user.
   * 
   * @returns {void}
   */
  function closeFaq() {
    uiStore.toggleFAQModal(false);
  }
  
  return {
    // Data
    faqItems: localizedFaqContent,
    
    // Methods
    openFaq,
    closeFaq,
  };
}
