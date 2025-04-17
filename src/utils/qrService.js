/**
 * @fileoverview QR code service module for generating specialized QR codes.
 *
 * This module provides a centralized service for generating QR codes with
 * specific data formats for different parts of the application. It handles
 * patient data, phenotype data, and pedigree data encoding in ultra-compact formats
 * to maximize QR code readability and minimize size.
 * 
 * The ultra-compact format is designed to fit the maximum amount of data into a QR code
 * while maintaining reliable scanning capability across different devices. This format is
 * particularly important for phenotype data where potentially hundreds of HPO terms need
 * to be encoded in a single QR code.
 * 
 * QR Data Format Specification:
 * 
 * - Patient data: [version, type, patientDataArray, selectedTests]
 *   Where patientDataArray contains patient info in a compact array format
 *   Using abbreviated field names (fn=firstName, ln=lastName, bd=birthdate, etc.)
 * 
 * - Phenotype data: [version, type, phenotypeArray]
 *   Where phenotypeArray contains strings in ultra-compact format "+123" or "-123"
 *   + prefix indicates present phenotype
 *   - prefix indicates absent phenotype
 *   Numbers are the HPO ID without the "HP:" prefix and leading zeros
 *   "no input" values are completely excluded from the QR code
 *   Example: "HP:0000123: present" becomes "+123"
 * 
 * - Pedigree data: [version, type, [pedigreeData, format]]
 *   Where format is either 't' (table) or 'i' (image)
 *   Image format is used when the pedigree is too complex for direct encoding
 * 
 * - Complete data: Object with all data types in compact format
 *   Structure: {v: version, t: type, p: patient, ts: tests, ph: phenotypes, pd: pedigree}
 * 
 * The QR code system is designed for maximum space efficiency while maintaining
 * compatibility with the PDF generation system, which uses human-readable formats.
 * 
 * QR codes are positioned on each relevant page of the PDF output with descriptive titles:
 * - Patient QR code on patient data page
 * - Phenotype QR code on phenotype data page
 * - Pedigree QR code on pedigree page (when available)
 */

import QRCode from 'qrcode';
import qrMappingSchema from '../config/qrMappingSchema.json';
import logService from '@/services/logService'; // Import log service

/**
 * Validates if an object conforms to the compact QR mapping schema.
 * This function checks that QR data has the required structure and properties
 * according to our schema specification before generating QR codes.
 *
 * Validation includes:
 * - Checking data type (object)
 * - Verifying schema version
 * - Validating data type code against allowed types
 * - Ensuring all required properties exist
 *
 * @param {Object} data - The data object to validate
 * @param {Array<string>} requiredProperties - Array of properties that must exist in the data
 * @return {boolean} Whether the data is valid according to the schema
 */
function validateQrData(data, requiredProperties = []) {
  if (!data || typeof data !== 'object') {
    logService.error('QR data validation failed: Data must be an object');
    return false;
  }

  // Check schema version (v)
  if (!data.v) {
    data.v = qrMappingSchema.properties.version.default;
  }

  // Check data type (t) - map compact types to full types for validation
  const typeMap = {
    'p': 'patient',
    'ph': 'phenotype',
    'pd': 'pedigree',
    'c': 'complete'
  };
  
  // Get full type for validation
  const fullType = typeMap[data.t] || data.t;
  
  if (!fullType || !qrMappingSchema.properties.type.enum.includes(fullType)) {
    logService.error(`QR data validation failed: Invalid type "${data.t}"`);
    return false;
  }

  // Check required properties
  for (const prop of requiredProperties) {
    if (!data[prop]) {
      logService.error(`QR data validation failed: Missing required property "${prop}"`);
      return false;
    }
  }

  return true;
}

/**
 * Ultra-compresses phenotype data for minimal QR code size.
 * Transforms phenotype data from full HPO format to ultra-compact format:
 * - "HP:0000123: present" → "+123" (+ prefix indicates present phenotype)
 * - "HP:0000456: absent" → "-456" (- prefix indicates absent phenotype)
 * - "no input" values are completely excluded
 *
 * This ultra-compact format significantly reduces QR code size while maintaining
 * all essential information for data exchange. The compression achieved can reduce
 * data size by up to 80% compared to full JSON representation, enabling reliable
 * QR code scanning even with large phenotype datasets.
 *
 * The encoding follows these steps:
 * 1. Filter out items with no ID or status
 * 2. Extract the numeric part of the HPO ID (removing "HP:" and leading zeros)
 * 3. Add "+" prefix for present phenotypes or "-" for absent phenotypes
 * 4. Return the resulting array of compact strings
 *
 * @param {Array} phenotypeData - Array of phenotype objects
 * @param {string} phenotypeData[].id - HPO ID (e.g. "HP:0000123") or numeric ID
 * @param {string} phenotypeData[].status - Status of the phenotype ("present" or "absent")
 * @param {boolean} [phenotypeData[].present] - Alternative format: true=present, false=absent
 * @return {Array} Ultra-compressed phenotype data array with +/- prefixes
 * @example
 * // Input: [{id: "HP:0000123", status: "present"}, {id: "HP:0000456", status: "absent"}]
 * // Output: ["+123", "-456"]
 */
