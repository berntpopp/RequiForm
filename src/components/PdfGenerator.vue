<template>
  <div>
    <v-btn @click="generatePdf" color="primary" dark>
      Generate PDF
    </v-btn>
  </div>
</template>

<script setup>
import { jsPDF } from 'jspdf';
import { defineProps, computed, defineExpose, inject } from 'vue';
import pdfConfig from '../data/pdfConfig.json';
import testsData from '../data/tests.json';
import { generateQrCodeDataUrl } from '../utils/qrGenerator';

// Define props for backward compatibility
const props = defineProps({
  patientData: {
    type: Object,
    required: true,
  },
  selectedTests: {
    type: Array,
    required: true,
  },
  pedigreeDataUrl: { type: String, required: false, default: '' },
  phenotypeData: { type: Object, required: false, default: () => ({}) },
});

// Inject the unified patient data model
const unifiedPatientData = inject('patientData', null);

// Expose generatePdf for external calls.
defineExpose({ generatePdf });

// Compute grouped test panels from either unified model or legacy props
const groupedPanels = computed(() => {
  // Determine which tests to use (prefer unified model if available)
  const testsToUse = unifiedPatientData?.selectedPanels || props.selectedTests || [];
  
  return testsData.categories
    .map((category) => ({
      categoryTitle: category.title,
      id: category.id,
      tests: category.tests.filter((test) =>
        testsToUse.includes(test.id)
      )
    }))
    .filter((group) => group.tests.length > 0);
});

// Compute QR code content using either unified model or legacy props
const qrContent = computed(() => {
  // Prefer unified model if available
  if (unifiedPatientData?.personalInfo) {
    const personalInfo = unifiedPatientData.personalInfo;
    const testsToUse = unifiedPatientData.selectedPanels || props.selectedTests || [];
    
    return `Given Name: ${personalInfo.firstName || ''}, Family Name: ${personalInfo.lastName || ''}, Birthdate: ${personalInfo.birthdate || ''}, Insurance: ${personalInfo.insurance || ''}, Tests: ${testsToUse.join(', ')}`;
  }
  
  // Fallback to legacy props
  return `Given Name: ${props.patientData.givenName || ''}, Family Name: ${props.patientData.familyName || ''}, Birthdate: ${props.patientData.birthdate || ''}, Insurance: ${props.patientData.insurance || ''}, Tests: ${props.selectedTests.join(', ')}`;
});

// Utility: Replace placeholders in a template string with values from mapping.
function mapTemplateString(template, mapping) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, key) =>
    key in mapping ? mapping[key] : ''
  );
}

// Utility: Convert yes/no to German labels.
function toYesNo(value) {
  return value === 'yes' ? 'Ja' : 'Nein';
}

// ------------------------
// Common Render Functions
// ------------------------
function renderText(doc, element, mapping) {
  const text = mapTemplateString(element.content, mapping);
  if (element.style) {
    doc.setFont(element.style.font || 'Helvetica', element.style.fontStyle || 'normal');
    doc.setFontSize(element.style.fontSize || 12);
    doc.setTextColor(element.style.color || '#000000');
  }
  doc.text(text, element.position.x, element.position.y);
}

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

