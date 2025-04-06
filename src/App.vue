<template>
  <v-app :theme="uiStore.isDark ? 'dark' : 'light'" id="app">
    <!-- Top Menu Bar -->
    <TopBar
      :isDark="uiStore.isDark"
      @toggle-theme="formActions.toggleTheme"
      @reset-form="formActions.initiateReset"
      @open-faq="faq.openFaq"
      @generate-pdf="handleGeneratePdf"
      @copy-url="urlHandler.copyShareableUrl"
      @copy-encrypted-url="uiStore.openEncryptionDialog"
      @start-tour="appTour.startTour"
      @save-data="uiStore.openSaveDataDialog"
      @load-data="uiStore.openLoadDataDialog"
      @open-paste-data="uiStore.openPasteDataDialog"
    />

    <!-- Disclaimer Modal: shown if not yet acknowledged or if reopened -->
    <Disclaimer v-if="!settingsStore.disclaimerAcknowledged || uiStore.showDisclaimerModal" @dismiss="handleDisclaimerDismiss" />

    <v-main>
      <v-container>
        <!-- Validation Summary Component - shows all validation errors in one place -->
        <div class="mb-4" v-if="formStore.showValidation">
          <ValidationSummary 
            :showValidation="formStore.showValidation" 
            :isValid="formStore.isValid" 
            :validationErrors="formStore.validationErrors"
          />
        </div>
        
        <!-- PatientForm now includes both the basic fields and the GenDG Consent select/form (if chosen) -->
        <PatientForm 
          :patientData="formStore.patientData.personalInfo" 
          @update:patientData="formStore.updatePatientData"
          :pdfConfig="pdfConfig" 
          id="patient-form-component"
        />

        <!-- Pedigree Option -->
        <v-checkbox v-model="formStore.showPedigree" label="Include Pedigree Chart" class="mb-4" />
        <PedigreeDrawer v-if="formStore.showPedigree" ref="pedigreeDrawerRef" @update:pedigreeDataUrl="formStore.updatePedigreeDataUrl" />

        <!-- Test Selector -->
        <TestSelector 
          v-model="formStore.selectedTests"
          id="test-selector-component"
        />

        <!-- Phenotype Selector -->
        <PhenotypeSelector 
          :groupedPanelDetails="groupedPanelDetails" 
          v-model="formStore.phenotypeDataObj"
          id="phenotype-selector-component"
        />

        <!-- Hidden PDF Generator component -->
        <div style="display: none;">
          <PdfGenerator
            ref="pdfGeneratorRef"
            :patientData="formStore.patientData.personalInfo"
            :selectedTests="formStore.selectedTests"
            :pedigreeDataUrl="formStore.pedigreeDataUrl"
            :phenotypeData="formStore.phenotypeDataObj"
            :pdfConfig="pdfConfig"
          />
        </div>

        <!-- Selected Panels Summary (extracted to its own component) -->
        <SelectedPanelsSummary :groupedPanelDetails="groupedPanelDetails" />
      </v-container>

      <!-- Snackbar for notifications -->
      <v-snackbar v-model="uiStore.snackbar" timeout="3000" top right transition="scale-transition">
        {{ uiStore.snackbarMessage }}
        <template #action="{ attrs }">
          <v-btn color="red" text v-bind="attrs" @click="uiStore.snackbar = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>

      <!-- Dialogs -->
      <EncryptionDialog
        v-model="uiStore.encryptionDialog"
        @cancel="uiStore.closeEncryptionDialog"
        @confirm="handleEncryptionConfirm"
      />

      <DecryptionDialog
        v-model="uiStore.decryptionDialog"
        :error="uiStore.decryptionError"
        @cancel="uiStore.cancelDecryption"
        @confirm="handleDecryptionConfirm"
      />

      <FAQDialog
        v-model="uiStore.showFAQModal"
        :faqItems="Array.isArray(faq.faqItems) ? faq.faqItems : []"
        @close="faq.closeFaq"
      />

      <ResetConfirmationDialog
        v-model="uiStore.resetConfirmationDialog"
        @cancel="formActions.cancelReset"
        @confirm="formActions.confirmReset"
      />

      <SaveDataDialog
        v-model="uiStore.saveDataDialog"
        :defaultFileName="formStore.saveDataName"
        @cancel="uiStore.closeSaveDataDialog"
        @confirm="handleSaveDataConfirm"
      />

      <LoadDataDialog
        v-model="uiStore.loadDataDialog"
        :error="uiStore.loadDataError"
        @cancel="uiStore.closeLoadDataDialog"
        @confirm="handleLoadDataConfirm"
      />
      
      <!-- Paste Data Modal -->
      <PasteDataModal
        v-model="uiStore.pasteDataDialog"
        @close="uiStore.closePasteDataDialog"
        @import="handlePastedDataImport"
      />
    </v-main>

    <!-- Footer with disclaimer acknowledgement button -->
    <Footer
      :disclaimerAcknowledged="settingsStore.disclaimerAcknowledged"
      :acknowledgmentTime="settingsStore.acknowledgmentTime"
      @reopen-disclaimer="uiStore.openDisclaimerModal"
    />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, provide, watch } from 'vue';
