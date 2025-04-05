/**
 * @fileoverview QR code service module for generating specialized QR codes.
 *
 * This module provides a centralized service for generating QR codes with
 * specific data formats for different parts of the application. It handles
 * patient data, phenotype data, and pedigree data encoding.
 * 
 * QR Data Format Specification:
 * - Patient data: [version, type, patientDataArray, selectedTests]
 *   Where patientDataArray contains patient info in a compact array format
 * 
 * - Phenotype data: [version, type, phenotypeArray]
 *   Where phenotypeArray contains strings in format "+123" or "-123"
 *   + prefix indicates present phenotype
 *   - prefix indicates absent phenotype
 *   Numbers are the HPO ID without the "HP:" prefix
 * 
 * - Pedigree data: [version, type, [pedigreeData, format]]
 *   Where format is either 't' (table) or 'i' (image)
 * 
 * - Complete data: Object with all data types in compact format
 */

import QRCode from 'qrcode';
import qrMappingSchema from '../config/qrMappingSchema.json';

/**
 * Validates if an object conforms to the compact QR mapping schema
 *
 * @param {Object} data - The data object to validate
 * @param {Array<string>} requiredProperties - Array of properties that must exist
 * @return {boolean} Whether the data is valid
 */
function validateQrData(data, requiredProperties = []) {
  if (!data || typeof data !== 'object') {
    console.error('QR data validation failed: Data must be an object');
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
    console.error(`QR data validation failed: Invalid type "${data.t}"`);
    return false;
  }

  // Check required properties
  for (const prop of requiredProperties) {
    if (!data[prop]) {
      console.error(`QR data validation failed: Missing required property "${prop}"`);
      return false;
    }
  }

  return true;
}

/**
 * Ultra-compresses phenotype data for minimal QR code size
 * Transforms "HP:0000123: present" to just "+123" (+ for present, - for absent)
 *
 * @param {Array} phenotypeData - Array of phenotype objects with format {id: string, present: boolean}
 * @return {Array} Ultra-compressed phenotype data array with +/- prefixes
 * @example
 * // Input: [{id: "HP:0000123", present: true}, {id: "HP:0000456", present: false}]
 * // Output: ["+123", "-456"]
 */
export function encodePhenotypeData(phenotypeData) {
  if (!phenotypeData || !Array.isArray(phenotypeData)) {
    console.warn('Invalid phenotype data provided for QR encoding');
    return [];
  }

  try {
    // Use even more compact format: just a string array with +/- prefixes
    const encoded = phenotypeData.map(item => {
      // Skip items without an ID
      if (!item || !item.id) {
        console.debug('Skipping phenotype item with no ID');
        return null;
      }
      
      let hpoNumber;
      
      // Extract just the numeric part from HP:0000123
      if (typeof item.id === 'string' && item.id.startsWith('HP:')) {
        // Remove HP: prefix and leading zeros
        hpoNumber = parseInt(item.id.substring(3), 10);
        if (isNaN(hpoNumber)) {
          console.warn(`Invalid HPO ID format: ${item.id}`);
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
    console.error('Error encoding phenotype data:', error);
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
    console.warn('Invalid encoded phenotype data provided for decoding');
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
              console.warn(`Invalid phenotype format: ${item}. Expected +/-NUMBER format.`);
              return null;
            }
            
            decoded.id = `HP:${numStr.padStart(7, '0')}`;
            decoded.present = isPresent;
            return decoded;
          } catch (error) {
            console.warn(`Error decoding phenotype string: ${item}`, error);
            return null;
          }
        } else {
          console.warn(`Invalid phenotype string format: ${item}. Missing +/- prefix.`);
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
          console.warn('Error decoding phenotype array:', error);
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
          console.warn('Error decoding phenotype object:', error);
          return null;
        }
      }
      
      console.warn(`Unsupported phenotype data format: ${typeof item}`);
      return null;
    }).filter(item => item !== null); // Remove any items that failed to decode
  } catch (error) {
    console.error('Error decoding phenotype data:', error);
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
  console.log(`QR code data size: ${dataLength} characters`);
  
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
    console.error('Failed to generate QR code:', error);
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
  console.log('Patient QR data size:', jsonStr.length, 'characters');

  return generateQrCodeDataUrl(jsonStr, options.qrOptions || {});
}

/**
 * Generates ultra-compact QR code for phenotype data
 *
 * @param {Array} phenotypeData - Array of phenotype objects
 * @param {Object} [options={}] - Additional options
 * @param {Object} [options.qrOptions={}] - QR code generation options
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
  console.log('Phenotype QR data size:', jsonStr.length, 'characters');

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
      console.log('[qrService] Using standard PED format');
      // Already in PED format - use as is
      d = pedigreeData;
    } else {
      console.log('[qrService] Using array format');
      // Some other array format, use as is
      d = pedigreeData;
    }
  } else if (pedigreeData.f === 'c' || pedigreeData.format === 'compact') {
    // Legacy object format - convert to array if needed
    console.log('[qrService] Converting legacy object format to array');
    d = pedigreeData;
  } else if (pedigreeData.h || pedigreeData.hasImage) {
    // Only reference to image - use simplest format
    console.log('[qrService] Using image reference only');
    d = [0]; // Format code 0 = image reference only
  } else {
    // Unknown format - use as is but log for debugging
    console.log('[qrService] Unknown format:', typeof pedigreeData);
    d = pedigreeData;
  }

  // For ultra-compact encoding, just use the data directly if it's already an array
  // This skips extra wrapping that would add characters
  try {
    // Use our flat array format directly for maximum compression
    const js = Array.isArray(d) ? JSON.stringify(d) : JSON.stringify([3, d]);
    const compressed = js.replace(/\s/g, '');
    const size = compressed.length;
    
    console.log('[qrService] Final pedigree data size:', size, 'chars');
    
    // Check if data is too large for a reliable QR code (typical limit ~4000 chars)
    if (size > 4000) {
      console.warn('Pedigree data exceeds limit');
      // Fall back to image reference
      return generatePedigreeQrCode([0], { qrOptions: options.qrOptions });
    }
    
    return generateQrCodeDataUrl(compressed, options.qrOptions || {});
  } catch (error) {
    console.error('Error generating pedigree QR:', error);
    // Fallback to empty QR code
    return generateQrCodeDataUrl('{}', options.qrOptions || {});
  }
}

/**
 * Generates a minimal QR code containing all available data
 *
 * @param {Object} fullData - Object containing all data types
 * @param {Object} [fullData.patient={}] - Patient personal information
 * @param {Array} [fullData.selectedTests=[]] - Array of selected test IDs
 * @param {Array} [fullData.phenotypes=[]] - Array of phenotype objects
 * @param {Object} [fullData.pedigree={}] - Pedigree data
 * @param {Object} [options={}] - Additional options
 * @param {Object} [options.qrOptions={}] - QR code generation options
 * @return {Promise<string>} Data URL of the generated QR code
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
