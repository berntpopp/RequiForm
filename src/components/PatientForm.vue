<template>
  <div>
    <h2 class="text-h5">Patient Details</h2>
    <v-text-field dense label="Given Name" v-model="patientData.givenName" />
    <v-text-field dense label="Family Name" v-model="patientData.familyName" />
    <v-text-field dense label="Birthdate" v-model="patientData.birthdate" />
    <v-text-field dense label="Insurance" v-model="patientData.insurance" />
    <v-select
      dense
      label="Sex"
      :items="sexOptions"
      v-model="patientData.sex"
    />
    <v-text-field
      dense
      label="Physician Name"
      v-model="patientData.physicianName"
    />
    <v-select
      dense
      label="Family History"
      :items="familyHistoryOptions"
      v-model="patientData.familyHistory"
    />
    <v-select
      dense
      label="Parental Consanguinity"
      :items="consanguinityOptions"
      v-model="patientData.parentalConsanguinity"
    />
    <v-textarea
      dense
      label="Diagnosis / Suspicion"
      v-model="patientData.diagnosis"
      rows="2"
    />
  </div>
</template>

<script setup>
defineProps({
  patientData: {
    type: Object,
    required: true
  }
});

// Options for drop-downs
const sexOptions = ["male", "female", "undetermined"];
const familyHistoryOptions = ["conspicuous", "inconspicuous", "unknown"];
const consanguinityOptions = ["yes", "no"];
</script>

<style scoped>
/* Adjust spacing if needed */
</style>
