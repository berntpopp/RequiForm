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
      @open-paste-data="openPasteDataDialog"
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

        <!-- Selected Panels Summary (extracted to its own component) -->
        <SelectedPanelsSummary :groupedPanelDetails="groupedPanelDetails" />
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

      <!-- Dialogs -->
      <EncryptionDialog
        v-model="encryptionDialog"
        @cancel="closeEncryptionDialog"
        @confirm="confirmEncryption"
      />

      <DecryptionDialog
        v-model="decryptionDialog"
        :error="decryptionError"
        @cancel="cancelDecryption"
        @confirm="confirmDecryption"
      />

      <FAQDialog
        v-model="showFAQModal"
        :faqItems="faqContent"
        @close="closeFAQ"
      />

      <ResetConfirmationDialog
        v-model="resetConfirmationDialog"
        @cancel="cancelReset"
        @confirm="confirmReset"
      />

      <SaveDataDialog
        v-model="saveDataDialog"
        :defaultFileName="saveDataName"
        @cancel="cancelSaveData"
        @confirm="confirmSaveData"
      />

      <LoadDataDialog
        v-model="loadDataDialog"
        :error="loadDataError"
        @cancel="cancelLoadData"
        @confirm="confirmLoadData"
      />
      
      <!-- Paste Data Modal -->
      <PasteDataModal
        v-model="pasteDataDialog"
        @close="closePasteDataDialog"
        @import="handlePastedDataImport"
      />
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
import PhenotypeSelector from './components/PhenotypeSelector.vue';
import PedigreeDrawer from './components/PedigreeDrawer.vue';
import ValidationSummary from './components/ValidationSummary.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import Disclaimer from './components/Disclaimer.vue';
import VersionFooter from './components/VersionFooter.vue';
import PasteDataModal from './components/PasteDataModal.vue';
import SelectedPanelsSummary from './components/SelectedPanelsSummary.vue';

// Dialog components
import EncryptionDialog from './components/dialogs/EncryptionDialog.vue';
import DecryptionDialog from './components/dialogs/DecryptionDialog.vue';
import FAQDialog from './components/dialogs/FAQDialog.vue';
import ResetConfirmationDialog from './components/dialogs/ResetConfirmationDialog.vue';
import SaveDataDialog from './components/dialogs/SaveDataDialog.vue';
import LoadDataDialog from './components/dialogs/LoadDataDialog.vue';

// Utilities and Composables
import { parsePatientDataFromUrl, clearUrlParameters, getUrlParameter } from './utils/urlUtils';
import { encryptData, decryptData } from './utils/cryptoUtils';
import { downloadJsonFile } from './utils/fileUtils';
import { categories } from './data/categories.js';
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
  parsePatientDataFromUrl: parseDataFromUrl,
  isValid,
  validationErrors: unifiedValidationErrors,
  sectionValidation,
  validateForm,
  getFieldErrors
} = usePatientData();

// Provide validation utilities to child components
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
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    sex: '',
    insurance: '',
    physicianName: '',
    diagnosis: '',
    category: '',  // Add this field as it's now part of the data model
    gendgConsent: {
      type: 'fill',
      firstName: '',
      lastName: '',
      location: '',
      date: getCurrentIsoDate(),
    }
  };
}

/** The main reactive patient data object. */
const patientData = ref(initialPatientData());

/** Array of selected panel IDs. */
const selectedTests = ref([]);

/** Phenotype data mapping category id to phenotype states. */
const phenotypeData = ref({});

/** Whether to show the pedigree chart drawer. */
const showPedigree = ref(false);
const pedigreeDataUrl = ref('');

/** Dark mode toggle. */
const isDark = ref(localStorage.getItem('darkMode') === 'true');

/** Snackbar for notifications. */
const snackbar = ref(false);
const snackbarMessage = ref('');

/** Validation state for form validation. */
const showValidation = ref(false);

/** Encryption dialog state and related variables. */
const encryptionDialog = ref(false);
const encryptionPassword = ref('');

/** Decryption dialog state and related variables. */
const decryptionDialog = ref(false);
const decryptionPassword = ref('');
const decryptionError = ref('');
const pendingEncryptedValue = ref('');

/** Reset confirmation dialog state. */
const resetConfirmationDialog = ref(false);

