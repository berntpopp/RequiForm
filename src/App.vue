<!-- src/App.vue -->
<template>
  <v-app>
    <v-main>
      <v-container>
        <PatientForm :patientData="patientData" />
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
  name: '',
  birthdate: '',
  insurance: ''
})

const selectedTests = ref([])

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  patientData.name = params.get('name') || ''
  patientData.birthdate = params.get('birthdate') || ''
  patientData.insurance = params.get('insurance') || ''
})
</script>

<style>
.mt-4 {
  margin-top: 1rem;
}
</style>
