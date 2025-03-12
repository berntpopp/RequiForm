<template>
  <div>
    <!-- Optional visible button if desired -->
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

const qrContainer = ref(null);

const qrContent = computed(() => {
  return `Given Name: ${props.patientData.givenName}, Family Name: ${props.patientData.familyName}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(", ")}`;
});

function generatePdf() {
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(16);
  doc.text("Genetic Test Requisition", 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Given Name: ${props.patientData.givenName}`, 10, y);
  y += 10;
  doc.text(`Family Name: ${props.patientData.familyName}`, 10, y);
  y += 10;
  doc.text(`Birthdate: ${props.patientData.birthdate}`, 10, y);
  y += 10;
  doc.text(`Insurance: ${props.patientData.insurance}`, 10, y);
  y += 10;

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

// Expose generatePdf so parent components can call it via a ref.
defineExpose({ generatePdf });
</script>
