import { reactive, readonly } from 'vue';
import defaultConfig from '@/config/defaultBrandingConfig.json';
import logService from '@/services/logService'; // Assuming logService exists
import { sanitizeParsedJson } from '@/utils/jsonSanitizer'; // Import sanitizer

// Initialize with a deep copy of the default config to avoid modifying the imported JSON directly
const activeConfig = reactive(JSON.parse(JSON.stringify(defaultConfig)));

/**
 * Asynchronously loads an external branding configuration file specified by
 * the VITE_BRANDING_CONFIG_PATH environment variable.
 * If the path is specified and the file is successfully fetched and parsed,
 * its values are merged over the default configuration.
 * Falls back to defaults if the path is not specified or loading/parsing fails.
 */
async function loadExternalConfig() {
  const externalConfigPath = import.meta.env.VITE_BRANDING_CONFIG_PATH;

  if (!externalConfigPath) {
    logService.info('[Branding] No external config path specified (VITE_BRANDING_CONFIG_PATH). Using defaults.');
    // Defaults are already loaded, nothing more to do.
    return;
  }

  // Construct the final URL. Assuming the path is relative to the application's root.
  const url = new URL(externalConfigPath, window.location.origin).href;
  logService.info(`[Branding] Attempting to load external config from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - Failed to fetch ${url}`);
    }
    let externalConfig = await response.json();
    logService.debug('[Branding] Raw external config loaded:', externalConfig);

    // Sanitize the loaded JSON to prevent prototype pollution
    sanitizeParsedJson(externalConfig);
    logService.debug('[Branding] Sanitized external config:', externalConfig);

    // Merge external config over defaults
    // Simple merge for top-level properties
    if (externalConfig.appTitle) {
      activeConfig.appTitle = externalConfig.appTitle;
    }
    // Shallow merge for the 'styles' object
    if (externalConfig.styles) {
      // Ensure activeConfig.styles exists (it should from defaults)
      if (!activeConfig.styles) activeConfig.styles = {}; 
      activeConfig.styles = { ...activeConfig.styles, ...externalConfig.styles };
    }
    // Merge themeColors object (shallow merge)
    if (externalConfig.themeColors) {
      if (!activeConfig.themeColors) activeConfig.themeColors = {};
      activeConfig.themeColors = { ...activeConfig.themeColors, ...externalConfig.themeColors };
    }
    // Merge darkThemeColors object (shallow merge)
    if (externalConfig.darkThemeColors) {
      if (!activeConfig.darkThemeColors) activeConfig.darkThemeColors = {};
      activeConfig.darkThemeColors = { ...activeConfig.darkThemeColors, ...externalConfig.darkThemeColors };
    }
    // Merge logoUrl
    if (externalConfig.logoUrl) {
      activeConfig.logoUrl = externalConfig.logoUrl;
    }
    // Add merging logic for other properties if they are added later

    logService.info(`[Branding] Successfully merged external config from ${url}.`);
    logService.debug("Merged branding config:", JSON.stringify(activeConfig));

  } catch (error) {
    logService.error(`[Branding] Failed to load or parse external config from ${url}. Falling back to defaults.`, error);
    // Reset to a deep copy of defaults on error to ensure a clean state
    Object.assign(activeConfig, JSON.parse(JSON.stringify(defaultConfig)));
  }
}

/**
 * Readonly reactive object containing the active branding configuration.
 * Components should import and use this.
 */
export const brandingConfig = readonly(activeConfig);

/**
 * Function to initialize the branding configuration.
 * Should be called early in the application lifecycle (e.g., in main.js).
 */
export const initializeBranding = loadExternalConfig;
