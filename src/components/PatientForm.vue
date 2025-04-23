<template>
  <div>
    <h2 class="text-h5 mb-4" :key="`patient-title-${i18nKey}`">{{ t('patientForm.title') }}</h2>
    
    <!-- Group 1: Basic Information -->
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          :label="t('patientForm.labels.givenName')" :key="`given-name-input-${i18nKey}`"
          v-model="givenName"
          prepend-inner-icon="mdi-account"
          :error="!!firstNameError"
          :error-messages="firstNameError"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          :label="t('patientForm.labels.familyName')" :key="`family-name-input-${i18nKey}`"
          v-model="familyName"
          prepend-inner-icon="mdi-account-group"
          :error="!!lastNameError"
          :error-messages="lastNameError"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <LocaleDatePicker 
          v-model="birthdate" 
          :label="t('patientForm.labels.birthdate')" :key="`birthdate-input-${i18nKey}`"
          :error="!!birthdateError"
          :error-messages="birthdateError"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          :label="t('patientForm.labels.sex')" :key="`sex-input-${i18nKey}`"
          :items="sexOptions"
          item-title="text"
          item-value="value"
          v-model="sex"
          prepend-inner-icon="mdi-gender-male-female"
          :error="!!sexError"
          :error-messages="sexError"
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
          :label="t('patientForm.labels.insurance')" :key="`insurance-input-${i18nKey}`"
          v-model="insurance"
          prepend-inner-icon="mdi-card-account-details-outline"
          :error="!!insuranceError"
          :error-messages="insuranceError"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          :label="t('patientForm.labels.physicianName')" :key="`physician-input-${i18nKey}`"
          v-model="physicianName"
          prepend-inner-icon="mdi-stethoscope"
          :error="!!referrerError"
          :error-messages="referrerError"
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
          :label="t('patientForm.labels.familyHistory')" :key="`family-history-input-${i18nKey}`"
          :items="familyHistoryOptions"
          item-title="text"
          item-value="value"
          v-model="familyHistory"
          prepend-inner-icon="mdi-history"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          density="compact"
          outlined
          :label="t('patientForm.labels.parentalConsanguinity')" :key="`consanguinity-input-${i18nKey}`"
          :items="consanguinityOptions"
          item-title="text"
          item-value="value"
          v-model="parentalConsanguinity"
          prepend-inner-icon="mdi-human-male-female"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          density="compact"
          outlined
          :label="t('patientForm.labels.diagnosis')" :key="`diagnosis-input-${i18nKey}`"
          v-model="diagnosis"
          rows="2"
          prepend-inner-icon="mdi-file-document-edit-outline"
          persistent-hint
          :error="!!diagnosisError"
          :error-messages="diagnosisError"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-1"></v-divider>
    
    <!-- Group 4: Ordering Information and Consent Select -->
    <v-row dense>
      <v-col cols="12" sm="6">
        <LocaleDatePicker 
          v-model="orderingDate" 
          :label="t('patientForm.labels.orderingDate')" :key="`ordering-date-input-${i18nKey}`" 
        />
      </v-col>
      <v-col cols="12" sm="6">
        <!-- Use the genDGConsentData field consistently -->
        <v-select
          density="compact"
          outlined
          :label="t('patientForm.labels.consent')" :key="`consent-input-${i18nKey}`"
          :items="consentOptions"
          item-title="text"
          item-value="value"
          v-model="genDGProvided"
        />
      </v-col>
    </v-row>

    <!-- If user chooses "Fill Form", show the additional Consent fields -->
    <v-row dense v-if="genDGProvided === 'fill'" class="mt-2">
      <v-col cols="12" sm="6">
        <v-text-field
          density="compact"
          outlined
          :label="t('patientForm.labels.consentGivenBy')" :key="`consent-given-by-input-${i18nKey}`"
          v-model="genDGConsentName"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <LocaleDatePicker 
          v-model="genDGConsentDate" 
          :label="t('patientForm.labels.consentDate')" :key="`consent-date-input-${i18nKey}`"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          :label="t('patientForm.labels.consentSecondaryFindings')" :key="`consent-secondary-input-${i18nKey}`"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGSecondaryFindings"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          :label="t('patientForm.labels.consentMaterial')" :key="`consent-material-input-${i18nKey}`"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGMaterial"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          :label="t('patientForm.labels.consentExtendedStorage')" :key="`consent-extended-input-${i18nKey}`"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGExtended"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          density="compact"
          outlined
          :label="t('patientForm.labels.consentResearch')" :key="`consent-research-input-${i18nKey}`"
          :items="yesNoOptions"
          item-title="text"
          item-value="value"
          v-model="genDGResearch"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-1"></v-divider>
    
    <!-- Group 5: Variant Segregation Request -->
    <v-row dense>
      <v-col cols="12">
        <v-checkbox
          density="compact"
          :label="t('patientForm.labels.requestVariantSegregation')" :key="`variant-segregation-input-${i18nKey}`"
          v-model="variantSegregationRequested"
        />
      </v-col>
      <v-col cols="12" v-if="variantSegregationRequested">
        <v-text-field
          density="compact"
          outlined
          :key="`variant-details-field-${i18nKey}`"
          :label="t('patientForm.labels.variantDetails')"
          v-model="variantDetails"
          :hint="t('patientForm.hints.variantDetails')"
          persistent-hint
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import LocaleDatePicker from './LocaleDatePicker.vue'
import { computed, inject, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

// Get i18n instance
const { t } = useI18n();

// Create a reactivity key to force re-renders when language changes
const i18nKey = ref(0);

// Listen for global language change events and trigger reactive updates
const handleI18nUpdate = () => {
  i18nKey.value++;
};

onMounted(() => {
  // Listen for both custom events
  window.addEventListener('i18n-updated', handleI18nUpdate);
  window.addEventListener('i18n-locale-changed', handleI18nUpdate);
});

onBeforeUnmount(() => {
  // Clean up event listeners
  window.removeEventListener('i18n-updated', handleI18nUpdate);
  window.removeEventListener('i18n-locale-changed', handleI18nUpdate);
});

/**
 * PatientForm component to capture patient details.
 * 
 * This component now has dual functionality:
 * 1. It can work with the legacy patientData prop (for backward compatibility)
 * 2. It can work with the unified patient data model using inject
 */
const props = defineProps({
  patientData: {
    type: Object,
    required: true,
  },
})

// Define the emit function for backward compatibility
const emit = defineEmits(['update:patientData'])

// Inject the unified patient data and update functions
const unifiedPatientData = inject('patientData')
const updatePersonalInfo = inject('updatePersonalInfo')

// Inject validation-related functions
const getFieldErrors = inject('getFieldErrors', () => ({})) // Fallback to empty object if not provided

// Computed properties for field-level validation errors
// Each one ensures proper type for Vuetify (string or empty string)

// First name error
const firstNameError = computed(() => {
  const errors = getFieldErrors('personalInfo');
  return errors && errors.firstName ? t(errors.firstName) : ''
})

// Last name error
const lastNameError = computed(() => {
  const errors = getFieldErrors('personalInfo');
  return errors && errors.lastName ? t(errors.lastName) : ''
})

// Birthdate error
const birthdateError = computed(() => {
  const errors = getFieldErrors('personalInfo');
  return errors && errors.birthdate ? t(errors.birthdate) : ''
})

// Sex error
const sexError = computed(() => {
  const errors = getFieldErrors('personalInfo');
  return errors && errors.sex ? t(errors.sex) : ''
})

// Insurance error
const insuranceError = computed(() => {
  const errors = getFieldErrors('personalInfo');
  return errors && errors.insurance ? t(errors.insurance) : ''
})

// Referrer error (physician name)
const referrerError = computed(() => {
  const errors = getFieldErrors('personalInfo');
  return errors && errors.referrer ? t(errors.referrer) : ''
})

// Diagnosis error
const diagnosisError = computed(() => {
  const errors = getFieldErrors('personalInfo');
  return errors && errors.diagnosis ? t(errors.diagnosis) : ''
})

/**
 * Helper function to create computed properties with dual data binding
 * - Binds to both legacy patientData prop (via emit)
 * - Updates unified patient data model (via inject)
 * 
 * @param {string} legacyKey - Key in the legacy patientData object
 * @param {string} unifiedKey - Key in the unified personalInfo object
 * @param {...string} nestedKeys - Additional keys for nested legacy objects
 * @return {import('vue').ComputedRef} Computed property with dual binding
 */
function createDualBindingField(legacyKey, unifiedKey, ...nestedKeys) {
  return computed({
    get() {
      // First try to get from unified data model if it exists
      if (unifiedPatientData && unifiedKey && unifiedPatientData.personalInfo) {
        const unifiedValue = unifiedPatientData.personalInfo[unifiedKey];
        if (unifiedValue !== undefined) return unifiedValue;
      }
      
      // Fallback to legacy data model
      let current = props.patientData;
      const keys = [legacyKey, ...nestedKeys];
      
      for (const key of keys) {
        // Check if current is an object and has the key
        if (current === null || typeof current !== 'object' || !(key in current)) {
          // Special handling for boolean 'variantSegregationRequested'
          if (keys.length === 1 && keys[0] === 'variantSegregationRequested') {
            return false;
          }
          return ''; // Default to empty string for other missing paths
        }
        current = current[key];
      }
      
      // Ensure boolean is returned for variantSegregationRequested
      if (keys.length === 1 && keys[0] === 'variantSegregationRequested') {
        return typeof current === 'boolean' ? current : false;
      }
      
      return current ?? ''; // Return the final value or default to empty string
    },
    set(newValue) {
      // Update the unified model if it exists
      if (updatePersonalInfo && unifiedKey) {
        updatePersonalInfo({ [unifiedKey]: newValue });
      }
      
      // Also update the legacy model for backward compatibility
      const newData = JSON.parse(JSON.stringify(props.patientData));
      let current = newData;
      const keys = [legacyKey, ...nestedKeys];
      
      // Traverse the path, creating objects if they don't exist
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === null || typeof current[key] !== 'object') {
          current[key] = {}; // Ensure path exists
        }
        current = current[key];
      }
      
      // Set the value at the final key
      current[keys[keys.length - 1]] = newValue;
      emit('update:patientData', newData); // Emit the updated full object
    },
  });
}

