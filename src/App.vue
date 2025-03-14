<template>
  <v-app>
    <!-- Top Menu Bar -->
    <TopBar 
      @generate-pdf="handleGeneratePdf" 
      @copy-url="handleCopyUrl"
      @copy-encrypted-url="openEncryptionDialog"
    />
    <v-main>
      <v-container>
        <PatientForm :patientData="patientData" />
        <TestSelector v-model="selectedTests" />

        <!-- Hidden PDF Generator component -->
        <div style="display: none;">
          <PdfGenerator
            ref="pdfGen"
            :patientData="patientData"
            :selectedTests="selectedTests"
          />
        </div>

        <!-- Conditionally render the Selected Panels section only if panels are selected -->
        <div class="mt-4" v-if="groupedPanelDetails.length">
          <h2>Selected Panels:</h2>
          <div v-for="group in groupedPanelDetails" :key="group.categoryTitle">
            <h3 class="category-header">{{ group.categoryTitle }}</h3>
            <ul>
              <li v-for="panel in group.tests" :key="panel.id" class="panel-item">
                <div class="panel-name">
                  <strong>{{ panel.name }}</strong>
                </div>
                <div class="panel-genes" v-if="panel.genes && panel.genes.length">
                  <em>{{ panel.genes.join(', ') }}</em>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </v-container>

      <!-- Snackbar for notifications -->
      <v-snackbar
        v-model="snackbar"
        timeout="3000"
        top
        right
        transition="scale-transition"
      >
        {{ snackbarMessage }}
        <template #action="{ attrs }">
          <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>

      <!-- Encryption Modal -->
      <v-dialog v-model="encryptionDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Enter Password for Encryption</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="encryptionPassword"
              type="password"
              label="Password"
              autocomplete="off"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeEncryptionDialog">Cancel</v-btn>
            <v-btn color="primary" text @click="confirmEncryption">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Decryption Modal -->
      <v-dialog v-model="decryptionDialog" max-width="500">
        <v-card>
          <v-card-title class="headline">Enter Password for Decryption</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="decryptionPassword"
              type="password"
              label="Password"
              autocomplete="off"
              :error-messages="decryptionError"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelDecryption">Cancel</v-btn>
            <v-btn color="primary" text @click="confirmDecryption">Confirm</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import CryptoJS from 'crypto-js';
import PatientForm from './components/PatientForm.vue';
import TestSelector from './components/TestSelector.vue';
import TopBar from './components/TopBar.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import testsData from './data/tests.json';

/** Patient data object */
const patientData = reactive({
  givenName: '',
  familyName: '',
  birthdate: '',
  insurance: '',
  sex: '',
  physicianName: '',
  familyHistory: '',
  parentalConsanguinity: '',
  diagnosis: ''
});

/** Array of selected panel IDs */
const selectedTests = ref([]);

/** Snackbar state for notifications */
const snackbar = ref(false);
const snackbarMessage = ref('');

/** Encryption dialog state and password */
const encryptionDialog = ref(false);
const encryptionPassword = ref('');

/** Decryption dialog state, password, and error */
const decryptionDialog = ref(false);
const decryptionPassword = ref('');
const decryptionError = ref('');

/**
 * Merges parameters from both query string and URL hash.
 * @return {URLSearchParams} The merged URL parameters.
 */
function mergeUrlParameters() {
  const merged = new URLSearchParams();
  const queryParams = new URLSearchParams(window.location.search);
  for (const [key, value] of queryParams.entries()) {
    merged.set(key, value);
  }
  const hash = window.location.hash.substring(1);
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    for (const [key, value] of hashParams.entries()) {
      merged.set(key, value);
    }
  }
  return merged;
}

/**
 * Clears URL parameters and hash from the browser’s address bar.
 */
function clearUrlParameters() {
  window.history.replaceState(null, '', window.location.pathname);
}

/**
 * Loads patient data from URL parameters (query and hash) and then clears them.
 * If an encrypted parameter is detected, opens the decryption dialog.
 */
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  let encryptedValue = urlParams.get('encrypted');
  if (!encryptedValue) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    encryptedValue = hashParams.get('encrypted');
  }
  if (encryptedValue) {
    pendingEncryptedValue.value = encryptedValue;
    decryptionDialog.value = true;
  } else {
    const params = mergeUrlParameters();
    patientData.givenName = params.get('givenName') || '';
    patientData.familyName = params.get('familyName') || '';
    patientData.birthdate = params.get('birthdate') || '';
    patientData.insurance = params.get('insurance') || '';
    patientData.sex = (params.get('sex') || '').toLowerCase();
    patientData.physicianName = params.get('physicianName') || '';
    patientData.familyHistory = (params.get('familyHistory') || '').toLowerCase();
    patientData.parentalConsanguinity = (params.get('parentalConsanguinity') || '').toLowerCase();
    patientData.diagnosis = params.get('diagnosis') || '';
    clearUrlParameters();
  }
});

/** Used to store the encrypted string from the URL for decryption */
const pendingEncryptedValue = ref(null);