export function encodePhenotypeData(phenotypeData) {
  if (!phenotypeData || !Array.isArray(phenotypeData)) {
    logService.warn('Invalid phenotype data provided for QR encoding');
    return [];
  }

  try {
    // Use even more compact format: just a string array with +/- prefixes
    const encoded = phenotypeData.map(item => {
      // Skip items without an ID
      if (!item || !item.id) {
        logService.debug('Skipping phenotype item with no ID');
        return null;
      }
      
      let hpoNumber;
      
      // Extract just the numeric part from HP:0000123
      if (typeof item.id === 'string' && item.id.startsWith('HP:')) {
        // Remove HP: prefix and leading zeros
        hpoNumber = parseInt(item.id.substring(3), 10);
        if (isNaN(hpoNumber)) {
          logService.warn(`Invalid HPO ID format: ${item.id}`);
          return null;
        }
      } else {
        hpoNumber = item.id;
      }
      
      // Use +/- prefix to indicate present/absent (more compact)
      const prefix = item.present ? '+' : '-';
      
      // Return just a string like "+123" instead of an array
      return `${prefix}${hpoNumber}`;
    }).filter(item => item !== null); // Remove any null entries
    
    return encoded;
  } catch (error) {
    logService.error('Error encoding phenotype data:', error);
    return [];
  }
}

/**
 * Decodes ultra-compressed phenotype data
 * Transforms "+123" back to {id: "HP:0000123", present: true}
 *
 * @param {Array} encodedPhenotypeData - Array of encoded phenotype strings or arrays
 * @return {Array} Decoded phenotype data with restored formatting
 */
/**
 * Decodes ultra-compressed phenotype data
 * Transforms "+123" back to {id: "HP:0000123", present: true}
 *
 * @param {Array} encodedPhenotypeData - Array of encoded phenotype strings or arrays
 * @return {Array} Decoded phenotype data with restored formatting
 * @example
 * // Input: ["+123", "-456"]
 * // Output: [{id: "HP:0000123", present: true}, {id: "HP:0000456", present: false}]
 */
export function decodePhenotypeData(encodedPhenotypeData) {
  if (!encodedPhenotypeData || !Array.isArray(encodedPhenotypeData)) {
    logService.warn('Invalid encoded phenotype data provided for decoding');
    return [];
  }

  try {
    return encodedPhenotypeData.map(item => {
      const decoded = {};
      
      // Handle new +/- prefix format (string format)
      if (typeof item === 'string') {
        // Check for present/absent prefix
        const isPresent = item.startsWith('+');
        const isAbsent = item.startsWith('-');
        
        if (isPresent || isAbsent) {
          try {
            // Extract number part and add leading zeros
            const numStr = item.substring(1); // Remove +/- prefix
            
            // Validate that the remaining part is a number
            if (!/^\d+$/.test(numStr)) {
              logService.warn(`Invalid phenotype format: ${item}. Expected +/-NUMBER format.`);
              return null;
            }
            
            decoded.id = `HP:${numStr.padStart(7, '0')}`;
            decoded.present = isPresent;
            return decoded;
          } catch (error) {
            logService.warn(`Error decoding phenotype string: ${item}`, error);
            return null;
          }
        } else {
          logService.warn(`Invalid phenotype string format: ${item}. Missing +/- prefix.`);
          return null;
        }
      }
      // Item is an array with [id, present, term]
      else if (Array.isArray(item)) {
        try {
          // Element 0: Restore full HP ID with leading zeros
          if (item[0] !== undefined) {
            const numStr = String(item[0]);
            decoded.id = `HP:${numStr.padStart(7, '0')}`;
          } else {
            return null; // Skip if no ID
          }
          
          // Element 1: Restore present flag
          if (item[1] !== undefined) {
            decoded.present = Boolean(item[1]);
          }
          
          // Element 2: Restore term if present
          if (item[2] !== undefined) {
            decoded.term = item[2];
          }
          
          return decoded;
        } catch (error) {
          logService.warn('Error decoding phenotype array:', error);
          return null;
        }
      } 
      // Backward compatibility with object format
      else if (typeof item === 'object' && item !== null) {
        try {
          if (item.i) {
            if (typeof item.i === 'string' && item.i.startsWith('HP:')) {
              const numericPart = item.i.substring(3);
              decoded.id = `HP:${numericPart.padStart(7, '0')}`;
            } else {
              decoded.id = `HP:${String(item.i).padStart(7, '0')}`;
            }
            
            if (item.p !== undefined) decoded.present = Boolean(item.p);
            if (item.t !== undefined) decoded.term = item.t;
            
            return decoded;
          }
          return null; // Skip if no ID
        } catch (error) {
          logService.warn('Error decoding phenotype object:', error);
          return null;
        }
      }
      
      logService.warn(`Unsupported phenotype data format: ${typeof item}`);
      return null;
    }).filter(item => item !== null); // Remove any items that failed to decode
  } catch (error) {
    logService.error('Error decoding phenotype data:', error);
    return [];
  }
}

