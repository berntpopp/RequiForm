/**
 * @fileoverview Composable for handling PDF generation.
 * 
 * This composable encapsulates the logic for triggering PDF generation
 * via the PdfGenerator component.
 */

import { ref } from 'vue';
import { useUiStore } from '../stores/uiStore';

/**
 * Composable for PDF generation functionality
 * @returns {Object} PDF generation methods
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
