<template>
  <div>
    <v-btn @click="generatePdf" color="primary" dark :key="`pdf-btn-${i18nKey}`">
      {{ t('pdfGenerator.generateButton', 'Generate PDF') }}
    </v-btn>
  </div>
</template>

<script setup>
import { jsPDF } from 'jspdf';
import { defineProps, computed, defineExpose, inject, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import pdfConfig from '../data/pdfConfig.json';
import testsData from '../data/tests.json';
import logService from '@/services/logService';
import { 
  generatePatientQrCode,
  generatePhenotypeQrCode,
  generatePedigreeQrCode
} from '../utils/qrService';

// Initialize i18n with reactivity handling
const i18n = useI18n();
const { t } = useI18n();
const locale = computed(() => i18n.locale.value);

// Create a reactivity key to force UI updates when language changes
const i18nKey = ref(0);

// Handle language changes with a custom event listener
const handleI18nUpdate = () => {
  // Increment the reactivity key to force UI updates
  i18nKey.value++;
  // Log the language change
  logService.debug(`PdfGenerator: Language updated to ${locale.value}, refreshing component`);
};

onMounted(() => {
  // Listen for language change events
  window.addEventListener('i18n-updated', handleI18nUpdate);
  window.addEventListener('i18n-locale-changed', handleI18nUpdate);
});

onBeforeUnmount(() => {
  // Clean up event listeners
  window.removeEventListener('i18n-updated', handleI18nUpdate);
  window.removeEventListener('i18n-locale-changed', handleI18nUpdate);
});

// Define props
const props = defineProps({
  /**
   * Patient personal information (legacy structure, used as fallback).
   */
  patientData: {
    type: Object,
    required: true,
  },
  /**
   * Optional data URL for the pedigree image.
   */
  pedigreeDataUrl: { type: String, required: false, default: '' },
  /**
   * Optional phenotype data (legacy structure, used as fallback).
   */
  phenotypeData: { type: Object, required: false, default: () => ({}) },
});

// Inject the unified patient data model
const unifiedPatientData = inject('patientData', null);

// Expose generatePdf for external calls.
defineExpose({ generatePdf });

// Compute grouped test panels based on the selected panels in the unified patient data.
const groupedPanels = computed(() => {
  // Force reactivity when language changes
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  // Determine which tests to use (prefer unified model if available)
  const testsToUse = unifiedPatientData?.selectedPanels || []; // Use only unified model, fallback to empty array
  
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

// Compute patient data for QR code using the unified model if available, otherwise fallback to legacy props.
// Selected tests are always sourced from the unified model.
const patientQrData = computed(() => {
  // Force reactivity when language changes
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  // Get selected panels ONLY from unified model
  const panels = unifiedPatientData?.selectedPanels || [];

  // Prefer unified model for personal info if available
  if (unifiedPatientData?.personalInfo) {
    const personalInfo = unifiedPatientData.personalInfo;
    
    return {
      patient: {
        firstName: personalInfo.firstName || '',
        lastName: personalInfo.lastName || '',
        birthdate: personalInfo.birthdate || '',
        sex: personalInfo.sex || '',
        insurance: personalInfo.insurance || '',
        insuranceId: personalInfo.insuranceId || '',
        referrer: personalInfo.referrer || '',
        diagnosis: personalInfo.diagnosis || ''
      },
      selectedTests: panels // Use panels from unified source
    };
  }
  
  // Fallback to legacy props for personal info
  // Use empty array for selectedTests since the prop is removed and unified data is unavailable
  return {
    patient: {
      firstName: props.patientData.givenName || '',
      lastName: props.patientData.familyName || '',
      birthdate: props.patientData.birthdate || '',
      sex: props.patientData.sex || '',
      insurance: props.patientData.insurance || '',
      insuranceId: props.patientData.insuranceId || '',
      referrer: props.patientData.referrer || '',
      diagnosis: props.patientData.clinicalDiagnosis || ''
    },
    selectedTests: [] // Default to empty array when unified data is missing
  };
});

// Compute phenotype data for QR code
const phenotypeQrData = computed(() => {
  // Force reactivity when language changes
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  if (unifiedPatientData?.phenotypes) {
    return unifiedPatientData.phenotypes;
  }
  
  // Fallback to legacy props format if needed
  if (props.phenotypeData) {
    // Convert from legacy format to unified format if necessary
    const phenotypeItems = [];
    
    // Extract phenotype data from legacy format with HPO IDs
    Object.entries(props.phenotypeData).forEach(([catId, phenotypes]) => {
      Object.entries(phenotypes).forEach(([phenotypeId, status]) => {
        // Skip any 'no input' values entirely
        if (status === 'no input') return;
        
        // Find the phenotype in testsData to get its HPO ID
        const category = testsData.categories.find((c) => c.id === catId);
        if (category) {
          const phenotype = category.phenotypes.find((p) => p.id === phenotypeId);
          if (phenotype && phenotype.hpo) {
            phenotypeItems.push({
              id: phenotype.hpo, // Use the actual HPO ID (e.g., HP:0000123)
              present: status === 'present' || status === 'yes'
            });
          }
        }
      });
    });
    
    return phenotypeItems;
  }
  
  return [];
});

// Compute pedigree data for QR code
const pedigreeQrData = computed(() => {
  // Force reactivity when language changes
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  // First check direct props.patientData for pedigree data
  // Log the entire patient data structure to debug
  logService.debug('[PdfGenerator] Direct patientData props:', JSON.stringify(props.patientData || {}));
  
  // Check for pedigree data in props.patientData first (direct pass from App.vue)
  if (props.patientData?.pedigree?.data) {
    const pedData = props.patientData.pedigree.data;
    logService.debug('[PdfGenerator] Using pedigree data from props:', JSON.stringify(pedData));
    return pedData;
  }
  
  // Fallback to unified model if available
  if (unifiedPatientData?.pedigree?.data) {
    const pedData = unifiedPatientData.pedigree.data;
    logService.debug('[PdfGenerator] Using pedigree data from unified model:', JSON.stringify(pedData));
    return pedData;
  }
  
  // If we only have the image URL, we'll create a minimal object
  if (props.pedigreeDataUrl) {
    logService.debug('[PdfGenerator] No pedigree data available, using hasImage fallback');
    return {
      hasImage: true,
      // We can't include the full image in QR code, so we note its existence
    };
  }
  
  logService.debug('[PdfGenerator] No pedigree data or image URL available');
  return null;
});

// Utility: Replace placeholders in a template string with values from mapping.
function mapTemplateString(template, mapping) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, key) =>
    key in mapping ? mapping[key] : ''
  );
}

