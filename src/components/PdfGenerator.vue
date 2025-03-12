<template>
  <div>
    <v-btn @click="generatePdf" color="primary" dark>
      Generate PDF
    </v-btn>
    <!-- Hidden container for the QR code -->
    <div ref="qrContainer" style="display: none;">
      <qrcode-vue :value="qrContent" :size="128" />
    </div>
  </div>
</template>

<script setup>
import { jsPDF } from 'jspdf';
import { defineProps, ref, nextTick, computed, defineExpose } from 'vue';
import QrcodeVue from 'qrcode.vue';
import pdfConfig from '../data/pdfConfig.json';
import testsData from '../data/tests.json';

// Define props for patient data and selected tests.
const props = defineProps({
  patientData: { type: Object, required: true },
  selectedTests: { type: Array, required: true }
});

// Expose generatePdf for external calls.
defineExpose({ generatePdf });

// Reference for the hidden QR code container.
const qrContainer = ref(null);

// Compute grouped panels by category.
const groupedPanels = computed(() => {
  return testsData.categories
    .map(category => ({
      categoryTitle: category.title,
      tests: category.tests.filter(test => props.selectedTests.includes(test.id))
    }))
    .filter(group => group.tests.length > 0);
});

// Compute QR code content.
const qrContent = computed(() => {
  return `Given Name: ${props.patientData.givenName}, Family Name: ${props.patientData.familyName}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(', ')}`;
});

/**
 * Replace placeholders in a template string with actual values from mapping.
 * Returns an empty string if a variable is missing.
 *
 * @param {string} template - The template string containing placeholders.
 * @param {Object} mapping - The mapping of placeholders to values.
 * @return {string} - The resulting string with placeholders replaced.
 */
function mapTemplateString(template, mapping) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, key) =>
    key in mapping ? mapping[key] : ''
  );
}

/**
 * Renders a text element on the PDF.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The text element configuration.
 * @param {Object} mapping - The mapping of placeholders to values.
 */
function renderText(doc, element, mapping) {
  const text = mapTemplateString(element.content, mapping);
  if (element.style) {
    doc.setFont(element.style.font || 'Helvetica', element.style.fontStyle || 'normal');
    doc.setFontSize(element.style.fontSize || 12);
    doc.setTextColor(element.style.color || '#000000');
  }
  doc.text(text, element.position.x, element.position.y);
}

/**
 * Renders an image element on the PDF.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The image element configuration.
 * @param {Object} mapping - The mapping of placeholders to values.
 */
function renderImage(doc, element, mapping) {
  const imageData = mapTemplateString(element.source, mapping);
  doc.addImage(
    imageData,
    'PNG',
    element.position.x,
    element.position.y,
    element.size.width,
    element.size.height
  );
}

/**
 * Renders a rectangle element on the PDF.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The rectangle element configuration.
 */
function renderRectangle(doc, element) {
  const { x, y } = element.position;
  const { width, height } = element.size;
  const style = element.style || {};
  if (style.fill && style.fillColor) {
    doc.setFillColor(style.fillColor);
  }
  if (style.borderColor) {
    doc.setDrawColor(style.borderColor);
  }
  doc.setLineWidth(style.borderWidth || 1);
  let rectStyle = 'S';
  if (style.fill && style.fillColor) {
    rectStyle = style.borderWidth ? 'DF' : 'F';
  }
  doc.rect(x, y, width, height, rectStyle);
}

/**
 * Renders a line element on the PDF.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The line element configuration.
 */
function renderLine(doc, element) {
  const { x: startX, y: startY } = element.start;
  const { x: endX, y: endY } = element.end;
  const style = element.style || {};
  doc.setLineWidth(style.lineWidth || 1);
  if (style.color) {
    doc.setDrawColor(style.color);
  }
  doc.line(startX, startY, endX, endY);
}

/**
 * Renders all elements in a section on the PDF.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} section - The section configuration.
 * @param {Object} mapping - The mapping of placeholders to values.
 */
function renderSection(doc, section, mapping) {
  if (!section || !section.elements) return;
  section.elements.forEach(element => {
    switch (element.type) {
      case 'text':
        renderText(doc, element, mapping);
        break;
      case 'image':
        renderImage(doc, element, mapping);
        break;
      case 'rectangle':
        renderRectangle(doc, element);
        break;
      case 'line':
        renderLine(doc, element);
        break;
      default:
        console.warn('Unknown element type:', element.type);
    }
  });
}

/**
 * Renders a category header as a subheader in the PDF.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {string} categoryTitle - The category title.
 * @param {number} offsetX - The x-coordinate for the header.
 * @param {number} y - The y-coordinate for the header.
 * @param {number} spacing - The vertical spacing after the header.
 * @return {number} - The new y-coordinate after rendering.
 */