function renderSection(doc, section, mapping) {
  if (!section || !section.elements) return;
  section.elements.forEach((element) => {
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

function renderCategoryHeader(doc, categoryTitle, offsetX, y, spacing) {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#000000');
  doc.text(categoryTitle, offsetX, y);
  const textWidth = doc.getTextWidth(categoryTitle);
  doc.line(offsetX, y + 2, offsetX + textWidth, y + 2);
  return y + spacing;
}

function renderPanel(doc, panel, offsetX, y, spacing) {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#000000');
  doc.text(panel.name, offsetX, y);
  y += spacing;
  if (panel.genes && panel.genes.length > 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    const geneText = panel.genes.join(', ');
    const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40;
    const lines = doc.splitTextToSize(geneText, maxWidth);
    lines.forEach((line) => {
      doc.text(line, offsetX, y);
      y += spacing;
    });
  }
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  return y;
}

function renderPhenotypePage(doc) {
  // Determine which phenotype data to use (prefer unified model if available)
  const phenotypeDataToUse = unifiedPatientData?.phenotypeData?.length > 0
    ? convertUnifiedPhenotypeDataToMap(unifiedPatientData.phenotypeData)
    : props.phenotypeData;
    
  /**
   * Helper function to convert unified phenotype data array to the map format needed for rendering
   * @param {Array} phenotypeArray - Unified format: [{categoryId, phenotypeId, status}]
   * @return {Object} - Format: {categoryId: {phenotypeId: status}}
   */
  function convertUnifiedPhenotypeDataToMap(phenotypeArray) {
    if (!phenotypeArray || !Array.isArray(phenotypeArray)) return {};
    
    return phenotypeArray.reduce((result, item) => {
      if (!result[item.categoryId]) {
        result[item.categoryId] = {};
      }
      result[item.categoryId][item.phenotypeId] = item.status;
      return result;
    }, {});
  }
  
  // Check if we have any non-empty phenotype data to render
  let hasPhenotype = false;
  for (const cat in phenotypeDataToUse) {
    for (const phen in phenotypeDataToUse[cat]) {
      if (phenotypeDataToUse[cat][phen] !== 'no input') {
        hasPhenotype = true;
        break;
      }
    }
    if (hasPhenotype) break;
  }
  if (!hasPhenotype) return;
  doc.addPage();
  let currentY = 40;
  const leftMargin = 40;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Phenotype Information', leftMargin, currentY);
  currentY += 20;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  for (const catId in phenotypeDataToUse) {
    const category = testsData.categories.find((c) => c.id === catId);
    if (!category || !category.phenotypes) continue;
    const phenotypes = category.phenotypes.filter(
      (p) => phenotypeDataToUse[catId][p.id] !== 'no input'
    );
    if (phenotypes.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.text(category.title, leftMargin, currentY);
      currentY += 16;
      doc.setFont('Helvetica', 'normal');
      phenotypes.forEach((p) => {
        const state = phenotypeDataToUse[catId][p.id];
        const line = `${p.name} (${p.hpo}): ${state}`;
        doc.text(line, leftMargin, currentY);
        currentY += 14;
        if (currentY > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          currentY = 40;
        }
      });
      currentY += 10;
    }
  }
}

/**
 * Renders the consent page in English using paragraphs and signature area from pdfConfig.consent.
 */
function renderConsentPage(doc) {
  console.log("Rendering consent page...");
  try {
    // Access consent data via patientData prop
    if (!props.patientData.genDGConsentData || !props.patientData.genDGConsentData.form) {
      console.error("Consent form data is missing in PdfGenerator");
      return; // Don't attempt to render if data is missing
    }

    // Use the nested form object from the patientData prop
    const consentFormData = props.patientData.genDGConsentData.form;
    const consentConfig = pdfConfig.consent;

    console.log("Consent Form Data:", JSON.stringify(consentFormData));
    console.log("Consent Config:", JSON.stringify(consentConfig));

    // Map the form data to the placeholders used in pdfConfig.json
    const mapping = {
      consentName: consentFormData.consentName || '', // Used in paragraph 2
      // Map form data (yes/no) to labels using the toYesNo helper
      zufallsbefundeLabel: toYesNo(consentFormData.questionSecondaryFindings), // Used in paragraph 3
      materialLabel: toYesNo(consentFormData.questionMaterial),           // Used in paragraph 4
      extendedLabel: toYesNo(consentFormData.questionExtended),           // Used in paragraph 5
      researchLabel: toYesNo(consentFormData.questionResearch),           // Used in paragraph 6
    };

    doc.addPage();
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    let currentY = consentConfig.startY || 40; // Start Y position from config or default
    const leftX = 40;
    const rightMargin = 40;
    const maxWidth = doc.internal.pageSize.getWidth() - leftX - rightMargin;
    const lineSpacing = consentConfig.lineSpacing || 5;
    const paragraphSpacing = consentConfig.paragraphSpacing || 10;

    // Render title (Using German title from config)
    if (consentConfig.title) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(consentConfig.title.fontSize || 14);
      // Use the title directly from the config
      const titleLines = doc.splitTextToSize(consentConfig.title, maxWidth);
      titleLines.forEach((line) => {
        doc.text(line, leftX, currentY);
        currentY += (consentConfig.title.fontSize || 14) * 0.5; // Adjust spacing based on font size
      });
      currentY += lineSpacing; // Add spacing after title
      doc.setFont('Helvetica', 'normal'); // Reset font
      doc.setFontSize(10);
    }

    // Render each paragraph from the config
    console.log("Rendering paragraphs...");
    consentConfig.paragraphs.forEach((paragraphTemplate) => {
      // Replace placeholders in the template from the config
      const text = mapTemplateString(paragraphTemplate, mapping);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        // Check for page break before rendering line
        if (currentY + lineSpacing > doc.internal.pageSize.getHeight() - 60) { // Add some bottom margin
          doc.addPage();
          currentY = consentConfig.startY || 40; // Reset Y on new page
        }
        doc.text(line, leftX, currentY);
        currentY += doc.getFontSize() * 1.2; // Use 1.2 line height multiplier
      });
      currentY += paragraphSpacing; // Add extra space after paragraph
    });

    // Start position for signature elements
    let sigStartY = currentY + (consentConfig.signatureArea.marginTop || 20); // Add top margin

    const lineStartX = consentConfig.signatureArea.lineStartX || leftX;
    const patientLineEndX = consentConfig.signatureArea.patientLineEndX || lineStartX + 200;
    const physicianLineStartX = consentConfig.signatureArea.physicianLineStartX || leftX + 250;
    const physicianLineEndX = consentConfig.signatureArea.physicianLineEndX || physicianLineStartX + 200;

    // Date text (using consent date from form data)
    const dateText = `Date: ${consentFormData.consentDate || '___________'}`;
    doc.text(dateText, lineStartX, sigStartY);
    sigStartY += doc.getFontSize() * 1.4; // Increase spacing after date

    // Patient Signature Line and Label
    const patientSigLineY = sigStartY;
    doc.line(lineStartX, patientSigLineY, patientLineEndX, patientSigLineY);
    if (consentConfig.signatureArea.patientLabel) {
        doc.text(consentConfig.signatureArea.patientLabel, lineStartX, patientSigLineY + doc.getFontSize() * 1.2); // Place label below line
    }

    // Physician Signature Line and Label
    const physicianSigLineY = sigStartY; // Keep physician line at same Y as patient line for alignment
    doc.line(physicianLineStartX, physicianSigLineY, physicianLineEndX, physicianSigLineY);
    if (consentConfig.signatureArea.physicianLabel) {
        doc.text(consentConfig.signatureArea.physicianLabel, physicianLineStartX, physicianSigLineY + doc.getFontSize() * 1.2); // Place label below line
    }

    // Sign Hint
    const hintY = Math.max(patientSigLineY, physicianSigLineY) + doc.getFontSize() * 2.4; // Position hint below both labels
    if (consentConfig.signatureArea.signHint) {
        doc.text(consentConfig.signatureArea.signHint, lineStartX, hintY);
    }
    console.log("Finished rendering consent page content.");
  } catch (error) {
    console.error("Error during renderConsentPage:", error);
    // Optionally re-throw or handle the error further
  }
}

