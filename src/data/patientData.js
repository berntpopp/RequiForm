/**
 * @fileoverview Unified patient data model.
 * 
 * This file defines a centralized data structure for all patient-related
 * information, including personal details, test panels, phenotypes,
 * category, and consent information.
 */

/**
 * @typedef {Object} PatientData
 * @property {Object} personalInfo - Patient's personal information
 * @property {string} personalInfo.firstName - Patient's first name
 * @property {string} personalInfo.lastName - Patient's last name
 * @property {string} personalInfo.birthdate - Patient's birthdate
 * @property {string} personalInfo.sex - Patient's biological sex
 * @property {string} personalInfo.insurance - Insurance information
 * @property {string} personalInfo.insuranceId - Insurance ID
 * @property {string} personalInfo.referrer - Referring physician
 * @property {Array<string>} selectedPanels - Array of selected test panel IDs
 * @property {Array<Object>} phenotypeData - Array of phenotype information
 * @property {string} category - Selected category
 * @property {Object} consent - Consent information
 * @property {boolean} consent.dataProcessing - Consent to data processing
 * @property {boolean} consent.incidentalFindings - Consent to incidental findings
 */

/**
 * Creates a default patient data object with sensible defaults
 * @return {PatientData} The default patient data object
 */
export function createDefaultPatientData() {
  return {
    personalInfo: {
      firstName: '',
      lastName: '',
      birthdate: '',
      sex: '',
      insurance: '',
      insuranceId: '',
      referrer: '',
    },
    selectedPanels: [],
    phenotypeData: [],
    category: '',
    consent: {
      dataProcessing: false,
      incidentalFindings: false,
    },
  };
}

/**
 * Merges patient data objects, preserving existing values when new ones are empty
 * @param {PatientData} existingData - Current patient data
 * @param {PatientData} newData - New patient data to merge
 * @return {PatientData} Merged patient data
 */
export function mergePatientData(existingData, newData) {
  // Create a deep copy of existing data
  const mergedData = JSON.parse(JSON.stringify(existingData));
  
  // Merge personal info, keeping existing values if new ones are empty
  if (newData.personalInfo) {
    Object.entries(newData.personalInfo).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        mergedData.personalInfo[key] = value;
      }
    });
  }
  
  // Merge selected panels if provided
  if (newData.selectedPanels && newData.selectedPanels.length > 0) {
    mergedData.selectedPanels = [...newData.selectedPanels];
  }
  
  // Merge phenotype data if provided
  if (newData.phenotypeData && newData.phenotypeData.length > 0) {
    mergedData.phenotypeData = [...newData.phenotypeData];
  }
  
  // Merge category if provided
  if (newData.category) {
    mergedData.category = newData.category;
  }
  
  // Merge consent information if provided
  if (newData.consent) {
    Object.entries(newData.consent).forEach(([key, value]) => {
      if (value !== undefined) {
        mergedData.consent[key] = value;
      }
    });
  }
  
  return mergedData;
}

export default { createDefaultPatientData, mergePatientData };
