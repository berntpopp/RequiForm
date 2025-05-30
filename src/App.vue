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
      @toggle-language="toggleLanguage"
      @toggle-log-viewer="toggleLogViewer"
    />

    <!-- Disclaimer Modal: shown if not yet acknowledged or if reopened -->
    <AppDisclaimer v-if="!settingsStore.disclaimerAcknowledged || uiStore.showDisclaimerModal" @dismiss="handleDisclaimerDismiss" />

    <v-main>
      <v-container class="main-content-container">
        <!-- Validation Summary Component - shows all validation errors in one place -->
        <div class="mb-4" v-if="formStore.showValidation">
          <Suspense>
            <template #default>
              <ValidationSummary 
                :showValidation="formStore.showValidation" 
                :isValid="formStore.isValid" 
                :validationErrors="formStore.validationErrors"
              />
            </template>
            <template #fallback>
              <div style="min-height: 60px; display: flex; align-items: center; justify-content: center; opacity: 0.5; border: 1px solid #ddd; border-radius: 4px; padding: 1rem;">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <span class="ml-2">Loading Validation Summary...</span>
              </div>
            </template>
          </Suspense>
        </div>
        
        <!-- PatientForm now includes only the basic fields and the GenDG Consent select/form -->
        <Suspense>
          <template #default>
            <PatientForm 
              :patientData="formStore.patientData.personalInfo" 
              @update:patientData="formStore.updatePatientData"
              :pdfConfig="pdfConfig" 
              id="patient-form-component"
            />
          </template>
          <template #fallback>
            <div style="min-height: 260px; display: flex; align-items: center; justify-content: center; opacity: 0.5; border: 1px solid #ddd; border-radius: 4px; padding: 1rem;">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-2">Loading Patient Form...</span>
            </div>
          </template>
        </Suspense>

        <!-- Test Selector -->
        <Suspense>
          <template #default>
            <TestSelector 
              id="test-selector-component"
            />
          </template>
          <template #fallback>
            <div style="min-height: 100px; display: flex; align-items: center; justify-content: center; opacity: 0.5; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; margin-top: 1rem;">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-2">Loading Test Selector...</span>
            </div>
          </template>
        </Suspense>

        <!-- Phenotype Selector -->
        <Suspense>
          <template #default>
            <PhenotypeSelector 
              :groupedPanelDetails="groupedPanelDetails" 
              v-model="formStore.phenotypeDataObj"
              id="phenotype-selector-component"
              @panel-state-change="handlePhenotypePanelStateChange"
            />
          </template>
          <template #fallback>
            <div style="min-height: 120px; display: flex; align-items: center; justify-content: center; opacity: 0.5; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; margin-top: 1rem;">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-2">Loading Phenotype Selector...</span>
            </div>
          </template>
        </Suspense>
        
        <!-- Pedigree Button and Drawer with forced inline styling to ensure visibility -->
        <div class="phenotype-selector" style="border: 1px solid #ddd; border-radius: 4px; padding: 0.25rem; margin-top: 0.5rem;">
          <v-btn 
            color="primary" 
            small 
            @click="formStore.togglePedigree"
            :key="`pedigree-btn-${i18nLocaleKey}`"
          >
            {{ t(formStore.showPedigree ? 'app.hidePedigreeChart' : 'app.addPedigreeChart') }}
          </v-btn>
          
          <!-- Pedigree Drawer - only shown when activated -->
          <v-expand-transition>
            <div v-if="formStore.showPedigree" class="phenotype-panel mt-2 mb-4">
              <Suspense>
                <template #default>
                  <PedigreeDrawer ref="pedigreeDrawerRef" @update:pedigreeDataUrl="formStore.updatePedigreeDataUrl" />
                </template>
                <template #fallback>
                  <div style="min-height: 80px; display: flex; align-items: center; justify-content: center; opacity: 0.5;">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <span class="ml-2">Loading Pedigree Drawer...</span>
                  </div>
                </template>
              </Suspense>
            </div>
          </v-expand-transition>
        </div>

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
        <Suspense>
          <template #default>
            <SelectedPanelsSummary :groupedPanelDetails="groupedPanelDetails" />
          </template>
          <template #fallback>
            <div style="min-height: 60px; display: flex; align-items: center; justify-content: center; opacity: 0.5; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; margin-top: 1rem;">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-2">Loading Panels Summary...</span>
            </div>
          </template>
        </Suspense>
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
        :faqItems="faq.faqItems.value"
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

    <!-- Log Viewer (conditionally rendered) -->
    <LogViewer v-if="uiStore.showLogViewer" />

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch, defineAsyncComponent } from 'vue'; 
import { useI18n } from 'vue-i18n';

// Track phenotype panel visibility state
const phenotypePanelVisible = ref(false);

