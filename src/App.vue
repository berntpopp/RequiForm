<template>
  <v-app :theme="isDark ? 'dark' : 'light'" id="app">
    <!-- Top Menu Bar -->
    <TopBar
      :isDark="isDark"
      @toggle-theme="toggleTheme"
      @reset-form="resetApplicationState"
      @open-faq="openFAQ"
      @generate-pdf="handleGeneratePdf"
      @copy-url="handleCopyUrl"
      @copy-encrypted-url="openEncryptionDialog"
      @start-tour="startTour"
      @save-data="openSaveDataDialog"
      @load-data="openLoadDataDialog"
    />

    <!-- Disclaimer Modal: shown if not yet acknowledged or if reopened -->
    <Disclaimer v-if="!disclaimerAcknowledged || showDisclaimerModal" @dismiss="handleDisclaimerDismiss" />

    <v-main>
      <v-container>
        <!-- Validation Summary Component - shows all validation errors in one place -->
        <div class="d-flex align-center mb-4" v-if="showValidation">
          <ValidationSummary :showValidation="showValidation" />
          <v-btn 
            color="primary" 
            variant="text" 
            class="ml-auto" 
            size="small" 
            @click="resetValidation"
          >
            <v-icon left>mdi-close</v-icon>
            Hide Validation
          </v-btn>
        </div>
        
        <!-- PatientForm now includes both the basic fields and the GenDG Consent select/form (if chosen). -->
        <PatientForm 
          :patientData="patientData" 
          @update:patientData="handlePatientDataUpdate"
          :pdfConfig="pdfConfig" 
          id="patient-form-component"
        />

        <!-- Pedigree Option -->
        <v-checkbox v-model="showPedigree" label="Include Pedigree Chart" class="mb-4" />
        <PedigreeDrawer v-if="showPedigree" ref="pedigreeDrawer" />

        <!-- Test Selector -->
        <TestSelector 
          v-model="selectedTests"
          id="test-selector-component"
        />

        <!-- Phenotype Selector -->
        <PhenotypeSelector 
          :groupedPanelDetails="groupedPanelDetails" 
          v-model="phenotypeData"
          id="phenotype-selector-component"
        />

        <!-- Hidden PDF Generator component -->
        <div style="display: none;">
          <PdfGenerator
            ref="pdfGen"
            :patientData="patientData"
            :selectedTests="selectedTests"
            :pedigreeDataUrl="pedigreeDataUrl"
            :phenotypeData="phenotypeData"
            :pdfConfig="pdfConfig"
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
      <v-snackbar v-model="snackbar" timeout="3000" top right transition="scale-transition">
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
          <v-card-title class="headline">Enter Password for Encryption</v-card-title>
          <v-card-text>
            <v-text-field v-model="encryptionPassword" type="password" label="Password" autocomplete="off" />
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
          <v-card-title class="headline">Enter Password for Decryption</v-card-title>
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

      <!-- Validation is now handled by ValidationSummary component -->

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

      <!-- Reset Confirmation Modal -->
      <v-dialog v-model="resetConfirmationDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Reset Application</v-card-title>
          <v-card-text>
            <p class="mt-3">Are you sure you want to reset the entire application? All data will be lost.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelReset">Cancel</v-btn>
            <v-btn color="error" text @click="confirmReset">Reset</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
      <!-- Save Data Dialog -->
      <v-dialog v-model="saveDataDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Save Form Data</v-card-title>
          <v-card-text>
            <p>Enter a filename for your form data:</p>
            <v-text-field 
              v-model="saveDataName" 
              label="Filename (Optional)"
              hint="If blank, a default name with the current date will be used."
              persistent-hint
              class="mt-3"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelSaveData">Cancel</v-btn>
            <v-btn color="primary" text @click="confirmSaveData">Export</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
      <!-- Load Data Dialog -->
      <v-dialog v-model="loadDataDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Load Form Data</v-card-title>
          <v-card-text>
            <p>Select a JSON file to import:</p>
            <v-file-input
              v-model="importedFile"
              accept=".json"
              label="Select a JSON file"
              prepend-icon="mdi-file-import"
              show-size
              truncate-length="15"
              class="mt-3"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelLoadData">Cancel</v-btn>
            <v-btn 
              color="primary" 
              text 
              @click="confirmLoadData"
              :disabled="!importedFile"
            >
              Import
            </v-btn>
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
import { ref, computed, onMounted, nextTick, provide } from 'vue';
import TopBar from './components/TopBar.vue';
import PatientForm from './components/PatientForm.vue';
import TestSelector from './components/TestSelector.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import PedigreeDrawer from './components/PedigreeDrawer.vue';
import PhenotypeSelector from './components/PhenotypeSelector.vue';
import ValidationSummary from './components/ValidationSummary.vue';
import VersionFooter from './components/Footer.vue';
import testsData from './data/tests.json';
import {
  getUrlParameter,
  clearUrlParameters,
  encryptParams,
  decryptParams,
  parsePatientDataFromUrl,
  createUrlWithPatientData,
} from './utils/url.js';
import Disclaimer from './components/Disclaimer.vue';