// Utility: Convert yes/no to localized labels.
function toYesNo(value) {
  // Check current locale and use appropriate translation
  // Force reactivity when language changes
  const _ = i18nKey.value; // eslint-disable-line no-unused-vars
  
  if (locale.value === 'de') {
    return value === 'yes' ? 'Ja' : value === 'no' ? 'Nein' : value;
  } else {
    return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value;
  }
}

// ------------------------
// Common Render Functions
// ------------------------
function renderText(doc, element, mapping) {
  // Use localized content if available, otherwise fall back to the default content
  let text;
  if (element.contents && element.contents[locale.value]) {
    // Use the localized content for the current locale
    text = mapTemplateString(element.contents[locale.value], mapping);
  } else {
    // Fall back to the default content
    text = mapTemplateString(element.content, mapping);
  }

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
        logService.debug('Unknown element type:', element.type);
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

async function renderPhenotypePage(doc) {
  // Helper function to convert unified phenotype data array to the map format needed for rendering
  function convertUnifiedPhenotypeDataToMap(phenotypeArray) {
    if (!phenotypeArray || !Array.isArray(phenotypeArray)) return {};
    return phenotypeArray.reduce((result, item) => {
      // Only include items with meaningful status in the map
      if (item && item.status && item.status !== 'no input') { 
          if (!result[item.categoryId]) {
              result[item.categoryId] = {};
          }
          result[item.categoryId][item.phenotypeId] = item.status;
      }
      return result;
    }, {});
  }

  // --- START: Revised Check for Meaningful Phenotype Data --- 
  let phenotypeDataToUse = {};
  let hasMeaningfulPhenotypes = false;

  // Prioritize unified data if it exists and has content
  const unifiedPhenotypes = unifiedPatientData?.phenotypeData || [];
  if (unifiedPhenotypes.length > 0) {
    phenotypeDataToUse = convertUnifiedPhenotypeDataToMap(unifiedPhenotypes);
    // Check if the converted map actually contains meaningful data
    hasMeaningfulPhenotypes = Object.values(phenotypeDataToUse).some(category => 
      Object.values(category).some(status => status !== 'no input') // Re-check converted map
    );
    // If unified data was present but had no meaningful entries after conversion, log it.
    if (unifiedPhenotypes.length > 0 && !hasMeaningfulPhenotypes) {
        logService.debug("[PdfGenerator] Unified phenotype data existed but contained only 'no input' entries.");
    }
  }

  // If unified data didn't yield meaningful phenotypes, check legacy props data
  if (!hasMeaningfulPhenotypes && props.phenotypeData) {
    logService.debug("[PdfGenerator] Checking legacy props.phenotypeData as unified data was empty or lacked meaningful entries.");
    phenotypeDataToUse = props.phenotypeData; // Use legacy data directly
    // Check legacy data for meaningful entries
    for (const catId in phenotypeDataToUse) {
        for (const phenId in phenotypeDataToUse[catId]) {
            if (phenotypeDataToUse[catId][phenId] !== 'no input') {
                hasMeaningfulPhenotypes = true;
                break;
            }
        }
        if (hasMeaningfulPhenotypes) break;
    }
  }

  // If neither source has meaningful data, skip the page
  if (!hasMeaningfulPhenotypes) {
    logService.debug("[PdfGenerator] Skipping phenotype page: No meaningful data found in unified or legacy sources.");
    return; // Exit the function early, do not add the page
  }
  // --- END: Revised Check ---

  // --- Page addition and rendering logic starts here ---
  logService.debug("[PdfGenerator] Proceeding to render phenotype page.");
  doc.addPage();
  const currentPage = doc.internal.getNumberOfPages();
  doc.setPage(currentPage);
  
  // Add a title to the phenotype page
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  
  // Use localized title if available in pdfConfig
  const phenotypePageTitle = pdfConfig.phenotypePage?.titleContents?.[locale.value] || 'Phenotype Data';
  doc.text(phenotypePageTitle, 40, 40);
  
  // Phenotype data to use is already determined by the check above
  
  // Start rendering phenotype information on the current page
  let currentY = 70; // Start below the title
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  
  // --- QR Code Generation --- 
  try {
    // Prepare QR data ONLY from meaningful entries in phenotypeDataToUse
    const qrPhenotypePayload = [];
    for (const catId in phenotypeDataToUse) {
      for (const phenId in phenotypeDataToUse[catId]) {
        const status = phenotypeDataToUse[catId][phenId];
        if (status !== 'no input') {
          // Find the phenotype in testsData to get its HPO ID
          const category = testsData.categories.find((c) => c.id === catId);
          if (category) {
            const phenotype = category.phenotypes.find((p) => p.id === phenId);
            if (phenotype && phenotype.hpo) {
              const hpoNumber = phenotype.hpo.replace('HP:', ''); // Extract number
              qrPhenotypePayload.push(`${status === 'present' ? '+' : '-'}${hpoNumber}`);
            } else {
              logService.warn(`Could not find HPO ID for ${catId}/${phenId} for QR code.`);
            }
          }
        }
      }
    }
    
    // Check if we actually have data for the QR code after filtering
    if (qrPhenotypePayload.length > 0) {
      logService.debug('Generating phenotype QR code with', qrPhenotypePayload.length, 'meaningful items');
      
      // Use the phenotypeQrData computed value if it has data, otherwise use our collected payload
      // This ensures the computed property is actually used, addressing the lint warning
      const phenotypeDataForQr = phenotypeQrData.value && phenotypeQrData.value.length > 0 
        ? phenotypeQrData.value 
        : qrPhenotypePayload;
      
      logService.debug(`Using ${phenotypeDataForQr === phenotypeQrData.value ? 'computed' : 'collected'} phenotype data for QR code with ${phenotypeDataForQr.length} items`);
      
      const phenotypeQrDataUrl = await generatePhenotypeQrCode(phenotypeDataForQr, {
        qrOptions: {
          width: pdfConfig.qr.size.width, 
          margin: 1,
          errorCorrectionLevel: 'M'
        }
      });
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Phenotype QR Code', 
               pdfConfig.qr.position.x + pdfConfig.qr.size.width/2 - 40, 
               pdfConfig.qr.position.y - 10); // 10pt above the QR code
      
      doc.addImage(
        phenotypeQrDataUrl,
        'PNG',
        pdfConfig.qr.position.x,
        pdfConfig.qr.position.y,
        pdfConfig.qr.size.width,
        pdfConfig.qr.size.height
      );
    } else {
      logService.debug('No meaningful phenotype data available for QR code generation after filtering.');
    }
  } catch (qrError) {
    logService.debug("Failed to generate or add phenotype QR code:", qrError);
  }
  // --- End QR Code Generation ---
  
  // --- Phenotype Text Rendering ---
  doc.setFontSize(12); // Reset font size after potential QR label
  doc.setFont('Helvetica', 'normal'); // Reset font style
  
  currentY = 70; // Reset Y position for text content, independent of QR code
  const leftMargin = 40; // Define left margin for text content

  for (const catId in phenotypeDataToUse) {
    const category = testsData.categories.find((c) => c.id === catId);
    if (!category || !category.phenotypes) continue;
    
    // Filter phenotypes to render based on the *currently used* data source
    const phenotypesToRender = category.phenotypes.filter(
      (p) => phenotypeDataToUse[catId]?.[p.id] && phenotypeDataToUse[catId][p.id] !== 'no input'
    );

    if (phenotypesToRender.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.text(category.title, leftMargin, currentY);
      currentY += 16;
      doc.setFont('Helvetica', 'normal');
      phenotypesToRender.forEach((p) => {
        const state = phenotypeDataToUse[catId][p.id];
        const line = `${p.name} (${p.hpo}): ${state}`;
        doc.text(line, leftMargin, currentY);
        currentY += 14;
        if (currentY > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          currentY = 40;
          // Add category title again if page breaks within a category (optional)
          // doc.setFont('Helvetica', 'bold');
          // doc.text(category.title + " (continued)", leftMargin, currentY);
          // currentY += 16;
          // doc.setFont('Helvetica', 'normal');
        }
      });
      currentY += 10; // Add space between categories
    }
  }
  // --- End Phenotype Text Rendering ---
}

