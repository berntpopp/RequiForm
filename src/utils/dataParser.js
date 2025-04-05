/**
 * @file dataParser.js
 * @description Utility functions for parsing text data into structured patient data.
 * This module processes normalized data that users paste into the application.
 */

/**
 * Parses a string of normalized data into a structured patient data object.
 * 
 * Expected format is a set of key-value pairs, one per line, with a colon separator.
 * For example:
 * ```
 * First Name: Jane
 * Last Name: Doe
 * Birthdate: 1990-05-15
 * Sex: female
 * Insurance: ABC Health
 * Physician: Dr. Smith
 * Diagnosis: Suspected Renal Disease
 * ```
 * 
 * @param {string} text - The normalized text data to parse
 * @return {Object} Object containing parsed data or error information
 * @property {boolean} success - Whether parsing was successful
 * @property {Object} data - The parsed patient data (if successful)
 * @property {string} error - Error message (if parsing failed)
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
 * This is useful for generating example text that users can paste.
 * 
 * @param {Object} patientData - The patient data object to format
 * @return {string} A formatted string representation of the patient data
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
 * @return {string} Example data that can be used in the paste dialog
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
