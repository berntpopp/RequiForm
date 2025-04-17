import { createI18n } from 'vue-i18n';
import enMessages from './locales/en.json';
import deMessages from './locales/de.json';

// Function to detect initial locale (e.g., from localStorage or browser)
function getInitialLocale() {
  const savedLang = localStorage.getItem('userLanguage');
  if (savedLang && ['en', 'de'].includes(savedLang)) {
    return savedLang;
  }
  // Basic browser language detection (can be more sophisticated)
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'de'].includes(browserLang) ? browserLang : 'en'; // Default to 'en'
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getInitialLocale(), // Set initial locale dynamically
  fallbackLocale: 'en', // Fallback locale if key missing
  messages: {
    en: enMessages,
    de: deMessages,
  },
  // Optional: Suppress warnings for missing translations during development
  // missingWarn: false,
  // fallbackWarn: false,
});

export default i18n;
