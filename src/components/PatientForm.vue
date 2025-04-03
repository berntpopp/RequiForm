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
          label="Diagnosis / Suspicion"
          v-model="diagnosis"
          rows="2"
          prepend-inner-icon="mdi-file-document-edit-outline"
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
import { computed } from 'vue';

/**
 * PatientForm component to capture patient details.
 * Props:
 * - patientData: Object with patient details.
 * Emits:
 * - update:patientData: Emitted when any patient data field changes.
 */
const props = defineProps({
  patientData: {
    type: Object,
    required: true,
  },
})

// Define the emit function
const emit = defineEmits(['update:patientData'])

// Helper function to create computed properties for patient data fields
// Accepts a variable number of arguments representing the path keys
function createComputedField(...pathKeys) {
  return computed({
    get() {
      let current = props.patientData;
      for (const key of pathKeys) {
        // Check if current is an object and has the key
        if (current === null || typeof current !== 'object' || !(key in current)) {
          // Special handling for boolean 'variantSegregationRequested'
          if (pathKeys.length === 1 && pathKeys[0] === 'variantSegregationRequested') {
            return false;
          }
          return ''; // Default to empty string for other missing paths
        }
        current = current[key];
      }
      // Ensure boolean is returned for variantSegregationRequested
      if (pathKeys.length === 1 && pathKeys[0] === 'variantSegregationRequested') {
        const result = typeof current === 'boolean' ? current : false;
        return result;
      }
      return current ?? ''; // Return the final value or default to empty string
    },
    set(newValue) {
      // Create a deep clone to avoid mutating the prop directly
      const newData = JSON.parse(JSON.stringify(props.patientData));
      let current = newData;
      // Traverse the path, creating objects if they don't exist
      for (let i = 0; i < pathKeys.length - 1; i++) {
        const key = pathKeys[i];
        if (current[key] === null || typeof current[key] !== 'object') {
          current[key] = {}; // Ensure path exists
        }
        current = current[key];
      }
      // Set the value at the final key
      current[pathKeys[pathKeys.length - 1]] = newValue;
      emit('update:patientData', newData); // Emit the updated full object
    },
  });
}

// Computed properties for basic fields
const givenName = createComputedField('givenName');
const familyName = createComputedField('familyName');
const birthdate = createComputedField('birthdate');
const sex = createComputedField('sex');
const insurance = createComputedField('insurance');
const physicianName = createComputedField('physicianName');
const familyHistory = createComputedField('familyHistory');
const parentalConsanguinity = createComputedField('parentalConsanguinity');
const diagnosis = createComputedField('diagnosis');
const orderingDate = createComputedField('orderingDate');
const variantSegregationRequested = createComputedField('variantSegregationRequested');
const variantDetails = createComputedField('variantDetails');

// Computed properties for GenDG Consent Data using the path
const genDGProvided = createComputedField('genDGConsentData', 'provided');
const genDGConsentName = createComputedField('genDGConsentData', 'form', 'consentName');
const genDGConsentDate = createComputedField('genDGConsentData', 'form', 'consentDate');
const genDGSecondaryFindings = createComputedField('genDGConsentData', 'form', 'questionSecondaryFindings');
const genDGMaterial = createComputedField('genDGConsentData', 'form', 'questionMaterial');
const genDGExtended = createComputedField('genDGConsentData', 'form', 'questionExtended');
const genDGResearch = createComputedField('genDGConsentData', 'form', 'questionResearch');

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