import TopBar from './components/TopBar.vue';
import PatientForm from './components/PatientForm.vue';
import TestSelector from './components/TestSelector.vue';
import PhenotypeSelector from './components/PhenotypeSelector.vue';
import PedigreeDrawer from './components/PedigreeDrawer.vue';
import ValidationSummary from './components/ValidationSummary.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import Disclaimer from './components/Disclaimer.vue';
import Footer from './components/Footer.vue';
import PasteDataModal from './components/modals/PasteDataModal.vue';
import SelectedPanelsSummary from './components/SelectedPanelsSummary.vue';

// Dialog components
import EncryptionDialog from './components/dialogs/EncryptionDialog.vue';
import DecryptionDialog from './components/dialogs/DecryptionDialog.vue';
import FAQDialog from './components/dialogs/FAQDialog.vue';
import ResetConfirmationDialog from './components/dialogs/ResetConfirmationDialog.vue';
import SaveDataDialog from './components/dialogs/SaveDataDialog.vue';
import LoadDataDialog from './components/dialogs/LoadDataDialog.vue';

// Import Pinia stores
import { useUiStore } from './stores/uiStore';
import { useFormStore } from './stores/formStore';
import { useSettingsStore } from './stores/settingsStore';

// Import composables
import { useUrlHandler } from './composables/useUrlHandler';
import { useDataPersistence } from './composables/useDataPersistence';
import { usePdfGenerator } from './composables/usePdfGenerator';
import { useAppTour } from './composables/useAppTour';
import { useFaq } from './composables/useFaq';
import { useFormActions } from './composables/useFormActions';

// Import data
import { categories } from './data/categories.js';

// Initialize Pinia stores
const uiStore = useUiStore();
const formStore = useFormStore();
const settingsStore = useSettingsStore();

// Initialize composables
const urlHandler = useUrlHandler();
const dataPersistence = useDataPersistence();
const pdfGenerator = usePdfGenerator();
const appTour = useAppTour();
const faq = useFaq();
const formActions = useFormActions();

// Set up provides for child components
provide('ui', uiStore);
provide('form', formStore);
provide('settings', settingsStore);
provide('validationErrors', formStore.validationErrors);
provide('sectionValidation', formStore.sectionValidation);
provide('validateForm', formStore.validateForm);
provide('getFieldErrors', formStore.getFieldErrors);

// Add provides needed by PatientForm
provide('patientData', formStore.patientData);
provide('updatePersonalInfo', formStore.updatePatientData);

// Configuration for PDF generation
const pdfConfig = ref({
  // Add your pdfConfig data here
  qrCodes: true,
  patientQrTitle: "Patient Data QR",
  phenotypeQrTitle: "Phenotype Data QR",
  pedigreeQrTitle: "Pedigree QR",
  titleFontSize: 20,
  subtitleFontSize: 16,
  sectionTitleFontSize: 14,
  normalFontSize: 12,
  smallFontSize: 10
});

/**
 * Groups selected panels by category
 */
const groupedPanelDetails = computed(() => {
  return categories
    .map((category) => ({
      id: category.id,
      categoryTitle: category.title,
      tests: category.tests.filter((test) => formStore.selectedTests.includes(test.id)),
    }))
    .filter((group) => group.tests.length > 0);
});

// Handler functions for components that still need direct function references

/**
 * Dismiss the disclaimer
 */
function handleDisclaimerDismiss() {
  settingsStore.acknowledgeDisclaimer();
  uiStore.closeDisclaimerModal();
}

/**
 * Handle encryption dialog confirmation
 * @param {string} password - The password for encryption
 */
function handleEncryptionConfirm(password) {
  urlHandler.copyEncryptedUrl(password)
    .then(success => {
      if (success) {
        uiStore.closeEncryptionDialog();
      }
    });
}

/**
 * Handle decryption dialog confirmation
 * @param {string} password - The password for decryption
 */
function handleDecryptionConfirm(password) {
  const success = urlHandler.decryptUrlData(password);
  if (success) {
    uiStore.cancelDecryption();
  }
}

/**
 * Handler for saving data to file
 * @param {string} fileName - Name for the saved file
 */
