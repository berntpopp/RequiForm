/**
 * @file url.js
 * @description Utility module for URL parameter handling and encryption/decryption operations.
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
  } catch (error) {
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