function renderCategoryHeader(doc, categoryTitle, offsetX, y, spacing) {
  const headerStyle = {
    font: 'Helvetica',
    fontStyle: 'bold',
    fontSize: 12,
    color: '#000000'
  };
  doc.setFont(headerStyle.font, headerStyle.fontStyle);
  doc.setFontSize(headerStyle.fontSize);
  doc.setTextColor(headerStyle.color);
  doc.text(categoryTitle, offsetX, y);
  const textWidth = doc.getTextWidth(categoryTitle);
  // Draw an underline below the header.
  doc.line(offsetX, y + 2, offsetX + textWidth, y + 2);
  return y + spacing;
}

/**
 * Renders a single panel on the PDF and returns the new y-coordinate.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} panel - The panel configuration.
 * @param {number} offsetX - The x-coordinate for the panel.
 * @param {number} y - The y-coordinate for the panel.
 * @param {number} spacing - The vertical spacing after rendering.
 * @return {number} - The new y-coordinate after rendering.
 */
function renderPanel(doc, panel, offsetX, y, spacing) {
  const panelNameStyle = panel.style || { font: 'Helvetica', fontStyle: 'bold', fontSize: 12, color: '#000000' };
  doc.setFont(panelNameStyle.font, panelNameStyle.fontStyle);
  doc.setFontSize(panelNameStyle.fontSize);
  doc.setTextColor(panelNameStyle.color);
  doc.text(panel.name, offsetX, y);
  y += spacing;
  if (panel.genes && panel.genes.length > 0) {
    const panelGeneStyle = panel.geneStyle || { font: 'Helvetica', fontStyle: 'italic', fontSize: 10, color: '#000000' };
    doc.setFont(panelGeneStyle.font, panelGeneStyle.fontStyle);
    doc.setFontSize(panelGeneStyle.fontSize);
    doc.setTextColor(panelGeneStyle.color);
    const geneText = panel.genes.join(', ');
    const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40;
    const lines = doc.splitTextToSize(geneText, maxWidth);
    lines.forEach(line => {
      doc.text(line, offsetX, y);
      y += spacing;
    });
  }
  // Reset font to default.
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  return y;
}

/**
 * Main function to generate the PDF.
 * Renders header, body, grouped panels with category headers, QR code, and footer.
 */
async function generatePdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 50;

  // Merge placeholders.
  const mapping = {
    ...props.patientData,
    ...pdfConfig.header,
    ...pdfConfig.footer
  };

  // Render header and body on page 1.
  if (pdfConfig.header) {
    renderSection(doc, pdfConfig.header, mapping);
  }
  if (pdfConfig.body) {
    renderSection(doc, pdfConfig.body, mapping);
  }

  // Panels configuration.
  const { baseY = 350, maxHeight = 600, spacing = 14, offsetX = 60, secondPageBaseY = 50 } =
    pdfConfig.panels || {};

  let y = baseY;

  // Render grouped panels with category headers.
  groupedPanels.value.forEach(group => {
    // Check if the category header fits on the current page.
    if (y + spacing > maxHeight) {
      doc.addPage();
      y = secondPageBaseY;
    }
    // Render the category header.
    y = renderCategoryHeader(doc, group.categoryTitle, offsetX, y, spacing);
    group.tests.forEach(panel => {
      let requiredHeight = spacing;
      if (panel.genes && panel.genes.length > 0) {
        const geneText = panel.genes.join(', ');
        const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40;
        const lines = doc.splitTextToSize(geneText, maxWidth);
        requiredHeight += lines.length * spacing;
      }
      // If the panel does not fit, add a new page.
      if (y + requiredHeight > maxHeight) {
        doc.addPage();
        y = secondPageBaseY;
      }
      y = renderPanel(doc, panel, offsetX, y, spacing);
    });
  });

  // Render footer on page 1.
  if (pdfConfig.footer) {
    renderSection(doc, pdfConfig.footer, mapping);
  }

  // Render QR code on page 1 in nextTick.
  nextTick(() => {
    const canvas = qrContainer.value?.querySelector('canvas');
    if (canvas && pdfConfig.qr?.position && pdfConfig.qr?.size) {
      doc.setPage(1); // Ensure we're on page 1.
      doc.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        pdfConfig.qr.position.x,
        pdfConfig.qr.position.y,
        pdfConfig.qr.size.width,
        pdfConfig.qr.size.height
      );
    }
    // Add page numbers if more than one page is present.
    const totalPages = doc.internal.getNumberOfPages();
    if (totalPages > 1 && pdfConfig.pageNumber && pdfConfig.pageNumber.enabled) {
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const { x, y: posY } = pdfConfig.pageNumber.position;
        const pageText = `Page ${p} of ${totalPages}`;
        doc.setFont(pdfConfig.pageNumber.font || 'Helvetica', pdfConfig.pageNumber.fontStyle || 'normal');
        doc.setFontSize(pdfConfig.pageNumber.fontSize || 10);
        doc.setTextColor(pdfConfig.pageNumber.color || '#000000');
        doc.text(pageText, x, posY);
      }
    }
    doc.save('genetic_test_requisition.pdf');
  });
}
</script>

<style scoped>
/* Scoped styles if needed */
</style>
