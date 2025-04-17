# Technical Details

This document outlines the technical architecture, data formats, and key implementation details of RequiForm.

## Architecture

RequiForm is a single-page application (SPA) built with the following core technologies:

*   **Framework:** [Vue.js](https://vuejs.org/) (v3) using the Composition API.
*   **UI Library:** [Vuetify](https://vuetifyjs.com/) for Material Design components and styling.
*   **Build Tool:** [Vite](https://vitejs.dev/) for fast development and optimized production builds.
*   **Language:** JavaScript (ES6+)
*   **Execution Environment:** Client-side only (Web Browser). There is no backend server component.

## Project Structure

The codebase is organized into the following main directories within `src/`:

*   `components/`: Reusable Vue UI components (e.g., `PatientForm.vue`, `PhenotypeSelector.vue`, `QrCodeDisplay.vue`). Adheres to PascalCase naming convention.
*   `composables/`: Vue Composition API functions for reusable stateful logic (e.g., `useUrlParameters.js`, `useFormData.js`).
*   `services/`: Modules responsible for specific tasks or interfacing with external concerns (e.g., `logService.js`, `pdfService.js`).
*   `utils/`: General-purpose utility functions (e.g., `cryptoUtilsWebCrypto.js`, `jsonSanitizer.js`, `hpoUtils.js`). Named exports are preferred here.
*   `data/`: Static data definitions or schemas (e.g., `testCategories.json`, `faqContent.js`).
*   `assets/`: Static assets like images or fonts.
*   `router/`: Vue Router configuration (if routing is used beyond simple component visibility).
*   `vendor/`: Locally downloaded third-party libraries not managed via npm (e.g., PedigreeJS).

*(Refer to the [Development Guide](Development) for setup instructions)*

## State Management

*   **Local State:** Primarily managed within components using Vue 3's Composition API (`ref`, `reactive`).
*   **Shared State:** Complex shared state is managed through composables or potentially a dedicated state management library like Pinia could be adopted if application complexity grows significantly. Currently, shared logic is often encapsulated in composables.

## Data Formats

*   **Internal Form Data:** Reactive JavaScript objects managed by Vue's Composition API.
*   **File Import/Export:** A specific JSON structure representing the complete form state. Users can inspect this format by using the "Save File" feature. The `jsonSanitizer.js` utility is used when loading data to prevent prototype pollution.
*   **URL Parameters:** Key-value pairs in the URL hash fragment (`#`) used for pre-populating the form. See [Using URL Parameters](URL-Parameters) for details.
*   **QR Code Data:**
    *   **Patient Data QR:** Contains essential patient identifiers.
    *   **Phenotype Data QR:** Uses an ultra-compact format for HPO terms:
        *   Numeric HPO ID only (e.g., `77` instead of `HP:0000077`).
        *   `+` prefix for **present** phenotypes (e.g., `+77`).
        *   `-` prefix for **absent** phenotypes (e.g., `-555`).
        *   Terms marked as "unknown" or not selected are excluded entirely.
        *   Terms are joined by a separator (e.g., comma or semicolon).
    *   **Pedigree Data QR:** Contains the data necessary to reconstruct the pedigree (format defined by PedigreeJS or the saving mechanism).
*   **PDF Content:** The generated PDF displays data in a human-readable format, including full HPO IDs and names (e.g., "Abnormality of the Kidney (HP:0000077): present").

## Key Libraries & Features

*   **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF) library, likely orchestrated by a custom `pdfService.js`.
*   **QR Code Generation:** A JavaScript QR code generation library (e.g., `qrcode.vue` component wrapping a library like `qrcode-generator`).
*   **Pedigree Chart:** [PedigreeJS](https://github.com/CCGE-BOADICEA/pedigreejs) integrated via the `PedigreeEditor.vue` component, using local assets from `src/vendor/`.
*   **Encryption:** Native browser **Web Crypto API** for AES-GCM encryption/decryption, managed by `src/utils/cryptoUtilsWebCrypto.js`. See [Security Information](Security).
*   **Phenotype Selection:** Custom component allowing search and selection of HPO terms, likely interacting with HPO data utilities (`hpoUtils.js`).
*   **Logging:** A dedicated `logService.js` provides application-wide logging capabilities, displayed in the in-app Log Viewer component.
*   **Styling:** Primarily handled by Vuetify components, with scoped CSS within `.vue` files for component-specific styles.

This overview provides insight into the technical foundation of RequiForm. For more specific details, consult the source code and individual module documentation (JSDoc comments).
