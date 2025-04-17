/**
 * @module cryptoUtilsWebCrypto
 * @description Provides strong encryption and decryption using Web Crypto API (AES-GCM).
 * Implements AES-GCM with PBKDF2 key derivation for secure client-side data handling,
 * packaging salt, IV, and ciphertext into a URL-safe Base64 string.
 */

import logService from '@/services/logService';

const PBKDF2_ITERATIONS = 100000; // Number of iterations for PBKDF2
const PBKDF2_HASH = 'SHA-256'; // Hash function for PBKDF2
const SALT_LENGTH_BYTES = 16; // 128 bits salt
const AES_KEY_LENGTH_BITS = 256; // AES key size
const AES_ALGORITHM = 'AES-GCM'; // AES mode
const IV_LENGTH_BYTES = 12; // 96 bits IV, standard for GCM

/**
 * Converts an ArrayBuffer to a Base64 string.
 * @param {ArrayBuffer} buffer - The buffer to convert.
 * @returns {string} The Base64 encoded string.
 * @throws {Error} If Base64 encoding fails.
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  try {
    return window.btoa(binary);
  } catch (e) {
    logService.error('Base64 encoding failed:', e);
    throw new Error('Failed to encode data to Base64.');
  }
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 * Handles URL-safe Base64 encoding.
 * @param {string} base64 - The Base64 string to convert (potentially URL-safe).
 * @returns {ArrayBuffer} The resulting buffer.
 * @throws {Error} If Base64 decoding fails due to invalid characters or other issues.
 */
function base64ToArrayBuffer(base64) {
  try {
    // Replace URL-safe characters and add padding if necessary
    let base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Standard.length % 4) {
        base64Standard += '=';
    }
    const binary_string = window.atob(base64Standard);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    logService.error('Base64 decoding failed:', e);
    // Distinguish between format error and actual decoding error if possible
    if (e instanceof DOMException && e.name === 'InvalidCharacterError') {
        throw new Error('Failed to decode Base64 data: Invalid characters detected.');
    } else {
        throw new Error('Failed to decode Base64 data. It might be corrupted.');
    }
  }
}

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 * @param {string} password - The user's password.
 * @param {Uint8Array} salt - A random salt.
 * @returns {Promise<CryptoKey>} A promise that resolves with the derived AES-GCM key.
 * @throws {Error} If key derivation fails (e.g., unsupported algorithm, invalid parameters).
 */
async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  // Import the password as a raw key material for PBKDF2
  const importedPasswordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false, // Key is not extractable
    ['deriveBits', 'deriveKey'] // Usage for PBKDF2
  );

  // Derive the actual AES-GCM key
  const derivedAesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    importedPasswordKey, // Base key material
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH_BITS }, // Desired algorithm and key length
    false, // Derived key is not extractable for security
    ['encrypt', 'decrypt'] // Key usages
  );

  return derivedAesKey;
}

/**
 * Encrypts plaintext data using AES-GCM with a key derived from a password.
 * The output is a URL-safe Base64 string containing salt, IV, and ciphertext.
 * Format: urlSafeBase64(salt + iv + ciphertext)
 * @param {string} plaintextString - The string data to encrypt. Must be a string.
 * @param {string} password - The password to derive the encryption key. Cannot be empty.
 * @returns {Promise<string>} A promise that resolves with the URL-safe Base64 encoded encrypted package.
 * @throws {Error} If encryption fails or password is missing.
 */
export async function encryptData(plaintextString, password) {
  if (!password) {
    logService.warn('encryptData called without a password.');
    throw new Error('Password is required for encryption.');
  }
  if (typeof plaintextString !== 'string') {
    logService.warn('encryptData called with non-string input.');
    throw new Error('Input data must be a string.');
  }
  try {
    // 1. Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

    // 2. Derive AES key from password and salt
    const derivedKey = await deriveKeyFromPassword(password, salt);

    // 3. Encode plaintext to ArrayBuffer
    const enc = new TextEncoder();
    const plaintextBuffer = enc.encode(plaintextString);

    // 4. Encrypt using AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: AES_ALGORITHM,
        iv: iv,
        // Optional: tagLength: 128 (default)
      },
      derivedKey,
      plaintextBuffer
    );

    // 5. Combine salt, IV, and ciphertext
    const combinedBuffer = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    combinedBuffer.set(salt, 0); // Place salt at the beginning
    combinedBuffer.set(iv, salt.length); // Place IV after salt
    combinedBuffer.set(new Uint8Array(encryptedBuffer), salt.length + iv.length); // Place ciphertext after IV

    // 6. Convert the combined buffer to Base64
    const base64Package = arrayBufferToBase64(combinedBuffer.buffer);
    // Make Base64 URL-safe
    const urlSafeBase64 = base64Package.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return urlSafeBase64;
  } catch (error) {
    logService.error('Encryption failed:', error);
    // Avoid leaking specific crypto errors to the caller unless necessary
    throw new Error('Encryption process failed.');
  }
}

