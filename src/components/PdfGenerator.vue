<!-- src/components/PdfGenerator.vue -->
<template>
  <div>
    <v-btn @click="generatePdf" color="primary" dark>
      Generate PDF
    </v-btn>
    <!-- Wrap the QR code in a div with a ref (hidden) -->
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

// Create a reference to the container that wraps the QR code.
const qrContainer = ref(null);

// Compute the content to encode in the QR code.
const qrContent = computed(() => {
  return `Name: ${props.patientData.name}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(", ")}`;
});

function generatePdf() {
  const doc = new jsPDF();
  let y = 10;

  // Add title.
  doc.setFontSize(16);
  doc.text("Genetic Test Requisition", 10, y);
  y += 10;

  // Add patient details.
  doc.setFontSize(12);
  doc.text(`Name: ${props.patientData.name}`, 10, y);
  y += 10;
  doc.text(`Birthdate: ${props.patientData.birthdate}`, 10, y);
  y += 10;
  doc.text(`Insurance: ${props.patientData.insurance}`, 10, y);
  y += 10;

  // Add selected tests.
  doc.text("Selected Tests:", 10, y);
  y += 10;
  props.selectedTests.forEach((testId) => {
    doc.text(`- ${testId}`, 10, y);
    y += 10;
  });

  // Wait for the QR code to render.
  nextTick(() => {
    // Use the container ref to query for the canvas element.
    const canvas = qrContainer.value.querySelector("canvas");
    if (canvas) {
      const qrDataUrl = canvas.toDataURL("image/png");
      // Add the QR code image to the PDF.
      doc.addImage(qrDataUrl, "PNG", 150, 10, 50, 50);
      // Save the PDF.
      doc.save("genetic_test_requisition.pdf");
    } else {
      console.error("QR code canvas not found.");
    }
  });
}
</script>
