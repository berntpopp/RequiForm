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
    <AppDisclaimer v-if="!settingsStore.disclaimerAcknowledged || uiStore.showDisclaimerModal" @dismiss="handleDisclaimerDismiss" />

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
    <AppFooter
      :disclaimerAcknowledged="settingsStore.disclaimerAcknowledged"
      :acknowledgmentTime="settingsStore.acknowledgmentTime"
      @reopen-disclaimer="uiStore.openDisclaimerModal"
    />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch } from 'vue'; 
import TopBar from './components/TopBar.vue';
import PatientForm from './components/PatientForm.vue';
import TestSelector from './components/TestSelector.vue';
import PhenotypeSelector from './components/PhenotypeSelector.vue';
import PedigreeDrawer from './components/PedigreeDrawer.vue';
import ValidationSummary from './components/ValidationSummary.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import AppDisclaimer from './components/Disclaimer.vue';
import AppFooter from './components/Footer.vue';
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
import pdfConfigData from './data/pdfConfig.json'; 

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

// Add provides needed by child components requiring patientData directly
provide('patientData', formStore.patientData);
provide('updatePersonalInfo', formStore.updatePatientData);
provide('updatePhenotypeData', formStore.updatePhenotypeData);
provide('updateSelectedPanels', formStore.updateSelectedPanels); 

// Configuration for PDF generation
const pdfConfig = ref(pdfConfigData); 

/**
 * Compute grouped panel details based on selected panels in the unified patient data model.
 */
const groupedPanelDetails = computed(() => {
  if (!formStore || !formStore.patientData) {
    console.warn('groupedPanelDetails: formStore or patientData not available yet.');
    return [];
  }
  if (!categories) {
    console.warn('groupedPanelDetails: testsData.categories not available yet.');
    return [];
  }
  return categories
    .map((category) => ({
      id: category.id,
      categoryTitle: category.title,
      tests: category.tests.filter((test) => formStore.patientData.selectedPanels?.includes(test.id)), 
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
    
    const success = await dataPersistence.importFromJson(jsonData);
    
    if (success) {
      uiStore.closePasteDataDialog();
      uiStore.showSnackbar('Data imported successfully!'); 
      
      setTimeout(() => {
        console.log('App: Current form state after import:', {
          personalInfo: formStore.patientData.personalInfo,
          selectedPanels: formStore.patientData.selectedPanels.length,
          phenotypeData: formStore.patientData.phenotypeData.length
        });
      }, 0);
    } else {
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
  appTour.initialize();
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
  const isValid = formStore.validateForm(true);
  
  formStore.setShowValidation(true);
  
  console.log('Validation errors:', formStore.validationErrors);
  console.log('Validation sections:', formStore.sectionValidation);
  
  if (!isValid) {
    console.log('Form validation failed. Please correct the errors before generating PDF.');
    uiStore.showSnackbar('Please correct the form errors before generating PDF.');
    
    formStore.setShowValidation(true);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const validationArea = document.querySelector('.validation-summary'); 
    if (validationArea) {
      validationArea.setAttribute('tabindex', '-1'); 
      validationArea.focus();
      validationArea.classList.add('highlight-animation');
      
      setTimeout(() => {
        validationArea.classList.remove('highlight-animation');
      }, 1500);
    }
    
    return;
  }
  
  if (formStore.showPedigree && pedigreeDrawerRef.value) {
    try {
      const pedigreeDataUrl = await pedigreeDrawerRef.value.getPedigreeDataUrl();
      formStore.updatePedigreeDataUrl(pedigreeDataUrl);
      
      const pedigreeData = pedigreeDrawerRef.value.getPedigreeData(); 
      if (pedigreeData) {
        console.log('Updated pedigree data:', pedigreeData);
      }
      
      console.log('Pedigree data updated successfully for PDF generation');
    } catch (error) {
      console.error('Error updating pedigree data for PDF:', error);
    }
  }
  
  await pdfGenerator.generatePdf();
}

</script>

<style scoped>
.highlight-animation {
  animation: pulse 1.5s ease-in-out;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(255, 87, 34, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0); }
}
</style>
