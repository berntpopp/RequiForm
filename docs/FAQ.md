# Frequently Asked Questions (FAQ)

## General

### What is RequiForm?

RequiForm is a web application designed to help clinicians and researchers easily generate standardized clinical data requisitions, particularly for genetic testing. It focuses on privacy, usability, and adherence to standards like HPO.

### Which browsers are supported?

RequiForm is tested on the latest versions of modern browsers like **Chrome**, **Firefox**, **Edge**, and **Safari**. While it may work on others, using an up-to-date version of these recommended browsers ensures the best experience.

## Data Handling & Security

### How is my data handled? Is it secure?

**All data processing happens entirely in your browser.** Your data **never leaves your device**, and no information is stored on any servers. This client-side approach ensures maximum privacy and security for sensitive information. When using sharing features, data is either encoded directly in the URL or saved locally as a file.

### What encryption is used for sharing?

The "Share Encrypted Link" option uses **AES-GCM encryption** with a key derived from your chosen password using **PBKDF2**. This is a strong, standard-based encryption method. *Remember: the security relies on the strength of your password and keeping it confidential.* The specific implementation details can be reviewed in the source code.

### What data format is used for file import/export?

RequiForm uses a specific **JSON format** for saving and loading data via files. You can inspect the format by saving your current form data. When importing, the application expects data in this structure. For pasting data, you can use the same JSON structure or provide URL-encoded data (like from a shared link).

### Can I share the collected data securely?

Yes! You can share the collected data securely using the "Copy Encrypted Link" feature. This creates a special link containing the data, encrypted with a password you provide. The data is encrypted directly in your browser using the strong AES-GCM standard from the Web Crypto API. When someone opens the link, they must enter the correct password to decrypt the data in **their** browser. The password is never stored or sent over the internet, ensuring confidentiality and integrity. Only someone with the exact link **and** the correct password can access the data.

## Features

### How does the phenotype selection work?

The phenotype selector allows you to search for and select **HPO (Human Phenotype Ontology)** terms using their name or ID.

You can mark each selected term as:

- **Present:** The patient exhibits this phenotype.
- **Absent:** The patient specifically *does not* exhibit this phenotype.
- *(No input):* It is unknown or not specified.

Selected phenotypes appear in the generated PDF, including their HPO ID and status.

### Can I include a pedigree chart?

Yes! Check the **"Include Pedigree Chart"** option. This opens a drawing interface (PedigreeEditor) where you can create a standard family pedigree. The generated pedigree image will be included in the final PDF.

### What is the Log Viewer?

The Log Viewer (accessible via the settings menu) provides a detailed **technical log** of application events, such as data loading, encryption/decryption processes, and potential errors. It's primarily useful for **debugging** or understanding the application's internal workings.

## Sharing & Saving

### What are the different ways to save or share my form data?

You have several options:

- **Save File:** Downloads a `.json` file containing all form data to your device. Use the "Load" button to import this file later.
- **Share Link:** Creates a long URL containing all form data (URL-encoded). Anyone with the link can view the data. Use for non-sensitive information or trusted channels.
- **Share Encrypted Link:** Creates a URL that loads encrypted data. A password (chosen by you) is required to decrypt and view the form data. This is the recommended method for sharing sensitive information.
- **Generate PDF:** Creates a human-readable PDF document of the requisition form, including patient data, phenotypes, and optionally the pedigree.

## Troubleshooting

### The PDF generation is slow or failing. What can I do?

PDF generation happens in your browser and can be resource-intensive, especially with large pedigrees or many phenotypes. Try these steps:

- Ensure your browser is **up-to-date**.
- **Close unnecessary tabs** or applications to free up memory.
- Try generating the PDF **without the pedigree** first to isolate the issue.
- If the problem persists, check the **Log Viewer** for specific error messages that might provide clues.

### What happens when I click "Reset Form"?

This action **clears all entered data** (patient info, phenotypes, pedigree) and resets the form to its initial empty state. You will be prompted to **confirm** before the reset occurs, as this action cannot be undone.
