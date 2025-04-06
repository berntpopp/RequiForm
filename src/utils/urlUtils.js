/**
 * @file urlUtils.js
 * @description Enhanced utility module for URL parameter handling, ensuring both query and hash parameters are properly handled.
 */

/**
 * Parses patient data from URL parameters.
 * This function extracts data from both query parameters and hash fragments.
 * @returns {Object} Parsed patient data from the URL
 */
export function parsePatientDataFromUrl() {
  try {
    const params = {};
    let foundData = false;
    
    // First check query parameters
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams.entries()) {
      try {
        params[key] = JSON.parse(decodeURIComponent(value));
        foundData = true;
      } catch {
        params[key] = decodeURIComponent(value);
        foundData = true;
      }
    }
    
    // Then check hash parameters (format: #key1=value1&key2=value2...)
    if (window.location.hash && window.location.hash.length > 1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      for (const [key, value] of hashParams.entries()) {
        try {
          const parsedValue = JSON.parse(decodeURIComponent(value));
          // Handle the case where the entire patient data is in a single parameter
          if (key === 'data' && typeof parsedValue === 'object') {
            return parsedValue; // Return the structured data directly
          }
          params[key] = parsedValue;
          foundData = true;
        } catch {
          params[key] = decodeURIComponent(value);
          foundData = true;
        }
      }
    }
    
    // Special case: check if we have a complete patient data structure
    // For backward compatibility with older URL formats
    if (params.personalInfo || params.phenotypeData || params.selectedPanels) {
      return params;
    }
    
    // For legacy URL formats where data is flat
    if (foundData) {
      // Try to convert the flat structure to the new unified data model
      const structuredData = {
        personalInfo: {
          firstName: params.givenName || '',
          lastName: params.familyName || '',
          birthdate: params.birthdate || '',
          sex: params.sex || '',
          diagnosis: params.diagnosis || '',
          insurance: params.insurance || '',
          referrer: params.physicianName || ''
        },
        selectedPanels: Array.isArray(params.selectedTests) ? params.selectedTests : [],
        phenotypeData: params.phenotypeData || [],
        category: params.category || ''
      };
      
      // If we have found any relevant keys, return the structured data
      return structuredData;
    }
    
    return {};
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return {};
  }
}

/**
 * Gets a specific URL parameter value.
 * @param {string} name - The parameter name to retrieve
 * @returns {string|null} The parameter value or null if not found
 */
export function getUrlParameter(name) {
  // First check query parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has(name)) {
    return urlParams.get(name);
  }
  
  // Then check hash parameters
  if (window.location.hash && window.location.hash.length > 1) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.has(name)) {
      return hashParams.get(name);
    }
  }
  
  return null;
}

/**
 * Clears all URL parameters from the browser's address bar.
 * This is an alias for clearAllUrlParameters for backward compatibility.
 */
export function clearUrlParameters() {
  clearAllUrlParameters();
}

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