/** Save data dialog state and related variables. */
const saveDataDialog = ref(false);
const saveDataName = ref('requiform-data');

/** Load data dialog state and related variables. */
const loadDataDialog = ref(false);
const importedFile = ref(null);
const loadDataError = ref('');

/** Paste data dialog state */
const pasteDataDialog = ref(false);

/** FAQ modal state. */
const showFAQModal = ref(false);

/** FAQ content array. */
const faqContent = ref([
  {
    question: 'What is RequiForm's approach to data handling?',
    answer:
      'RequiForm processes all data locally in your browser. No data is sent to any server, ensuring maximum privacy. You can save your form state by generating a URL, storing it as a file, or by encrypting it with a password.',
  },
  {
    question: 'Can I save my data and continue later?',
    answer:
      'Yes, you have several options: <ul><li>Generate a URL containing your data (which can be bookmarked)</li><li>Save your data to a JSON file</li><li>Generate an encrypted URL that requires a password</li></ul>',
  },
  {
    question: 'What does the JSON file contain?',
    answer:
      'The JSON file contains all the information that you have entered into the form, including patient data, selected test panels, and phenotype information.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Since all processing happens in your browser and no data is ever sent to a server, your data remains under your control at all times. The encryption feature adds an additional layer of security for shared URLs.',
  },
  {
    question: 'What happens when I click "Reset Form"?',
    answer:
      'This will clear all entered data and return the form to its initial state. You will be prompted to confirm before the reset occurs.',
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
 */
const groupedPanelDetails = computed(() => {
  return categories
    .map((category) => ({
      categoryTitle: category.title,
      tests: category.tests.filter((test) => selectedTests.value.includes(test.id)),
    }))
    .filter((group) => group.tests.length > 0);
});

// Validation is now handled by the validation utility in src/utils/validation.js

/**
 * Main PDF generation handler.
 */
function handleGeneratePdf() {
  // First validate the form
  if (!validateForm()) {
    // Show validation errors
    showValidation.value = true;
    snackbar.value = true;
    snackbarMessage.value = "Please correct the highlighted fields before generating PDF.";
    return;
  }

  // Validation passed, capture pedigree data if needed
  if (showPedigree.value && pedigreeDrawer.value) {
    pedigreeDataUrl.value = pedigreeDrawer.value.getDataURL();
  } else {
    pedigreeDataUrl.value = '';
  }

  // Generate PDF after a brief delay to ensure pedigree data is ready
  nextTick().then(() => {
    if (pdfGen.value) {
      pdfGen.value.generatePdf();
      
      // Show success notification
      snackbar.value = true;
      snackbarMessage.value = "PDF generated successfully!";
    } else {
      console.error('PDF generator component not available');
      
      // Show error notification
      snackbar.value = true;
      snackbarMessage.value = "Error generating PDF. Please try again.";
    }
  });
}

/**
 * Reset the validation state
 */
function resetValidation() {
  showValidation.value = false;
}

/**
 * Copy the URL with patient data to the clipboard.
 */
function handleCopyUrl() {
  const formData = exportPatientData();
  
  // Clear sensitive data that should not be in URL
  const urlSafeData = { ...formData };
  if (urlSafeData.personalInfo && urlSafeData.personalInfo.insurance) {
    delete urlSafeData.personalInfo.insurance;
  }
  
  // Generate URL
  const url = window.location.origin + window.location.pathname + '#' + new URLSearchParams(urlSafeData).toString();
  
  navigator.clipboard.writeText(url).then(
    () => {
      snackbar.value = true;
      snackbarMessage.value = "URL copied to clipboard!";
    },
    (err) => {
      console.error('Could not copy URL: ', err);
      snackbar.value = true;
      snackbarMessage.value = "Failed to copy URL to clipboard";
    }
  );
}

/**
 * Encryption dialog handlers.
 */
function openEncryptionDialog() {
  encryptionDialog.value = true;
}

function closeEncryptionDialog() {
  encryptionDialog.value = false;
  encryptionPassword.value = '';
}

function confirmEncryption(password) {
  const formData = exportPatientData();
  
  try {
    const encryptedData = encryptData(JSON.stringify(formData), password);
    const url = `${window.location.origin}${window.location.pathname}?encrypted=${encodeURIComponent(encryptedData)}`;
    
    navigator.clipboard.writeText(url).then(
      () => {
        snackbar.value = true;
        snackbarMessage.value = "Encrypted URL copied to clipboard!";
      },
      (err) => {
        console.error('Could not copy encrypted URL: ', err);
        snackbar.value = true;
        snackbarMessage.value = "Failed to copy encrypted URL to clipboard";
      }
    );
  } catch (error) {
    console.error('Encryption failed:', error);
    snackbar.value = true;
    snackbarMessage.value = "Encryption failed. Please try again.";
  }
}

/**
 * Decryption dialog handlers.
 */
function cancelDecryption() {
  decryptionDialog.value = false;
  decryptionPassword.value = '';
  decryptionError.value = '';
  pendingEncryptedValue.value = '';
  
  // Remove encrypted parameter from URL
  const url = new URL(window.location.href);
  url.searchParams.delete('encrypted');
  window.history.replaceState({}, document.title, url.pathname + url.search);
}

function confirmDecryption(password) {
  try {
    const decryptedData = decryptData(pendingEncryptedValue.value, password);
    const parsedData = JSON.parse(decryptedData);
    
    // Initialize application with decrypted data
    initializeFromExternalData(parsedData);
    syncLegacyPatientData();
    
    // Close dialog and clean up
    decryptionDialog.value = false;
    decryptionPassword.value = '';
    pendingEncryptedValue.value = '';
    
    // Clear URL parameter
    clearUrlParameters();
    
    snackbar.value = true;
    snackbarMessage.value = "Data successfully loaded from encrypted URL!";
  } catch (error) {
    console.error('Decryption failed:', error);
    decryptionError.value = "Incorrect password or invalid data.";
  }
}

/**
 * Toggle dark/light theme.
 */
function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem('darkMode', isDark.value);
}

/**
 * Shows a confirmation modal dialog before resetting the application state
 */
function resetApplicationState() {
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
  performApplicationReset();
  resetConfirmationDialog.value = false;
  
  snackbar.value = true;
  snackbarMessage.value = "Form has been reset.";
}

/**
 * Opens the save data dialog
 */
function openSaveDataDialog() {
  saveDataName.value = 'requiform-data';
  saveDataDialog.value = true;
}

/**
 * Cancels saving data
 */
function cancelSaveData() {
  saveDataDialog.value = false;
  saveDataName.value = '';
}

/**
 * Confirms saving data to a file
 */
function confirmSaveData(fileName) {
  const exportData = exportPatientData();
  downloadJsonFile(exportData, fileName || 'requiform-data');
  
  snackbar.value = true;
  snackbarMessage.value = "Data saved to file successfully!";
}

/**
 * Opens the load data dialog
 */
function openLoadDataDialog() {
  loadDataError.value = '';
  loadDataDialog.value = true;
}

/**
 * Cancels loading data
 */
function cancelLoadData() {
  loadDataDialog.value = false;
  importedFile.value = null;
  loadDataError.value = '';
}

/**
 * Confirms loading data from a file
 */
function confirmLoadData(file) {
  loadFromFile(file);
}

/**
 * Opens the paste data dialog
 */
function openPasteDataDialog() {
  pasteDataDialog.value = true;
}

/**
 * Closes the paste data dialog without applying changes
 */
function closePasteDataDialog() {
  pasteDataDialog.value = false;
}

/**
 * Handles importing data from the paste data dialog
 * @param {Object} data - The parsed patient data
 */
function handlePastedDataImport(data) {
  if (!data) {
    snackbar.value = true;
    snackbarMessage.value = "Invalid data format!";
    return;
  }
  
  // Initialize with pasted data
  initializeFromExternalData(data);
  
  // Sync with legacy model for compatibility
  syncLegacyPatientData();
  
  // Close dialog
  pasteDataDialog.value = false;
  
  snackbar.value = true;
  snackbarMessage.value = "Data imported successfully!";
}

/**
 * Saves the current form data to a file
 */
function saveToFile() {
  try {
    const exportData = exportPatientData();
    
    // Create Blob and trigger download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = `${saveDataName.value || 'requiform-data'}.json`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Success message
    snackbar.value = true;
    snackbarMessage.value = "Data exported successfully!";
    
    // Cleanup
    URL.revokeObjectURL(downloadLink.href);
  } catch (error) {
    console.error('Error saving to file:', error);
    snackbar.value = true;
    snackbarMessage.value = "Error exporting data!";
  }
}

/**
 * Loads form data from a file
 */
function loadFromFile(file) {
  if (!file) {
    loadDataError.value = "Please select a file to import.";
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const jsonData = JSON.parse(event.target.result);
      
      // Validate the imported data structure
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Invalid data format');
      }
      
      // Initialize with imported data
      initializeFromExternalData(jsonData);
      
      // Sync with legacy model for compatibility
      syncLegacyPatientData();
      
      // Close dialog
      loadDataDialog.value = false;
      importedFile.value = null;
      
      snackbar.value = true;
      snackbarMessage.value = "Data imported successfully!";
    } catch (error) {
      console.error('Error parsing JSON:', error);
      loadDataError.value = "Invalid file format. Please select a valid RequiForm JSON file.";
    }
  };
  
  reader.onerror = () => {
    loadDataError.value = "Error reading file. Please try again.";
  };
  
  reader.readAsText(file);
}