// Tour Service
import { initializeTour, shouldShowTour } from './services/tourService';
import { usePatientData } from './composables/usePatientData';

// Tour instance ref
const tourInstance = ref(null);

// Initialize unified patient data composable
const {
  patientData: unifiedPatientData,
  updatePersonalInfo,
  updateSelectedPanels,
  updatePhenotypeData,
  updateCategory,
  updateConsent,
  resetPatientData: resetUnifiedPatientData,
  initializeFromExternalData,
  exportPatientData,
  // Validation-related functions
  isValid,
  validationErrors: unifiedValidationErrors,
  sectionValidation,
  validateForm,
  getFieldErrors
} = usePatientData();

// Provide patient data and update methods to child components
provide('patientData', unifiedPatientData);
provide('updatePersonalInfo', updatePersonalInfo);
provide('updateSelectedPanels', updateSelectedPanels);
provide('updatePhenotypeData', updatePhenotypeData);
provide('updateCategory', updateCategory);
provide('updateConsent', updateConsent);

// Provide validation-related methods and data
provide('isValid', isValid);
provide('validationErrors', unifiedValidationErrors);
provide('sectionValidation', sectionValidation);
provide('validateForm', validateForm);
provide('getFieldErrors', getFieldErrors);

/**
 * Returns the current date in ISO format (YYYY-MM-DD).
 * @return {string} The ISO date string.
 */
function getCurrentIsoDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns the initial patient data object.
 * Includes genDGConsentData with "provided" or "fill" + subfields.
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
    // The GenDG consent structure
    genDGConsentData: {
      provided: 'provided',
      form: {
        consentName: '',
        consentDate: '',
        consentStatement: '',
        questionSecondaryFindings: 'no',
        questionMaterial: 'no',
        questionExtended: 'no',
        questionResearch: 'no'
      }
    }
  };
}

/** The main reactive patient data object. */
const patientData = ref(initialPatientData());

/** Array of selected panel IDs. */
const selectedTests = ref([]);

/** Phenotype data mapping category id to phenotype states. */
const phenotypeData = ref({});

/** Snackbar for notifications. */
const snackbar = ref(false);
const snackbarMessage = ref('');

/** Validation state */
const showValidation = ref(false);

/** Encryption dialog state and password. */
const encryptionDialog = ref(false);
const encryptionPassword = ref('');

/** Decryption dialog state, password, and error. */
const decryptionDialog = ref(false);
const decryptionPassword = ref('');
const decryptionError = ref('');

/** Validation dialog state and error messages. */
/** Used to store the encrypted string from the URL for decryption. */
const pendingEncryptedValue = ref(null);

/** Toggle for pedigree chart. */
const showPedigree = ref(false);

/** Holds the pedigree chart image data URL for PDF inclusion. */
const pedigreeDataUrl = ref('');

/** Theme state: true = dark theme, false = light theme. */
const isDark = ref(false);

/** Reset confirmation dialog state. */
const resetConfirmationDialog = ref(false);

/** Save data dialog state and related variables. */
const saveDataDialog = ref(false);
const saveDataName = ref('');

/** Load data dialog state and related variables. */
const loadDataDialog = ref(false);
const importedFile = ref(null);

/** FAQ modal state. */
const showFAQModal = ref(false);

