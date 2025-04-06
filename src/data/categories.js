/**
 * @fileoverview Test categories data for RequiForm.
 * @module data/categories
 */

import testsData from './tests.json';

/**
 * Categories data extracted from tests.json.
 * Provides information about test categories and their associated tests.
 * Used for displaying grouped panel details and filtering options in the UI.
 */
export const categories = testsData.categories || [];