/**
 * Helper function for legacy fields that don't have a unified model equivalent
 * Uses only the legacy data path
 */
function createLegacyField(...pathKeys) {
  return computed({
    get() {
      let current = props.patientData;
      for (const key of pathKeys) {
        if (current === null || typeof current !== 'object' || !(key in current)) {
          if (pathKeys.length === 1 && pathKeys[0] === 'variantSegregationRequested') {
            return false;
          }
          return ''; 
        }
        current = current[key];
      }
      if (pathKeys.length === 1 && pathKeys[0] === 'variantSegregationRequested') {
        return typeof current === 'boolean' ? current : false;
      }
      return current ?? '';
    },
    set(newValue) {
      const newData = JSON.parse(JSON.stringify(props.patientData));
      let current = newData;
      for (let i = 0; i < pathKeys.length - 1; i++) {
        const key = pathKeys[i];
        if (current[key] === null || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      current[pathKeys[pathKeys.length - 1]] = newValue;
      emit('update:patientData', newData);
    },
  });
}

// Computed properties for patient personal information (dual binding to both models)
const givenName = createDualBindingField('givenName', 'firstName');
const familyName = createDualBindingField('familyName', 'lastName');
const birthdate = createDualBindingField('birthdate', 'birthdate');
const sex = createDualBindingField('sex', 'sex');
const insurance = createDualBindingField('insurance', 'insurance');
const physicianName = createDualBindingField('physicianName', 'referrer');

// The following fields don't have unified model equivalents yet,
// so they use the legacy data model only
const familyHistory = createLegacyField('familyHistory');
const parentalConsanguinity = createLegacyField('parentalConsanguinity');
// Diagnosis now uses the unified data model
const diagnosis = createDualBindingField('diagnosis', 'diagnosis');
const orderingDate = createLegacyField('orderingDate');
const variantSegregationRequested = createLegacyField('variantSegregationRequested');
const variantDetails = createLegacyField('variantDetails');

// Functions were previously added here but caused errors - reverting to original state

// Computed properties for GenDG Consent Data using legacy paths only
const genDGProvided = createLegacyField('genDGConsentData', 'provided');
const genDGConsentName = createLegacyField('genDGConsentData', 'form', 'consentName');
const genDGConsentDate = createLegacyField('genDGConsentData', 'form', 'consentDate');
const genDGSecondaryFindings = createLegacyField('genDGConsentData', 'form', 'questionSecondaryFindings');
const genDGMaterial = createLegacyField('genDGConsentData', 'form', 'questionMaterial');
const genDGExtended = createLegacyField('genDGConsentData', 'form', 'questionExtended');
const genDGResearch = createLegacyField('genDGConsentData', 'form', 'questionResearch');

// Note: Data processing consent has been removed as it's out of scope

// Note: Incidental findings consent is already handled via the genDGSecondaryFindings field
// in the GenDG consent section

/**
 * Computed properties for translated select options.
 * Each option is reactive to language changes via the i18nKey.
 */
const sexOptions = computed(() => {
  // Using the i18nKey to trigger reactivity on language change
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  return [
  { text: t('patientForm.options.sex.male'), value: 'male' },
  { text: t('patientForm.options.sex.female'), value: 'female' },
  { text: t('patientForm.options.sex.undetermined'), value: 'undetermined' }
  ];
});

const familyHistoryOptions = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  return [
  { text: t('patientForm.options.familyHistory.conspicuous'), value: 'conspicuous' },
  { text: t('patientForm.options.familyHistory.inconspicuous'), value: 'inconspicuous' },
  { text: t('patientForm.options.familyHistory.unknown'), value: 'unknown' }
  ];
});

const consanguinityOptions = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  return [
  { text: t('patientForm.options.consanguinity.yes'), value: 'yes' },
  { text: t('patientForm.options.consanguinity.no'), value: 'no' }
  ];
});

// Options for the Consent select.
const consentOptions = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  return [
  { text: t('patientForm.options.consent.provided'), value: 'provided' },
  { text: t('patientForm.options.consent.fill'), value: 'fill' },
  ];
});

// Options for yes/no questions.
const yesNoOptions = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _ = i18nKey.value;
  return [
  { text: t('patientForm.options.yesNo.yes'), value: 'yes' },
  { text: t('patientForm.options.yesNo.no'), value: 'no' },
  ];
});
</script>

<style scoped>
.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
