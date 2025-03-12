<!-- src/App.vue -->
<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- Patient Form with separate given and family names -->
        <PatientForm :patientData="patientData" />
        
        <!-- Test Selector -->
        <TestSelector v-model="selectedTests" />
        
        <!-- PDF Generator Button -->
        <PdfGenerator 
          :patientData="patientData" 
          :selectedTests="selectedTests" 
        />
        
        <!-- Debug: List Selected Tests -->
        <div class="mt-4">
          <h2>Selected Tests:</h2>
          <ul>
            <li v-for="testId in selectedTests" :key="testId">{{ testId }}</li>
          </ul>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import PatientForm from './components/PatientForm.vue'
import TestSelector from './components/TestSelector.vue'
import PdfGenerator from './components/PdfGenerator.vue'

// Update the patient data structure to include givenName and familyName
const patientData = reactive({
  givenName: '',
  familyName: '',
  birthdate: '',
  insurance: ''
})

const selectedTests = ref([])

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  // Expect URL parameters "givenName" and "familyName"
  patientData.givenName = params.get('givenName') || ''
  patientData.familyName = params.get('familyName') || ''
  patientData.birthdate = params.get('birthdate') || ''
  patientData.insurance = params.get('insurance') || ''
})
</script>

<style>
.mt-4 {
  margin-top: 1rem;
}
</style>
