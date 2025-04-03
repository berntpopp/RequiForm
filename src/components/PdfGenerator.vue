<template>
  <div>
    <v-btn @click="generatePdf" color="primary" dark>
      Generate PDF
    </v-btn>
    <!-- Hidden container for the QR code -->
    <div ref="qrContainer" class="hidden">
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

// Define props – note the use of "consentData" instead of "genDGConsentData".
const props = defineProps({
  patientData: { type: Object, required: true },
  selectedTests: { type: Array, required: true },
  pedigreeDataUrl: { type: String, required: false, default: '' },
  phenotypeData: { type: Object, required: false, default: () => ({}) },
  consentData: { type: Object, required: false, default: () => null }
});

// Expose generatePdf for external calls.
defineExpose({ generatePdf });

// Reference for the hidden QR code.
const qrContainer = ref(null);

// Compute grouped test panels.
const groupedPanels = computed(() =>
  testsData.categories
    .map((category) => ({
      categoryTitle: category.title,
      tests: category.tests.filter((test) =>
        props.selectedTests.includes(test.id)
      )
    }))
    .filter((group) => group.tests.length > 0)
);

// Compute QR code content.
const qrContent = computed(() =>
  `Given Name: ${props.patientData.givenName}, Family Name: ${props.patientData.familyName}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(', ')}`
);

// Utility: Replace placeholders in a template string with values from mapping.
function mapTemplateString(template, mapping) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, key) =>
    key in mapping ? mapping[key] : ''
  );
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
  let hasPhenotype = false;
  for (const cat in props.phenotypeData) {
    for (const phen in props.phenotypeData[cat]) {
      if (props.phenotypeData[cat][phen] !== 'no input') {
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
  for (const catId in props.phenotypeData) {
    const category = testsData.categories.find((c) => c.id === catId);
    if (!category || !category.phenotypes) continue;
    const phenotypes = category.phenotypes.filter(
      (p) => props.phenotypeData[catId][p.id] !== 'no input'
    );
    if (phenotypes.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.text(category.title, leftMargin, currentY);
      currentY += 16;
      doc.setFont('Helvetica', 'normal');
      phenotypes.forEach((p) => {
        const state = props.phenotypeData[catId][p.id];
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
  const consentConfig = pdfConfig.consent;
  if (!consentConfig || !consentConfig.enabled) return;
  
  doc.addPage();
  
  // Render title in English (fallback title if not provided)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(consentConfig.title ? consentConfig.title : "Consent for Genetic Analysis", 40, 50);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  
  let currentY = 70;
  const leftX = 40;
  const maxWidth = doc.internal.pageSize.getWidth() - leftX * 2;
  
  // Build mapping using user consent data.
  const userForm = props.consentData?.form || {};
  
  // Utility to convert yes/no to English
  function toYesNo(value) {
    return value === 'yes' ? 'yes' : 'no';
  }
  
  const mapping = {
    consentName: userForm.consentName || '____________',
    zufallsbefundeLabel: toYesNo(userForm.questionSecondaryFindings),
    materialLabel: toYesNo(userForm.questionMaterial),
    extendedLabel: toYesNo(userForm.questionExtended),
    researchLabel: toYesNo(userForm.questionResearch)
  };
  
  // Render paragraphs from config (assumed to be in English)
  const paragraphs = consentConfig.paragraphs || [];
  paragraphs.forEach((para) => {
    const text = mapTemplateString(para, mapping);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      doc.text(line, leftX, currentY);
      currentY += 14;
    });
    currentY += 10;
    if (currentY > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      currentY = 70;
    }
  });
  
  // Render signature area.
  currentY += 10;
  doc.text(`Date: ${userForm.consentDate || '___________'}`, leftX, currentY);
  currentY += 40;
  // Patient signature line.
  doc.line(leftX, currentY, leftX + 200, currentY);
  doc.text(
    consentConfig.signatureArea.patientLabel
      ? consentConfig.signatureArea.patientLabel
      : "Patient (print clearly)",
    leftX,
    currentY + 12
  );
  // Physician signature line.
  doc.line(leftX + 280, currentY, leftX + 480, currentY);
  doc.text(
    consentConfig.signatureArea.physicianLabel
      ? consentConfig.signatureArea.physicianLabel
      : "Physician (print clearly)",
    leftX + 280,
    currentY + 12
  );
  currentY += 35;
  doc.text(
    consentConfig.signatureArea.signHint
      ? consentConfig.signatureArea.signHint
      : "Date / Signature",
    leftX,
    currentY
  );
}

/**
 * Main function to generate the PDF document.
 */
async function generatePdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });
  const mapping = {
    ...props.patientData,
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
  if (props.patientData.variantSegregationRequested && props.patientData.variantDetails) {
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

  // 5. Wait for the QR code to render and add it to page 1.
  await nextTick();
  const canvas = qrContainer.value?.querySelector('canvas');
  if (canvas && pdfConfig.qr?.position && pdfConfig.qr?.size) {
    doc.setPage(1);
    doc.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      pdfConfig.qr.position.x,
      pdfConfig.qr.position.y,
      pdfConfig.qr.size.width,
      pdfConfig.qr.size.height
    );
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

  // 8. Render the consent page if the form was filled.
  if (props.consentData && props.consentData.provided === 'fill') {
    renderConsentPage(doc);
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
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
