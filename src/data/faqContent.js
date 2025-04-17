/**
 * @fileoverview FAQ content for the RequiForm application.
 * 
 * This module exports the FAQ content, organized by category.
 */

/**
 * Array of FAQ items, each with a category, question, and answer.
 * Answers can use basic markdown (bolding, lists).
 */
export const faqContent = [
  // --- General ---
  {
    category: 'General',
    question: 'What is RequiForm?',
    answer:
      'RequiForm is a web application designed to help clinicians and researchers easily generate standardized clinical data requisitions, particularly for genetic testing. It focuses on privacy, usability, and adherence to standards like HPO.',
  },
  {
    category: 'General',
    question: 'Which browsers are supported?',
    answer:
      'RequiForm is tested on the latest versions of modern browsers like <strong>Chrome</strong>, <strong>Firefox</strong>, <strong>Edge</strong>, and <strong>Safari</strong>. While it may work on others, using an up-to-date version of these recommended browsers ensures the best experience.',
  },

  // --- Data Handling & Security ---
  {
    category: 'Data Handling & Security',
    question: 'How is my data handled? Is it secure?',
    answer:
      '<strong>All data processing happens entirely in your browser.</strong> Your data <strong>never leaves your device</strong>, and no information is stored on any servers. This client-side approach ensures maximum privacy and security for sensitive information. When using sharing features, data is either encoded directly in the URL or saved locally as a file.',
  },
  {
    category: 'Data Handling & Security',
    question: 'What encryption is used for sharing?',
    answer:
      'The "Share Encrypted Link" option uses <strong>AES-GCM encryption</strong> with a key derived from your chosen password using <strong>PBKDF2</strong>. This is a strong, standard-based encryption method. <em>Remember: the security relies on the strength of your password and keeping it confidential.</em> The specific implementation details can be reviewed in the source code.',
  },
  {
    category: 'Data Handling & Security',
    question: 'What data format is used for file import/export?',
    answer:
      'RequiForm uses a specific <strong>JSON format</strong> for saving and loading data via files. You can inspect the format by saving your current form data. When importing, the application expects data in this structure. For pasting data, you can use the same JSON structure or provide URL-encoded data (like from a shared link).',
  },

  // --- Features ---
  {
    category: 'Features',
    question: 'How does the phenotype selection work?',
    answer:
      'The phenotype selector allows you to search for and select <strong>HPO (Human Phenotype Ontology)</strong> terms using their name or ID. <br> You can mark each selected term as: <ul><li><strong>Present:</strong> The patient exhibits this phenotype.</li><li><strong>Absent:</strong> The patient specifically does not exhibit this phenotype.</li><li><em>(No input):</em> It is unknown or not specified.</li></ul>Selected phenotypes appear in the generated PDF, including their HPO ID and status.',
  },
  {
    category: 'Features',
    question: 'Can I include a pedigree chart?',
    answer:
      'Yes! Check the <strong>"Include Pedigree Chart"</strong> option. This opens a drawing interface (PedigreeEditor) where you can create a standard family pedigree. The generated pedigree image will be included in the final PDF.',
  },
  {
    category: 'Features',
    question: 'What is the Log Viewer?',
    answer:
      'The Log Viewer (accessible via the settings menu) provides a detailed <strong>technical log</strong> of application events, such as data loading, encryption/decryption processes, and potential errors. It\'s primarily useful for <strong>debugging</strong> or understanding the application\'s internal workings.',
  },

  // --- Sharing & Saving ---
  {
    category: 'Sharing & Saving',
    question: 'What are the different ways to save or share my form data?',
    answer:
      'You have several options:<ul><li><strong>Save File:</strong> Downloads a <code>.json</code> file containing all form data to your device. Use the "Load" button to import this file later.</li><li><strong>Share Link:</strong> Creates a long URL containing all form data (URL-encoded). Anyone with the link can view the data. Use for non-sensitive information or trusted channels.</li><li><strong>Share Encrypted Link:</strong> Creates a URL that loads encrypted data. A password (chosen by you) is required to decrypt and view the form data. This is the recommended method for sharing sensitive information.</li><li><strong>Generate PDF:</strong> Creates a human-readable PDF document of the requisition form, including patient data, phenotypes, and optionally the pedigree.</li></ul>',
  },

  // --- Troubleshooting ---
  {
    category: 'Troubleshooting',
    question: 'The PDF generation is slow or failing. What can I do?',
    answer:
      'PDF generation happens in your browser and can be resource-intensive, especially with large pedigrees or many phenotypes. Try these steps:<ul><li>Ensure your browser is <strong>up-to-date</strong>.</li><li><strong>Close unnecessary tabs</strong> or applications to free up memory.</li><li>Try generating the PDF <strong>without the pedigree</strong> first to isolate the issue.</li><li>If the problem persists, check the <strong>Log Viewer</strong> for specific error messages that might provide clues.</li></ul>',
  },
  {
    category: 'Troubleshooting',
    question: 'What happens when I click "Reset Form"?',
    answer:
      'This action <strong>clears all entered data</strong> (patient info, phenotypes, pedigree) and resets the form to its initial empty state. You will be prompted to <strong>confirm</strong> before the reset occurs, as this action cannot be undone.',
  },
];
