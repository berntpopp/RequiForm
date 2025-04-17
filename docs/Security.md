# Security Considerations

Security and privacy are paramount in RequiForm, especially given the potential sensitivity of clinical data. This document outlines the key security measures implemented.

## Core Principle: Client-Side Execution

**RequiForm is designed to run entirely within the user's web browser.**

- **No Backend Server:** There is no server-side component that processes or stores user data. All calculations, data manipulation, PDF generation, and encryption/decryption happen locally on the user's machine.
- **Data Stays Local:** Unless explicitly shared by the user (via generated links, files, or PDFs), the data entered into the form **never leaves the user's device**.

This client-side architecture fundamentally limits exposure to common web vulnerabilities related to server breaches or data transmission interception.

## Secure Data Sharing: Encrypted Links

When sharing form data is necessary, RequiForm provides a secure "Share Encrypted Link" feature.

- **Strong Encryption:** Uses the **AES-GCM** (Advanced Encryption Standard - Galois/Counter Mode) algorithm, a widely recognized standard for authenticated encryption, implemented via the browser's native **Web Crypto API**.
- **Key Derivation:** The encryption key is derived from a user-provided password using **PBKDF2** (Password-Based Key Derivation Function 2) with **100,000 iterations** and **SHA-256** as the hash function. This makes brute-forcing the password significantly harder.
- **Salt and IV:**
  - A unique, cryptographically random **16-byte (128-bit) salt** is generated for each encryption operation. This salt is used during key derivation, ensuring that the same password results in different encryption keys for different data sets.
  - A unique, cryptographically random **12-byte (96-bit) Initialization Vector (IV)** is generated for each encryption operation, as required by AES-GCM.
- **Packaging:** The generated salt, IV, and the encrypted ciphertext are concatenated and then encoded into a **URL-safe Base64** string. This string forms part of the shareable link.
- **Decryption:** Decryption also occurs entirely client-side in the recipient's browser. The recipient must provide the correct password. The application extracts the salt from the received data, re-derives the key using PBKDF2, and then uses the key and the extracted IV to decrypt the ciphertext via the Web Crypto API.
- **Password Security:** The security of this method relies heavily on the **strength of the chosen password** and the **confidentiality** with which it is shared. The password itself is never stored or transmitted. An incorrect password will fail the decryption process (due to the authenticated nature of AES-GCM).

*(Implementation Reference: `src/utils/cryptoUtilsWebCrypto.js`)*

## URL Parameter Security

While RequiForm supports pre-populating fields via URL parameters for integration purposes:

- **Hash Fragments Preferred:** The application primarily uses the URL hash fragment (`#`) for parameters. Hash fragments are generally not sent to web servers in HTTP requests, offering a slight privacy advantage over query strings (`?`).
- **Potential Exposure:** Be aware that URLs (including fragments) can still be stored in browser history, logs, or potentially exposed if shared insecurely.
- **Recommendation:** For sharing complete and potentially sensitive form data, **always use the "Share Encrypted Link" feature** instead of relying solely on URL parameters.

## Prototype Pollution Prevention

To mitigate the risk of prototype pollution vulnerabilities when parsing JSON data (e.g., from loaded files or potentially malformed URL parameters):

- **Sanitization Utility:** A utility function (`sanitizeParsedJson`) recursively inspects parsed JSON objects and arrays.
- **Harmful Key Removal:** It actively removes potentially harmful keys like `__proto__`, `constructor`, and `prototype` from the parsed data structure *before* it is used by the application state.

*(Implementation Reference: `src/utils/jsonSanitizer.js`)*

## Input Validation

Standard input validation techniques are applied to form fields to prevent unexpected data types or formats from causing errors, though the primary security focus remains on the client-side architecture and secure sharing mechanisms.

## Disclaimer

RequiForm is intended solely as a tool for streamlining the genetic test requisition process. It is not a substitute for professional medical advice, diagnosis, or certified medical device software. Users must consult qualified healthcare professionals for medical decisions and ensure compliance with all relevant privacy regulations (e.g., HIPAA, GDPR) in their jurisdiction when handling patient data.
