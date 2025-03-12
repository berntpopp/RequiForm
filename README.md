# RequiForm

**RequiForm** is a client-side web application for generating and managing genetic test requisition forms. It aims to streamline the process of filling out patient information, selecting specific genetic tests or panels, and producing a final PDF (with an embedded QR code) that can be shared or printed. 

## Key Features

1. **Patient Data Entry**  
   - Collect core patient information such as name, birthdate, and insurance details.  
   - All data is handled locally (browser or Electron app) for security.

2. **Test Selection**  
   - Presents a list of genetic tests or gene panels defined in a local JSON schema.  
   - Enables easy selection of the appropriate analysis (e.g., BRCA, Whole Genome, etc.).

3. **PDF Generation**  
   - Uses a JavaScript-based library (jsPDF) to create a professional, printable PDF.  
   - Automatically includes form data and test details.

4. **QR Code Embedding**  
   - Generates a QR code containing selected patient identifiers and test references.  
   - QR codes can be included directly in the PDF for quick data retrieval.

5. **Client-Side & Offline**  
   - Designed to run entirely on the client (no backend), reducing security risks.  
   - Optionally packaged with Electron for a local desktop application.

## Project Goals

- **Security & Privacy**: Keep sensitive patient data strictly within the client environment.  
- **Ease of Use**: Provide a clean, intuitive form-based interface powered by Vue/Vuetify.  
- **Extensibility**: Allow easy updates to the list of genetic tests through a simple JSON file.  
- **Interoperability**: Accept URL parameters so other systems (e.g., EHRs) can link directly into RequiForm with pre-populated data.

## Getting Started

- **Clone or Download**: Obtain a copy of this repository.  
- **Static Hosting**: Serve the app as static files in a secure environment, or run it locally in a browser.  
- **Electron Option**: Package the app for desktop use with Electron if an offline, self-contained application is preferred.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
