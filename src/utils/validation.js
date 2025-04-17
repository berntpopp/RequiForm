/**
 * @fileoverview Validation utilities for the RequiForm application.
 * 
 * Provides functions to validate the unified patient data model including
 * personal information, test panels, phenotype data, and consent information.
 * These utilities ensure data integrity throughout the application.
 * 
 * Validation rules include:
 * - Personal information: 
 *   - Required: firstName, lastName, birthdate, sex, insurance, referrer, diagnosis
 *   - Each field has specific format requirements (e.g., valid date format for birthdate)
 * - Test panel selection: completely optional (no validation constraints)
 * - Category selection: optional (no validation constraints)
 * - Phenotype data: validation for structure only (ensures proper format)
 * - Consent: all consent fields are optional (no validation constraints)
 * 
 * The validation system provides detailed error messages for each field
 * and supports both full-form validation and section-specific validation.
 */

/**
 * Validates that a string is not empty.
 * This utility function checks if a string contains meaningful content
 * after whitespace trimming. Used for required field validation throughout the form.
 * 
 * @param {string} value - The string value to check
 * @return {boolean} True if the value is a non-empty string, false otherwise
 */
export function isNotEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates an email address format.
 * This utility function ensures email addresses follow the standard format
 * with username, @ symbol, and domain. Empty values are considered valid
 * since email fields are typically optional.
 * 
 * @param {string} email - The email string to validate
 * @return {boolean} True if the email is valid or empty, false otherwise
 */
