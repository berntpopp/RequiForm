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
  patientData: { type: Object, required: true },
  selectedTests: { type: Array, required: true }
});

// Expose generatePdf for external calls.
defineExpose({ generatePdf });

// Reference for the hidden QR code container.
const qrContainer = ref(null);

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

// Compute QR code content.
const qrContent = computed(() => {
  return `Given Name: ${props.patientData.givenName}, Family Name: ${props.patientData.familyName}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(", ")}`;
});

/**
 * Replace placeholders in a template string with actual values from mapping.
 * Returns an empty string if a variable is missing.
 */
function mapTemplateString(template, mapping) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, key) =>
    key in mapping ? mapping[key] : ""
  );
}

/** Renders a text element. */
function renderText(doc, element, mapping) {
  const text = mapTemplateString(element.content, mapping);
  if (element.style) {
    doc.setFont(element.style.font || "Helvetica", element.style.fontStyle || "normal");
    doc.setFontSize(element.style.fontSize || 12);
    doc.setTextColor(element.style.color || "#000000");
  }
  doc.text(text, element.position.x, element.position.y);
}

/** Renders an image element. */
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

/** Renders a rectangle element. */
function renderRectangle(doc, element) {
  const { x, y } = element.position;
  const { width, height } = element.size;
  const style = element.style || {};
  if (style.fill && style.fillColor) doc.setFillColor(style.fillColor);
  if (style.borderColor) doc.setDrawColor(style.borderColor);
  doc.setLineWidth(style.borderWidth || 1);
  let rectStyle = "S";
  if (style.fill && style.fillColor) {
    rectStyle = style.borderWidth ? "DF" : "F";
  }
  doc.rect(x, y, width, height, rectStyle);
}

/** Renders a line element. */
function renderLine(doc, element) {
  const { x: startX, y: startY } = element.start;
  const { x: endX, y: endY } = element.end;
  const style = element.style || {};
  doc.setLineWidth(style.lineWidth || 1);
  if (style.color) doc.setDrawColor(style.color);
  doc.line(startX, startY, endX, endY);
}

/** Renders all elements in a section. */
function renderSection(doc, section, mapping) {
  if (!section || !section.elements) return;
  section.elements.forEach(element => {
    switch (element.type) {
      case "text":
        renderText(doc, element, mapping);
        break;
      case "image":
        renderImage(doc, element, mapping);
        break;
      case "rectangle":
        renderRectangle(doc, element);
        break;
      case "line":
        renderLine(doc, element);
        break;
      default:
        console.warn("Unknown element type:", element.type);
    }
  });
}

/**
 * Renders a single panel at position (offsetX, y) and returns the new y.
 */
function renderPanel(doc, panel, offsetX, y, spacing) {
  const panelNameStyle = panel.style || { font: "Helvetica", fontStyle: "bold", fontSize: 12, color: "#000000" };
  doc.setFont(panelNameStyle.font, panelNameStyle.fontStyle);
  doc.setFontSize(panelNameStyle.fontSize);
  doc.setTextColor(panelNameStyle.color);
  doc.text(panel.name, offsetX, y);
  y += spacing;
  if (panel.genes && panel.genes.length > 0) {
    const panelGeneStyle = panel.geneStyle || { font: "Helvetica", fontStyle: "italic", fontSize: 10, color: "#000000" };
    doc.setFont(panelGeneStyle.font, panelGeneStyle.fontStyle);
    doc.setFontSize(panelGeneStyle.fontSize);
    doc.setTextColor(panelGeneStyle.color);
    const geneText = panel.genes.join(", ");
    const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40;
    const lines = doc.splitTextToSize(geneText, maxWidth);
    lines.forEach(line => {
      doc.text(line, offsetX, y);
      y += spacing;
    });
  }
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  return y;
}

/**
 * Main function to generate the PDF.
 * 1) Render header & body on page 1.
 * 2) Render panels on page 1 up to panels.maxHeight.
 * 3) Render footer and (later) QR code on page 1.
 * 4) Render overflow panels on subsequent pages.
 * 5) If more than one page exists, add page numbers using the config.
 */
async function generatePdf() {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 50;

  // Merge placeholders.
  const mapping = {
    ...props.patientData,
    ...pdfConfig.header,
    ...pdfConfig.footer
  };

  // 1) Render header & body on page 1.
  if (pdfConfig.header) renderSection(doc, pdfConfig.header, mapping);
  if (pdfConfig.body) renderSection(doc, pdfConfig.body, mapping);

  // Panels configuration.
  const { baseY = 350, maxHeight = 600, spacing = 14, offsetX = 60, secondPageBaseY = 50 } = pdfConfig.panels || {};

  // 2) Render as many panels as fit on page 1.
  let y = baseY;
  const panels = selectedPanelDetails.value;
  let i = 0;
  while (i < panels.length) {
    const panel = panels[i];
    let requiredHeight = spacing;
    if (panel.genes && panel.genes.length > 0) {
      const geneText = panel.genes.join(", ");
      const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40;
      const lines = doc.splitTextToSize(geneText, maxWidth);
      requiredHeight += lines.length * spacing;
    }
    if (y + requiredHeight > maxHeight) break;
    y = renderPanel(doc, panel, offsetX, y, spacing);
    i++;
  }

  // 3) Render footer on page 1.
  if (pdfConfig.footer) renderSection(doc, pdfConfig.footer, mapping);

  // 4) Render QR code on page 1 in nextTick.
  nextTick(() => {
    const canvas = qrContainer.value?.querySelector("canvas");
    if (canvas && pdfConfig.qr?.position && pdfConfig.qr?.size) {
      doc.setPage(1); // Ensure we're on page 1.
      doc.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        pdfConfig.qr.position.x,
        pdfConfig.qr.position.y,
        pdfConfig.qr.size.width,
        pdfConfig.qr.size.height
      );
    }
    // 5) Render overflow panels on subsequent pages.
    let overflowY = secondPageBaseY;
    for (let j = i; j < panels.length; j++) {
      const panel = panels[j];
      if (j === i) {
        doc.addPage();
        overflowY = secondPageBaseY;
      }
      let requiredHeight = spacing;
      if (panel.genes && panel.genes.length > 0) {
        const geneText = panel.genes.join(", ");
        const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40;
        const lines = doc.splitTextToSize(geneText, maxWidth);
        requiredHeight += lines.length * spacing;
      }
      if (overflowY + requiredHeight > pageHeight - marginBottom) {
        doc.addPage();
        overflowY = secondPageBaseY;
      }
      overflowY = renderPanel(doc, panel, offsetX, overflowY, spacing);
    }

    // 6) Add page numbers if more than one page is present.
    const totalPages = doc.internal.getNumberOfPages();
    if (totalPages > 1 && pdfConfig.pageNumber && pdfConfig.pageNumber.enabled) {
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const { x, y } = pdfConfig.pageNumber.position;
        const pageText = `Page ${p} of ${totalPages}`;
        doc.setFont(pdfConfig.pageNumber.font || "Helvetica", pdfConfig.pageNumber.fontStyle || "normal");
        doc.setFontSize(pdfConfig.pageNumber.fontSize || 10);
        doc.setTextColor(pdfConfig.pageNumber.color || "#000000");
        doc.text(pageText, x, y);
      }
    }
    doc.save("genetic_test_requisition.pdf");
  });
}
</script>

<style scoped>
/* Scoped styles if needed */
</style>
