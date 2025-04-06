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
      console.log('Found query parameters:', window.location.search);
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
            console.log('Found JSON data in URL hash:', parsedData);
            
            // Ensure selectedTests/selectedPanels are properly processed
            if (parsedData.patientData && parsedData.patientData.selectedPanels) {
              console.log('Hash data contains nested selectedPanels:', parsedData.patientData.selectedPanels);
              
              // Make sure we have both formats for maximum compatibility
              if (!parsedData.selectedTests) {
                parsedData.selectedTests = [...parsedData.patientData.selectedPanels];
                console.log('Added top-level selectedTests from nested data:', parsedData.selectedTests);
              }
            } else if (parsedData.selectedTests && !parsedData.patientData?.selectedPanels) {
              // Ensure patientData.selectedPanels exists if selectedTests exists
              if (!parsedData.patientData) {
                parsedData.patientData = {};
              }
              parsedData.patientData.selectedPanels = [...parsedData.selectedTests];
              console.log('Added nested selectedPanels from top-level data:', parsedData.patientData.selectedPanels);
            }
            
            // Ensure phenotype data is available in both formats
            if (parsedData.phenotypeData) {
              // Check if we have both array and object formats available
              if (parsedData.patientData && !parsedData.patientData.phenotypeData) {
                // Add the phenotype data to nested structure
                parsedData.patientData.phenotypeData = Array.isArray(parsedData.phenotypeData) ? 
                  [...parsedData.phenotypeData] : [parsedData.phenotypeData];
                console.log('Added nested phenotypeData from top-level:', parsedData.patientData.phenotypeData);
              }
              
              // Ensure category is considered for phenotype data handling
              if (parsedData.category && typeof parsedData.phenotypeData === 'object' && !Array.isArray(parsedData.phenotypeData)) {
                // Check if the phenotype data is already categorized
                if (!parsedData.phenotypeData[parsedData.category] && Object.keys(parsedData.phenotypeData).length > 0) {
                  // Wrap the existing phenotype data into the category
                  const categorizedData = {};
                  categorizedData[parsedData.category] = parsedData.phenotypeData;
                  parsedData.phenotypeData = categorizedData;
                  console.log('Categorized phenotype data by category:', parsedData.category);
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
                
                console.log('Added top-level phenotypeData from nested array:', parsedData.phenotypeData);
              }
            }
            
            return parsedData; // Return the enhanced structured data
          }
        } catch (parseError) {
          console.error('Error parsing JSON data from URL:', parseError);
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
      console.log('Converting legacy format data:', params);
      
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
