<template>
  <v-dialog :model-value="modelValue" max-width="500" @update:model-value="$emit('update:modelValue', $event)" :aria-labelledby="dialogTitleId">
    <v-card>
      <v-card-title :id="dialogTitleId" class="headline">{{ t('saveDataDialog.title') }}</v-card-title>
      <v-card-text>
        <p>{{ t('saveDataDialog.instruction') }}</p>
        <v-text-field 
          v-model="fileName" 
          :label="t('saveDataDialog.labels.fileName')" 
          :placeholder="t('saveDataDialog.placeholders.fileName')"
          :hint="t('saveDataDialog.hints.fileName')"
          persistent-hint
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">{{ t('saveDataDialog.buttons.cancel') }}</v-btn>
        <v-btn color="primary" text @click="confirm">{{ t('saveDataDialog.buttons.export') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * SaveDataDialog component provides a UI for saving form data to a file.
 * @file SaveDataDialog.vue - Dialog for exporting form data to a JSON file
 * @module components/dialogs/SaveDataDialog
 */
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Generate a unique ID for the dialog title for accessibility
const dialogTitleId = computed(() => 'save-data-dialog-title');

const props = defineProps({
  /**
   * Controls dialog visibility
   * @type {Boolean}
   */
  modelValue: {
    type: Boolean,
    required: true
  },
  
  /**
   * Default filename (without extension)
   * @type {String}
   */
  defaultFileName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'confirm'
]);

// Internal state for the file name input - Initialize with prop or translated default
const fileName = ref(props.defaultFileName || t('saveDataDialog.defaultFileName'));

// Reset filename when dialog opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Reset to the provided prop or the translated default
    fileName.value = props.defaultFileName || t('saveDataDialog.defaultFileName'); 
  }
});

/**
 * Handles the cancel action
 */
function cancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

/**
 * Handles the confirm action with the provided filename
 */
function confirm() {
  emit('confirm', fileName.value);
  emit('update:modelValue', false);
}
</script>
