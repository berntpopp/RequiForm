<template>
  <v-dialog v-model="dialog" persistent max-width="600">
    <v-card>
      <v-card-title class="headline">
        {{ $t('disclaimer.title') }}
      </v-card-title>
      <v-card-text>
        <p>
          {{ $t('disclaimer.body') }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="acknowledge">{{ $t('disclaimer.acknowledgeButton') }}</v-btn>
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
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n'; // Import useI18n

export default defineComponent({
  name: 'AppDisclaimer',
  // Inject t function using setup for Options API
  setup() {
    const { t } = useI18n();
    return { t }; // Return t or use this.$t directly in template
  },
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
});
</script>

<style scoped>
/* Add any disclaimer-specific styles if necessary */
</style>