/**
 * Groups selected panels by category.
 */
const groupedPanelDetails = computed(() => {
  return testsData.categories
    .map((category) => ({
      categoryTitle: category.title,
      tests: category.tests.filter((test) => selectedTests.value.includes(test.id))
    }))
    .filter((group) => group.tests.length > 0);
});

/** Reference for the PdfGenerator component */
const pdfGen = ref(null);

/**
 * Handles PDF generation by calling the exposed generatePdf method.
 */
const handleGeneratePdf = () => {
  if (pdfGen.value && typeof pdfGen.value.generatePdf === 'function') {
    pdfGen.value.generatePdf();
  }
};

/**
 * Generates a URL with hash parameters based on patient data and selected tests.
 * @return {string} The generated URL.
 */
const generateUrlWithHash = () => {
  const url = new URL(window.location.href);
  url.search = '';
  const hashParams = new URLSearchParams();
  Object.entries(patientData).forEach(([key, value]) => {
    if (value) {
      hashParams.set(key, value);
    }
  });
  if (selectedTests.value.length) {
    hashParams.set('selectedTests', selectedTests.value.join(','));
  }
  url.hash = hashParams.toString();
  return url.toString();
};

/**
 * Copies the generated plain URL (with hash parameters) to the clipboard.
 */
const handleCopyUrl = () => {
  const urlToCopy = generateUrlWithHash();
  navigator.clipboard
    .writeText(urlToCopy)
    .then(() => {
      snackbarMessage.value = 'Hash URL copied to clipboard!';
      snackbar.value = true;
    })
    .catch(() => {
      snackbarMessage.value = 'Failed to copy URL.';
      snackbar.value = true;
    });
};

/**
 * Opens the encryption modal.
 */
const openEncryptionDialog = () => {
  encryptionPassword.value = '';
  encryptionDialog.value = true;
};

/**
 * Closes the encryption modal.
 */
const closeEncryptionDialog = () => {
  encryptionDialog.value = false;
};

/**
 * Encrypts the current parameters using the provided password,
 * copies the URL with the encrypted hash, and closes the modal.
 */
const confirmEncryption = () => {
  const params = new URLSearchParams();
  Object.entries(patientData).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  if (selectedTests.value.length) {
    params.set('selectedTests', selectedTests.value.join(','));
  }
  const paramsStr = params.toString();
  const cipher = CryptoJS.AES.encrypt(paramsStr, encryptionPassword.value);
  const encryptedStr = cipher.toString();
  const url = new URL(window.location.href);
  url.search = '';
  const hashParams = new URLSearchParams();
  hashParams.set('encrypted', encryptedStr);
  url.hash = hashParams.toString();
  navigator.clipboard
    .writeText(url.toString())
    .then(() => {
      snackbarMessage.value = 'Encrypted URL copied to clipboard!';
      snackbar.value = true;
      encryptionDialog.value = false;
    })
    .catch(() => {
      snackbarMessage.value = 'Failed to copy encrypted URL.';
      snackbar.value = true;
      encryptionDialog.value = false;
    });
};

/**
 * Cancels decryption: closes the modal and resets patient data.
 */
const cancelDecryption = () => {
  decryptionDialog.value = false;
  decryptionPassword.value = '';
  decryptionError.value = '';
  Object.keys(patientData).forEach((key) => {
    patientData[key] = '';
  });
  clearUrlParameters();
};

/**
 * Attempts to decrypt the pending encrypted parameter using the provided password.
 */
const confirmDecryption = () => {
  try {
    const bytes = CryptoJS.AES.decrypt(pendingEncryptedValue.value, decryptionPassword.value);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) {
      throw new Error('Invalid password or corrupted data');
    }
    const params = new URLSearchParams(decryptedStr);
    patientData.givenName = params.get('givenName') || '';
    patientData.familyName = params.get('familyName') || '';
    patientData.birthdate = params.get('birthdate') || '';
    patientData.insurance = params.get('insurance') || '';
    patientData.sex = (params.get('sex') || '').toLowerCase();
    patientData.physicianName = params.get('physicianName') || '';
    patientData.familyHistory = (params.get('familyHistory') || '').toLowerCase();
    patientData.parentalConsanguinity = (params.get('parentalConsanguinity') || '').toLowerCase();
    patientData.diagnosis = params.get('diagnosis') || '';
    decryptionDialog.value = false;
    decryptionPassword.value = '';
    decryptionError.value = '';
    clearUrlParameters();
  } catch (error) {
    decryptionError.value = 'Decryption failed. Please check your password.';
  }
};
</script>

<style>
.mt-4 {
  margin-top: 1rem;
}

.category-header {
  font-size: 1.1rem;
  margin: 1rem 0 0.5rem;
  border-bottom: 2px solid #000;
  font-weight: bold;
}

.panel-item {
  margin-bottom: 0.75rem;
}

.panel-name {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.panel-genes {
  font-size: 0.85rem;
  color: #555;
}
</style>