/** FAQ content array. */
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

/** PDF generator and pedigree drawer references. */
const pdfGen = ref(null);
const pedigreeDrawer = ref(null);

const pdfConfig = ref({
  // Add your pdfConfig data here
});

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

// Validation is now handled by the validation utility in src/utils/validation.js

/**
 * Main PDF generation handler.
 */
async function handleGeneratePdf() {
  // Use the new validation system
  const isFormValid = validateForm(true);
  if (!isFormValid) {
    // Show the validation summary
    showValidation.value = true;
    
    // Show a snackbar message
    snackbar.value = true;
    snackbarMessage.value = 'Please correct the errors before generating the PDF.';
    
    // Scroll to top to make validation summary visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  
  // Attempt to get pedigree data if requested
  if (showPedigree.value && pedigreeDrawer.value?.getPedigreeDataUrl) {
    try {
      pedigreeDataUrl.value = await pedigreeDrawer.value.getPedigreeDataUrl();
    } catch (error) {
      console.error('Error retrieving pedigree image:', error);
    }
  }
  
  await nextTick();
  if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
    pdfGen.value.generatePdf();
  }
}

/** Reset the validation state */
function resetValidation() {
  showValidation.value = false;
}

// Removed the proceedValidation function as it's now handled directly within the handleGeneratePdf function

// The following function is kept for reference but now using unified data model for URL generation
// const generatePlainUrl = () => generateUrlWithHash(patientData.value, selectedTests.value);

/** Copy the URL with patient data to the clipboard. */
function handleCopyUrl() {
  // Ensure unified model is up to date with current form state
  syncUnifiedPatientData();
  
  // Generate URL using unified patient data
  const unifiedUrl = createUrlWithPatientData(exportPatientData());
  
  navigator.clipboard
    .writeText(unifiedUrl)
    .then(() => {
      snackbarMessage.value = 'URL copied to clipboard!';
      snackbar.value = true;
    })
    .catch(() => {
      snackbarMessage.value = 'Failed to copy URL.';
      snackbar.value = true;
    });
}

/** Encryption dialog handlers. */
function openEncryptionDialog() {
  encryptionPassword.value = '';
  encryptionDialog.value = true;
}
function closeEncryptionDialog() {
  encryptionDialog.value = false;
}
function confirmEncryption() {
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
}

/** Decryption dialog handlers. */
function cancelDecryption() {
  decryptionDialog.value = false;
  decryptionPassword.value = '';
  decryptionError.value = '';
  // Clear all patient data if canceled
  Object.keys(patientData.value).forEach((key) => {
    patientData.value[key] = '';
  });
  clearUrlParameters();
}
function confirmDecryption() {
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
}

/** Toggle dark/light theme. */
function toggleTheme() {
  isDark.value = !isDark.value;
}

/**
 * Shows a confirmation modal dialog before resetting the application state
 */
function resetApplicationState() {
  // Show confirmation dialog
  resetConfirmationDialog.value = true;
}

/**
 * Handles the cancel action from the reset confirmation dialog
 */
function cancelReset() {
  resetConfirmationDialog.value = false;
}

/**
 * Handles the confirm action from the reset confirmation dialog
 */
function confirmReset() {
  resetConfirmationDialog.value = false;
  performApplicationReset();
}



/**
 * Opens the save data dialog
 */
function openSaveDataDialog() {
  // Default save name with date and time
  saveDataName.value = `RequiForm_Data_${new Date().toISOString().split('T')[0]}`;
  saveDataDialog.value = true;
}

/**
 * Cancels saving data
 */
function cancelSaveData() {
  saveDataDialog.value = false;
}

/**
 * Confirms saving data to a file
 */
function confirmSaveData() {
  saveToFile();
  saveDataDialog.value = false;
  
  // Clear URL parameters for security
  clearUrlParameters();
}

/**
 * Opens the load data dialog
 */
function openLoadDataDialog() {
  loadDataDialog.value = true;
}

/**
 * Cancels loading data
 */
function cancelLoadData() {
  loadDataDialog.value = false;
  importedFile.value = null;
}

/**
 * Confirms loading data from a file
 */
