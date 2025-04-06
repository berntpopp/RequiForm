/**
 * @fileoverview Utility functions for client-side encryption and decryption.
 * @module utils/cryptoUtils
 */

/**
 * Encrypts a string using the provided password.
 * Uses a simple XOR-based encryption for client-side only security.
 * 
 * @param {string} data - The data to encrypt.
 * @param {string} password - The password to use for encryption.
 * @return {string} The encrypted data as a base64-encoded string.
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
 * Must be used with the same password that was used for encryption.
 * 
 * @param {string} encryptedData - The encrypted data (base64-encoded string).
 * @param {string} password - The password to use for decryption.
 * @return {string} The decrypted data.
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
 * This is a helper function and should not be exported.
 * 
 * @private
 * @param {string} password - The password to generate a key from.
 * @return {number[]} An array of character codes derived from the password.
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
