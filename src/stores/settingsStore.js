/**
 * @fileoverview Settings store for managing persistent user settings using Pinia.
 * 
 * This store centralizes settings-related state, such as disclaimer acknowledgment
 * and persistence logic using localStorage. It provides a unified interface for
 * accessing and modifying user preferences that persist across sessions.
 * 
 * Key responsibilities:
 * - Managing disclaimer acknowledgment state
 * - Persisting user preferences in localStorage
 * - Providing utilities for date formatting
 * - Enabling reset of user preferences
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Pinia store for managing user preferences and settings.
 * Uses the Composition API to define state and methods for settings management.
 * This store ensures consistent handling of user preferences by centralizing
 * all settings-related logic and persistence.
 * 
 * @returns {Object} A store object containing settings state properties and methods
 */
export const useSettingsStore = defineStore('settings', () => {
  // Disclaimer acknowledgment state
  const disclaimerAcknowledged = ref(localStorage.getItem('disclaimerAcknowledged') === 'true');
  const acknowledgmentTime = ref(localStorage.getItem('acknowledgmentTime') || '');
  
  /**
   * Gets the current ISO date string (YYYY-MM-DD).
   * This utility function formats the current date in a standardized format
   * suitable for storage and comparison of date values.
   * 
   * @returns {string} ISO date string in YYYY-MM-DD format
   */
  function getCurrentIsoDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  
  /**
   * Acknowledges the disclaimer and stores the acknowledgment in localStorage.
   * This function updates both the reactive state and the persistent storage
   * to record that the user has acknowledged the legal disclaimer, along with
   * the timestamp of acknowledgment.
   * 
   * @returns {void}
   */
  function acknowledgeDisclaimer() {
    const currentDate = getCurrentIsoDate();
    
    disclaimerAcknowledged.value = true;
    acknowledgmentTime.value = currentDate;
    
    // Persist to localStorage
    localStorage.setItem('disclaimerAcknowledged', 'true');
    localStorage.setItem('acknowledgmentTime', currentDate);
  }
  
  /**
   * Resets the disclaimer acknowledgment state.
   * This function clears both the reactive state and the persistent storage
   * related to the disclaimer acknowledgment, requiring the user to acknowledge
   * the disclaimer again on next visit.
   * 
   * @returns {void}
   */
  function resetDisclaimerAcknowledgment() {
    disclaimerAcknowledged.value = false;
    acknowledgmentTime.value = '';
    
    // Remove from localStorage
    localStorage.removeItem('disclaimerAcknowledged');
    localStorage.removeItem('acknowledgmentTime');
  }
  
  return {
    // State
    disclaimerAcknowledged,
    acknowledgmentTime,
    
    // Actions
    acknowledgeDisclaimer,
    resetDisclaimerAcknowledgment
  };
});
