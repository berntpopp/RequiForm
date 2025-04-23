/**
 * @file urlUtils.js
 * @description Enhanced utility module for URL parameter handling, ensuring both query and hash parameters are properly handled.
 */

import logService from '@/services/logService'; // Import log service

/**
 * Parses patient data from URL parameters.
 * This function extracts data from both query parameters and hash fragments.
 * @returns {Object} Parsed patient data from the URL
 */
export function parsePatientDataFromUrl() {
  try {
    // First check if we have encrypted data in query parameters
    const encryptedParam = getUrlParameter('encrypted');
    if (encryptedParam) {
      // We'll handle decryption elsewhere, just return empty for now
      return {};
    }
    
    // Process parameters from all sources
    let params = {};
    let foundData = false;
    
    // First check query parameters (legacy format)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.toString()) {
      logService.debug('Found query parameters:', window.location.search);
      // Collect all query parameters
      for (const [key, value] of searchParams.entries()) {
        if (key === 'encrypted') continue; // Skip encrypted parameter
        
        try {
          params[key] = JSON.parse(decodeURIComponent(value));
          foundData = true;
        } catch {
          params[key] = decodeURIComponent(value);
          foundData = true;
        }
      }
    }
    
    // Check hash parameters - we now store data as a single JSON-stringified 'data' parameter
    if (window.location.hash && window.location.hash.length > 1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const dataParam = hashParams.get('data');
      
      if (dataParam) {
        try {
          // Parse the JSON data from the 'data' parameter
          const parsedData = JSON.parse(decodeURIComponent(dataParam));
          if (typeof parsedData === 'object') {
            logService.debug('Found JSON data in URL hash:', parsedData);
            
            // Ensure selectedTests/selectedPanels are properly processed
            if (parsedData.patientData && parsedData.patientData.selectedPanels) {
              logService.debug('Hash data contains nested selectedPanels:', parsedData.patientData.selectedPanels);
              
              // Make sure we have both formats for maximum compatibility
              if (!parsedData.selectedTests) {
                parsedData.selectedTests = [...parsedData.patientData.selectedPanels];
                logService.debug('Added top-level selectedTests from nested data:', parsedData.selectedTests);
              }
            } else if (parsedData.selectedTests && !parsedData.patientData?.selectedPanels) {
              // Ensure patientData.selectedPanels exists if selectedTests exists
              if (!parsedData.patientData) {
                parsedData.patientData = {};
              }
              parsedData.patientData.selectedPanels = [...parsedData.selectedTests];
              logService.debug('Added nested selectedPanels from top-level data:', parsedData.patientData.selectedPanels);
            }
            
            // Ensure phenotype data is available in both formats
            if (parsedData.phenotypeData) {
              // Check if we have both array and object formats available
              if (parsedData.patientData && !parsedData.patientData.phenotypeData) {
                // Add the phenotype data to nested structure
                parsedData.patientData.phenotypeData = Array.isArray(parsedData.phenotypeData) ? 
                  [...parsedData.phenotypeData] : [parsedData.phenotypeData];
                logService.debug('Added nested phenotypeData from top-level:', parsedData.patientData.phenotypeData);
              }
              
              // Ensure category is considered for phenotype data handling
              if (parsedData.category && typeof parsedData.phenotypeData === 'object' && !Array.isArray(parsedData.phenotypeData)) {
                // Check if the phenotype data is already categorized
                if (!parsedData.phenotypeData[parsedData.category] && Object.keys(parsedData.phenotypeData).length > 0) {
                  // Wrap the existing phenotype data into the category
                  const categorizedData = {};
                  categorizedData[parsedData.category] = parsedData.phenotypeData;
                  parsedData.phenotypeData = categorizedData;
                  logService.debug('Categorized phenotype data by category:', parsedData.category);
                }
              }
            } else if (parsedData.patientData && parsedData.patientData.phenotypeData) {
              // Copy the nested phenotype data to top level
              if (Array.isArray(parsedData.patientData.phenotypeData)) {
                // Convert array format to object format for the top level
                const item = parsedData.patientData.phenotypeData[0] || {};
                
                if (parsedData.category) {
                  // Create a categorized structure if we have a category
                  const categorizedData = {};
                  categorizedData[parsedData.category] = item;
                  parsedData.phenotypeData = categorizedData;
                } else {
                  // Otherwise just use the item directly
                  parsedData.phenotypeData = item;
                }
                
                logService.debug('Added top-level phenotypeData from nested array:', parsedData.phenotypeData);
              }
            }
            
            return parsedData; // Return the enhanced structured data
          }
        } catch (parseError) {
          logService.error('Error parsing JSON data from URL:', parseError);
        }
      }
      
      // For backward compatibility, handle old-style hash parameters
      for (const [key, value] of hashParams.entries()) {
        if (key === 'data') continue; // Skip data parameter as we already tried to parse it
        
        try {
          params[key] = JSON.parse(decodeURIComponent(value));
          foundData = true;
        } catch {
          params[key] = decodeURIComponent(value);
          foundData = true;
        }
      }
    }
    
    // Check if we have a complete patient data structure
    if (params.personalInfo || params.phenotypeData || params.selectedPanels) {
      return params;
    }
    
    // For legacy URL formats where data is flat
    if (foundData) {
      logService.debug('Converting legacy format data:', params);
      
      // Convert flat structure to unified data model
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
        selectedPanels: Array.isArray(params.selectedTests) ? params.selectedTests : 
                        params.selectedPanels ? [params.selectedPanels] : [],
        phenotypeData: params.phenotypeData || [],
        category: params.category || ''
      };
      
      return structuredData;
    }
    
    return {};
  } catch (error) {
    logService.error('Error parsing URL parameters:', error);
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
 * Clears all URL hash parameters from the browser's address bar without affecting the path or query parameters.
 * This is optimized for privacy concerns, removing only hash fragments that might contain sensitive data.
 * 
 * IMPORTANT BROWSER HISTORY LIMITATION:
 * This function only modifies the current history entry's URL - it cannot remove the URL from the browser's
 * global history list that was already recorded during the initial page navigation. When users navigate to a URL
 * with parameters, that full URL is recorded in history before any JavaScript code runs. This function can only
 * clean the URL in the address bar for the current session.
 */
export function clearUrlParameters() {
  try {
    // Keep pathname and query parameters, but remove hash
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, document.title, cleanUrl);
    logService.debug('URL hash fragment cleared from current history entry using replaceState.');
  } catch (error) {
    logService.error('Error clearing URL hash fragment with replaceState:', error);
    // Fallback approach if the primary method fails
    try {
      window.location.hash = '';
      logService.debug('URL hash cleared using fallback method.');
    } catch (fallbackError) {
      logService.error('Fallback hash clearing also failed:', fallbackError);
    }
  }
}

