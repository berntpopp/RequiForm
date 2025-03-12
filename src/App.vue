<template>
  <v-app>
    <!-- Top menu bar with the app name and Generate PDF button -->
    <TopBar @generate-pdf="handleGeneratePdf" />
    <v-main>
      <v-container>
        <PatientForm :patientData="patientData" />
        <TestSelector v-model="selectedTests" />

        <!-- PdfGenerator is kept hidden; its method is invoked from TopBar -->
        <div style="display: none;">
          <PdfGenerator ref="pdfGen" :patientData="patientData" :selectedTests="selectedTests" />
        </div>

        <!-- For debugging -->
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
import TopBar from './components/TopBar.vue'
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

// Get a ref to PdfGenerator so we can call generatePdf()
const pdfGen = ref(null)
const handleGeneratePdf = () => {
  if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
    pdfGen.value.generatePdf();
  }
}
</script>
