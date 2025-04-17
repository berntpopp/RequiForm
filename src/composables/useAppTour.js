/**
 * @fileoverview Composable for managing the application tour feature.
 * 
 * This composable encapsulates logic for initializing and starting 
 * the application tour using Shepherd.js. It provides an interface for
 * managing the tour functionality throughout the application.
 * 
 * Key responsibilities:
 * - Initializing the tour instance
 * - Auto-starting the tour for new users
 * - Providing methods to manually start the tour
 * - Managing the tour instance lifecycle
 */

import { ref } from 'vue';
import { initializeTour, shouldShowTour } from '../services/tourService';
import logService from '@/services/logService';

/**
 * Vue composable that provides application tour functionality.
 * Uses Vue's Composition API to manage the tour state and operations.
 * The tour helps users navigate and understand the application features.
 * 
 * @returns {Object} Object containing the following:
 *   @returns {Ref<Object>} tourInstance - Reference to the Shepherd.js tour instance
 *   @returns {Function} initialize - Function to initialize the tour
 *   @returns {Function} startTour - Function to manually start the tour
 */
export function useAppTour() {
  // Reference to the tour instance
  const tourInstance = ref(null);
  
  /**
   * Initializes the application tour.
   * This function:
   * 1. Creates a new tour instance using the tour service
   * 2. Checks if the tour should be automatically shown to the user
   * 3. Auto-starts the tour for first-time users based on settings
   * 
   * The tour is only initialized once per application session.
   * 
   * @returns {void}
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
   * Manually starts the application tour.
   * This function can be called from UI components (like a help button)
   * to start the tour at any time during the application session.
   * 
   * If the tour instance is not available, an error will be logged.
   * 
   * @returns {void}
   */
  function startTour() {
    if (tourInstance.value) {
      logService.info("Starting application tour...");
      tourInstance.value.start();
    } else {
      logService.error("App Tour: Could not start, tour instance not available.");
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
