<template>
  <div>
    <h2 class="text-h5 mb-4">Patient Details</h2>
    
    <!-- Group 1: Basic Information -->
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Given Name"
          v-model="givenName"
          prepend-inner-icon="mdi-account"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Family Name"
          v-model="familyName"
          prepend-inner-icon="mdi-account-group"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <LocaleDatePicker 
          v-model="birthdate" 
          label="Birthdate" 
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          label="Sex"
          :items="sexOptions"
          v-model="sex"
          prepend-inner-icon="mdi-gender-male-female"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-1"></v-divider>
    
    <!-- Group 2: Insurance & Physician -->
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Insurance"
          v-model="insurance"
          prepend-inner-icon="mdi-card-account-details-outline"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Physician Name"
          v-model="physicianName"
          prepend-inner-icon="mdi-stethoscope"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-1"></v-divider>
    
    <!-- Group 3: Clinical Details -->
    <v-row dense>
      <v-col cols="12" sm="4">
        <v-select
          density="compact"
          outlined
          label="Family History"
          :items="familyHistoryOptions"
          v-model="familyHistory"
          prepend-inner-icon="mdi-history"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          density="compact"
          outlined
          label="Parental Consanguinity"
          :items="consanguinityOptions"
          v-model="parentalConsanguinity"
          prepend-inner-icon="mdi-human-male-female"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          density="compact"
          outlined
          label="Diagnosis / Suspicion *"
          v-model="diagnosis"
          rows="2"
          prepend-inner-icon="mdi-file-document-edit-outline"
          hint="Required field - please provide a diagnosis or suspicion"
          persistent-hint
          :error="!!diagnosisError"
          :error-messages="diagnosisError"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-1"></v-divider>
    
    <!-- Group 4: Ordering Information and Consent Select -->
    <v-row dense>
      <v-col cols="12" sm="6">
        <LocaleDatePicker 
          v-model="orderingDate" 
          label="Ordering Date" 
        />
      </v-col>
      <v-col cols="12" sm="6">
        <!-- Use the genDGConsentData field consistently -->
        <v-select
          density="compact"
          outlined
          label="Consent"
          :items="consentOptions"
          item-title="text"
          item-value="value"
          v-model="genDGProvided"
        />
      </v-col>
    </v-row>

    <!-- If user chooses "Fill Form", show the additional Consent fields -->
    <v-row dense v-if="genDGProvided === 'fill'" class="mt-2">
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Consent Given By"
          v-model="genDGConsentName"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <LocaleDatePicker
          v-model="genDGConsentDate"
          label="Consent Date"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          label="Report incidental findings?"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGSecondaryFindings"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          label="Store test material?"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGMaterial"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          label="Store results beyond 10 years (max. 30 years)?"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGExtended"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          label="Use for research/quality assurance purposes?"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGResearch"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-1"></v-divider>
    
    <!-- Group 5: Variant Segregation Request -->
    <v-row dense>
      <v-col cols="12">
        <v-checkbox v-model="variantSegregationRequested" label="Request Variant Segregation" />
      </v-col>
      <v-col cols="12" v-if="variantSegregationRequested">
        <v-text-field
          density="compact"
          outlined
          label="Variant Details"
          v-model="variantDetails"
          hint="Provide details for the variant segregation request"
          persistent-hint
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import LocaleDatePicker from './LocaleDatePicker.vue'
import { computed, inject } from 'vue';

/**
 * PatientForm component to capture patient details.
 * 
 * This component now has dual functionality:
 * 1. It can work with the legacy patientData prop (for backward compatibility)
 * 2. It can work with the unified patient data model using inject
 */
const props = defineProps({
  patientData: {
    type: Object,
    required: true,
  },
})

// Define the emit function for backward compatibility
const emit = defineEmits(['update:patientData'])

// Inject the unified patient data and update functions
const unifiedPatientData = inject('patientData')
const updatePersonalInfo = inject('updatePersonalInfo')

// Inject validation-related functions
const getFieldErrors = inject('getFieldErrors', () => ({})) // Fallback to empty object if not provided

// Computed property for diagnosis validation error - ensures proper type for Vuetify
const diagnosisError = computed(() => {
  // Get all personal info field errors
  const errors = getFieldErrors('personalInfo');
  // Return the diagnosis error message as a string if it exists
  return errors && errors.diagnosis ? errors.diagnosis : ''
})

/**
 * Helper function to create computed properties with dual data binding
 * - Binds to both legacy patientData prop (via emit)
 * - Updates unified patient data model (via inject)
 * 
 * @param {string} legacyKey - Key in the legacy patientData object
 * @param {string} unifiedKey - Key in the unified personalInfo object
 * @param {...string} nestedKeys - Additional keys for nested legacy objects
 * @return {import('vue').ComputedRef} Computed property with dual binding
 */
