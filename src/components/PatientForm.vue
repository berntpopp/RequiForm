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
          v-model="patientData.givenName"
          prepend-inner-icon="mdi-account"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Family Name"
          v-model="patientData.familyName"
          prepend-inner-icon="mdi-account-group"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <LocaleDatePicker 
          v-model="patientData.birthdate" 
          label="Birthdate" 
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          label="Sex"
          :items="sexOptions"
          v-model="patientData.sex"
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
          v-model="patientData.insurance"
          prepend-inner-icon="mdi-card-account-details-outline"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Physician Name"
          v-model="patientData.physicianName"
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
          v-model="patientData.familyHistory"
          prepend-inner-icon="mdi-history"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          density="compact"
          outlined
          label="Parental Consanguinity"
          :items="consanguinityOptions"
          v-model="patientData.parentalConsanguinity"
          prepend-inner-icon="mdi-human-male-female"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          density="compact"
          outlined
          label="Diagnosis / Suspicion"
          v-model="patientData.diagnosis"
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
          v-model="patientData.orderingDate" 
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
          v-model="patientData.genDGConsentData.provided"
        />
      </v-col>
    </v-row>

    <!-- If user chooses "Fill Form", show the additional Consent fields -->
    <v-row dense v-if="patientData.genDGConsentData.provided === 'fill'" class="mt-2">
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          label="Consent Given By"
          v-model="patientData.genDGConsentData.form.consentName"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <LocaleDatePicker
          v-model="patientData.genDGConsentData.form.consentDate"
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
          v-model="patientData.genDGConsentData.form.questionSecondaryFindings"
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
          v-model="patientData.genDGConsentData.form.questionMaterial"
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
          v-model="patientData.genDGConsentData.form.questionExtended"
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
          v-model="patientData.genDGConsentData.form.questionResearch"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-1"></v-divider>
    
    <!-- Group 5: Variant Segregation Request -->
    <v-row dense>
      <v-col cols="12">
        <v-checkbox v-model="patientData.variantSegregationRequested" label="Request Variant Segregation" />
      </v-col>
      <v-col cols="12" v-if="patientData.variantSegregationRequested">
        <v-text-field
          density="compact"
          outlined
          label="Variant Details"
          v-model="patientData.variantDetails"
          hint="Provide details for the variant segregation request"
          persistent-hint
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import LocaleDatePicker from './LocaleDatePicker.vue'

/**
 * PatientForm component to capture patient details.
 *
 * Props:
 * - patientData: Object with patient details.
 */
const props = defineProps({
  patientData: {
    type: Object,
    required: true,
  },
})

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
