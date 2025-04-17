# Internationalization (i18n)

RequiForm implements a comprehensive internationalization (i18n) strategy to support multiple languages throughout the application, including user interface elements and generated PDFs.

## Overview

The internationalization system in RequiForm provides:

- Support for multiple languages (currently English and German)
- Consistent translation format across components
- Language switching that respects the user's browser/system preferences
- Dynamic content translation in generated PDFs
- Backward compatibility with existing configurations

## Implementation Details

### Core Components

The internationalization architecture consists of the following components:

1. **Vue i18n Integration**
   - RequiForm utilizes Vue's i18n plugin for UI text translation
   - Locale detection automatically identifies user preferences
   - Language switching preserves state across application sections

2. **PDF Internationalization**
   - PDF templates use a nested JSON structure for translations
   - Original text fields are preserved for backward compatibility
   - Localized content is stored in dedicated `contents` objects with language codes

### PDF Configuration Structure

The internationalized PDF configuration follows this pattern:

```json
{
  "element": {
    "type": "text",
    "content": "Original Text",
    "contents": {
      "en": "English Translation",
      "de": "German Translation"
    }
  }
}
```

Key points about this structure:

- The original `content` property is maintained for backward compatibility
- The new `contents` object contains language-specific translations
- Each language has a two-letter key following ISO 639-1 codes (e.g., "en", "de")
- The application dynamically selects the appropriate content based on the current locale

### Rendering Logic

PDF generation follows these steps to determine which content to use:

1. Check if language-specific content exists for the current locale
2. If found, use the translated content
3. If not found, fall back to the original content
4. Apply the same process to all text elements, titles, and signature areas

### File Structure

The internationalization components are structured as follows:

- **PDF Configuration**: `src/data/pdfConfig.json`
  - Contains all internationalized text content for PDF templates
  - Structured with nested translation objects

- **PDF Generator**: `src/components/PdfGenerator.vue`
  - Implements the rendering logic for internationalized content
  - Uses Vue's locale system to detect the current language

## Examples

### Basic Text Translation

```json
{
  "type": "text",
  "position": { "x": 40, "y": 120 },
  "content": "ANFORDERUNGSSCHEIN MOLEKULARGENETIK",
  "contents": {
    "en": "MOLECULAR GENETICS REQUISITION FORM",
    "de": "ANFORDERUNGSSCHEIN MOLEKULARGENETIK"
  }
}
```

### Section Title Translation

```json
{
  "consent": {
    "enabled": true,
    "title": "Einwilligung zur genetischen Analyse nach GenDG",
    "titleContents": {
      "de": "Einwilligung zur genetischen Analyse nach GenDG",
      "en": "Consent for Genetic Analysis according to GenDG"
    }
  }
}
```

### Complex Sections

For multi-part sections like the signature area:

```json
{
  "signatureArea": {
    "patientLabel": "Patient*in / gesetzl. Vertreter*in (Druckbuchstaben)",
    "physicianLabel": "Ärztin/Arzt (Druckbuchstaben)",
    "signHint": "Datum / Unterschrift"
  },
  "signatureAreaContents": {
    "de": {
      "patientLabel": "Patient*in / gesetzl. Vertreter*in (Druckbuchstaben)",
      "physicianLabel": "Ärztin/Arzt (Druckbuchstaben)",
      "signHint": "Datum / Unterschrift"
    },
    "en": {
      "patientLabel": "Patient / Legal Representative (BLOCK LETTERS)",
      "physicianLabel": "Physician (BLOCK LETTERS)",
      "signHint": "Date / Signature"
    }
  }
}
```

## Adding a New Language

To add support for a new language:

1. **Identify the language code**: Use the appropriate ISO 639-1 two-letter code (e.g., "fr" for French)

2. **Add translations to pdfConfig.json**: For each text element, add a new entry to the `contents` object:

   ```json
   "contents": {
     "en": "English Text",
     "de": "German Text",
     "fr": "French Text"
   }
   ```

3. **Add translations for complex sections**: For sections like consent paragraphs or signature areas, include a complete set of translations:

   ```json
   "paragraphsContents": {
     "en": ["Paragraph 1", "Paragraph 2"],
     "de": ["Absatz 1", "Absatz 2"],
     "fr": ["Paragraphe 1", "Paragraphe 2"]
   }
   ```

## Best Practices

When working with the internationalization system:

1. **Always include all languages**: When adding new text content, include translations for all supported languages

2. **Maintain backward compatibility**: Always keep the original content property alongside translated content

3. **Use consistent keys**: Follow the established pattern of "contents" for simple elements and "[element]Contents" for complex sections

4. **Test language switching**: Verify that the application correctly handles language changes and renders the appropriate content

5. **Consider text length**: Be aware that translations may have different lengths and adjust layouts accordingly

## Technical Considerations

- **Fallback mechanism**: If a translation is missing for the current locale, the system uses the original content
- **Performance**: The internationalization system is designed to have minimal impact on performance
- **Modularity**: The implementation allows for easy addition of new languages without code changes
