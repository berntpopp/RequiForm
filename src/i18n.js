/**
 * i18n configuration file
 * Using Vue i18n v9 stable with Vue 3
 */
import { createI18n } from 'vue-i18n';

// Import JSON locale files
import enMessages from './locales/en.json';
import deMessages from './locales/de.json';

// Import security utility
import { sanitizeParsedJson } from './utils/jsonSanitizer';

/**
 * Detects and returns the initial locale based on user preferences
 * @returns {string} The detected locale code ('en' or 'de')
 */
function getInitialLocale() {
  try {
    // First check localStorage for saved preference
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang && ['en', 'de'].includes(savedLang)) {
      return savedLang;
    }
    
    // Fall back to browser language
    const browserLang = navigator.language.split('-')[0];
    return ['en', 'de'].includes(browserLang) ? browserLang : 'en';
  } catch {
    // If localStorage is not available
    return 'en';
  }
}

// Create deep copies of the messages and sanitize them for security
const messages = {
  en: JSON.parse(JSON.stringify(enMessages)),
  de: JSON.parse(JSON.stringify(deMessages))
};

// Apply security sanitization to prevent prototype pollution
sanitizeParsedJson(messages.en);
sanitizeParsedJson(messages.de);

// Create and export the i18n instance
const i18n = createI18n({
  // Use Vue 3 Composition API
  legacy: false,
  
  // Set locale and fallback
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  
  // Provide messages
  messages,
  
  // CRITICAL: Force the full build for production
  // This ensures the message compiler is included
  runtimeOnly: false,
  
  // Disable warnings in production
  silentTranslationWarn: import.meta.env.PROD,
  silentFallbackWarn: import.meta.env.PROD,
  
  // Additional settings that help resolve compiler issues
  warnHtmlMessage: false,
  escapeParameter: true,
  fullInstall: true
});

export default i18n;
