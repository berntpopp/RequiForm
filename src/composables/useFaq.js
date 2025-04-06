/**
 * @fileoverview Composable for managing FAQ functionality.
 * 
 * This composable encapsulates logic for managing the FAQ modal
 * and provides access to FAQ content.
 */

// No longer using computed
import { faqContent } from '../data/faqContent';
import { useUiStore } from '../stores/uiStore';

/**
 * Composable for FAQ functionality
 * @returns {Object} FAQ-related methods and data
 */
export function useFaq() {
  // Get UI store for dialog management
  const uiStore = useUiStore();
  
  /**
   * FAQ content items
   * Note: We use a regular reference to the array instead of a computed property
   * to avoid Vue warning about passing a computed ref to a component expecting an array
   */
  const faqItems = faqContent;
  
  /**
   * Opens the FAQ modal
   */
  function openFaq() {
    uiStore.toggleFAQModal(true);
  }
  
  /**
   * Closes the FAQ modal
   */
  function closeFaq() {
    uiStore.toggleFAQModal(false);
  }
  
  return {
    // Data
    faqItems,
    
    // Methods
    openFaq,
    closeFaq,
  };
}
