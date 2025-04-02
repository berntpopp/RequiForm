<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <!-- Top Menu Bar -->
    <TopBar
      :isDark="isDark"
      @toggle-theme="toggleTheme"
      @reset-form="resetForm"
      @open-faq="openFAQ"
      @generate-pdf="handleGeneratePdf"
      @copy-url="handleCopyUrl"
      @copy-encrypted-url="openEncryptionDialog"
    />

    <!-- Disclaimer Modal: shown if not yet acknowledged or if reopened -->
    <Disclaimer v-if="!disclaimerAcknowledged || showDisclaimerModal" @dismiss="handleDisclaimerDismiss" />

    <v-main>
      <v-container>
        <PatientForm :patientData="patientData" />

        <!-- Pedigree Option: show checkbox and component when enabled -->
        <v-checkbox
          v-model="showPedigree"
          label="Include Pedigree Chart"
          class="mb-4"
        />
        <PedigreeDrawer v-if="showPedigree" ref="pedigreeDrawer" />

        <!-- Always render TestSelector regardless of variant segregation option -->
        <TestSelector v-model="selectedTests" />

        <!-- New Phenotype Selector Component -->
        <PhenotypeSelector
          :groupedPanelDetails="groupedPanelDetails"
          v-model="phenotypeData"
        />

        <!-- Hidden PDF Generator component -->
        <div style="display: none;">
          <PdfGenerator
            ref="pdfGen"
            :patientData="patientData"
            :selectedTests="selectedTests"
            :pedigreeDataUrl="pedigreeDataUrl"
            :phenotypeData="phenotypeData"
          />
        </div>

        <!-- Selected Panels Section -->
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

      <!-- Snackbar for notifications -->
      <v-snackbar
        v-model="snackbar"
        timeout="3000"
        top
        right
        transition="scale-transition"
      >
        {{ snackbarMessage }}
        <template #action="{ attrs }">
          <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>

      <!-- Encryption Modal -->
      <v-dialog v-model="encryptionDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">
            Enter Password for Encryption
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="encryptionPassword"
              type="password"
              label="Password"
              autocomplete="off"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeEncryptionDialog">Cancel</v-btn>
            <v-btn color="primary" text @click="confirmEncryption">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Decryption Modal -->
      <v-dialog v-model="decryptionDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">
            Enter Password for Decryption
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="decryptionPassword"
              type="password"
              label="Password"
              autocomplete="off"
              :error-messages="decryptionError"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelDecryption">Cancel</v-btn>
            <v-btn color="primary" text @click="confirmDecryption">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Validation Warning Dialog -->
      <v-dialog v-model="validationDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">
            Incomplete or Invalid Data
          </v-card-title>
          <v-card-text>
            <p>The following required fields are missing or invalid:</p>
            <ul>
              <li v-for="(error, index) in validationErrors" :key="index">
                {{ error }}
              </li>
            </ul>
            <p>
              Generating the PDF with incomplete data may result in errors. Please
              review and correct the data if necessary.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelValidation">Cancel</v-btn>
            <v-btn color="primary" text @click="proceedValidation">
              Proceed Anyway
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- FAQ Modal -->
      <v-dialog v-model="showFAQModal" persistent max-width="600">
        <v-card>
          <v-card-title>Frequently Asked Questions (FAQ)</v-card-title>
          <v-card-text>
            <ul>
              <li v-for="(faq, index) in faqContent" :key="index">
                <h4>{{ faq.question }}</h4>
                <p>{{ faq.answer }}</p>
              </li>
            </ul>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="closeFAQ">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>

    <!-- Footer with disclaimer acknowledgement button -->
    <VersionFooter 
      :disclaimerAcknowledged="disclaimerAcknowledged" 
      :acknowledgmentTime="acknowledgmentTime" 
      @reopen-disclaimer="openDisclaimerModal" 
    />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import TopBar from './components/TopBar.vue';
import PatientForm from './components/PatientForm.vue';
import TestSelector from './components/TestSelector.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import PedigreeDrawer from './components/PedigreeDrawer.vue';
import PhenotypeSelector from './components/PhenotypeSelector.vue';
import VersionFooter from './components/Footer.vue';
import testsData from './data/tests.json';
import {
  mergeUrlParameters,
  getUrlParameter,
  clearUrlParameters,
  encryptParams,
  decryptParams,
  generateUrlWithHash,
} from './utils/url.js';
import Disclaimer from './components/Disclaimer.vue';

/**
 * Returns the current date in ISO format (YYYY-MM-DD).
 * @return {string} The ISO date string.
 */
function getCurrentIsoDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns the initial patient data object.
 * @return {Object} Initial patient data.
 */
function initialPatientData() {
  return {
    givenName: '',
    familyName: '',
    birthdate: '',
    insurance: '',
    sex: '',
    physicianName: '',
    familyHistory: '',
    parentalConsanguinity: '',
    diagnosis: '',
    orderingDate: getCurrentIsoDate(),
    variantSegregationRequested: false,
    variantDetails: '',
  };
}