function confirmLoadData() {
  loadFromFile();
  loadDataDialog.value = false;
  
  // Clear URL parameters for security
  clearUrlParameters();
}



/**
 * Saves the current form data to a file
 */
function saveToFile() {
  try {
    // Get the current data
    const data = exportPatientData();
    
    // Convert to a JSON string
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create a blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Set the filename
    const filename = saveDataName.value.trim() || `RequiForm_Data_${new Date().toISOString().split('T')[0]}.json`;
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    
    // Append to the document, click it, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    snackbarMessage.value = `Data successfully exported to "${link.download}".`;
    snackbar.value = true;
    
    // Clear URL parameters to prevent sensitive data exposure
    clearUrlParameters();
  } catch (error) {
    console.error('Error saving to file:', error);
    snackbarMessage.value = `Error exporting data: ${error.message}`;
    snackbar.value = true;
  }
}



/**
 * Loads form data from a file
 */
function loadFromFile() {
  if (!importedFile.value) {
    snackbarMessage.value = 'No file selected.';
    snackbar.value = true;
    return;
  }
  
  const fileReader = new FileReader();
  
  fileReader.onload = (event) => {
    try {
      // Parse the JSON
      const data = JSON.parse(event.target.result);
      
      // First, clear URL parameters to prevent sensitive data exposure
      clearUrlParameters();
      
      // Load the data into the application
      initializeFromExternalData(data, true);
      
      // Sync with legacy formats
      syncLegacyPatientData();
      
      // Show success message
      snackbarMessage.value = 'Data successfully loaded from file.';
      snackbar.value = true;
    } catch (error) {
      console.error('Error parsing file:', error);
      snackbarMessage.value = `Error loading file: ${error.message}`;
      snackbar.value = true;
    }
  };
  
  fileReader.onerror = () => {
    snackbarMessage.value = 'Error reading file.';
    snackbar.value = true;
  };
  
  fileReader.readAsText(importedFile.value);
}

/**
 * Performs the actual reset of the entire application state to its initial values.
 * This includes all patient data, UI flags, pedigree state, and validation.
 */
function performApplicationReset() {
  // Reset patient data models
  patientData.value = initialPatientData();
  selectedTests.value = [];
  phenotypeData.value = {};
  
  // Reset unified patient data model
  resetUnifiedPatientData();
  
  // Reset UI flags and component states
  showPedigree.value = false;
  showValidation.value = false;
  pdfConfig.value = {}; // Reset to empty object as there's no default config defined
  pedigreeDataUrl.value = '';
  
  // Reset any active dialog windows
  showFAQModal.value = false;
  encryptionDialog.value = false;
  decryptionDialog.value = false;
  showDisclaimerModal.value = false;
  
  // Reset input fields in dialogs
  encryptionPassword.value = '';
  decryptionPassword.value = '';
  
  // Reset any URL parameters - enhanced implementation to ensure both query and hash parameters are removed
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  
  try {
    // First specifically clear the query parameters (everything after ?)
    if (window.location.search) {
      history.pushState("", document.title, window.location.pathname + window.location.hash);
    }
    
    // Then clear any hash parameters
    if (window.location.hash) {
      history.pushState("", document.title, window.location.pathname);
    }
    
    // Final verification - explicitly set to base URL to ensure everything is cleared
    window.history.replaceState(null, document.title, baseUrl);
    console.log('URL parameters cleared successfully');
  } catch (error) {
    console.error('Error clearing URL parameters:', error);
    
    // Fallback method for older browsers
    if (window.location.href !== baseUrl) {
      window.location.href = baseUrl;
    }
  }
  
  // Reset any global state that might have been set
  if (window.requiFormData) {
    window.requiFormData = {};
  }
  
  // Reset pedigree drawer if the component exists
  nextTick(() => {
    if (pedigreeDrawer.value && typeof pedigreeDrawer.value.resetPedigree === 'function') {
      pedigreeDrawer.value.resetPedigree();
    }
  });
  
  // Show confirmation message
  snackbarMessage.value = 'Application state has been completely reset.';
  snackbar.value = true;
}

/** FAQ modal handlers. */
function openFAQ() {
  showFAQModal.value = true;
}
function closeFAQ() {
  showFAQModal.value = false;
}

