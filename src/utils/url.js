/**
 * @file url.js
 * @description Utility module for URL parameter handling and encryption/decryption operations.
 * Enhanced with patient data parsing and URL parameter generation functions.
 */

import CryptoJS from 'crypto-js';

/**
 * Merges URL parameters from both the query string and the hash.
 *
 * @return {URLSearchParams} The merged URL parameters.
 */
export function mergeUrlParameters() {
  const merged = new URLSearchParams();
  const queryParams = new URLSearchParams(window.location.search);
  for (const [key, value] of queryParams.entries()) {
    merged.set(key, value);
  }
  const hash = window.location.hash.substring(1);
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    for (const [key, value] of hashParams.entries()) {
      merged.set(key, value);
    }
  }
  return merged;
}

/**
 * Retrieves a specific URL parameter from the merged query and hash parameters.
 *
 * @param {string} key - The parameter key to retrieve.
 * @return {string|null} The parameter value if found, otherwise null.
 */
export function getUrlParameter(key) {
  const merged = mergeUrlParameters();
  return merged.get(key);
}

/**
 * Clears URL parameters and hash from the browser’s address bar.
 */
export function clearUrlParameters() {
  window.history.replaceState(null, '', window.location.pathname);
}

/**
 * Encrypts an object of parameters into an encrypted string.
 *
 * @param {Object} paramsObj - The parameters as key-value pairs.
 * @param {string} password - The password used for encryption.
 * @return {string} The encrypted string.
 */
export function encryptParams(paramsObj, password) {
  const params = new URLSearchParams();
  Object.entries(paramsObj).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const paramsStr = params.toString();
  const cipher = CryptoJS.AES.encrypt(paramsStr, password);
  return cipher.toString();
}

/**
 * Decrypts an encrypted string using the provided password.
 *
 * @param {string} encryptedStr - The encrypted parameter string.
 * @param {string} password - The password used for decryption.
 * @return {URLSearchParams|null} The decrypted URLSearchParams, or null if decryption fails.
 */
export function decryptParams(encryptedStr, password) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedStr, password);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) {
      return null;
    }
    return new URLSearchParams(decryptedStr);
  } catch {    // Empty catch block for errors
    return null;
  }
}

/**
 * Generates a URL string with hash parameters based on the provided data.
 *
 * @param {Object} data - An object containing key-value pairs (e.g., patient data).
 * @param {Array} selectedTests - An array of selected test IDs.
 * @return {string} The generated URL with hash parameters.
 */
export function generateUrlWithHash(data, selectedTests) {
  const url = new URL(window.location.href);
  url.search = '';
  const hashParams = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value) {
      hashParams.set(key, value);
    }
  });
  if (selectedTests && selectedTests.length) {
    hashParams.set('selectedTests', selectedTests.join(','));
  }
  url.hash = hashParams.toString();
  return url.toString();
}

/**
 * Parses URL parameters into a patient data object
 * @param {URL|string} url - URL object or string to parse
 * @return {Object} Parsed patient data from URL parameters
 */
