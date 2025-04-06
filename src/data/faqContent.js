/**
 * @fileoverview FAQ content for the RequiForm application.
 * 
 * This module exports the FAQ content that was previously embedded in App.vue.
 */

/**
 * Array of FAQ items, each with a question and answer
 */
export const faqContent = [
  {
    question: 'What is RequiForm\'s approach to data handling?',
    answer:
      'All data processing happens entirely in your browser. Your data never leaves your device, and no information is stored on our servers. This ensures maximum privacy and security for your sensitive medical information.',
  },
  {
    question: 'How can I save or share my form data?',
    answer:
      'You can save your data using the "Save" button to download a JSON file to your device. You can also share your form state by using the "Share Link" option, which creates a URL that contains all entered information. For sensitive data, use the "Share Encrypted Link" option, which requires a password to access the data.',
  },
  {
    question: 'How does the phenotype selection work?',
    answer:
      'The phenotype selector allows you to search for and select HPO (Human Phenotype Ontology) terms. Each term can be marked as "present" or "absent" in the patient. Selected phenotypes appear in the generated PDF, including their HPO ID and presence status.',
  },
  {
    question: 'Can I include a pedigree chart?',
    answer:
      'Yes! Check the "Include Pedigree Chart" option. This opens a drawing interface where you can create a family pedigree. The pedigree will be included in the generated PDF.',
  },
  {
    question: 'What happens when I click "Reset Form"?',
    answer:
      'This will clear all entered data and return the form to its initial state. You will be prompted to confirm before the reset occurs.',
  },
];
