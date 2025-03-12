<!-- App.vue -->
<template>
  <v-app>
    <v-main>
      <v-container>
        <PatientForm :patientData="patientData" />

        <!-- v-model binds to selectedTests in App.vue -->
        <TestSelector v-model="selectedTests" />

        <PdfGenerator 
          :patientData="patientData" 
          :selectedTests="selectedTests" 
        />

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

const patientData = reactive({
  givenName: '',
  familyName: '',
  birthdate: '',
  insurance: ''
})

const selectedTests = ref([])

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  patientData.givenName = params.get('givenName') || ''
  patientData.familyName = params.get('familyName') || ''
  patientData.birthdate = params.get('birthdate') || ''
  patientData.insurance = params.get('insurance') || ''
})
</script>
