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
          <PdfGenerator ref="pdfGen" :patientData="patientData" :selectedTests="selectedTests" />
        </div>

        <!-- Formatted display of selected panels -->
        <div class="mt-4">
          <h2>Selected Panels:</h2>
          <ul>
            <li v-for="panel in selectedPanelDetails" :key="panel.id" class="panel-item">
              <div class="panel-name"><strong>{{ panel.name }}</strong></div>
              <div class="panel-genes" v-if="panel.genes && panel.genes.length">
                <em>{{ panel.genes.join(', ') }}</em>
              </div>
            </li>
          </ul>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import PatientForm from './components/PatientForm.vue'
import TestSelector from './components/TestSelector.vue'
import TopBar from './components/TopBar.vue'
import PdfGenerator from './components/PdfGenerator.vue'
// Import tests data to look up panel details.
import testsData from './data/tests.json'

// Patient data object
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

// Array of selected panel IDs
const selectedTests = ref([]);

// On mount, read URL parameters (make sure to convert drop‑down values to lowercase if needed)
onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  patientData.givenName = params.get('givenName') || '';
  patientData.familyName = params.get('familyName') || '';
  patientData.birthdate = params.get('birthdate') || '';
  patientData.insurance = params.get('insurance') || '';
  patientData.sex = (params.get('sex') || '').toLowerCase();
  patientData.physicianName = params.get('physicianName') || '';
  patientData.familyHistory = (params.get('familyHistory') || '').toLowerCase();
  patientData.parentalConsanguinity = (params.get('parentalConsanguinity') || '').toLowerCase();
  patientData.diagnosis = params.get('diagnosis') || '';
});

// Create a flattened list of all panels from all categories
const allPanels = computed(() => {
  const panels = [];
  testsData.categories.forEach(cat => {
    cat.tests.forEach(test => {
      panels.push(test);
    });
  });
  return panels;
});

// Compute details for the selected panels by matching selectedTests array with allPanels
const selectedPanelDetails = computed(() => {
  return allPanels.value.filter(panel => selectedTests.value.includes(panel.id));
});

// Ref for PdfGenerator component (to trigger PDF generation)
const pdfGen = ref(null);
const handleGeneratePdf = () => {
  if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
    pdfGen.value.generatePdf();
  }
};
</script>

<style>
.mt-4 {
  margin-top: 1rem;
}

.panel-item {
  margin-bottom: 0.75rem;
}

.panel-name {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.panel-genes {
  font-size: 0.85rem;
  color: #555;
}
</style>
