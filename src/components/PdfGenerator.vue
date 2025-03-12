<!-- src/components/PdfGenerator.vue -->
<template>
  <v-btn @click="generatePdf" color="primary" dark>
    Generate PDF
  </v-btn>
</template>

<script setup>
import { jsPDF } from "jspdf";
import { defineProps } from "vue";

// Define props for patient data and selected tests
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

function generatePdf() {
  const doc = new jsPDF();
  let y = 10;

  // Title
  doc.setFontSize(16);
  doc.text("Genetic Test Requisition", 10, y);
  y += 10;

  // Patient details
  doc.setFontSize(12);
  doc.text(`Name: ${props.patientData.name}`, 10, y);
  y += 10;
  doc.text(`Birthdate: ${props.patientData.birthdate}`, 10, y);
  y += 10;
  doc.text(`Insurance: ${props.patientData.insurance}`, 10, y);
  y += 10;

  // Selected tests
  doc.text("Selected Tests:", 10, y);
  y += 10;
  props.selectedTests.forEach((testId, index) => {
    doc.text(`- ${testId}`, 10, y);
    y += 10;
  });

  // Trigger the download
  doc.save("genetic_test_requisition.pdf");
}
</script>
