<!-- src/components/PatientForm.vue -->
<template>
  <div>
    <h2>Patient Details</h2>
    <v-text-field label="Name" v-model="patientData.name" />
    <v-text-field label="Birthdate" v-model="patientData.birthdate" />
    <v-text-field label="Insurance" v-model="patientData.insurance" />
  </div>
</template>

<script setup>
defineProps({
  patientData: {
    type: Object,
    required: true
  }
});
</script>
