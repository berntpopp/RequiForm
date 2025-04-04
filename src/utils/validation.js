/**
 * @fileoverview Validation utilities for the RequiForm application.
 * 
 * Provides functions to validate the unified patient data model including
 * personal information, test panels, phenotype data, and consent information.
 * 
 * Validation rules include:
 * - Personal information: firstName, lastName, and diagnosis fields are required
 * - Test panel selection: completely optional
 * - Category selection: optional
 * - Phenotype data: validation for structure only
 * - Consent: all consent fields are optional
 */

/**
 * Validates that a string is not empty
 * @param {string} value - The value to check
 * @return {boolean} True if the value is not empty
 */
export function isNotEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @return {boolean} True if the email is valid
 */
export function isValidEmail(email) {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a date in YYYY-MM-DD format
 * @param {string} date - The date to validate
 * @return {boolean} True if the date is valid
 */
export function isValidDate(date) {
  if (!date) return false; // Required field
  
  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Check if date is valid
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return false;
  
  // Check if date is not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj <= today;
}

/**
 * Validates personal information fields in the patient data model
 * 
 * This validates the following required fields:
 * - First name: Patient identifier
 * - Last name: Patient identifier
 * - Birthdate: Patient identifier
 * - Sex: Required for medical analysis
 * - Insurance: Required for administrative purposes
 * - Referring physician: Required for medical coordination
 * - Diagnosis/Suspicion: Essential clinical context for genetic testing
 * 
 * @param {Object} personalInfo - The personal information object
 * @return {Object} Validation result object with field-specific errors
 */
export function validatePersonalInfo(personalInfo) {
  const errors = {};
  
  if (!isNotEmpty(personalInfo.firstName)) {
    errors.firstName = 'First name is required';
  }
  
  if (!isNotEmpty(personalInfo.lastName)) {
    errors.lastName = 'Last name is required';
  }
  
  if (!isValidDate(personalInfo.birthdate)) {
    errors.birthdate = 'Valid birthdate is required (YYYY-MM-DD)';
  }
  
  if (!isNotEmpty(personalInfo.sex)) {
    errors.sex = 'Sex is required';
  }
  
  if (!isNotEmpty(personalInfo.insurance)) {
    errors.insurance = 'Insurance information is required';
  }
  
  if (!isNotEmpty(personalInfo.referrer)) {
    errors.referrer = 'Referring physician is required';
  }
  
  if (!isNotEmpty(personalInfo.diagnosis)) {
    errors.diagnosis = 'Diagnosis / Suspicion is required';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates the selected test panels
 * 
 * Note: As of April 2025, test panel selection is completely optional.
 * Users can proceed without selecting any panels, which allows maximum
 * flexibility in the form workflow. This change was made to streamline
 * the data collection process.
 * 
 * @return {Object} Validation result with always valid=true
 */
export function validateSelectedPanels() {
  // Panel selection is completely optional (no validation required)
  return {
    valid: true,
    errors: {}
  };
}

// Removed the unused helper function to fix the lint error

/**
 * Validates category selection
 * 
 * Category selection is optional in the patient data form.
 * This allows users to submit data without categorization when appropriate.
 * 
 * @return {Object} Validation result with always valid=true
 */
export function validateCategory() {
  // Category is optional, so always return valid
  return {
    valid: true,
    errors: {}
  };
}

/**
 * Validates phenotype data
 * @param {Array} phenotypeData - The phenotype data array
 * @return {Object} Validation result
 */
export function validatePhenotypeData(phenotypeData) {
  // Phenotype data is optional, so we only validate it if it's present
  if (!phenotypeData || phenotypeData.length === 0) {
    return { valid: true, errors: {} };
  }
  
  const errors = {};
  
  // Validate each phenotype entry has the required fields
  phenotypeData.forEach((item, index) => {
    if (!item.categoryId) {
      errors[`phenotypeData[${index}].categoryId`] = 'Category ID is required';
    }
    
    if (!item.phenotypeId) {
      errors[`phenotypeData[${index}].phenotypeId`] = 'Phenotype ID is required';
    }
    
    if (!item.status) {
      errors[`phenotypeData[${index}].status`] = 'Status is required';
    }
  });
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates consent data
 * @return {Object} Validation result
 */
export function validateConsent() {
  // No validation requirements for consent fields
  // Data processing consent has been deemed out of scope
  return {
    valid: true,
    errors: {}
  };
}

/**
 * Validates the entire patient data model
 * @param {Object} patientData - The unified patient data object
 * @return {Object} Complete validation result
 */
export function validatePatientData(patientData) {
  if (!patientData) {
    return {
      valid: false,
      errors: { general: 'Patient data is missing' },
      sections: {
        personalInfo: false,
        selectedPanels: false,
        category: false,
        consent: false
      }
    };
  }
  
  // Initialize all validations - note that panel selection is now entirely optional
  const personalInfoValidation = validatePersonalInfo(patientData.personalInfo || {});
  const selectedPanelsValidation = validateSelectedPanels(); // No parameters needed as we've made panels optional
  const categoryValidation = validateCategory(patientData.category || '');
  const phenotypeValidation = validatePhenotypeData(patientData.phenotypeData || []);
  const consentValidation = validateConsent(patientData.consent || {});
  
  // Combine all errors
  const errors = {
    ...personalInfoValidation.errors,
    ...selectedPanelsValidation.errors,
    ...categoryValidation.errors,
    ...phenotypeValidation.errors,
    ...consentValidation.errors
  };
  
  // Determine if the overall form is valid
  const valid = personalInfoValidation.valid && 
                selectedPanelsValidation.valid && 
                phenotypeValidation.valid &&
                consentValidation.valid;
  // Note: categoryValidation.valid is removed as it's now always true
  
  return {
    valid,
    errors,
    sections: {
      personalInfo: personalInfoValidation.valid,
      selectedPanels: selectedPanelsValidation.valid,
      category: categoryValidation.valid,
      phenotypeData: phenotypeValidation.valid,
      consent: consentValidation.valid
    }
  };
}
