<template>
  <div>
    <!-- (Optional visible button if needed) -->
    <v-btn @click="generatePdf" color="primary" dark>
      Generate PDF
    </v-btn>
    <!-- Hidden container for QR code -->
    <div ref="qrContainer" style="display: none;">
      <qrcode-vue :value="qrContent" :size="128" />
    </div>
  </div>
</template>

<script setup>
import { jsPDF } from "jspdf";
import { defineProps, ref, nextTick, computed, defineExpose } from "vue";
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

// Reference for the hidden QR code container
const qrContainer = ref(null);

// Compute QR code content from patient data and selected tests.
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
  
  // Patient details
  doc.setFontSize(12);
  doc.text(`Given Name: ${props.patientData.givenName}`, 10, y);
  y += 10;
  doc.text(`Family Name: ${props.patientData.familyName}`, 10, y);
  y += 10;
  doc.text(`Birthdate: ${props.patientData.birthdate}`, 10, y);
  y += 10;
  doc.text(`Insurance: ${props.patientData.insurance}`, 10, y);
  y += 10;
  
  // Additional information
  doc.text(`Sex: ${props.patientData.sex}`, 10, y);
  y += 10;
  doc.text(`Physician: ${props.patientData.physicianName}`, 10, y);
  y += 10;
  doc.text(`Family History: ${props.patientData.familyHistory}`, 10, y);
  y += 10;
  doc.text(`Parental Consanguinity: ${props.patientData.parentalConsanguinity}`, 10, y);
  y += 10;
  doc.text(`Diagnosis: ${props.patientData.diagnosis}`, 10, y);
  y += 10;
  
  // Selected tests
  doc.text("Selected Tests:", 10, y);
  y += 10;
  props.selectedTests.forEach((testId) => {
    doc.text(`- ${testId}`, 10, y);
    y += 10;
  });
  
  nextTick(() => {
    const canvas = qrContainer.value.querySelector("canvas");
    if (canvas) {
      const qrDataUrl = canvas.toDataURL("image/png");
      doc.addImage(qrDataUrl, "PNG", 150, 10, 50, 50);
      doc.save("genetic_test_requisition.pdf");
    } else {
      console.error("QR code canvas not found.");
    }
  });
}

// Expose the generatePdf method for external calls.
defineExpose({ generatePdf });
</script>
