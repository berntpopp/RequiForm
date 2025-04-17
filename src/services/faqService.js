import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import faqData from '@/data/faqContent.json';

/**
 * Composable function providing reactive FAQ content based on the current application locale.
 *
 * @returns {Readonly<Ref<Array<{category: string, question: string, answer: string}>>>}
 */
export function useFaqService() {
  // Get the i18n instance to access the current locale
  const { locale } = useI18n();

  /**
   * A computed property that returns the FAQ content array 
   * for the currently selected language (e.g., 'en' or 'de').
   * Falls back to English ('en') if the current locale is not found in the JSON.
   */
  const localizedFaqContent = computed(() => {
    // Fallback to 'en' if the current locale doesn't exist in the data
    const currentLocaleData = faqData[locale.value] || faqData['en'] || [];
    // Ensure we return a clean array if somehow both are missing
    return Array.isArray(currentLocaleData) ? currentLocaleData : [];
  });

  return {
    localizedFaqContent
  };
}
