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
        <!-- Using the new LocaleDatePicker -->
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
  </div>
</template>

<script setup>
import LocaleDatePicker from './LocaleDatePicker.vue'

defineProps({
  patientData: {
    type: Object,
    required: true
  }
})

const sexOptions = ['male', 'female', 'undetermined']
const familyHistoryOptions = ['conspicuous', 'inconspicuous', 'unknown']
const consanguinityOptions = ['yes', 'no']
</script>

<style scoped>
.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
