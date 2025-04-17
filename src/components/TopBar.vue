<template>
  <!-- Add a class to v-app-bar for easier targeting -->
  <v-app-bar app :color="brandingConfig.styles.topBarColor" dark class="main-app-bar">
    <!-- Inner wrapper for content -->
    <div class="content-wrapper">
      <!-- Title aligned to the start -->
      <v-toolbar-title class="flex-shrink-0">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props: tooltipProps }">
            <h1 class="text-h5 font-weight-bold d-flex align-center" v-bind="tooltipProps">
              <!-- Logo Image -->
              <v-img
                v-if="brandingConfig.logoUrl"
                :src="brandingConfig.logoUrl"
                alt="App Logo"
                class="header-logo mr-2"
                max-height="32"
                contain
              ></v-img>
              <!-- Default Icon (hide if logo exists) -->
              <v-icon v-if="!brandingConfig.logoUrl" start class="logo-icon">mdi-file-document-outline</v-icon>
              <!-- App Title Text -->
              <span class="ml-1">{{ brandingConfig.appTitle }}</span>
            </h1>
          </template>
          <span>{{ brandingConfig.appTitle }}: Secure requisition form builder</span>
        </v-tooltip>
      </v-toolbar-title>

      <!-- Spacer pushes actions to the right -->
      <v-spacer></v-spacer> 

      <!-- Action buttons - Visible on sm and up -->
      <span id="top-bar-actions" class="d-none d-sm-inline-flex">
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

      <!-- Kebab menu for actions - Visible on xs only -->
      <div class="d-inline-flex d-sm-none">
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" aria-label="More Actions">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <!-- Replicate actions as list items -->
            <v-list-item @click="$emit('toggle-theme')">
              <template v-slot:prepend>
                <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
              </template>
              <v-list-item-title>{{ isDark ? 'Light Theme' : 'Dark Theme' }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('reset-form')">
              <template v-slot:prepend>
                <v-icon>mdi-restart</v-icon>
              </template>
              <v-list-item-title>Reset Application</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('open-faq')">
              <template v-slot:prepend>
                <v-icon>mdi-help-circle</v-icon>
              </template>
              <v-list-item-title>FAQ</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('start-tour')">
              <template v-slot:prepend>
                <v-icon>mdi-compass-outline</v-icon>
              </template>
              <v-list-item-title>Start Guided Tour</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('copy-url')">
              <template v-slot:prepend>
                <v-icon>mdi-link-variant</v-icon>
              </template>
              <v-list-item-title>Copy URL</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('copy-encrypted-url')">
              <template v-slot:prepend>
                <v-icon>mdi-lock</v-icon>
              </template>
              <v-list-item-title>Copy Encrypted URL</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('open-paste-data')">
              <template v-slot:prepend>
                <v-icon>mdi-clipboard-text</v-icon>
              </template>
              <v-list-item-title>Paste Data</v-list-item-title>
            </v-list-item>
             <v-list-item @click="$emit('save-data')">
              <template v-slot:prepend>
                <v-icon>mdi-content-save</v-icon>
              </template>
              <v-list-item-title>Save Data</v-list-item-title>
            </v-list-item>
             <v-list-item @click="$emit('load-data')">
              <template v-slot:prepend>
                <v-icon>mdi-folder-open</v-icon>
              </template>
              <v-list-item-title>Load Data</v-list-item-title>
            </v-list-item>
             <v-list-item @click="$emit('generate-pdf')">
              <template v-slot:prepend>
                <v-icon>mdi-file-pdf-box</v-icon>
              </template>
              <v-list-item-title>Generate PDF</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

    </div>
  </v-app-bar>
</template>

<script setup>
import { brandingConfig } from '@/services/brandingConfigService'; // Import branding config

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

<style scoped>
.content-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto; /* Center the wrapper */
  padding: 0 16px; /* Ensure padding for content */
}

/* Ensure title doesn't shrink excessively if needed */
.v-toolbar-title {
   flex-shrink: 0; /* Keep this */
}

.header-logo {
  /* Styles for the custom logo image */
  max-height: 32px; /* Control logo height */
  width: auto; /* Maintain aspect ratio */
  /* margin-right is added via class mr-2 */
}

.logo-icon {
  /* Add transition for smoothness if needed, although animation might cover it */
  transition: transform 0.1s ease-in-out;
}

/* Apply animation only to the icon on hover */
.logo-icon:hover {
  animation: wiggle 0.3s ease-in-out 1; /* Faster duration, play once */
}

/* Simple wiggle animation */
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}

#top-bar-actions button {
  margin: 0 4px;
}
</style>