// Create a reactive key for i18n updates
const i18nLocaleKey = ref(0);

// Get i18n for translations
const { t, locale } = useI18n();

// Update the i18n key when language changes
watch(() => locale.value, () => {
  i18nLocaleKey.value++;
});

// The togglePedigree function is now directly imported from formStore

// Critical components loaded eagerly - these are needed for initial render
import TopBar from './components/TopBar.vue';

// Lazily loaded components with i18n reactivity preserved
// Main components with dynamic imports for better tree shaking
const PatientForm = defineAsyncComponent({
  loader: () => import('./components/PatientForm.vue'),
  // Delay to avoid blocking main thread with too many component loads
  delay: 0
});
const TestSelector = defineAsyncComponent({
  loader: () => import('./components/TestSelector.vue'),
  delay: 50
});
const PhenotypeSelector = defineAsyncComponent({
  loader: () => import('./components/PhenotypeSelector.vue'),
  delay: 100
});
const PedigreeDrawer = defineAsyncComponent({
  loader: () => import('./components/PedigreeDrawer.vue'),
  delay: 100
});
const AppFooter = defineAsyncComponent({
  loader: () => import('./components/AppFooter.vue'),
  delay: 0 // Load early since it's always visible
});

// Components that don't have many translations or are less critical can still be lazy-loaded
const SelectedPanelsSummary = defineAsyncComponent({
  loader: () => import('./components/SelectedPanelsSummary.vue'),
  delay: 50
});
const ValidationSummary = defineAsyncComponent({
  loader: () => import('./components/ValidationSummary.vue'),
  delay: 0 // Load early since it's visible when there are errors
});
const LogViewer = defineAsyncComponent({
  loader: () => import('./components/LogViewer.vue'),
  delay: 200 // Not immediately needed
});
const AppDisclaimer = defineAsyncComponent({
  loader: () => import('./components/Disclaimer.vue'),
  delay: 0 // Load early if needed
});

// PDF Generator can be loaded lazily as it's only used when generating PDFs
const PdfGenerator = defineAsyncComponent({
  loader: () => import('./components/PdfGenerator.vue'),
  // Adding a small delay ensures it doesn't impact initial page load
  delay: 200
});

// Dialog components are lazily loaded with improved i18n reactivity
const PasteDataModal = defineAsyncComponent({
  loader: () => import('./components/modals/PasteDataModal.vue'),
  delay: 200 // Not immediately needed
});
const EncryptionDialog = defineAsyncComponent({
  loader: () => import('./components/dialogs/EncryptionDialog.vue'),
  delay: 300 // Not immediately needed
});
const DecryptionDialog = defineAsyncComponent({
  loader: () => import('./components/dialogs/DecryptionDialog.vue'),
  delay: 300 // Not immediately needed
});
const FAQDialog = defineAsyncComponent({
  loader: () => import('./components/dialogs/FAQDialog.vue'),
  delay: 300 // Not immediately needed
});
const ResetConfirmationDialog = defineAsyncComponent({
  loader: () => import('./components/dialogs/ResetConfirmationDialog.vue'),
  delay: 300 // Not immediately needed
});
const SaveDataDialog = defineAsyncComponent({
  loader: () => import('./components/dialogs/SaveDataDialog.vue'),
  delay: 300 // Not immediately needed
});
const LoadDataDialog = defineAsyncComponent({
  loader: () => import('./components/dialogs/LoadDataDialog.vue'),
  delay: 300 // Not immediately needed
});

// Import service for logging
import logService from '@/services/logService';

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

// i18n was already initialized at the top

// Set up provides for child components
provide('ui', uiStore);
provide('form', formStore);
provide('settings', settingsStore);
provide('isValid', formStore.isValid); 
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
    logService.warn('groupedPanelDetails: formStore or patientData not available yet.'); 
    return [];
  }
  if (!categories) {
    logService.warn('groupedPanelDetails: testsData.categories not available yet.'); 
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
  urlHandler.handlePasswordSubmit(password);
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
    logService.debug('App: Received data for import, length:', jsonData?.length || 0); 

    const success = await dataPersistence.importFromJson(jsonData);
    
    if (success) {
      uiStore.closePasteDataDialog();
      uiStore.showSnackbar('Data imported successfully!'); 
      
      setTimeout(() => {
        logService.debug('App: Current form state after import:', { 
          personalInfo: formStore.patientData.personalInfo,
          selectedPanels: formStore.patientData.selectedPanels.length,
          phenotypeData: formStore.patientData.phenotypeData.length
        });
      }, 0);
    } else {
      logService.error('App: Failed to import data'); 
    }
  } catch (error) {
    logService.error('App: Error importing data:', error); 
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
    logService.debug('PDF generator reference connected'); 
    pdfGenerator.setPdfGeneratorRef(newRef);
  }
}, { immediate: true });

