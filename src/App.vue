<template>
  <v-app>
    <!-- Top Menu Bar -->
    <TopBar @generate-pdf="handleGeneratePdf" @copy-url="handleCopyUrl" />
    <v-main>
      <v-container>
        <PatientForm :patientData="patientData" />
        <TestSelector v-model="selectedTests" />

        <!-- Hidden PDF Generator component -->
        <div style="display: none;">
          <PdfGenerator
            ref="pdfGen"
            :patientData="patientData"
            :selectedTests="selectedTests"
          />
        </div>

        <!-- Conditionally render the Selected Panels section only if panels are selected -->
        <div class="mt-4" v-if="groupedPanelDetails.length">
          <h2>Selected Panels:</h2>
          <div v-for="group in groupedPanelDetails" :key="group.categoryTitle">
            <h3 class="category-header">{{ group.categoryTitle }}</h3>
            <ul>
              <li v-for="panel in group.tests" :key="panel.id" class="panel-item">
                <div class="panel-name">
                  <strong>{{ panel.name }}</strong>
                </div>
                <div class="panel-genes" v-if="panel.genes && panel.genes.length">
                  <em>{{ panel.genes.join(', ') }}</em>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </v-container>

      <!-- Snackbar for copy URL notifications -->
      <v-snackbar v-model="snackbar" timeout="3000" top right transition="scale-transition">
        {{ snackbarMessage }}
        <template #action="{ attrs }">
          <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import PatientForm from './components/PatientForm.vue';
import TestSelector from './components/TestSelector.vue';
import TopBar from './components/TopBar.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import testsData from './data/tests.json';

/** Patient data object */
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

/** Array of selected panel IDs */
const selectedTests = ref([]);

/** Snackbar state for notifications */
const snackbar = ref(false);
const snackbarMessage = ref('');

/**
 * Merges parameters from both query string and URL hash.
 * @return {URLSearchParams} The merged URL parameters.
 */
function mergeUrlParameters() {
  const merged = new URLSearchParams();
  // Parse query parameters.
  const queryParams = new URLSearchParams(window.location.search);
  for (const [key, value] of queryParams.entries()) {
    merged.set(key, value);
  }
  // Parse hash parameters (removing the leading '#').
  const hash = window.location.hash.substring(1);
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    for (const [key, value] of hashParams.entries()) {
      merged.set(key, value);
    }
  }
  return merged;
}

/**
 * Clears URL parameters and hash from the browser’s address bar.
 */
function clearUrlParameters() {
  window.history.replaceState(null, '', window.location.pathname);
}

/**
 * Loads patient data from URL parameters (query and hash) and then clears them.
 */
onMounted(() => {
  const params = mergeUrlParameters();
  // Expecting key "givenName" for the first name.
  patientData.givenName = params.get('givenName') || '';
  patientData.familyName = params.get('familyName') || '';
  patientData.birthdate = params.get('birthdate') || '';
  patientData.insurance = params.get('insurance') || '';
  patientData.sex = (params.get('sex') || '').toLowerCase();
  patientData.physicianName = params.get('physicianName') || '';
  patientData.familyHistory = (params.get('familyHistory') || '').toLowerCase();
  patientData.parentalConsanguinity = (params.get('parentalConsanguinity') || '').toLowerCase();
  patientData.diagnosis = params.get('diagnosis') || '';
  
  // Auto-clear URL parameters (both query and hash) to enhance security.
  clearUrlParameters();
});

/**
 * Groups selected panels by category.
 */
const groupedPanelDetails = computed(() => {
  return testsData.categories
    .map((category) => ({
      categoryTitle: category.title,
      tests: category.tests.filter((test) => selectedTests.value.includes(test.id))
    }))
    .filter((group) => group.tests.length > 0);
});

/** Reference for the PdfGenerator component */
const pdfGen = ref(null);

/**
 * Handles PDF generation by calling the exposed generatePdf method.
 */
const handleGeneratePdf = () => {
  if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
    pdfGen.value.generatePdf();
  }
};

/**
 * Generates a URL with query parameters based on patient data and selected tests.
 * @return {string} The generated URL.
 */
const generateUrlWithParams = () => {
  const url = new URL(window.location.href);
  url.search = '';
  // Add patient data as query parameters.
  Object.entries(patientData).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  // Add selected tests as a comma-separated list if any.
  if (selectedTests.value.length) {
    url.searchParams.set('selectedTests', selectedTests.value.join(','));
  }
  return url.toString();
};

/**
 * Copies the generated URL to the clipboard and displays a snackbar notification.
 */
const handleCopyUrl = () => {
  const urlToCopy = generateUrlWithParams();
  navigator.clipboard
    .writeText(urlToCopy)
    .then(() => {
      snackbarMessage.value = 'URL copied to clipboard!';
      snackbar.value = true;
    })
    .catch((err) => {
      snackbarMessage.value = 'Failed to copy URL.';
      snackbar.value = true;
    });
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