/**
 * Clears all URL parameters (both query and hash fragments) from the browser's address bar.
 * This function ensures complete removal of both types of parameters to enhance security.
 */
export function clearAllUrlParameters() {
  try {
    // Define the base URL (without any parameters)
    const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    
    // Use replaceState to set the URL to just the pathname
    window.history.replaceState(null, document.title, baseUrl);
    
    // Verify that both types of parameters are gone
    if (window.location.search || window.location.hash) {
      logService.warn('First attempt to clear parameters failed, trying alternate method...');
      
      // Second approach: Try handling hash separately first
      if (window.location.hash) {
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }
      
      // Then remove search parameters if any remain
      if (window.location.search) {
        window.history.replaceState(null, document.title, window.location.pathname);
      }
      
      // Final verification - explicitly set to base URL
      window.history.replaceState(null, document.title, baseUrl);
    }
    
    logService.debug('All URL parameters cleared successfully');
  } catch (error) {
    logService.error('Error clearing URL parameters:', error);
    
    // Fallback method as last resort
    try {
      const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      if (window.location.href !== baseUrl) {
        // Note: This is a more aggressive approach that may reload the page
        // Only used if the replaceState approaches fail
        window.location.href = baseUrl;
        logService.warn('Using fallback method to clear parameters - page may reload');
      }
    } catch (fallbackError) {
      logService.error('All parameter clearing attempts failed:', fallbackError);
    }
  }
}
