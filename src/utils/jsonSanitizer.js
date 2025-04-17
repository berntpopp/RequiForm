/**
 * @fileoverview Utility for sanitizing parsed JSON objects.
 */

import logService from '@/services/logService';

/**
 * Recursively removes potentially dangerous keys (__proto__, constructor, prototype)
 * from a parsed JSON object or array to prevent prototype pollution.
 *
 * @param {*} obj - The object or array to sanitize. It will be mutated directly.
 * @returns {*} The sanitized object or array.
 */
export function sanitizeParsedJson(obj) {
  const keysToRemove = ['__proto__', 'constructor', 'prototype'];

  if (obj === null || typeof obj !== 'object') {
    return obj; // Return non-objects/arrays as is
  }

  if (Array.isArray(obj)) {
    // Sanitize each element in the array
    obj.forEach(item => sanitizeParsedJson(item));
  } else {
    // Sanitize object properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (keysToRemove.includes(key)) {
          logService.warn(`[Sanitizer] Detected and removed potentially harmful key: "${key}"`);
          console.warn(`Attempted prototype pollution via key "${key}". Removing.`);
          delete obj[key];
        } else {
          // Recursively sanitize nested objects/arrays
          obj[key] = sanitizeParsedJson(obj[key]);
        }
      }
    }
    // Check the prototype itself after iterating keys
    if (Object.getPrototypeOf(obj) !== Object.prototype) {
        // This case is less common with JSON.parse but good to cover
        // if objects are constructed differently before sanitization.
        // We might just reset the prototype or handle specific cases.
        // For standard JSON.parse results, the key check above is primary.
        // Let's log if we encounter this.
        console.warn('Object with unexpected prototype encountered during sanitization.');
        // Optionally, reset prototype: Object.setPrototypeOf(obj, Object.prototype);
    }
  }

  return obj;
}