/**
 * Main function to generate the PDF document.
 */
async function generatePdf() {
  try {
    console.log("Starting PDF generation process...");
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'A4'
    });
    // Create mapping object for template values using either unified model or legacy props
    const mapping = {
      // Personal info (prefer unified model, fall back to legacy props)
      givenName: unifiedPatientData?.personalInfo?.firstName || props.patientData.givenName || '',
      familyName: unifiedPatientData?.personalInfo?.lastName || props.patientData.familyName || '',
      birthdate: unifiedPatientData?.personalInfo?.birthdate || props.patientData.birthdate || '',
      sex: unifiedPatientData?.personalInfo?.sex || props.patientData.sex || '',
      insurance: unifiedPatientData?.personalInfo?.insurance || props.patientData.insurance || '',
      physicianName: unifiedPatientData?.personalInfo?.referrer || props.patientData.physicianName || '',
      
      // Include other legacy fields that aren't yet in unified model
      ...props.patientData,
      
      // Include config values
      ...pdfConfig.header,
      ...pdfConfig.footer
    };

    // 1. Render header and body sections.
    if (pdfConfig.header) renderSection(doc, pdfConfig.header, mapping);
    if (pdfConfig.body) renderSection(doc, pdfConfig.body, mapping);

    // 2. Render grouped test panels.
    const { baseY = 350, maxHeight = 600, spacing = 14, offsetX = 60, secondPageBaseY = 50 } = pdfConfig.panels || {};
    let y = baseY;
    groupedPanels.value.forEach((group) => {
      if (y + spacing > maxHeight) {
        doc.addPage();
        y = secondPageBaseY;
      }
      y = renderCategoryHeader(doc, group.categoryTitle, offsetX, y, spacing);
      group.tests.forEach((panel) => {
        let requiredHeight = spacing;
        if (panel.genes && panel.genes.length > 0) {
          const geneText = panel.genes.join(', ');
          const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40;
          const lines = doc.splitTextToSize(geneText, maxWidth);
          requiredHeight += lines.length * spacing;
        }
        if (y + requiredHeight > maxHeight) {
          doc.addPage();
          y = secondPageBaseY;
        }
        y = renderPanel(doc, panel, offsetX, y, spacing);
      });
    });

    // 3. Render variant segregation details if provided.
    // Check for variant details in either unified model or legacy props
    const variantSegregationRequested = props.patientData.variantSegregationRequested;
    const variantDetails = props.patientData.variantDetails;
    
    if (variantSegregationRequested && variantDetails) {
      if (y + spacing > maxHeight) {
        doc.addPage();
        y = secondPageBaseY;
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor('#000000');
      doc.text('Segregation of familial variant:', offsetX, y);
      y += spacing;
      doc.setFont('Helvetica', 'normal');
      const variantLines = doc.splitTextToSize(
        props.patientData.variantDetails,
        doc.internal.pageSize.getWidth() - offsetX - 40
      );
      variantLines.forEach((line) => {
        doc.text(line, offsetX, y);
        y += spacing;
      });
    }

    // 4. Render footer sections.
    if (pdfConfig.footer) renderSection(doc, pdfConfig.footer, mapping);

    // 5. Generate QR code and add it to page 1.
    if (pdfConfig.qr?.position && pdfConfig.qr?.size) {
      try {
        const qrDataUrl = await generateQrCodeDataUrl(qrContent.value, {
          width: 128, // Specify desired size if needed
        });
        doc.setPage(1); // Ensure we are on the first page
        doc.addImage(
          qrDataUrl,
          'PNG',
          pdfConfig.qr.position.x,
          pdfConfig.qr.position.y,
          pdfConfig.qr.size.width, // Use config size for placement
          pdfConfig.qr.size.height
        );
      } catch (qrError) {
        console.error("Failed to generate or add QR code:", qrError);
        // Optionally inform the user or handle the error
      }
    }

    // 6. Render phenotype page if available.
    renderPhenotypePage(doc);

    // 7. Render pedigree image if available.
    if (props.pedigreeDataUrl && props.pedigreeDataUrl !== '') {
      await new Promise((resolve) => {
        const img = new Image();
        img.src = props.pedigreeDataUrl;
        img.onload = () => {
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 40;
          const maxWidth = pageWidth - margin * 2;
          const maxHeight = pageHeight - margin * 2;
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const offsetXImg = (pageWidth - drawWidth) / 2;
          const offsetYImg = (pageHeight - drawHeight) / 2;
          doc.addPage();
          doc.addImage(props.pedigreeDataUrl, 'PNG', offsetXImg, offsetYImg, drawWidth, drawHeight);
          resolve();
        };
        img.onerror = () => {
          console.error('Error loading pedigree image.');
          resolve();
        };
      });
    }

    // 8. Render the consent page if the form was filled within patientData or unified model.
    // Check consent in unified model first, then fall back to legacy model
    const consentDataExists = unifiedPatientData?.consent?.dataProcessing || 
                          (props.patientData.genDGConsentData && props.patientData.genDGConsentData.provided === 'fill');
    
    console.log('generatePdf in PdfGenerator: Checking consent data availability:', consentDataExists);
    if (consentDataExists) {
      console.log("Attempting to render consent page...");
      try {
        renderConsentPage(doc);
      } catch (renderError) {
        console.error("Caught error during renderConsentPage call:", renderError);
      }
    }

    // 9. Add page numbering and footer version info.
    const totalPages = doc.internal.getNumberOfPages();
    if (pdfConfig.pageNumber && pdfConfig.pageNumber.enabled) {
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
    const footerVersionText = `PDF Schema: v${pdfConfig.schema.version} | Test Schema: v${testsData.schema.version}`;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#000000');
      doc.text(footerVersionText, 40, doc.internal.pageSize.getHeight() - 10);
    }

    // 10. Save the final PDF document.
    doc.save('genetic_test_requisition.pdf');
    console.log("PDF generation process completed.");
  } catch (error) {
    console.error("Error during PDF generation process:", error);
    // Potentially show an error message to the user
    alert("An error occurred while generating the PDF. Please check the console for details.");
  }
}
</script>