/** Reactive patient data object. */
const patientData = ref(initialPatientData());

/** Array of selected panel IDs. */
const selectedTests = ref([]);

/** Phenotype data: an object mapping category id to phenotype states. */
const phenotypeData = ref({});

/** Snackbar state for notifications. */
const snackbar = ref(false);
const snackbarMessage = ref('');

/** Encryption dialog state and password. */
const encryptionDialog = ref(false);
const encryptionPassword = ref('');

/** Decryption dialog state, password, and error. */
const decryptionDialog = ref(false);
const decryptionPassword = ref('');
const decryptionError = ref('');

/** Validation dialog state and error messages. */
const validationDialog = ref(false);
const validationErrors = ref([]);

/** Used to store the encrypted string from the URL for decryption. */
const pendingEncryptedValue = ref(null);

/** Controls whether the pedigree chart is displayed. */
const showPedigree = ref(false);

/** Holds the pedigree chart image data URL for PDF inclusion. */
const pedigreeDataUrl = ref('');

/** Theme state: true for dark theme, false for light theme. */
const isDark = ref(false);

/** FAQ modal state. */
const showFAQModal = ref(false);

/** FAQ content array with detailed approach and security measures. */
const faqContent = ref([
  {
    question: 'What is RequiForm’s approach to data handling?',
    answer:
      'RequiForm is completely static and runs entirely in your browser. No data is sent to a backend server. This ensures that your sensitive patient data remains on your local machine only.',
  },
  {
    question: 'How does RequiForm secure my data?',
    answer:
      'RequiForm uses client-side encryption for URL parameters and hash-based URL parsing. This approach avoids sending sensitive data in the browser history or over the network, providing an extra layer of security.',
  },
  {
    question: 'Is RequiForm a medical device?',
    answer:
      'No. RequiForm is designed solely as a tool for streamlining the genetic test requisition process. It is not a substitute for professional medical advice or diagnosis.',
  },
  {
    question: 'Why is my data safe in RequiForm?',
    answer:
      'Since all processing happens locally in your browser, your data is never transmitted to a server. This minimizes the risk of unauthorized access and ensures that your information remains private.',
  },
  {
    question: 'Where can I learn more about the security measures in place?',
    answer:
      'This FAQ and the project documentation provide detailed insights into the data handling, encryption techniques, and overall security measures implemented in RequiForm. We encourage you to review these sections for a comprehensive understanding.',
  },
]);

/** References to child components. */
const pdfGen = ref(null);
const pedigreeDrawer = ref(null);

/**
 * Groups selected panels by category.
 * @return {Array<Object>} Grouped panel details.
 */
const groupedPanelDetails = computed(() => {
  return testsData.categories
    .map((category) => ({
      id: category.id,
      categoryTitle: category.title,
      tests: category.tests.filter((test) => selectedTests.value.includes(test.id)),
    }))
    .filter((group) => group.tests.length > 0);
});

/**
 * Validates the patient data based on required fields.
 * @return {Array<string>} List of error messages for missing/invalid fields.
 */
function validatePatientData() {
  const errors = [];
  const requiredFields = {
    givenName: 'Given Name',
    familyName: 'Family Name',
    birthdate: 'Birthdate',
    sex: 'Sex',
    physicianName: 'Physician Name',
    orderingDate: 'Ordering Date',
  };
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!patientData.value[field] || patientData.value[field].trim() === '') {
      errors.push(`${label} is required.`);
    }
  });
  if (patientData.value.birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(patientData.value.birthdate)) {
    errors.push('Birthdate must be in YYYY-MM-DD format.');
  }
  return errors;
}

/**
 * Handles PDF generation by validating patient data and,
 * if pedigree is enabled, retrieving the pedigree image before generating PDF.
 */
const handleGeneratePdf = async () => {
  const errors = validatePatientData();
  if (errors.length > 0) {
    validationErrors.value = errors;
    validationDialog.value = true;
  } else {
    if (showPedigree.value && pedigreeDrawer.value?.getPedigreeDataUrl) {
      try {
        pedigreeDataUrl.value = await pedigreeDrawer.value.getPedigreeDataUrl();
      } catch (error) {
        console.error('Error retrieving pedigree image:', error);
      }
    }
    if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
      pdfGen.value.generatePdf();
    }
  }
};

function cancelValidation() {
  validationDialog.value = false;
}

function proceedValidation() {
  validationDialog.value = false;
  if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
    pdfGen.value.generatePdf();
  }
}

const generatePlainUrl = () => generateUrlWithHash(patientData.value, selectedTests.value);

const handleCopyUrl = () => {
  const urlToCopy = generatePlainUrl();
  navigator.clipboard
    .writeText(urlToCopy)
    .then(() => {
      snackbarMessage.value = 'Hash URL copied to clipboard!';
      snackbar.value = true;
    })
    .catch(() => {
      snackbarMessage.value = 'Failed to copy URL.';
      snackbar.value = true;
    });
};

