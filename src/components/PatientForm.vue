<template>
  <div>
    <h2 class="text-h5 mb-4">Patient Details</h2>
    
    <!-- Group 1: Basic Information -->
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          dense
          outlined
          label="Given Name"
          v-model="patientData.givenName"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          dense
          outlined
          label="Family Name"
          v-model="patientData.familyName"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          dense
          outlined
          label="Birthdate"
          v-model="patientData.birthdate"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          dense
          outlined
          label="Sex"
          :items="sexOptions"
          v-model="patientData.sex"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- Group 2: Insurance & Physician -->
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          dense
          outlined
          label="Insurance"
          v-model="patientData.insurance"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          dense
          outlined
          label="Physician Name"
          v-model="patientData.physicianName"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- Group 3: Clinical Details -->
    <v-row dense>
      <v-col cols="12" sm="4">
        <v-select
          dense
          outlined
          label="Family History"
          :items="familyHistoryOptions"
          v-model="patientData.familyHistory"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          dense
          outlined
          label="Parental Consanguinity"
          :items="consanguinityOptions"
          v-model="patientData.parentalConsanguinity"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          dense
          outlined
          label="Diagnosis / Suspicion"
          v-model="patientData.diagnosis"
          rows="2"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
defineProps({
  patientData: {
    type: Object,
    required: true
  }
});

const sexOptions = ["male", "female", "undetermined"];
const familyHistoryOptions = ["conspicuous", "inconspicuous", "unknown"];
const consanguinityOptions = ["yes", "no"];
</script>

<style scoped>
.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
