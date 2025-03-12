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
import { jsPDF } from "jspdf";
import { defineProps, ref, nextTick, computed, defineExpose } from "vue";
import QrcodeVue from "qrcode.vue";
import pdfConfig from "../data/pdfConfig.json";
import testsData from "../data/tests.json";

// Define props for patient data and selected tests.
const props = defineProps({
  patientData: {
    type: Object,
    required: true
  },
  selectedTests: {
    type: Array,
    required: true
  }
});

// Expose generatePdf for external calls.
defineExpose({ generatePdf });

// Reference for the hidden QR code container.
const qrContainer = ref(null);

// Compute QR code content.
const qrContent = computed(() => {
  return `Given Name: ${props.patientData.givenName}, Family Name: ${props.patientData.familyName}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(", ")}`;
});

// Flatten all panels from testsData.
const allPanels = computed(() => {
  const panels = [];
  testsData.categories.forEach(cat => {
    cat.tests.forEach(test => {
      panels.push(test);
    });
  });
  return panels;
});

// Compute selected panel details.
const selectedPanelDetails = computed(() => {
  return allPanels.value.filter(panel => props.selectedTests.includes(panel.id));
});

/**
 * Replaces placeholders in a template string with values from the mapping object.
 * If a variable is missing, an empty string is returned.
 *
 * @param {string} template - The template string with placeholders, e.g., "Hello, {{name}}".
 * @param {Object} mapping - The key-value mapping for replacement.
 * @returns {string} - The processed string.
 */
function mapTemplateString(template, mapping) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, key) =>
    key in mapping ? mapping[key] : ""
  );
}

/**
 * Renders a text element onto the jsPDF document.
 *
 * @param {jsPDF} doc - The jsPDF instance.
 * @param {Object} element - The text element configuration.
 * @param {Object} mapping - The dynamic mapping for placeholders.
 */
function renderText(doc, element, mapping) {
  const text = mapTemplateString(element.content, mapping);
  if (element.style) {
    const fontName = element.style.font || "Helvetica";
    const fontStyle = element.style.fontStyle || "normal";
    doc.setFont(fontName, fontStyle);
    doc.setFontSize(element.style.fontSize || 12);
    doc.setTextColor(element.style.color || "#000000");
  }
  doc.text(text, element.position.x, element.position.y);
}

/**
 * Renders an image element onto the jsPDF document.
 *
 * @param {jsPDF} doc - The jsPDF instance.
 * @param {Object} element - The image element configuration.
 * @param {Object} mapping - The dynamic mapping for placeholders.
 */
function renderImage(doc, element, mapping) {
  const imageData = mapTemplateString(element.source, mapping);
  doc.addImage(
    imageData,
    "PNG",
    element.position.x,
    element.position.y,
    element.size.width,
    element.size.height
  );
}

/**
 * Iterates over a section’s elements and renders them on the PDF.
 *
 * @param {jsPDF} doc - The jsPDF instance.
 * @param {Object} section - The section configuration (header, body, or footer).
 * @param {Object} mapping - The mapping for placeholder replacement.
 */
function renderSection(doc, section, mapping) {
  if (!section || !section.elements) return;
  section.elements.forEach(element => {
    if (element.type === "text") {
      renderText(doc, element, mapping);
    } else if (element.type === "image") {
      renderImage(doc, element, mapping);
    }
  });
}

/**
 * Generates the PDF document by combining configurable sections with
 * dynamic patient details, selected panels, and a QR code.
 */
async function generatePdf() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt", // Use points for precise placement.
    format: "A4"
  });

  // Build the mapping object by merging patient data with config values.
  const mapping = {
    ...props.patientData,
    ...pdfConfig.header,
    ...pdfConfig.footer
  };

  // --- Render Configurable Sections ---
  if (pdfConfig.header) {
    renderSection(doc, pdfConfig.header, mapping);
  }
  if (pdfConfig.body) {
    renderSection(doc, pdfConfig.body, mapping);
  }

  // --- Render Selected Panels (iterative rendering) ---
  let y = (pdfConfig.panels && pdfConfig.panels.baseY) || 304;
  const spacing = (pdfConfig.panels && pdfConfig.panels.spacing) || 14;
  const offsetX = (pdfConfig.panels && pdfConfig.panels.offsetX) || 60;
  
  selectedPanelDetails.value.forEach(panel => {
    // Render panel name using configuration if provided, defaulting to bold style.
    const panelNameStyle = panel.style || { font: "Helvetica", fontStyle: "bold", fontSize: 12, color: "#000000" };
    doc.setFont(panelNameStyle.font || "Helvetica", panelNameStyle.fontStyle || "bold");
    doc.setFontSize(panelNameStyle.fontSize || 12);
    doc.setTextColor(panelNameStyle.color || "#000000");
    doc.text(panel.name, offsetX, y);
    y += spacing;
    // Render panel genes in italic if available with sensible line breaks.
    if (panel.genes && panel.genes.length > 0) {
      const panelGeneStyle = panel.geneStyle || { font: "Helvetica", fontStyle: "italic", fontSize: 10, color: "#000000" };
      doc.setFont(panelGeneStyle.font || "Helvetica", panelGeneStyle.fontStyle || "italic");
      doc.setFontSize(panelGeneStyle.fontSize || 10);
      doc.setTextColor(panelGeneStyle.color || "#000000");
      const geneText = panel.genes.join(", ");
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - offsetX - 40; // right margin of 40 pts
      const splitGenes = doc.splitTextToSize(geneText, maxWidth);
      doc.text(splitGenes, offsetX, y);
      y += spacing * splitGenes.length;
    }
    // Reset font to default.
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);
  });

  // --- Render Footer ---
  if (pdfConfig.footer) {
    renderSection(doc, pdfConfig.footer, mapping);
  }

  // --- Add QR Code ---
  nextTick(() => {
    const canvas = qrContainer.value.querySelector("canvas");
    if (canvas) {
      const qrDataUrl = canvas.toDataURL("image/png");
      if (pdfConfig.qr && pdfConfig.qr.position && pdfConfig.qr.size) {
        doc.addImage(
          qrDataUrl,
          "PNG",
          pdfConfig.qr.position.x,
          pdfConfig.qr.position.y,
          pdfConfig.qr.size.width,
          pdfConfig.qr.size.height
        );
      }
      doc.save("genetic_test_requisition.pdf");
    } else {
      console.error("QR code canvas not found.");
    }
  });
}
</script>

<style scoped>
/* Scoped styles for PdfGenerator (if needed) */
</style>