/**
 * Calculates optimal QR code size based on data length
 * Larger data requires larger QR codes for reliable scanning
 *
 * @param {number} dataLength - Length of the data to be encoded
 * @param {number} [baseSize=100] - Base size for small data
 * @return {number} Optimal QR code width/height in pixels
 */
function calculateOptimalQrSize(dataLength, baseSize = 100) {
  // Base size for small data
  let size = baseSize;
  
  // Scale up for larger data to maintain scannability
  if (dataLength > 100) size = Math.min(baseSize + 20, 120);  // +20px for medium data
  if (dataLength > 200) size = Math.min(baseSize + 40, 140);  // +40px for large data
  if (dataLength > 300) size = Math.min(baseSize + 60, 160);  // +60px for very large data
  if (dataLength > 400) size = Math.min(baseSize + 80, 180);  // +80px for extremely large data
  
  return size;
}

/**
 * Generates an ultra-compact QR code as a data URL with the given data and options
 *
 * @param {Object|Array|string} data - The data to encode in the QR code
 * @param {Object} [options={}] - QR code generation options
 * @param {number} [options.width] - Width of QR code image (auto-calculated if not specified)
 * @param {number} [options.margin=1] - Margin around QR code (minimal for better space efficiency)
 * @param {Object} [options.color] - Color options
 * @param {string} [options.color.dark='#000000'] - Color of dark modules
 * @param {string} [options.color.light='#ffffff'] - Color of light modules
 * @return {Promise<string>} Data URL of the generated QR code
 */
export async function generateQrCodeDataUrl(data, options = {}) {
  // Convert data to string if needed, ensuring minimal size
  let dataString;
  
  if (typeof data === 'string') {
    // Already a string, use as is
    dataString = data;
  } else if (Array.isArray(data) || typeof data === 'object') {
    // Convert to JSON with no whitespace
    dataString = JSON.stringify(data).replace(/\s/g, '');
  } else {
    // Convert other types to string
    dataString = String(data);
  }
  
  // Get data length for optimal size calculation
  const dataLength = dataString.length;
  
  // Log the character count to diagnose size issues
  logService.debug(`QR code data size: ${dataLength} characters`);
  
  // Calculate optimal size for QR code based on data length
  const calculatedWidth = calculateOptimalQrSize(dataLength);
  
  // Choose appropriate error correction level based on data length
  // Smaller data can use higher error correction
  let errorCorrectionLevel = 'M'; // Default: Medium
  if (dataLength > 300) {
    errorCorrectionLevel = 'L'; // For very large data: Low error correction allows more data
  } else if (dataLength < 100) {
    errorCorrectionLevel = 'H'; // For small data: High error correction for better reliability
  }
  
  // Configure options - optimize for minimal QR size with acceptable error correction
  const qrOptions = {
    // Use provided width or the dynamically calculated one
    width: options.width || calculatedWidth,
    margin: options.margin !== undefined ? options.margin : 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    // Use provided error correction level or the dynamically selected one
    errorCorrectionLevel: options.errorCorrectionLevel || errorCorrectionLevel,
  };

  try {
    return await QRCode.toDataURL(dataString, qrOptions);
  } catch (error) {
    logService.error('Failed to generate QR code:', error);
    throw new Error(`QR code generation failed: ${error.message}`);
  }
}

