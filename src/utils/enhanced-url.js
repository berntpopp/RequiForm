/**
 * Enhanced URL utility functions for more robust URL parameter handling.
 * This module provides improved versions of URL parameter handling functions.
 */

/**
 * Clears URL parameters and hash from the browser's address bar.
 * Ensures both query parameters and hash fragments are removed.
 */
export function clearUrlParameters() {
  // Get the base URL without any parameters or hash
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  
  // Use history API to replace the current URL with the base URL
  // This explicitly removes both query parameters and hash fragments
  try {
    window.history.replaceState(null, document.title, baseUrl);
    console.log('URL parameters cleared successfully');
  } catch (error) {
    console.error('Error clearing URL parameters:', error);
    
    // Fallback method if replaceState fails
    if (window.location.href !== baseUrl) {
      window.location.href = baseUrl;
    }
  }
}