/** Disclaimer handling. */
const disclaimerAcknowledged = ref(localStorage.getItem('disclaimerAcknowledged') === 'true');
const acknowledgmentTime = ref(localStorage.getItem('acknowledgmentTime') || '');
const showDisclaimerModal = ref(!disclaimerAcknowledged.value);

/** Dismiss the disclaimer. */
function handleDisclaimerDismiss() {
  disclaimerAcknowledged.value = true;
  acknowledgmentTime.value = new Date().toLocaleDateString();
  localStorage.setItem('disclaimerAcknowledged', 'true');
  localStorage.setItem('acknowledgmentTime', acknowledgmentTime.value);
  showDisclaimerModal.value = false;
}

/** Reopen the disclaimer modal. */
function openDisclaimerModal() {
  showDisclaimerModal.value = true;
}

// --- Tour Initialization ---
// Wait a moment for the DOM to be ready after initial rendering
onMounted(() => {
  nextTick().then(() => {
    try {
      tourInstance.value = initializeTour();
      if (shouldShowTour()) {
        console.log("Starting tour automatically...");
        tourInstance.value.start();
      } else {
        console.log("Tour already completed or skipped previously.");
      }
    } catch (error) {
      console.error("Failed to initialize or start tour:", error);
    }
  });
  
  // Initialize unified patient data from URL parameters
  const parsedData = parsePatientDataFromUrl();
  
  // Only initialize if there's actual data in the URL
  const hasUrlData = Object.values(parsedData).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return !!value;
  });
  
  if (hasUrlData) {
    // Initialize the unified patient data model
    initializeFromExternalData(parsedData, false);
    
    // Sync with legacy patient data format for backward compatibility
    syncLegacyPatientData();
    
    // Clear URL parameters after loading to prevent sensitive data exposure
    // Wait a moment to ensure data is fully loaded before clearing URL
    setTimeout(() => {
      // Reset any URL parameters - explicit handling for both query and hash parameters
      const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      
      try {
        // First clear query parameters (everything after ?)
        if (window.location.search) {
          history.pushState("", document.title, window.location.pathname + window.location.hash);
        }
        
        // Then clear hash parameters
        if (window.location.hash) {
          history.pushState("", document.title, window.location.pathname);
        }
        
        // Final explicit set to the base URL
        window.history.replaceState(null, document.title, baseUrl);
        console.log('URL parameters cleared after initialization');
      } catch (error) {
        console.error('Error clearing URL parameters:', error);
        
        // Fallback method
        if (window.location.href !== baseUrl) {
          window.location.href = baseUrl;
        }
      }
    }, 500); // 500ms delay to ensure data is fully loaded
  }
  
  // Handle URL parameters and initialize data
  const encryptedValue = getUrlParameter('encrypted');
  if (encryptedValue) {
    pendingEncryptedValue.value = encryptedValue;
    decryptionDialog.value = true;
  } else {
    // Direct hash parameter handling for debugging
    const hash = window.location.hash.substring(1);
    console.log('URL Hash:', hash);
    
    if (hash) {
      try {
        // Parse the hash parameters manually
        const hashParams = new URLSearchParams(hash);
        console.log('Hash params:', Object.fromEntries(hashParams.entries()));
        
        // Directly populate the legacy patient data object
        if (hashParams.get('givenName')) patientData.value.givenName = hashParams.get('givenName');
        if (hashParams.get('familyName')) patientData.value.familyName = hashParams.get('familyName');
        if (hashParams.get('birthdate')) patientData.value.birthdate = hashParams.get('birthdate');
        if (hashParams.get('insurance')) patientData.value.insurance = hashParams.get('insurance');
        if (hashParams.get('sex')) patientData.value.sex = hashParams.get('sex').toLowerCase();
        if (hashParams.get('physicianName')) patientData.value.physicianName = hashParams.get('physicianName');
        
        // Directly handle category and diagnosis
        if (hashParams.get('category')) {
          const categoryValue = hashParams.get('category');
          console.log('Setting category from URL:', categoryValue);
          patientData.value.category = categoryValue;
          // Ensure category is properly updated in the unified model
          updateCategory(categoryValue);
        }
        
        if (hashParams.get('diagnosis')) {
          patientData.value.diagnosis = hashParams.get('diagnosis');
        }
        
        // Don't handle panels here - let parsePatientDataFromUrl and the TestSelector component handle it
        // This avoids competing updates that cause reactivity issues
        if (hashParams.get('panels')) {
          const panelsValue = hashParams.get('panels');
          console.log('Found panels in URL:', panelsValue);
          // We'll let the shared global state and parsePatientDataFromUrl handle this
        }
        
        // After setting all the values, sync with the unified model
        syncUnifiedPatientData();
        
        console.log('Populated patient data from URL:', patientData.value);
      } catch (error) {
        console.error('Error parsing URL parameters:', error);
      }
      
      // Clean up URL parameters
      clearUrlParameters();
    }
  }
});