const openEncryptionDialog = () => {
  encryptionPassword.value = '';
  encryptionDialog.value = true;
};

const closeEncryptionDialog = () => {
  encryptionDialog.value = false;
};

const confirmEncryption = () => {
  const paramsObj = { ...patientData.value };
  if (selectedTests.value.length) {
    paramsObj.selectedTests = selectedTests.value.join(',');
  }
  const encryptedStr = encryptParams(paramsObj, encryptionPassword.value);
  const url = new URL(window.location.href);
  url.search = '';
  const hashParams = new URLSearchParams();
  hashParams.set('encrypted', encryptedStr);
  url.hash = hashParams.toString();
  navigator.clipboard
    .writeText(url.toString())
    .then(() => {
      snackbarMessage.value = 'Encrypted URL copied to clipboard!';
      snackbar.value = true;
      encryptionDialog.value = false;
    })
    .catch(() => {
      snackbarMessage.value = 'Failed to copy encrypted URL.';
      snackbar.value = true;
      encryptionDialog.value = false;
    });
};

const cancelDecryption = () => {
  decryptionDialog.value = false;
  decryptionPassword.value = '';
  decryptionError.value = '';
  Object.keys(patientData.value).forEach((key) => {
    patientData.value[key] = '';
  });
  clearUrlParameters();
};

const confirmDecryption = () => {
  const params = decryptParams(pendingEncryptedValue.value, decryptionPassword.value);
  if (!params) {
    decryptionError.value = 'Decryption failed. Please check your password.';
    return;
  }
  patientData.value.givenName = params.get('givenName') || '';
  patientData.value.familyName = params.get('familyName') || '';
  patientData.value.birthdate = params.get('birthdate') || '';
  patientData.value.insurance = params.get('insurance') || '';
  patientData.value.sex = (params.get('sex') || '').toLowerCase();
  patientData.value.physicianName = params.get('physicianName') || '';
  patientData.value.familyHistory = (params.get('familyHistory') || '').toLowerCase();
  patientData.value.parentalConsanguinity = (params.get('parentalConsanguinity') || '').toLowerCase();
  patientData.value.diagnosis = params.get('diagnosis') || '';
  patientData.value.orderingDate = params.get('orderingDate') || getCurrentIsoDate();
  decryptionDialog.value = false;
  decryptionPassword.value = '';
  decryptionError.value = '';
  clearUrlParameters();
};

/**
 * Toggles the application theme between dark and light modes.
 */
function toggleTheme() {
  isDark.value = !isDark.value;
}

/**
 * Resets the form to its initial state.
 */
function resetForm() {
  patientData.value = initialPatientData();
  selectedTests.value = [];
  phenotypeData.value = {};
  showPedigree.value = false;
  snackbarMessage.value = 'Form has been reset.';
  snackbar.value = true;
}

/**
 * Opens the FAQ modal.
 */
function openFAQ() {
  showFAQModal.value = true;
}

/**
 * Closes the FAQ modal.
 */
function closeFAQ() {
  showFAQModal.value = false;
}

// --- Disclaimer Handling ---
const disclaimerAcknowledged = ref(localStorage.getItem('disclaimerAcknowledged') === 'true');
const acknowledgmentTime = ref(localStorage.getItem('acknowledgmentTime') || '');
// Show the disclaimer modal if not yet acknowledged
const showDisclaimerModal = ref(!disclaimerAcknowledged.value);

/**
 * Handles the dismissal of the disclaimer.
 */
function handleDisclaimerDismiss() {
  disclaimerAcknowledged.value = true;
  acknowledgmentTime.value = new Date().toLocaleDateString();
  localStorage.setItem('disclaimerAcknowledged', 'true');
  localStorage.setItem('acknowledgmentTime', acknowledgmentTime.value);
  showDisclaimerModal.value = false;
}

/**
 * Opens the disclaimer modal (e.g., when the footer button is clicked).
 */
function openDisclaimerModal() {
  showDisclaimerModal.value = true;
}

onMounted(() => {
  const encryptedValue = getUrlParameter('encrypted');
  if (encryptedValue) {
    pendingEncryptedValue.value = encryptedValue;
    decryptionDialog.value = true;
  } else {
    const params = mergeUrlParameters();
    patientData.value.givenName = params.get('givenName') || '';
    patientData.value.familyName = params.get('familyName') || '';
    patientData.value.birthdate = params.get('birthdate') || '';
    patientData.value.insurance = params.get('insurance') || '';
    patientData.value.sex = (params.get('sex') || '').toLowerCase();
    patientData.value.physicianName = params.get('physicianName') || '';
    patientData.value.familyHistory = (params.get('familyHistory') || '').toLowerCase();
    patientData.value.parentalConsanguinity = (params.get('parentalConsanguinity') || '').toLowerCase();
    patientData.value.diagnosis = params.get('diagnosis') || '';
    patientData.value.orderingDate = params.get('orderingDate') || getCurrentIsoDate();
    clearUrlParameters();
  }
});
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