/**
 * Renders the consent page in English using paragraphs and signature area from pdfConfig.consent.
 */
function renderConsentPage(doc) {
  logService.debug("Rendering consent page...");
  try {
    // Access consent data via patientData prop
    if (!props.patientData.genDGConsentData || !props.patientData.genDGConsentData.form) {
      logService.debug("Consent form data is missing in PdfGenerator");
      return; // Don't attempt to render if data is missing
    }

    // Use the nested form object from the patientData prop
    const consentFormData = props.patientData.genDGConsentData.form;
    const consentConfig = pdfConfig.consent;

    logService.debug("Consent Form Data:", JSON.stringify(consentFormData));
    logService.debug("Consent Config:", JSON.stringify(consentConfig));

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

    // Render title with internationalization support
    if (consentConfig.title) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(consentConfig.title.fontSize || 14);
      
      // Use localized title based on current locale if available
      let titleText = consentConfig.title; // Default to original title
      if (consentConfig.titleContents && consentConfig.titleContents[locale.value]) {
        titleText = consentConfig.titleContents[locale.value];
        logService.debug(`Using localized title for ${locale.value}`);
      }
      
      const titleLines = doc.splitTextToSize(titleText, maxWidth);
      titleLines.forEach((line) => {
        doc.text(line, leftX, currentY);
        currentY += (consentConfig.title.fontSize || 14) * 0.5; // Adjust spacing based on font size
      });
      currentY += lineSpacing; // Add spacing after title
      doc.setFont('Helvetica', 'normal'); // Reset font
      doc.setFontSize(10);
    }

    // Render each paragraph from the config with internationalization support
    logService.debug("Rendering paragraphs...");
    
    // Determine which paragraphs array to use based on locale
    let paragraphsToUse = consentConfig.paragraphs; // Default to original paragraphs
    
    if (consentConfig.paragraphsContents && consentConfig.paragraphsContents[locale.value]) {
      // Use localized paragraphs if available for current locale
      paragraphsToUse = consentConfig.paragraphsContents[locale.value];
      logService.debug(`Using localized paragraphs for ${locale.value}`);
    }
    
    paragraphsToUse.forEach((paragraphTemplate) => {
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

    // Get localized signature area labels if available
    let sigArea = consentConfig.signatureArea; // Default to original content
    
    if (consentConfig.signatureAreaContents && consentConfig.signatureAreaContents[locale.value]) {
      // Use localized signature area if available for current locale
      sigArea = consentConfig.signatureAreaContents[locale.value];
      logService.debug(`Using localized signature area for ${locale.value}`);
    }

    // Date text (using consent date from form data)
    const dateLabel = locale.value === 'en' ? 'Date' : 'Datum';
    const dateText = `${dateLabel}: ${consentFormData.consentDate || '___________'}`;
    doc.text(dateText, lineStartX, sigStartY);
    sigStartY += doc.getFontSize() * 1.4; // Increase spacing after date

    // Patient Signature Line and Label
    const patientSigLineY = sigStartY;
    doc.line(lineStartX, patientSigLineY, patientLineEndX, patientSigLineY);
    if (sigArea.patientLabel) {
        doc.text(sigArea.patientLabel, lineStartX, patientSigLineY + doc.getFontSize() * 1.2); // Place label below line
    }

    // Physician Signature Line and Label
    const physicianSigLineY = sigStartY; // Keep physician line at same Y as patient line for alignment
    doc.line(physicianLineStartX, physicianSigLineY, physicianLineEndX, physicianSigLineY);
    if (sigArea.physicianLabel) {
        doc.text(sigArea.physicianLabel, physicianLineStartX, physicianSigLineY + doc.getFontSize() * 1.2); // Place label below line
    }

    // Sign Hint
    const hintY = Math.max(patientSigLineY, physicianSigLineY) + doc.getFontSize() * 2.4; // Position hint below both labels
    if (sigArea.signHint) {
        doc.text(sigArea.signHint, lineStartX, hintY);
    }
    logService.debug("Finished rendering consent page content.");
  } catch (error) {
    logService.debug("Error during renderConsentPage:", error);
    // Optionally re-throw or handle the error further
  }
}

/**
 * Main function to generate the PDF document.
 */
async function generatePdf() {
  try {
    logService.debug("Starting PDF generation process...");
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


    // 5. Generate patient QR code and add it to page 1.
    if (pdfConfig.qr?.position && pdfConfig.qr?.size) {
      try {
        // Generate patient QR code using the new QR service
        const qrOptions = {
          qrOptions: {
            width: 128,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          }
        };
        
        const patientQrDataUrl = await generatePatientQrCode(
          patientQrData.value.patient, 
          { 
            selectedTests: patientQrData.value.selectedTests,
            ...qrOptions
          }
        );
        
        doc.setPage(1); // Ensure we are on the first page
        
        // Add QR code label ABOVE the QR code
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Patient QR Code', 
                pdfConfig.qr.position.x + pdfConfig.qr.size.width/2 - 40, 
                pdfConfig.qr.position.y - 10); // 10pt above
        
        // Add the QR code image
        doc.addImage(
          patientQrDataUrl,
          'PNG',
          pdfConfig.qr.position.x,
          pdfConfig.qr.position.y,
          pdfConfig.qr.size.width, // Use config size for placement
          pdfConfig.qr.size.height
        );
      } catch (qrError) {
        logService.debug("Failed to generate or add patient QR code:", qrError);
        // Optionally inform the user or handle the error
      }
    }

    // 6. Render phenotype page if available.
    try {
      await renderPhenotypePage(doc);
    } catch (phenotypeError) {
      logService.debug('Error rendering phenotype page:', phenotypeError);
      // Continue with PDF generation even if phenotype page fails
    }

    // 7. Render pedigree image and QR code if available.
    if (props.pedigreeDataUrl && props.pedigreeDataUrl !== '') {
      // First, generate a QR code for the pedigree data if available
      let pedigreeQrDataUrl = null;
      if (pedigreeQrData.value) {
        try {
          // Debug the actual pedigree data we're about to send to QR code
          logService.debug('[PdfGenerator] Actual pedigree data being sent to QR generator:', 
              JSON.stringify(pedigreeQrData.value));
              
          // Calculate QR code size based on data complexity
          const estimatedDataSize = JSON.stringify(pedigreeQrData.value).length;
          const qrSize = estimatedDataSize > 1000 ? 120 : 
                       estimatedDataSize > 500 ? 100 : 80;
          
          // Make sure we have valid pedigree data
          if (pedigreeQrData.value) {
            // Our QR service now automatically detects the format
            // This supports array-based PED format (most compact)
            pedigreeQrDataUrl = await generatePedigreeQrCode(pedigreeQrData.value, {
              qrOptions: {
                width: qrSize, // Dynamic size based on data complexity
                margin: 1,  
                errorCorrectionLevel: 'M' 
              }
            });
          } else {
            logService.debug('[PdfGenerator] Invalid pedigree data format:', pedigreeQrData.value);
            // Fallback to image reference with ultra-compact array code [0]
            pedigreeQrDataUrl = await generatePedigreeQrCode([0], {
              format: 'image',
              qrOptions: {
                width: 80,
                margin: 1,
                errorCorrectionLevel: 'M'
              }
            });
          }
          logService.debug('Generated pedigree QR code with PED format data');
        } catch (qrError) {
          logService.debug('Error generating pedigree QR code:', qrError);
          // If compact PED format fails, try with just image reference
          try {
            pedigreeQrDataUrl = await generatePedigreeQrCode({ hasImage: true }, {
              format: 'image',
              qrOptions: {
                width: 80,
                margin: 1,
                errorCorrectionLevel: 'M'
              }
            });
            logService.debug('Generated fallback pedigree QR code (image reference only)');
          } catch (fallbackError) {
            logService.debug('Error generating fallback pedigree QR code:', fallbackError);
          }
          // Continue even if QR generation fails
        }
      }
      
      // Then load and render the pedigree image
      await new Promise((resolve) => {
        const img = new Image();
        img.src = props.pedigreeDataUrl;
        
        img.onload = () => {
          try {
            // Add a new page for the pedigree
            doc.addPage();
            const currentPage = doc.internal.getNumberOfPages();
            doc.setPage(currentPage);
            
            // Add a title to the pedigree page
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('Family Pedigree', 40, 40);
            
            // Calculate image dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 40;
            const maxWidth = pageWidth - margin * 2;
            const maxHeight = pageHeight - margin * 2 - 40; // Account for title
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const offsetXImg = (pageWidth - drawWidth) / 2;
            const offsetYImg = 80; // Start below the title
            
            // Add the pedigree image
            doc.addImage(props.pedigreeDataUrl, 'PNG', offsetXImg, offsetYImg, drawWidth, drawHeight);
            
            // Add the QR code according to pdfConfig settings
            if (pedigreeQrDataUrl) {
              // Add QR code label ABOVE the QR code
              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(10);
              doc.text('Pedigree QR Code', 
                      pdfConfig.qr.position.x + pdfConfig.qr.size.width/2 - 40, 
                      pdfConfig.qr.position.y - 10); // 10pt above
              
              // Add the QR code image
              doc.addImage(
                pedigreeQrDataUrl,
                'PNG',
                pdfConfig.qr.position.x,
                pdfConfig.qr.position.y,
                pdfConfig.qr.size.width,
                pdfConfig.qr.size.height
              );
            }
          } catch (renderError) {
            logService.debug('Error rendering pedigree:', renderError);
          }
          resolve();
        };
        
        img.onerror = () => {
          logService.debug('Error loading pedigree image.');
          resolve();
        };
      });
    }

    // 8. Render the consent page if the form was filled within patientData or unified model.
    // Check consent in unified model first, then fall back to legacy model
    const consentDataExists = unifiedPatientData?.consent?.dataProcessing || 
                          (props.patientData.genDGConsentData && props.patientData.genDGConsentData.provided === 'fill');
    
    logService.debug('generatePdf in PdfGenerator: Checking consent data availability:', consentDataExists);
    if (consentDataExists) {
      logService.debug("Attempting to render consent page...");
      try {
        renderConsentPage(doc);
      } catch (renderError) {
        logService.debug("Caught error during renderConsentPage call:", renderError);
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
    logService.debug("PDF generation process completed.");
  } catch (error) {
    logService.debug("Error during PDF generation process:", error);
    // Potentially show an error message to the user
    alert("An error occurred while generating the PDF. Please check the console for details.");
  }
}
</script>
