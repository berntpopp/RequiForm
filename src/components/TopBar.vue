<template>
  <v-app-bar app color="primary" dark>
    <v-spacer></v-spacer>
    <v-divider vertical color="white" class="mx-1"></v-divider>
    <v-toolbar-title class="flex text-center">
      <h1 class="text-h5 font-weight-bold">
        <v-icon left>mdi-file-document</v-icon>
        <span class="ml-2">RequiForm</span>
      </h1>
    </v-toolbar-title>
    <v-divider vertical color="white" class="mx-1"></v-divider>
    <span id="top-bar-actions">
      <!-- Theme Toggle Button -->
      <v-btn icon @click="$emit('toggle-theme')" :aria-label="isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'">
        <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme' }}
        </v-tooltip>
      </v-btn>
      <!-- Reset Application Button -->
      <v-btn icon @click="$emit('reset-form')" aria-label="Reset Application">
        <v-icon>mdi-restart</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Reset Application
        </v-tooltip>
      </v-btn>
      <!-- FAQ Modal Button -->
      <v-btn icon @click="$emit('open-faq')" aria-label="Open FAQ">
        <v-icon>mdi-help-circle</v-icon>
        <v-tooltip activator="parent" location="bottom">
          FAQ
        </v-tooltip>
      </v-btn>
      <!-- Start Tour Button -->
      <v-btn icon @click="$emit('start-tour')" aria-label="Start Guided Tour">
        <v-icon>mdi-compass-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Start Guided Tour
        </v-tooltip>
      </v-btn>
      <!-- Copy URL Button -->
      <v-btn icon @click="$emit('copy-url')" aria-label="Copy URL">
        <v-icon>mdi-link-variant</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Copy URL
        </v-tooltip>
      </v-btn>
      <!-- Copy Encrypted URL Button -->
      <v-btn icon @click="$emit('copy-encrypted-url')" aria-label="Copy Encrypted URL">
        <v-icon>mdi-lock</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Copy Encrypted URL
        </v-tooltip>
      </v-btn>
      
      <!-- Paste Data Button -->
      <v-btn icon @click="$emit('open-paste-data')" aria-label="Paste and Import Data" id="paste-data-btn">
        <v-icon>mdi-clipboard-text</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Paste Data
        </v-tooltip>
      </v-btn>
      
      <!-- Save Data Button -->
      <v-btn icon @click="$emit('save-data')" aria-label="Save Data" id="save-data-btn">
        <v-icon>mdi-content-save</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Save Data
        </v-tooltip>
      </v-btn>
      
      <!-- Load Data Button -->
      <v-btn icon @click="$emit('load-data')" aria-label="Load Data" id="load-data-btn">
        <v-icon>mdi-folder-open</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Load Data
        </v-tooltip>
      </v-btn>
      
      <!-- Generate PDF Button -->
      <v-btn icon @click="$emit('generate-pdf')" aria-label="Generate PDF" id="generate-pdf-btn">
        <v-icon>mdi-file-pdf-box</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Generate PDF
        </v-tooltip>
      </v-btn>
    </span>
    <v-divider vertical color="white" class="mx-1"></v-divider>
    <v-spacer></v-spacer>
    <v-spacer></v-spacer>
  </v-app-bar>
</template>

<script setup>
/**
 * TopBar component for RequiForm.
 *
 * This component displays the top menu bar and provides icon-based buttons for:
 * - Toggling the theme (dark/light)
 * - Resetting the complete form
 * - Opening the FAQ modal
 * - Copying plain and encrypted URLs, and generating a PDF
 * - Starting a guided tour
 *
 * Props:
 *   isDark {Boolean} - Whether the dark theme is active.
 *
 * Emits:
 *   toggle-theme, reset-form, open-faq, start-tour, copy-url, copy-encrypted-url, generate-pdf, save-data, load-data, open-paste-data.
 */
defineProps({
  isDark: {
    type: Boolean,
    required: true,
  },
});
</script>
