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

async function generatePdf() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",  // Using points for precise placement.
    format: "A4"
  });
  
  // --- Render Header ---
  doc.setFontSize(12);
  const clinicName = String(pdfConfig.header?.clinicName || "");
  const department = String(pdfConfig.header?.department || "");
  const addressLine = String(pdfConfig.header?.addressLine || "");
  const headerTitle = String(pdfConfig.header?.headerTitle || "");
  
  doc.text(clinicName, 40, 40);
  doc.text(department, 40, 60);
  doc.text(addressLine, 40, 80);
  
  // Render the logo from config.
  if (pdfConfig.header.logoBase64 && pdfConfig.header.logoBase64.length > 0) {
    // Adjust coordinates (x, y) and size as needed.
    doc.addImage(pdfConfig.header.logoBase64, "PNG", 300, 30, 225, 47);
  }
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(headerTitle, 40, 120);
  doc.setFont("helvetica", "normal");
  
  let y = 160;
  
  // --- Render Patient Details ---
  doc.setFontSize(12);
  doc.text(`Given Name: ${props.patientData.givenName || ""}`, 40, y);
  y += 14;
  doc.text(`Family Name: ${props.patientData.familyName || ""}`, 40, y);
  y += 14;
  doc.text(`Birthdate: ${props.patientData.birthdate || ""}`, 40, y);
  y += 14;
  doc.text(`Insurance: ${props.patientData.insurance || ""}`, 40, y);
  y += 14;
  doc.text(`Sex: ${props.patientData.sex || ""}`, 40, y);
  y += 14;
  doc.text(`Physician: ${props.patientData.physicianName || ""}`, 40, y);
  y += 14;
  doc.text(`Family History: ${props.patientData.familyHistory || ""}`, 40, y);
  y += 14;
  doc.text(`Parental Consanguinity: ${props.patientData.parentalConsanguinity || ""}`, 40, y);
  y += 14;
  doc.text(`Diagnosis: ${props.patientData.diagnosis || ""}`, 40, y);
  y += 20;
  
  // --- Render Selected Panels ---
  doc.setFontSize(12);
  doc.text("Selected Panels:", 40, y);
  y += 14;
  
  // For each selected panel, render its name (bold) and genes (italic).
  selectedPanelDetails.value.forEach(panel => {
    // Panel name in bold.
    doc.setFont("helvetica", "bold");
    doc.text(panel.name, 60, y);
    y += 14;
    // If genes exist, render them in italic with a smaller font.
    if (panel.genes && panel.genes.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text(panel.genes.join(', '), 60, y);
      y += 14;
    }
    // Reset font settings.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
  });
  
  // --- Render Footer ---
  const footerY = 780;
  doc.setFontSize(10);
  doc.text(String(pdfConfig.footer?.contactLine1 || ""), 40, footerY);
  doc.text(String(pdfConfig.footer?.contactLine2 || ""), 40, footerY + 14);
  doc.text(String(pdfConfig.footer?.website || ""), 40, footerY + 28);
  
  // --- Add QR Code ---
  nextTick(() => {
    const canvas = qrContainer.value.querySelector("canvas");
    if (canvas) {
      const qrDataUrl = canvas.toDataURL("image/png");
      doc.addImage(qrDataUrl, "PNG", 450, 700, 100, 100);
      doc.save("genetic_test_requisition.pdf");
    } else {
      console.error("QR code canvas not found.");
    }
  });
}
</script>
