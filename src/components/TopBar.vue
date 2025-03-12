<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title>RequiForm</v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn color="secondary" @click="$emit('generate-pdf')">
      Generate PDF
    </v-btn>
  </v-app-bar>
</template>

<script setup>
// No extra logic needed here.
</script>