/**
 * Performs the actual reset of the entire application state to its initial values.
 * This includes all patient data, UI flags, pedigree state, and validation.
 */
function performApplicationReset() {
  // Reset all form data using the unified model
  resetUnifiedPatientData();
  
  // Also reset the legacy model for backward compatibility
  patientData.value = initialPatientData();
  selectedTests.value = [];
  phenotypeData.value = {};
  
  // Reset UI state
  showPedigree.value = false;
  pedigreeDataUrl.value = '';
  showValidation.value = false;
  
  // Reset pedigree drawer if it exists
  if (pedigreeDrawer.value && typeof pedigreeDrawer.value.reset === 'function') {
    pedigreeDrawer.value.reset();
  }
  
  // Clear URL parameters for a clean state
  clearUrlParameters();
}

/**
 * FAQ modal handlers.
 */
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

/**
 * Dismiss the disclaimer.
 */
function handleDisclaimerDismiss() {
  disclaimerAcknowledged.value = true;
  showDisclaimerModal.value = false;
  acknowledgmentTime.value = new Date().toISOString();
  localStorage.setItem('disclaimerAcknowledged', 'true');
  localStorage.setItem('acknowledgmentTime', acknowledgmentTime.value);
}

/**
 * Reopen the disclaimer modal.
 */
