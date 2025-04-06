/**
 * @fileoverview Utility functions for parsing and formatting text data for the RequiForm application.
 * 
 * This module provides functionality to convert between structured patient data objects
 * and normalized text representations. It enables users to import data via copy-paste
 * operations and supports a flexible key-value pair format with various synonyms for field names.
 * 
 * The parser recognizes multiple formats and synonyms for common fields (e.g., "First Name",
 * "FirstName", and "Given Name" all map to the same field), making it easier for users
 * to paste data from various sources without strict formatting requirements.
 */

/**
 * Parses a string of normalized data into a structured patient data object.
 * 
 * This function converts text-based key-value pairs into the application's unified
 * patient data model structure. It supports a flexible format that accommodates various
 * conventions and synonyms for field names, making it easier for users to paste data
 * from different sources.
 * 
 * Expected format is a set of key-value pairs, one per line, with a colon or equals separator:
 * ```
 * First Name: Jane
 * Last Name: Doe
 * Birthdate: 1990-05-15
 * Sex: female
 * Insurance: ABC Health
 * Physician: Dr. Smith
 * Diagnosis: Suspected Renal Disease
 * Panels: nephronophthise, alport_thin_basement, cystic_kidney_disease
 * ```
 * 
 * The parser recognizes multiple variants of field names:
 * - First name can be: "First Name", "FirstName", "Given Name", etc.
 * - Birth date can be: "Birthdate", "Date of Birth", "DOB", etc.
 * - Other fields have similar flexibility
 * 
 * @param {string} text - The normalized text data to parse
 * @return {Object} Result object with the following structure:
 *   @return {boolean} success - Whether parsing was successful
 *   @return {Object} data - If successful, the parsed patient data in unified model format with:
 *     @return {Object} data.personalInfo - Personal information (firstName, lastName, etc.)
 *     @return {Array} data.selectedPanels - Array of selected test panel IDs
 *     @return {Array} data.phenotypeData - Array of phenotype objects (if provided)
 *     @return {string} data.category - Selected category (if provided)
 *     @return {Object} data.consent - Consent information (if provided)
 *   @return {string} error - Error message if parsing failed
 */
export function parsePastedData(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return { 
      success: false, 
      error: 'No data provided. Please paste your data into the text area.' 
    };
  }

  try {
    // Initialize result object with empty structure
    const result = {
      personalInfo: {},
      selectedPanels: [],
      phenotypeData: [],
      category: '',
      consent: {}
    };
    
    // Split the text into lines and process each line
    const lines = text.split('\n');
    
    // Map of recognized field names to their appropriate location in the data structure
    const fieldMappings = {
      // Personal information mappings
      'first name': { section: 'personalInfo', field: 'firstName' },
      'firstname': { section: 'personalInfo', field: 'firstName' },
      'given name': { section: 'personalInfo', field: 'firstName' },
      'givenname': { section: 'personalInfo', field: 'firstName' },
      
      'last name': { section: 'personalInfo', field: 'lastName' },
      'lastname': { section: 'personalInfo', field: 'lastName' },
      'family name': { section: 'personalInfo', field: 'lastName' },
      'familyname': { section: 'personalInfo', field: 'lastName' },
      
      'birth date': { section: 'personalInfo', field: 'birthdate' },
      'birthdate': { section: 'personalInfo', field: 'birthdate' },
      'date of birth': { section: 'personalInfo', field: 'birthdate' },
      'dob': { section: 'personalInfo', field: 'birthdate' },
      
      'sex': { section: 'personalInfo', field: 'sex' },
      'gender': { section: 'personalInfo', field: 'sex' },
      
      'insurance': { section: 'personalInfo', field: 'insurance' },
      'insurance provider': { section: 'personalInfo', field: 'insurance' },
      'insurance id': { section: 'personalInfo', field: 'insuranceId' },
      'insuranceid': { section: 'personalInfo', field: 'insuranceId' },
      
      'physician': { section: 'personalInfo', field: 'referrer' },
      'physician name': { section: 'personalInfo', field: 'referrer' },
      'doctor': { section: 'personalInfo', field: 'referrer' },
      'referrer': { section: 'personalInfo', field: 'referrer' },
      'referring physician': { section: 'personalInfo', field: 'referrer' },
      
      'diagnosis': { section: 'personalInfo', field: 'diagnosis' },
      'clinical diagnosis': { section: 'personalInfo', field: 'diagnosis' },
      
      // Panels and tests
      'panels': { section: 'special', field: 'panels' },
      'selected panels': { section: 'special', field: 'panels' },
      'tests': { section: 'special', field: 'panels' },
      'selected tests': { section: 'special', field: 'panels' },
      
      // Category
      'category': { section: 'root', field: 'category' },
      
      // Special formats for more complex data
      'phenotypes': { section: 'special', field: 'phenotypes' },
    };
    
    // Process each line
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Try to split the line by colon or equals sign
      const separatorMatch = line.match(/:(.*)|=(.*)/);
      if (!separatorMatch) continue;
      
      // Extract key and value
      const separatorIndex = line.indexOf(separatorMatch[0]);
      const key = line.substring(0, separatorIndex).trim().toLowerCase();
      const value = (separatorMatch[1] || separatorMatch[2] || '').trim();
      
      // Skip if no value is provided
      if (!value) continue;
      
      // Map the key to the appropriate field in our data structure
      const mapping = fieldMappings[key];
      if (mapping) {
        if (mapping.section === 'root') {
          // Direct assignment to root level
          result[mapping.field] = value;
        } else if (mapping.section === 'personalInfo') {
          // Assign to personal info section
          result.personalInfo[mapping.field] = value;
        } else if (mapping.section === 'special') {
          // Handle special cases
          if (mapping.field === 'panels') {
            // Parse comma-separated list of panel IDs
            result.selectedPanels = value.split(',').map(v => v.trim()).filter(Boolean);
          } else if (mapping.field === 'phenotypes') {
            // Try to parse phenotype data if it looks like JSON
            try {
              if (value.startsWith('[') && value.endsWith(']')) {
                result.phenotypeData = JSON.parse(value);
              }
            } catch (e) {
              console.warn('Failed to parse phenotype data:', e);
            }
          }
        }
      }
    }
    
    // Validate the parsed data - at minimum we need some personal info
    if (Object.keys(result.personalInfo).length === 0) {
      return {
        success: false,
        error: 'No valid patient data found. Please check the format and try again.'
      };
    }
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('Error parsing pasted data:', error);
    return {
      success: false,
      error: 'An error occurred while parsing the data. Please check the format and try again.'
    };
  }
}

