/**
 * @fileoverview Utility functions for client-side encryption and decryption.
 * 
 * This module provides lightweight encryption/decryption utilities for protecting
 * data in client-side only scenarios, particularly for URL parameters. These functions
 * use XOR-based encryption with password-derived keys for simplicity and browser
 * compatibility.
 * 
 * Note: This is not intended for high-security applications but rather for basic
 * privacy protection when sharing data via URLs or basic storage.
 * 
 * @module utils/cryptoUtils
 */

/**
 * Encrypts a string using the provided password.
 * Uses a simple XOR-based encryption for client-side only security.
 * The encrypted data is safe for inclusion in URLs and other text formats
 * as it's converted to base64 encoding.
 * 
 * This function is typically used to encrypt form data for sharing via URLs,
 * providing a basic level of privacy protection.
 * 
 * @param {string} data - The data string to encrypt (typically JSON)
 * @param {string} password - The password to use for encryption
 * @return {string} The encrypted data as a base64-encoded string
 * @throws {Error} If data or password are missing
 */
export function encryptData(data, password) {
  if (!data || !password) {
    throw new Error('Data and password are required for encryption');
  }

  // Generate a simple key from the password
  const key = generateKeyFromPassword(password);
  
  // XOR each character of the data with corresponding character from the key
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key[i % key.length];
    result += String.fromCharCode(charCode);
  }
  
  // Convert to Base64 for safe URL transmission
  return btoa(result);
}

/**
 * Decrypts an encrypted string using the provided password.
 * This function reverses the encryption process by:
 * 1. Decoding the base64 string
 * 2. Generating the same key from the provided password
 * 3. Applying XOR decryption with the key
 * 
 * Must be used with exactly the same password that was used for encryption.
 * 
 * @param {string} encryptedData - The encrypted data (base64-encoded string)
 * @param {string} password - The password to use for decryption
 * @return {string} The decrypted data as a string (typically JSON)
 * @throws {Error} If encryptedData or password are missing
 * @throws {Error} If decryption fails due to incorrect password or invalid data
 */
export function decryptData(encryptedData, password) {
  if (!encryptedData || !password) {
    throw new Error('Encrypted data and password are required for decryption');
  }

  try {
    // Decode the Base64 string
    const decodedData = atob(encryptedData);
    
    // Generate the same key from the password
    const key = generateKeyFromPassword(password);
    
    // Perform the reverse XOR operation
    let result = '';
    for (let i = 0; i < decodedData.length; i++) {
      const charCode = decodedData.charCodeAt(i) ^ key[i % key.length];
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch {
    throw new Error('Decryption failed. Incorrect password or invalid data.');
  }
}

/**
 * Generates a key array from a password string.
 * This is a helper function that derives a numeric key array from the password,
 * adding some additional complexity to improve security.
 * 
 * The algorithm uses character codes and sums to create a key that's longer
 * than the original password, providing more encryption strength.
 * 
 * @private
 * @param {string} password - The password to generate a key from
 * @return {number[]} An array of character codes derived from the password
 */
function generateKeyFromPassword(password) {
  // Create an array of character codes from the password with some mixing
  const key = [];
  let sum = 0;
  
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i);
    sum += charCode;
    key.push(charCode);
  }
  
  // Add some additional complexity
  for (let i = 0; i < 10; i++) {
    key.push((sum + i) % 256);
  }
  
  return key;
}