export function parsePatientDataFromUrl() {
  // Use existing function to merge query and hash params
  const params = mergeUrlParameters();
  
  const patientData = {
    personalInfo: {},
    selectedPanels: [],
    phenotypeData: [],
    category: '',
    consent: {},
  };
  
  // Parse personal information
  if (params.has('firstName') || params.has('givenName')) {
    patientData.personalInfo.firstName = params.get('firstName') || params.get('givenName');
  }
  if (params.has('lastName') || params.has('familyName')) {
    patientData.personalInfo.lastName = params.get('lastName') || params.get('familyName');
  }
  if (params.has('birthdate')) patientData.personalInfo.birthdate = params.get('birthdate');
  if (params.has('sex')) patientData.personalInfo.sex = params.get('sex');
  if (params.has('insurance')) patientData.personalInfo.insurance = params.get('insurance');
  if (params.has('insuranceId')) patientData.personalInfo.insuranceId = params.get('insuranceId');
  if (params.has('referrer') || params.has('physicianName')) {
    patientData.personalInfo.referrer = params.get('referrer') || params.get('physicianName');
  }
  if (params.has('diagnosis')) patientData.personalInfo.diagnosis = params.get('diagnosis');
  
  // Parse selected panels (comma-separated list)
  if (params.has('panels')) {
    const panelIds = params.get('panels').split(',').filter(Boolean);
    patientData.selectedPanels = panelIds;
    
    // Also store in global state for component access
    window.requiFormData = window.requiFormData || {};
    window.requiFormData.directPanels = [...panelIds];
    console.log('URL parser: Found panels in URL and stored globally:', panelIds);
  }
  // For backward compatibility, also check selectedTests parameter
  else if (params.has('selectedTests')) {
    const panelIds = params.get('selectedTests').split(',').filter(Boolean);
    patientData.selectedPanels = panelIds;
    
    // Also store in global state
    window.requiFormData = window.requiFormData || {};
    window.requiFormData.directPanels = [...panelIds];
    console.log('URL parser: Found selectedTests in URL and stored globally:', panelIds);
  }
  
  // Parse phenotype data (JSON-encoded string)
  if (params.has('phenotypes')) {
    try {
      const phenotypesParam = params.get('phenotypes');
      patientData.phenotypeData = JSON.parse(decodeURIComponent(phenotypesParam));
    } catch (error) {
      console.error('Failed to parse phenotypes from URL:', error);
    }
  }
  
  // Parse category
  if (params.has('category')) patientData.category = params.get('category');
  
  // Parse consent information
  if (params.has('consentDataProcessing')) {
    patientData.consent.dataProcessing = params.get('consentDataProcessing') === 'true';
  }
  if (params.has('consentIncidentalFindings')) {
    patientData.consent.incidentalFindings = params.get('consentIncidentalFindings') === 'true';
  }

  return patientData;
}

/**
 * Converts patient data to URL parameters
 * @param {Object} patientData - Patient data object
 * @return {URLSearchParams} URL parameters
 */
export function patientDataToUrlParams(patientData) {
  const params = new URLSearchParams();
  
  // Add personal information
  const { personalInfo } = patientData;
  if (personalInfo) {
    if (personalInfo.firstName) params.set('firstName', personalInfo.firstName);
    if (personalInfo.lastName) params.set('lastName', personalInfo.lastName);
    if (personalInfo.birthdate) params.set('birthdate', personalInfo.birthdate);
    if (personalInfo.sex) params.set('sex', personalInfo.sex);
    if (personalInfo.insurance) params.set('insurance', personalInfo.insurance);
    if (personalInfo.insuranceId) params.set('insuranceId', personalInfo.insuranceId);
    if (personalInfo.referrer) params.set('referrer', personalInfo.referrer);
    if (personalInfo.diagnosis) params.set('diagnosis', personalInfo.diagnosis);
  }
  
  // Add selected panels
  if (patientData.selectedPanels && patientData.selectedPanels.length > 0) {
    params.set('panels', patientData.selectedPanels.join(','));
  }
  
  // Add phenotype data (JSON-encoded)
  if (patientData.phenotypeData && patientData.phenotypeData.length > 0) {
    params.set('phenotypes', encodeURIComponent(JSON.stringify(patientData.phenotypeData)));
  }
  
  // Add category
  if (patientData.category) params.set('category', patientData.category);
  
  // Add consent information
  if (patientData.consent) {
    if (patientData.consent.dataProcessing !== undefined) {
      params.set('consentDataProcessing', patientData.consent.dataProcessing.toString());
    }
    if (patientData.consent.incidentalFindings !== undefined) {
      params.set('consentIncidentalFindings', patientData.consent.incidentalFindings.toString());
    }
  }
  
  return params;
}

/**
 * Creates a URL with patient data parameters
 * @param {Object} patientData - Patient data object
 * @param {string} baseUrl - Base URL (defaults to current location)
 * @return {string} URL with patient data parameters
 */
export function createUrlWithPatientData(patientData, baseUrl = window.location.href.split('?')[0]) {
  const params = patientDataToUrlParams(patientData);
  return `${baseUrl}?${params.toString()}`;
}