function createDualBindingField(legacyKey, unifiedKey, ...nestedKeys) {
  return computed({
    get() {
      // First try to get from unified data model if it exists
      if (unifiedPatientData && unifiedKey && unifiedPatientData.personalInfo) {
        const unifiedValue = unifiedPatientData.personalInfo[unifiedKey];
        if (unifiedValue !== undefined) return unifiedValue;
      }
      
      // Fallback to legacy data model
      let current = props.patientData;
      const keys = [legacyKey, ...nestedKeys];
      
      for (const key of keys) {
        // Check if current is an object and has the key
        if (current === null || typeof current !== 'object' || !(key in current)) {
          // Special handling for boolean 'variantSegregationRequested'
          if (keys.length === 1 && keys[0] === 'variantSegregationRequested') {
            return false;
          }
          return ''; // Default to empty string for other missing paths
        }
        current = current[key];
      }
      
      // Ensure boolean is returned for variantSegregationRequested
      if (keys.length === 1 && keys[0] === 'variantSegregationRequested') {
        return typeof current === 'boolean' ? current : false;
      }
      
      return current ?? ''; // Return the final value or default to empty string
    },
    set(newValue) {
      // Update the unified model if it exists
      if (updatePersonalInfo && unifiedKey) {
        updatePersonalInfo({ [unifiedKey]: newValue });
      }
      
      // Also update the legacy model for backward compatibility
      const newData = JSON.parse(JSON.stringify(props.patientData));
      let current = newData;
      const keys = [legacyKey, ...nestedKeys];
      
      // Traverse the path, creating objects if they don't exist
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === null || typeof current[key] !== 'object') {
          current[key] = {}; // Ensure path exists
        }
        current = current[key];
      }
      
      // Set the value at the final key
      current[keys[keys.length - 1]] = newValue;
      emit('update:patientData', newData); // Emit the updated full object
    },
  });
}

/**
 * Helper function for legacy fields that don't have a unified model equivalent
 * Uses only the legacy data path
 */
function createLegacyField(...pathKeys) {
  return computed({
    get() {
      let current = props.patientData;
      for (const key of pathKeys) {
        if (current === null || typeof current !== 'object' || !(key in current)) {
          if (pathKeys.length === 1 && pathKeys[0] === 'variantSegregationRequested') {
            return false;
          }
          return ''; 
        }
        current = current[key];
      }
      if (pathKeys.length === 1 && pathKeys[0] === 'variantSegregationRequested') {
        return typeof current === 'boolean' ? current : false;
      }
      return current ?? '';
    },
    set(newValue) {
      const newData = JSON.parse(JSON.stringify(props.patientData));
      let current = newData;
      for (let i = 0; i < pathKeys.length - 1; i++) {
        const key = pathKeys[i];
        if (current[key] === null || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      current[pathKeys[pathKeys.length - 1]] = newValue;
      emit('update:patientData', newData);
    },
  });
}

// Computed properties for patient personal information (dual binding to both models)
const givenName = createDualBindingField('givenName', 'firstName');
const familyName = createDualBindingField('familyName', 'lastName');
const birthdate = createDualBindingField('birthdate', 'birthdate');
const sex = createDualBindingField('sex', 'sex');
const insurance = createDualBindingField('insurance', 'insurance');
const physicianName = createDualBindingField('physicianName', 'referrer');

// The following fields don't have unified model equivalents yet,
// so they use the legacy data model only
const familyHistory = createLegacyField('familyHistory');
const parentalConsanguinity = createLegacyField('parentalConsanguinity');
// Diagnosis now uses the unified data model
const diagnosis = createDualBindingField('diagnosis', 'diagnosis');
const orderingDate = createLegacyField('orderingDate');
const variantSegregationRequested = createLegacyField('variantSegregationRequested');
const variantDetails = createLegacyField('variantDetails');

// Functions were previously added here but caused errors - reverting to original state

// Computed properties for GenDG Consent Data using legacy paths only
const genDGProvided = createLegacyField('genDGConsentData', 'provided');
const genDGConsentName = createLegacyField('genDGConsentData', 'form', 'consentName');
const genDGConsentDate = createLegacyField('genDGConsentData', 'form', 'consentDate');
const genDGSecondaryFindings = createLegacyField('genDGConsentData', 'form', 'questionSecondaryFindings');
const genDGMaterial = createLegacyField('genDGConsentData', 'form', 'questionMaterial');
const genDGExtended = createLegacyField('genDGConsentData', 'form', 'questionExtended');
const genDGResearch = createLegacyField('genDGConsentData', 'form', 'questionResearch');

// Note: Data processing consent has been removed as it's out of scope

// Note: Incidental findings consent is already handled via the genDGSecondaryFindings field
// in the GenDG consent section

const sexOptions = ['male', 'female', 'undetermined']
const familyHistoryOptions = ['conspicuous', 'inconspicuous', 'unknown']
const consanguinityOptions = ['yes', 'no']

// Options for the Consent select.
const consentOptions = [
  { text: 'Already Provided', value: 'provided' },
  { text: 'Fill Form', value: 'fill' },
]

// Options for yes/no questions.
const yesNoOptions = [
  { text: 'Yes', value: 'yes' },
  { text: 'No', value: 'no' },
]
</script>

<style scoped>
.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
