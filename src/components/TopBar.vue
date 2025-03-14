<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title>RequiForm</v-toolbar-title>
    <v-spacer></v-spacer>
    <!-- Button to copy the plain URL with parameters -->
    <v-btn color="secondary" @click="$emit('copy-url')">
      Copy URL
    </v-btn>
    <!-- Button to copy the encrypted URL -->
    <v-btn color="secondary" @click="$emit('copy-encrypted-url')">
      Copy Encrypted URL
    </v-btn>
    <!-- Button to generate PDF -->
    <v-btn color="secondary" @click="$emit('generate-pdf')">
      Generate PDF
    </v-btn>
  </v-app-bar>
</template>

<script setup>
// This component is purely presentational.
// It emits 'copy-url', 'copy-encrypted-url', and 'generate-pdf' events.
</script>