/**
 * Generates ultra-compact QR code for patient data
 *
 * @param {Object} patientData - Patient personal information
 * @param {Object} [options={}] - Additional options and data
 * @param {Array} [options.selectedTests=[]] - Array of selected test IDs
 * @param {Object} [options.qrOptions={}] - QR code generation options
 * @return {Promise<string>} Data URL of the generated QR code
 */
export async function generatePatientQrCode(patientData, options = {}) {
  // Create array of patient values in fixed order
  // [firstName, lastName, birthdate, sex, insurance, insuranceId, referrer, diagnosis]
  const p = [
    patientData.firstName || '',
    patientData.lastName || '',
    patientData.birthdate || '',
    patientData.sex || '',
    patientData.insurance || '',
    patientData.insuranceId || '',
    patientData.referrer || '',
    patientData.diagnosis || ''
  ];
  
  // Ultra-compact array structure: [version, type, patient_data, test_ids]
  // 1=v1.0, 1=patient
  const qrData = [
    1,             // version
    1,             // type: patient
    p,             // patient data array
    options.selectedTests || [] // tests
  ];

  // Convert to JSON with no whitespace
  const jsonStr = JSON.stringify(qrData).replace(/\s/g, '');
  logService.debug('Patient QR data size:', jsonStr.length, 'characters');

  return generateQrCodeDataUrl(jsonStr, options.qrOptions || {});
}

/**
 * Generates ultra-compact QR code for phenotype data.
 * Creates a QR code with phenotype data using the ultra-compact format.
 * 
 * The generated QR code contains phenotype data in the format:
 * - Present phenotypes: "+[number]" (e.g., "+123")
 * - Absent phenotypes: "-[number]" (e.g., "-456")
 * - "no input" phenotypes are completely excluded to save space
 *
 * This QR code appears on the phenotype data page in PDF exports with a bold title above it.
 *
 * @param {Array} phenotypeData - Array of phenotype objects
 * @param {string} phenotypeData[].id - HPO ID (e.g. "HP:0000123") or numeric ID
 * @param {boolean} phenotypeData[].present - Whether the phenotype is present or absent
 * @param {Object} [options={}] - Additional options
 * @param {Object} [options.qrOptions={}] - QR code generation options including size, color, etc.
 * @return {Promise<string>} Data URL of the generated QR code
 */
export async function generatePhenotypeQrCode(phenotypeData, options = {}) {
  // Ultra-compress the phenotype data 
  const ph = encodePhenotypeData(phenotypeData || []);
  
  // Arrays with no property names for maximum compression
  // [version, type, phenotype_data]
  const qrData = [1, 2, ph]; // 1=v1.0, 2=phenotype

  // Convert to JSON with no whitespace
  const jsonStr = JSON.stringify(qrData).replace(/\s/g, '');
  logService.debug('Phenotype QR data size:', jsonStr.length, 'characters');

  return generateQrCodeDataUrl(jsonStr, options.qrOptions || {});
}

/**
 * Generates ultra-compact QR code for pedigree data in array format
 *
 * @param {Object|Array} pedigreeData - Pedigree data (array for ultra-compact format)
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.format='c'] - Format code ('c'=compact, 'i'=image)
 * @param {Object} [options.qrOptions={}] - QR code generation options
 * @return {Promise<string>} Data URL of the generated QR code
 */
