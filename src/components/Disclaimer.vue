<template>
  <v-dialog v-model="dialog" persistent max-width="600">
    <v-card>
      <v-card-title class="headline">
        Disclaimer
      </v-card-title>
      <v-card-text>
        <p>
          This tool is for non-medical use only. It is not intended to provide medical advice or diagnosis.
          Please do not enter sensitive personal data.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="acknowledge">I Acknowledge</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
/**
 * Disclaimer component.
 *
 * Displays a disclaimer message for non-medical use and warns users
 * not to enter sensitive personal data. Once acknowledged, it emits a
 * 'dismiss' event.
 */
export default {
  name: 'Disclaimer',
  data() {
    return {
      dialog: true,
    };
  },
  methods: {
    acknowledge() {
      this.dialog = false;
      this.$emit('dismiss');
    },
  },
};
</script>

<style scoped>
/* Add any disclaimer-specific styles if necessary */
</style>