function handlePatientDataUpdate(newData) {
  console.log("App.vue received update:", JSON.stringify(newData)); // Log received data
  patientData.value = newData; // Update the legacy reactive state
  
  // Also update unified patient data model
  syncUnifiedPatientData();
}

/**
 * Synchronizes the legacy patient data format with the unified model
 */
function syncUnifiedPatientData() {
  // Map the legacy patient data to the unified format
  updatePersonalInfo({
    firstName: patientData.value.givenName || '',
    lastName: patientData.value.familyName || '',
    birthdate: patientData.value.birthdate || '',
    sex: patientData.value.sex || '',
    insurance: patientData.value.insurance || '',
    referrer: patientData.value.physicianName || '',
    diagnosis: patientData.value.diagnosis || ''
  });
  
  // Update selected panels - ensure we're passing the actual panel IDs
  console.log('Syncing panels to unified model:', selectedTests.value);
  updateSelectedPanels(selectedTests.value || []);
  
  // For panels, do a direct update as well for immediate reactivity
  if (unifiedPatientData && selectedTests.value && selectedTests.value.length > 0) {
    unifiedPatientData.selectedPanels = [...selectedTests.value];
  }
  
  // Update phenotype data
  updatePhenotypeData(phenotypeData.value ? Object.values(phenotypeData.value) : []);
  
  // Update category if present - ensure it's explicitly called
  if (patientData.value.category) {
    console.log('Syncing category to unified model:', patientData.value.category);
    updateCategory(patientData.value.category);
    
    // Force immediate update in the unified patient data for components to detect
    unifiedPatientData.category = patientData.value.category;
  }
}

/**
 * Synchronizes the unified patient data model with the legacy format
 */
function syncLegacyPatientData() {
  // Map unified model back to legacy format
  patientData.value.givenName = unifiedPatientData.personalInfo.firstName || '';
  patientData.value.familyName = unifiedPatientData.personalInfo.lastName || '';
  patientData.value.birthdate = unifiedPatientData.personalInfo.birthdate || '';
  patientData.value.sex = unifiedPatientData.personalInfo.sex || '';
  patientData.value.insurance = unifiedPatientData.personalInfo.insurance || '';
  patientData.value.physicianName = unifiedPatientData.personalInfo.referrer || '';
  
  // Update selected tests - ensure a clean copy is made
  if (unifiedPatientData && unifiedPatientData.selectedPanels) {
    console.log('Syncing from unified model to legacy model - panels:', unifiedPatientData.selectedPanels);
    selectedTests.value = [...unifiedPatientData.selectedPanels];
  }
  
  // Process phenotype data
  if (unifiedPatientData.phenotypeData && unifiedPatientData.phenotypeData.length > 0) {
    // Convert array format to object format expected by legacy code
    const newPhenotypeData = {};
    unifiedPatientData.phenotypeData.forEach(item => {
      if (item.id) {
        newPhenotypeData[item.id] = item;
      }
    });
    phenotypeData.value = newPhenotypeData;
  }
}

// --- Tour Method --- 
// Method to manually start the tour
function startTour() {
  if (tourInstance.value) {
    // Reset localStorage flag if you want the tour to be startable multiple times manually
    // localStorage.removeItem('requiformTourCompleted'); 
    console.log("Starting tour manually...");
    tourInstance.value.start();
  } else {
    console.error("Tour instance not available.");
  }
}
// --- End Tour Method ---
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