export function isValidEmail(email) {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a date in YYYY-MM-DD format.
 * This function performs comprehensive date validation including:
 * 1. Checking for the correct format (YYYY-MM-DD)
 * 2. Verifying the date is valid (e.g., not February 30)
 * 3. Ensuring the date is not in the future
 * 
 * Empty values are considered invalid since this is for required date fields.
 * 
 * @param {string} date - The date string to validate
 * @return {boolean} True if the date is valid and not in the future, false otherwise
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
 * Validates personal information fields in the patient data model.
 * 
 * This function validates the following required fields:
 * - First name: Patient identifier - must not be empty
 * - Last name: Patient identifier - must not be empty
 * - Birthdate: Patient identifier - must be valid YYYY-MM-DD format and not in future
 * - Sex: Required for medical analysis - must not be empty
 * - Insurance: Required for administrative purposes - must not be empty
 * - Referring physician: Required for medical coordination - must not be empty
 * - Diagnosis/Suspicion: Essential clinical context for genetic testing - must not be empty
 * 
 * The function returns detailed error messages for each invalid field,
 * which are then displayed in the UI to guide the user.
 * 
 * @param {Object} personalInfo - The personal information object
 * @param {string} personalInfo.firstName - Patient's first name
 * @param {string} personalInfo.lastName - Patient's last name
 * @param {string} personalInfo.birthdate - Patient's birthdate (YYYY-MM-DD)
 * @param {string} personalInfo.sex - Patient's sex
 * @param {string} personalInfo.insurance - Patient's insurance information
 * @param {string} personalInfo.referrer - Referring physician's name
 * @param {string} personalInfo.diagnosis - Diagnosis or suspicion
 * @return {Object} Validation result with the following properties:
 *   @return {boolean} valid - Whether all fields are valid
 *   @return {Object} errors - Object with field names as keys and error messages as values
 */
export function validatePersonalInfo(personalInfo) {
  const errors = {};
  let valid = true;

  // Validate required fields
  if (!isNotEmpty(personalInfo.firstName)) {
    errors.firstName = 'validation.required.firstName'; // Key instead of string
    valid = false;
  }
  if (!isNotEmpty(personalInfo.lastName)) {
    errors.lastName = 'validation.required.lastName'; // Key
    valid = false;
  }
  if (!isValidDate(personalInfo.birthdate)) {
    // Check if it's required or just invalid format
    if (!personalInfo.birthdate) {
        errors.birthdate = 'validation.required.birthdate'; // Key
    } else {
        errors.birthdate = 'validation.invalid.birthdate'; // Key
    }
    valid = false;
  }
  if (!isNotEmpty(personalInfo.sex)) {
    errors.sex = 'validation.required.sex'; // Key
    valid = false;
  }
  if (!isNotEmpty(personalInfo.insurance)) {
    errors.insurance = 'validation.required.insurance'; // Key
    valid = false;
  }
  if (!isNotEmpty(personalInfo.referrer)) {
    errors.referrer = 'validation.required.referrer'; // Key
    valid = false;
  }
  if (!isNotEmpty(personalInfo.diagnosis)) {
    errors.diagnosis = 'validation.required.diagnosis'; // Key
    valid = false;
  }
  
  // Validate optional but potentially invalid fields
  if (personalInfo.email && !isValidEmail(personalInfo.email)) {
      errors.email = 'validation.invalid.email'; // Key
      valid = false; // Assuming invalid optional field makes the section invalid
  }

  return {
    valid,
    errors
  };
}

/**
 * Validates the selected test panels.
 * 
 * Note: As of April 2025, test panel selection is completely optional.
 * Users can proceed without selecting any panels, which allows maximum
 * flexibility in the form workflow. This change was made to streamline
 * the data collection process.
 * 
 * This function always returns a valid result with no errors, as there
 * are no validation requirements for test panel selection.
 * 
 * @return {Object} Validation result with the following properties:
 *   @return {boolean} valid - Always true
 *   @return {Object} errors - Empty object (no errors)
 */
export function validateSelectedPanels() {
  // Panel selection is completely optional (no validation required)
  return {
    valid: true,
    errors: {}
  };
}

/**
 * Validates category selection.
 * 
 * Category selection is optional in the patient data form.
 * This allows users to submit data without categorization when appropriate.
 * There are no validation constraints for the category field.
 * 
 * This function always returns a valid result with no errors, as there
 * are no validation requirements for category selection.
 * 
 * @return {Object} Validation result with the following properties:
 *   @return {boolean} valid - Always true
 *   @return {Object} errors - Empty object (no errors)
 */
export function validateCategory() { 
  return {
    valid: true,
    errors: {}
  };
}

/**
 * Validates phenotype data structure and format.
 * This function checks that each phenotype entry has the required
 * properties and structure. It performs validation on each item in the array,
 * ensuring they have the proper format for HPO terms.
 * 
 * The validation only checks for structural integrity, not the specific
 * content of HPO terms. Empty arrays are considered valid.
 * 
 * @param {Array} phenotypeData - The phenotype data array
 * @param {Object} phenotypeData[].id - HPO ID of the phenotype
 * @param {string} phenotypeData[].term - Text description of the phenotype
 * @param {string} phenotypeData[].status - Status of the phenotype (present/absent)
 * @return {Object} Validation result with the following properties:
 *   @return {boolean} valid - Whether all phenotype entries are valid
 *   @return {Object} errors - Object with field paths as keys and error messages as values
 */
export function validatePhenotypeData(phenotypeData) {
  const errors = {};
  let valid = true;

  if (!Array.isArray(phenotypeData)) {
    // If not an array, it's invalid structure, but maybe not a user error yet
    // Depending on how state is managed, this might indicate a programming error
    // For now, return valid as the user hasn't necessarily entered invalid data
    return { valid: true, errors: {} }; 
  }

  phenotypeData.forEach((phenotype, index) => {
    const fieldPrefix = `phenotypeData[${index}]`;
    let itemValid = true;

    // Validate required fields for each phenotype entry
    if (!phenotype || !isNotEmpty(phenotype.id)) {
      errors[`${fieldPrefix}.id`] = 'validation.required.phenotypeId'; // Key
      itemValid = false;
    } else {
      // Optional: Validate HPO ID format if needed (assuming simple check here)
      const hpoRegex = /^HP:\d{7}$/;
      if (!hpoRegex.test(phenotype.id)) {
        errors[`${fieldPrefix}.id`] = 'validation.invalid.hpoIdFormat'; // Key
        itemValid = false;
      }
    }
    
    if (!phenotype || !isNotEmpty(phenotype.status)) {
      errors[`${fieldPrefix}.status`] = 'validation.required.phenotypeStatus'; // Key
      itemValid = false;
    }

    if (!itemValid) {
      valid = false;
    }
  });

  return {
    valid,
    errors
  };
}

/**
 * Validates consent data.
 * This function handles consent-related validation, though currently
 * all consent fields are considered optional with no validation constraints.
 * 
 * Data processing consent has been deemed out of scope for the current
 * implementation requirements.
 * 
 * @return {Object} Validation result with the following properties:
 *   @return {boolean} valid - Always true
 *   @return {Object} errors - Empty object (no errors)
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
 * Validates the entire patient data model.
 * This comprehensive function validates all sections of the patient data form:
 * - Personal information
 * - Selected test panels
 * - Category selection
 * - Phenotype data
 * - Consent information
 * 
 * It combines the results from individual section validations and produces
 * a unified validation result that includes both overall validity and
 * section-specific validity flags. Error messages are formatted in both
 * flat and prefixed formats to support different UI components.
 * 
 * @param {Object} patientData - The unified patient data object
 * @param {Object} patientData.personalInfo - Personal information fields
 * @param {Array} patientData.selectedPanels - Selected test panel IDs
 * @param {string} patientData.category - Selected category
 * @param {Array} patientData.phenotypeData - Phenotype data entries
 * @param {Object} patientData.consent - Consent information
 * @return {Object} Complete validation result with the following properties:
 *   @return {boolean} valid - Whether the entire form is valid
 *   @return {Object} errors - Combined error messages from all sections
 *   @return {Object} sections - Object with section names as keys and validity as values
 */
export function validatePatientData(patientData) {
  if (!patientData) {
    return {
      valid: false,
      errors: { general: 'validation.general.missingData' }, // Key
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
    /**
   * Format validation errors in a flat structure to match previous behavior
   * - Non-prefixed format for the ValidationSummary at the top of the form
   * - Keep a prefixed version for section-specific error handling
   * 
   * This ensures backward compatibility with ValidationSummary component while
   * supporting the new architecture.
   */
  const errors = {};
  
  // Add all errors with appropriate context formatting
  
  // 1. Personal info errors
  Object.entries(personalInfoValidation.errors).forEach(([field, message]) => {
    // For the summary at the top - these names match the old structure exactly
    errors[field] = message;
    
    // For targeted section validation
    errors['personalInfo.' + field] = message;
  });
  
  // 2. Panel selection errors
  Object.entries(selectedPanelsValidation.errors).forEach(([field, message]) => {
    // For the summary
    errors[field] = message;
    
    // For section validation
    errors['selectedPanels.' + field] = message;
  });
  
  // 3. Category errors
  Object.entries(categoryValidation.errors).forEach(([field, message]) => {
    errors[field] = message;
    errors['category.' + field] = message;
  });
  
  // 4. Phenotype data errors
  Object.entries(phenotypeValidation.errors).forEach(([field, message]) => {
    // Only add the error once, not duplicated with different prefixes
    // If the field already has a phenotypeData prefix, don't add another one
    if (field.startsWith('phenotypeData[')) {
      errors[field] = message;
    } else {
      errors[field] = message;
      errors['phenotypeData.' + field] = message;
    }
  });
  
  // 5. Consent errors
  Object.entries(consentValidation.errors).forEach(([field, message]) => {
    errors[field] = message;
    errors['consent.' + field] = message;
  });
  
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