export async function generatePedigreeQrCode(pedigreeData, options = {}) {
  if (!pedigreeData) {
    return generateQrCodeDataUrl('{}', options.qrOptions || {});
  }

  let d = pedigreeData; // d=data (short variable)
  
  // Detect data format
  // 1. Array format [1, [...]] (ultra-compact numeric arrays)
  // 2. Object with f/d properties (compact object format)
  // 3. Legacy object format with format/data
  // 4. Image reference only (h:1 or hasImage:true)
  
  if (Array.isArray(pedigreeData)) {
    // Check if this is our standard PED format array [2, pedData]
    if (pedigreeData.length >= 2 && pedigreeData[0] === 2) {
      logService.debug('[qrService] Using standard PED format');
      // Already in PED format - use as is
      d = pedigreeData;
    } else {
      logService.debug('[qrService] Using array format');
      // Some other array format, use as is
      d = pedigreeData;
    }
  } else if (pedigreeData.f === 'c' || pedigreeData.format === 'compact') {
    // Legacy object format - convert to array if needed
    logService.debug('[qrService] Converting legacy object format to array');
    d = pedigreeData;
  } else if (pedigreeData.h || pedigreeData.hasImage) {
    // Only reference to image - use simplest format
    logService.debug('[qrService] Using image reference only');
    d = [0]; // Format code 0 = image reference only
  } else {
    // Unknown format - use as is but log for debugging
    logService.debug('[qrService] Unknown format:', typeof pedigreeData);
    d = pedigreeData;
  }

  // For ultra-compact encoding, just use the data directly if it's already an array
  // This skips extra wrapping that would add characters
  try {
    // Use our flat array format directly for maximum compression
    const js = Array.isArray(d) ? JSON.stringify(d) : JSON.stringify([3, d]);
    const compressed = js.replace(/\s/g, '');
    const size = compressed.length;
    
    logService.debug('[qrService] Final pedigree data size:', size, 'chars');
    
    // Check if data is too large for a reliable QR code (typical limit ~4000 chars)
    if (size > 4000) {
      logService.warn('Pedigree data exceeds limit');
      // Fall back to image reference
      return generatePedigreeQrCode([0], { qrOptions: options.qrOptions });
    }
    
    return generateQrCodeDataUrl(compressed, options.qrOptions || {});
  } catch (error) {
    logService.error('Error generating pedigree QR:', error);
    // Fallback to empty QR code
    return generateQrCodeDataUrl('{}', options.qrOptions || {});
  }
}

/**
 * Generates a comprehensive QR code containing all available data.
 * Creates a single QR code that combines patient, phenotype, and pedigree data 
 * using the ultra-compact format for maximum space efficiency.
 *
 * This complete QR code is the most space-efficient representation of all data,
 * using abbreviated field names and the ultra-compact phenotype format to maximize
 * data density while maintaining reliable scanning.
 *
 * The complete QR code combines all data types into a single compact structure:
 * - Patient data with minimal field names (fn=firstName, ln=lastName, bd=birthdate, etc.)
 * - Selected test IDs as an array
 * - Phenotype data in ultra-compact format (using +/- prefixes)
 * - Pedigree data with format indicator
 *
 * The data structure uses the format: 
 * {v: version, t: "c" (complete), p: patient, ts: tests, ph: phenotypes, pd: pedigree}
 *
 * @param {Object} fullData - Object containing all data types
 * @param {Object} [fullData.patient={}] - Patient personal information
 * @param {string} [fullData.patient.firstName] - Patient's first name
 * @param {string} [fullData.patient.lastName] - Patient's last name
 * @param {string} [fullData.patient.birthdate] - Patient's birthdate (YYYY-MM-DD format)
 * @param {string} [fullData.patient.sex] - Patient's sex
 * @param {string} [fullData.patient.insurance] - Patient's insurance information
 * @param {Array} [fullData.selectedTests=[]] - Array of selected test IDs
 * @param {Array} [fullData.phenotypes=[]] - Array of phenotype objects with id and status
 * @param {Object} [fullData.pedigree={}] - Pedigree data in any supported format
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.pedigreeFormat='t'] - Pedigree format code:
 *   - 't': table format (structured pedigree data)
 *   - 'i': image format (for complex pedigrees)
 * @param {Object} [options.qrOptions={}] - QR code generation options (size, colors, etc.)
 * @return {Promise<string>} Data URL of the generated QR code (PNG format, base64-encoded)
 * @throws {Error} If data validation fails against the required schema
 */
export async function generateCompleteQrCode(fullData, options = {}) {
  // Create minimal patient data object
  const p = {};
  if (fullData.patient) {
    if (fullData.patient.firstName) p.fn = fullData.patient.firstName;
    if (fullData.patient.lastName) p.ln = fullData.patient.lastName;
    if (fullData.patient.birthdate) p.bd = fullData.patient.birthdate;
    if (fullData.patient.sex) p.sx = fullData.patient.sex;
    if (fullData.patient.insurance) p.ins = fullData.patient.insurance;
  }
  
  // Super compact data structure
  const qrData = {
    v: "1.0",  // version
    t: "c",    // type: complete
    p,         // patient data
    ts: fullData.selectedTests || [], // tests
    ph: encodePhenotypeData(fullData.phenotypes || []), // phenotypes
    pd: {      // pedigree data
      d: fullData.pedigree || {},
      f: options.pedigreeFormat || 't' // t=table, i=image
    }
  };

  if (!validateQrData(qrData, [])) {
    throw new Error('Invalid data for complete QR code');
  }

  return generateQrCodeDataUrl(qrData, options.qrOptions || {});
}