/**
 * Decrypts a URL-safe Base64 encoded package (salt + IV + ciphertext) using AES-GCM
 * with a key derived from the provided password and the embedded salt.
 * @param {string} urlSafeBase64Package - The URL-safe Base64 encoded string.
 * @param {string} password - The password to derive the decryption key.
 * @returns {Promise<string>} A promise that resolves with the decrypted plaintext string.
 * @throws {Error} If decryption fails. Reasons include:
 *   - Missing or empty password.
 *   - Invalid Base64 input (corrupted or not Base64).
 *   - Input data too short (missing salt/IV/ciphertext components).
 *   - Incorrect password provided (Web Crypto API throws during `decrypt`).
 *   - Tampered ciphertext (Web Crypto API throws during `decrypt` due to GCM tag mismatch).
 *   - Other underlying Web Crypto API errors.
 */
export async function decryptData(urlSafeBase64Package, password) {
  if (!password) {
    logService.warn('decryptData called without a password.');
    throw new Error('Password is required for decryption.');
  }
  if (typeof urlSafeBase64Package !== 'string' || urlSafeBase64Package.length === 0) {
    logService.warn('decryptData called with invalid encrypted data input.');
    throw new Error('Invalid encrypted data provided.');
  }
  // Basic check for potentially massive inputs, adjust limit as needed
  // Example limit: 10MB. Adjust based on expected data size.
  const MAX_INPUT_LENGTH = 10 * 1024 * 1024;
  if (urlSafeBase64Package.length > MAX_INPUT_LENGTH) {
     throw new Error(`Encrypted data exceeds maximum allowed size of ${MAX_INPUT_LENGTH / 1024 / 1024}MB.`);
  }

  let combinedBuffer;
  try {
      // 1. Decode Base64 (URL-safe) to ArrayBuffer
      combinedBuffer = base64ToArrayBuffer(urlSafeBase64Package);
  } catch (error) {
      // Catch Base64 decoding errors specifically
      logService.error('Base64 decoding failed during decryption attempt:', error);
      throw new Error('Decryption failed: Invalid data format.'); // User-friendly message for format issues
  }

  const combinedBytes = new Uint8Array(combinedBuffer);

  // 2. Validate length before slicing
  const minLength = SALT_LENGTH_BYTES + IV_LENGTH_BYTES;
  if (combinedBytes.length < minLength) {
    logService.error(`Decryption failed: Data length (${combinedBytes.length}) is less than minimum required (${minLength}).`);
    throw new Error('Decryption failed: Data appears incomplete or corrupted.');
  }

  try {
    // 3. Extract salt, IV, and ciphertext
    const salt = combinedBytes.slice(0, SALT_LENGTH_BYTES);
    const iv = combinedBytes.slice(SALT_LENGTH_BYTES, minLength);
    const ciphertextBytes = combinedBytes.slice(minLength);

    // Redundant check as GCM handles empty ciphertext, but good for clarity
    // if (ciphertextBytes.length === 0) {
    //    throw new Error('Decryption failed: Ciphertext is missing.');
    // }

    // 4. Derive AES key using the *extracted* salt
    const derivedKey = await deriveKeyFromPassword(password, salt);

    // 5. Decrypt using AES-GCM
    // This is the critical step that throws on authentication failure (wrong key/tampering)
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: AES_ALGORITHM,
        iv: iv,
        // Optional: tagLength: 128 (default)
      },
      derivedKey,
      ciphertextBytes
    );

    // 6. Convert decrypted ArrayBuffer back to string
    const dec = new TextDecoder();
    const plaintextString = dec.decode(decryptedBuffer);

    return plaintextString;
  } catch (error) {
    // Catch errors specifically from crypto.subtle.decrypt or key derivation
    logService.error('Decryption failed during crypto operation:', error);
    // Provide a generic error message to the user for security
    // This hides whether it was a wrong password, tampered data, or other crypto issue
    throw new Error('Decryption failed. Please check the password or the link may be corrupted.');
  }
}