/**
 * Formats a patient data object into a normalized text representation.
 * 
 * This function converts a structured patient data object back into a human-readable
 * text format with key-value pairs. The output format uses standard field names and
 * is suitable for copying, sharing, or displaying as an example.
 * 
 * The resulting text can be used as input for the parsePastedData function,
 * enabling round-trip conversion between structured data and text representations.
 * 
 * @param {Object} patientData - The patient data object to format
 * @param {Object} patientData.personalInfo - Personal information fields
 * @param {string} patientData.personalInfo.firstName - Patient's first name
 * @param {string} patientData.personalInfo.lastName - Patient's last name
 * @param {string} patientData.personalInfo.birthdate - Patient's birthdate (YYYY-MM-DD format)
 * @param {string} patientData.personalInfo.sex - Patient's sex
 * @param {string} patientData.personalInfo.insurance - Patient's insurance provider
 * @param {string} patientData.personalInfo.insuranceId - Patient's insurance ID
 * @param {string} patientData.personalInfo.referrer - Referring physician
 * @param {string} patientData.personalInfo.diagnosis - Clinical diagnosis or suspicion
 * @param {Array<string>} patientData.selectedPanels - Selected test panel IDs
 * @param {string} patientData.category - Selected category 
 * @return {string} A formatted string representation of the patient data (key-value pairs)
 */
export function formatPatientData(patientData) {
  if (!patientData) return '';
  
  const lines = [];
  
  // Add personal information
  if (patientData.personalInfo) {
    const { personalInfo } = patientData;
    if (personalInfo.firstName) lines.push(`First Name: ${personalInfo.firstName}`);
    if (personalInfo.lastName) lines.push(`Last Name: ${personalInfo.lastName}`);
    if (personalInfo.birthdate) lines.push(`Birthdate: ${personalInfo.birthdate}`);
    if (personalInfo.sex) lines.push(`Sex: ${personalInfo.sex}`);
    if (personalInfo.insurance) lines.push(`Insurance: ${personalInfo.insurance}`);
    if (personalInfo.insuranceId) lines.push(`Insurance ID: ${personalInfo.insuranceId}`);
    if (personalInfo.referrer) lines.push(`Physician: ${personalInfo.referrer}`);
    if (personalInfo.diagnosis) lines.push(`Diagnosis: ${personalInfo.diagnosis}`);
  }
  
  // Add selected panels
  if (patientData.selectedPanels && patientData.selectedPanels.length > 0) {
    lines.push(`Panels: ${patientData.selectedPanels.join(', ')}`);
  }
  
  // Add category if present
  if (patientData.category) {
    lines.push(`Category: ${patientData.category}`);
  }
  
  return lines.join('\n');
}

/**
 * Generates example data in the expected format for the paste functionality.
 * 
 * This function creates a pre-formatted example of patient data that demonstrates
 * the expected format for the application's paste functionality. It includes
 * common fields like patient identifiers, medical information, and test panels.
 * 
 * The example data can be displayed in the UI to help users understand how to
 * format their own data for pasting, serving as a template or guide.
 * 
 * @return {string} Example data string that can be used in the paste dialog,
 *                  formatted as key-value pairs with appropriate field names
 */
export function generateExampleData() {
  return `First Name: Jane
Last Name: Doe
Birthdate: 1990-05-15
Sex: female
Insurance: ABC Health
Physician: Dr. Smith
Diagnosis: Suspected Renal Disease
Panels: nephronophthise, alport_thin_basement, cystic_kidney_disease`;
}
