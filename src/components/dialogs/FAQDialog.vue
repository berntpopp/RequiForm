<template>
  <v-dialog :model-value="modelValue" max-width="700" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="headline">Frequently Asked Questions</v-card-title>
      <v-card-text>
        <v-expansion-panels v-model="expandedPanel">
          <v-expansion-panel v-for="(item, i) in faqItems" :key="i">
            <v-expansion-panel-title>{{ item.question }}</v-expansion-panel-title>
            <v-expansion-panel-text>
              <p v-html="item.answer"></p>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * FAQDialog component displays frequently asked questions in an accordion format.
 * @file FAQDialog.vue - Dialog for displaying FAQ information
 * @module components/dialogs/FAQDialog
 */
import { ref, watch } from 'vue';

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
   * Array of FAQ items with question and answer properties
   * @type {Array<{question: string, answer: string}>}
   */
  faqItems: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  'update:modelValue',
  'close'
]);

// Track which panel is expanded
const expandedPanel = ref(0);

// Reset expanded panel when dialog opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    expandedPanel.value = 0;
  }
});

/**
 * Handles the close action
 */
function close() {
  emit('close');
  emit('update:modelValue', false);
}
</script>
