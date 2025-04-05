/**
 * @file urlUtils.js
 * @description Enhanced utility module for URL parameter handling, ensuring both query and hash parameters are properly handled.
 */

/**
 * Clears all URL parameters (both query and hash fragments) from the browser's address bar.
 * This function ensures complete removal of both types of parameters to enhance security.
 */
export function clearAllUrlParameters() {
  try {
    // Define the base URL (without any parameters)
    const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    
    // First approach: Use replaceState to set the URL to just the pathname
    window.history.replaceState(null, document.title, baseUrl);
    
    // Verify that both types of parameters are gone
    if (window.location.search || window.location.hash) {
      console.warn('First attempt to clear parameters failed, trying alternate method...');
      
      // Second approach: Try handling hash and search separately
      if (window.location.hash) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
      }
      
      if (window.location.search) {
        history.pushState("", document.title, window.location.pathname);
      }
      
      // Final verification - explicitly set to base URL
      window.history.replaceState(null, document.title, baseUrl);
    }
    
    console.log('URL parameters cleared successfully');
  } catch (error) {
    console.error('Error clearing URL parameters:', error);
    
    // Fallback method
    const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    if (window.location.href !== baseUrl) {
      window.location.href = baseUrl;
    }
  }
}