function openDisclaimerModal() {
  showDisclaimerModal.value = true;
}

// --- Application Initialization ---
onMounted(() => {
  // Initialize tour
  nextTick().then(() => {
    tourInstance.value = initializeTour();
    if (shouldShowTour()) {
      tourInstance.value.start();
    }
  });

  // Handle URL parameters and initialize data
  const parsedData = parsePatientDataFromUrl();

  if (Object.keys(parsedData).length > 0) {
    // Initialize the unified patient data model with URL data
    initializeFromExternalData(parsedData);
    
    // Sync with legacy patient data format for backward compatibility
    syncLegacyPatientData();
    
    // Clean up URL parameters
    clearUrlParameters();
  } else {
    // Check for encrypted data
    const encryptedValue = getUrlParameter('encrypted');
    if (encryptedValue) {
      pendingEncryptedValue.value = encryptedValue;
      decryptionDialog.value = true;
    }
  }
});

/**
 * Handle updates from PatientForm component
 */
function handlePatientDataUpdate(newData) {
  patientData.value = newData;
  
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
  
  // Update selected panels
  updateSelectedPanels(selectedTests.value || []);
  
  // Update phenotype data
  updatePhenotypeData(phenotypeData.value ? Object.values(phenotypeData.value) : []);
  
  // Update category if present
  if (patientData.value.category) {
    updateCategory(patientData.value.category);
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
  patientData.value.diagnosis = unifiedPatientData.personalInfo.diagnosis || '';
  
  // Update selected tests
  if (unifiedPatientData && unifiedPatientData.selectedPanels) {
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

/**
 * Method to manually start the tour
 */
function startTour() {
  if (tourInstance.value) {
    console.log("Starting tour manually...");
    tourInstance.value.start();
  } else {
    console.error("Tour instance not available.");
  }
}
</script>
