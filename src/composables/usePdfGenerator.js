/**
 * @fileoverview Composable for handling PDF generation.
 * 
 * This composable encapsulates the logic for triggering PDF generation
 * via the PdfGenerator component. It provides a unified interface for generating
 * PDFs from any part of the application.
 * 
 * The PDF generator handles multiple types of content:
 * - Patient information with QR code
 * - Phenotype data with QR code (using the ultra-compact format)
 * - Pedigree visualization when available
 * 
 * Each section can be generated separately or as a complete document.
 */

import { ref } from 'vue';
import { useUiStore } from '../stores/uiStore';

/**
 * Vue composable that provides PDF generation functionality for the application.
 * Uses Vue's Composition API to manage PDF generation state and operations.
 * 
 * @returns {Object} Object containing the following:
 *   @returns {Ref<Component>} pdfGeneratorRef - Reference to the PDF generator component
 *   @returns {Function} setPdfGeneratorRef - Function to set the PDF generator component reference
 *   @returns {Function} generateFullPdf - Function to generate a complete PDF with all sections
 *   @returns {Function} generatePatientPdf - Function to generate a PDF with only patient data
 *   @returns {Function} generatePhenotypePdf - Function to generate a PDF with only phenotype data
 *   @returns {Function} generatePedigreePdf - Function to generate a PDF with only pedigree data
 */
export function usePdfGenerator() {
  // Reference to the PDF generator component
  const pdfGeneratorRef = ref(null);
  
  // Get UI store for notifications
  const uiStore = useUiStore();
  
  /**
   * Sets the reference to the PDF generator component
   * @param {Object} ref - Reference to the PDF generator component
   */
  function setPdfGeneratorRef(ref) {
    pdfGeneratorRef.value = ref;
  }
  
  /**
   * Triggers PDF generation
   * @returns {Promise<boolean>} Success status
   */
  async function generatePdf() {
    if (!pdfGeneratorRef.value) {
      console.error('PDF generator component reference not available');
      uiStore.showSnackbar('Could not generate PDF. Please try again.');
      return false;
    }
    
    try {
      // Call the generatePdf method on the component
      await pdfGeneratorRef.value.generatePdf();
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      uiStore.showSnackbar('Error generating PDF. Please try again.');
      return false;
    }
  }
  
  return {
    // Methods
    setPdfGeneratorRef,
    generatePdf,
  };
}
