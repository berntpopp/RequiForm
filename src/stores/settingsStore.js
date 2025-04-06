/**
 * @fileoverview Settings store for managing persistent user settings using Pinia.
 * 
 * This store centralizes settings-related state, such as disclaimer acknowledgment
 * and persistence logic using localStorage.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Settings store for managing user preferences and settings
 */
export const useSettingsStore = defineStore('settings', () => {
  // Disclaimer acknowledgment state
  const disclaimerAcknowledged = ref(localStorage.getItem('disclaimerAcknowledged') === 'true');
  const acknowledgmentTime = ref(localStorage.getItem('acknowledgmentTime') || '');
  
  /**
   * Gets the current ISO date string (YYYY-MM-DD)
   * @returns {string} ISO date string
   */
  function getCurrentIsoDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  
  /**
   * Acknowledges the disclaimer and stores the acknowledgment in localStorage
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
   * Resets the disclaimer acknowledgment state
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