/**
 * Custom handler for PDF generation that validates form data and ensures pedigree data is updated first
 */
async function handleGeneratePdf() {
  // Check specifically for phenotype validation when panel is open
  if (phenotypePanelVisible.value && formStore.showPhenotypePanel) {
    // Check if any phenotype is selected (not 'no input')
    let hasSelectedPhenotype = false;
    const phenotypeData = formStore.phenotypeDataObj;
    
    if (phenotypeData && Object.keys(phenotypeData).length > 0) {
      outer: for (const categoryId in phenotypeData) {
        const phenotypes = phenotypeData[categoryId];
        for (const phenotypeId in phenotypes) {
          if (phenotypes[phenotypeId] === 'present' || phenotypes[phenotypeId] === 'absent') {
            hasSelectedPhenotype = true;
            break outer;
          }
        }
      }
    }
    
    if (!hasSelectedPhenotype) {
      logService.debug('Phenotype panel is open but no phenotypes are selected'); 
      uiStore.showSnackbar(t('phenotypeSelector.warnings.noneSelected'));
      
      // Scroll to the phenotype selector
      const phenotypeSelector = document.getElementById('phenotype-selector-component');
      if (phenotypeSelector) {
        phenotypeSelector.scrollIntoView({ behavior: 'smooth' });
        phenotypeSelector.setAttribute('tabindex', '-1');
        phenotypeSelector.focus();
      }
      
      return;
    }
  }
  
  // Continue with general form validation
  const isValid = formStore.validateForm(true);
  
  formStore.setShowValidation(true);
  
  logService.debug('Validation errors:', formStore.validationErrors); 
  logService.debug('Validation sections:', formStore.sectionValidation); 
  
  if (!isValid) {
    logService.debug('Form validation failed. Please correct the errors before generating PDF.'); 
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
        logService.debug('Updated pedigree data:', pedigreeData); 
      }
      
      logService.debug('Pedigree data updated successfully for PDF generation'); 
    } catch (error) {
      logService.error('Error updating pedigree data for PDF:', error); 
    }
  }
  
  await pdfGenerator.generatePdf();
}

// Function to toggle language between English and German with comprehensive reactivity
const toggleLanguage = () => {
  // Determine the new locale (toggle between English and German)
  const newLocale = locale.value === 'en' ? 'de' : 'en';
  
  // Save the new language preference to localStorage for persistence
  localStorage.setItem('userLanguage', newLocale);
  
  // Set the locale in i18n
  locale.value = newLocale;
  document.documentElement.lang = newLocale; // Update root HTML lang attribute
  
  // Log the change with detailed information
  logService.info(`Language switched to ${newLocale.toUpperCase()} - triggering reactive updates`);
  
  // Show notification to the user
  uiStore.showSnackbar(t('app.languageSwitched'));

  // Multi-phase reactive update process:
  // Phase 1: Create a custom event with locale information that components can use
  window.dispatchEvent(new CustomEvent('i18n-locale-changed', { 
    detail: { locale: newLocale, timestamp: Date.now() } 
  }));
  
  // Phase 2: Dispatch a simpler event that's easier for components to listen for
  window.dispatchEvent(new Event('i18n-updated'));
  
  // Phase 3: Force global UI refresh via the theme - this creates a reactivity cascade
  const currentTheme = uiStore.isDark;
  uiStore.setDarkTheme(!currentTheme);
  
  // Phase 4: Secondary refresh wave with delayed timing for components that load later
  setTimeout(() => {
    // Restore the original theme
    uiStore.setDarkTheme(currentTheme);
    
    // Additional event dispatch for any components that might have missed the first one
    window.dispatchEvent(new Event('i18n-updated'));
  }, 50);
};

// Function to toggle the log viewer
const toggleLogViewer = () => {
  uiStore.toggleLogViewer();
}

// Handler for phenotype panel visibility changes
function handlePhenotypePanelStateChange(isVisible) {
  logService.debug(`Phenotype panel visibility changed to: ${isVisible}`);
  phenotypePanelVisible.value = isVisible;
  
  // Update validation model with panel state
  formStore.updatePhenotypePanelState(isVisible);
}

// Pedigree visibility is now handled directly by formStore.togglePedigree

// ... rest of the code remains the same ...
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

/* Match the pedigree selector styling to phenotype selector */
.pedigree-selector {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #ffffff;
  width: 100%;
  display: block;
}

.main-content-container {
  max-width: 1200px;
  /* v-container provides padding, margin: 0 auto; might not be needed depending on layout */
  /* If centering isn't automatic with v-container, add: margin-left: auto; margin-right: auto; */
}

/* Optional: Ensure app takes full height */
:deep(.v-application__wrap) {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

:deep(main.v-main) {
  flex-grow: 1;
}
</style>
