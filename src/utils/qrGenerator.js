/**
 * @fileoverview Utility module for generating QR codes.
 *
 * This module provides functions to generate QR code data URLs
 * from given text content. It uses the 'qrcode' library.
 *
 * @see https://github.com/soldair/node-qrcode
 */

import QRCode from 'qrcode';

/**
 * Generates a QR code image as a data URL.
 *
 * @param {string} text The text content to encode in the QR code.
 * @param {object} [options] Optional QR code generation options (qrcode library options).
 * @param {number} [options.width=128] The desired width/height of the QR code image in pixels.
 * @param {number} [options.margin=1] The width of the quiet zone border.
 * @param {object} [options.color] Color options.
 * @param {string} [options.color.dark='#000000'] Color of the dark modules.
 * @param {string} [options.color.light='#ffffff'] Color of the light modules.
 * @returns {Promise<string>} A promise that resolves with the data URL (PNG) of the generated QR code.
 * @throws {Error} Throws an error if QR code generation fails.
 */
export async function generateQrCodeDataUrl(text, options = {}) {
  const defaultOptions = {
    width: options.width || 128, // Match the previous size used
    margin: options.margin || 1,   // A small margin is usually good
    color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'M', // Medium error correction
  };

  try {
    // The 'qrcode' library's toDataURL function directly accepts the text and options.
    const dataUrl = await QRCode.toDataURL(text, defaultOptions);
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    throw new Error(`QR code generation failed: ${err.message}`);
  }
}
