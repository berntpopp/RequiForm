<template>
  <v-app>
    <!-- Top Menu Bar -->
    <TopBar @generate-pdf="handleGeneratePdf" />
    <v-main>
      <v-container>
        <PatientForm :patientData="patientData" />
        <TestSelector v-model="selectedTests" />

        <!-- Hide the PDF generator component -->
        <div style="display: none;">
          <PdfGenerator
            ref="pdfGen"
            :patientData="patientData"
            :selectedTests="selectedTests"
          />
        </div>

        <!-- Debug: List selected panels -->
        <div class="mt-4">
          <h2>Selected Panels:</h2>
          <ul>
            <li v-for="testId in selectedTests" :key="testId">{{ testId }}</li>
          </ul>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import PatientForm from './components/PatientForm.vue'
import TestSelector from './components/TestSelector.vue'
import TopBar from './components/TopBar.vue'
import PdfGenerator from './components/PdfGenerator.vue'

const patientData = reactive({
  givenName: '',
  familyName: '',
  birthdate: '',
  insurance: '',
  sex: '',
  physicianName: '',
  familyHistory: '',
  parentalConsanguinity: '',
  diagnosis: ''
});

const selectedTests = ref([]);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  patientData.givenName = params.get('givenName') || '';
  patientData.familyName = params.get('familyName') || '';
  patientData.birthdate = params.get('birthdate') || '';
  patientData.insurance = params.get('insurance') || '';
  // Convert to lowercase so they match select options
  patientData.sex = (params.get('sex') || '').toLowerCase();
  patientData.physicianName = params.get('physicianName') || '';
  patientData.familyHistory = (params.get('familyHistory') || '').toLowerCase();
  patientData.parentalConsanguinity = (params.get('parentalConsanguinity') || '').toLowerCase();
  patientData.diagnosis = params.get('diagnosis') || '';
});

const pdfGen = ref(null);
const handleGeneratePdf = () => {
  if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
    pdfGen.value.generatePdf();
  }
};
</script>
