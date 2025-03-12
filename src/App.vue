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

        <!-- Formatted display of selected panels grouped by category -->
        <div class="mt-4">
          <h2>Selected Panels:</h2>
          <div v-for="group in groupedPanelDetails" :key="group.categoryTitle">
            <h3 class="category-header">{{ group.categoryTitle }}</h3>
            <ul>
              <li v-for="panel in group.tests" :key="panel.id" class="panel-item">
                <div class="panel-name"><strong>{{ panel.name }}</strong></div>
                <div class="panel-genes" v-if="panel.genes && panel.genes.length">
                  <em>{{ panel.genes.join(', ') }}</em>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import PatientForm from './components/PatientForm.vue';
import TestSelector from './components/TestSelector.vue';
import TopBar from './components/TopBar.vue';
import PdfGenerator from './components/PdfGenerator.vue';
// Import tests data to look up panel details.
import testsData from './data/tests.json';

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

// Compute details for the selected panels grouped by category.
const groupedPanelDetails = computed(() => {
  return testsData.categories
    .map(category => ({
      categoryTitle: category.title,
      tests: category.tests.filter(test => selectedTests.value.includes(test.id))
    }))
    .filter(group => group.tests.length > 0);
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

.category-header {
  font-size: 1.1rem;
  margin: 1rem 0 0.5rem;
  border-bottom: 2px solid #000;
  font-weight: bold;
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