function handleSaveDataConfirm(fileName) {
  dataPersistence.saveToFile(fileName)
    .then(success => {
      if (success) {
        uiStore.closeSaveDataDialog();
      }
    });
}

/**
 * Handler for loading data from file
 * @param {File} file - File to load data from
 */
function handleLoadDataConfirm(file) {
  dataPersistence.loadFromFile(file)
    .then(success => {
      if (success) {
        uiStore.closeLoadDataDialog();
      }
    });
}

/**
 * Handler for importing pasted data
 * @param {string} jsonData - Pasted JSON data
 */
async function handlePastedDataImport(jsonData) {
  try {
    console.log('App: Received data for import, length:', jsonData?.length || 0);
    
    // Properly await the async importFromJson method
    const success = await dataPersistence.importFromJson(jsonData);
    
    if (success) {
      // Close the dialog if import was successful
      uiStore.closePasteDataDialog();
      uiStore.showSnackbar('Data imported successfully!'); 
      
      // Force a reactivity update by setting a timeout
      setTimeout(() => {
        // Ensure data model is properly synced in both directions
        formStore.syncLegacyPatientData();
        formStore.syncUnifiedPatientData();
        
        console.log('App: Current form state after import:', {
          personalInfo: formStore.patientData.personalInfo,
          selectedTests: formStore.selectedTests.length,
          phenotypeData: Object.keys(formStore.phenotypeDataObj || {}).length
        });
      }, 0);
    } else {
      // Keep dialog open if import failed so user can try again
      console.error('App: Failed to import data');
    }
  } catch (error) {
    console.error('App: Error importing data:', error);
    uiStore.showSnackbar('Error importing data. Please try again.');
  }
}

// Get references to components
const pdfGeneratorRef = ref(null);
const pedigreeDrawerRef = ref(null);

// Application Initialization
onMounted(() => {
  // Initialize tour
  nextTick().then(() => {
    appTour.initialize();
  });

  // Initialize data from URL parameters
  urlHandler.initializeFromUrl();
});

// Watch for when the PDF generator reference is available
watch(pdfGeneratorRef, (newRef) => {
  if (newRef) {
    console.log('PDF generator reference connected');
    pdfGenerator.setPdfGeneratorRef(newRef);
  }
}, { immediate: true });

/**
 * Custom handler for PDF generation that validates form data and ensures pedigree data is updated first
 */
async function handleGeneratePdf() {
  // First, validate the form data - explicitly show validation errors
  const isValid = formStore.validateForm(true);
  
  // Explicitly set show validation flag to ensure UI updates
  formStore.setShowValidation(true);
  
  // Debug validation errors
  console.log('Validation errors:', formStore.validationErrors);
  console.log('Validation sections:', formStore.sectionValidation);
  
  // If validation fails, display validation errors and stop PDF generation
  if (!isValid) {
    console.log('Form validation failed. Please correct the errors before generating PDF.');
    uiStore.showSnackbar('Please correct the form errors before generating PDF.');
    
    // Ensure validation summary is visible - this is crucial for showing errors at the top
    formStore.setShowValidation(true);
    
    // Make sure errors are displayed - scroll to top where validation summary is shown
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Forcefully highlight validation errors by briefly focusing validation summary area
    const validationArea = document.querySelector('.validation-summary');
    if (validationArea) {
      validationArea.setAttribute('tabindex', '-1'); // Make it focusable
      validationArea.focus();
      validationArea.classList.add('highlight-animation');
      
      // Remove highlight animation after it completes
      setTimeout(() => {
        validationArea.classList.remove('highlight-animation');
      }, 1500);
    }
    
    return;
  }
  
  // Update pedigree data URL if pedigree is enabled and component is loaded
  if (formStore.showPedigree && pedigreeDrawerRef.value) {
    try {
      // Get pedigree image data URL
      const pedigreeDataUrl = await pedigreeDrawerRef.value.getPedigreeDataUrl();
      formStore.updatePedigreeDataUrl(pedigreeDataUrl);
      
      // Get pedigree structured data for QR code if needed
      const pedigreeData = pedigreeDrawerRef.value.getPedigreeData();
      if (pedigreeData) {
        // Store the pedigree data in formStore if you have a method for it
        console.log('Updated pedigree data:', pedigreeData);
      }
      
      console.log('Pedigree data updated successfully for PDF generation');
    } catch (error) {
      console.error('Error updating pedigree data for PDF:', error);
    }
  }
  
  // Now generate the PDF with the updated pedigree data
  await pdfGenerator.generatePdf();
}
</script>

<style scoped>
/* Add any component-specific styles here */
.highlight-animation {
  animation: pulse 1.5s ease-in-out;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(255, 87, 34, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0); }
}
</style>
