/**
 * @fileoverview Composable for managing the application tour feature.
 * 
 * This composable encapsulates logic for initializing and starting 
 * the application tour using Shepherd.js.
 */

import { ref } from 'vue';
import { initializeTour, shouldShowTour } from '../services/tourService';

/**
 * Composable for app tour functionality
 * @returns {Object} Tour-related methods
 */
export function useAppTour() {
  // Reference to the tour instance
  const tourInstance = ref(null);
  
  /**
   * Initializes the tour
   */
  function initialize() {
    // Create tour instance
    tourInstance.value = initializeTour();
    
    // Auto-start tour if it should be shown
    if (shouldShowTour()) {
      startTour();
    }
  }
  
  /**
   * Starts the tour
   */
  function startTour() {
    if (tourInstance.value) {
      console.log("Starting application tour...");
      tourInstance.value.start();
    } else {
      console.error("Tour instance not available.");
    }
  }
  
  return {
    // State
    tourInstance,
    
    // Methods
    initialize,
    startTour,
  };
}
