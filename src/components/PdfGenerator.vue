<!-- src/components/PdfGenerator.vue -->
<template>
  <div>
    <v-btn @click="generatePdf" color="primary" dark>
      Generate PDF
    </v-btn>
    <!-- Wrap the QR code in a hidden container -->
    <div ref="qrContainer" style="display: none;">
      <qrcode-vue :value="qrContent" :size="128" />
    </div>
  </div>
</template>

<script setup>
import { jsPDF } from "jspdf";
import { defineProps, ref, nextTick, computed } from "vue";
import QrcodeVue from "qrcode.vue";

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

// Create a ref for the container that wraps the QR code.
const qrContainer = ref(null);

// Compute the content for the QR code.
const qrContent = computed(() => {
  return `Given Name: ${props.patientData.givenName}, Family Name: ${props.patientData.familyName}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(", ")}`;
});

function generatePdf() {
  const doc = new jsPDF();
  let y = 10;

  // Title
  doc.setFontSize(16);
  doc.text("Genetic Test Requisition", 10, y);
  y += 10;

  // Patient details: add given and family names separately.
  doc.setFontSize(12);
  doc.text(`Given Name: ${props.patientData.givenName}`, 10, y);
  y += 10;
  doc.text(`Family Name: ${props.patientData.familyName}`, 10, y);
  y += 10;
  doc.text(`Birthdate: ${props.patientData.birthdate}`, 10, y);
  y += 10;
  doc.text(`Insurance: ${props.patientData.insurance}`, 10, y);
  y += 10;

  // Selected tests
  doc.text("Selected Tests:", 10, y);
  y += 10;
  props.selectedTests.forEach((testId) => {
    doc.text(`- ${testId}`, 10, y);
    y += 10;
  });

  // Wait for QR code rendering.
  nextTick(() => {
    const canvas = qrContainer.value.querySelector("canvas");
    if (canvas) {
      const qrDataUrl = canvas.toDataURL("image/png");
      // Add QR code image to the PDF.
      doc.addImage(qrDataUrl, "PNG", 150, 10, 50, 50);
      // Save/download PDF.
      doc.save("genetic_test_requisition.pdf");
    } else {
      console.error("QR code canvas not found.");
    }
  });
}
</script>
