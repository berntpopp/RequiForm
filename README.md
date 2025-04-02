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

## Downloading Local Assets

To ensure that RequiForm functions offline without relying on external CDN dependencies, download the following JavaScript and CSS assets and place them in the appropriate directories.

### 1. jQuery and jQuery UI

Create a directory for vendor assets if it doesn’t already exist:

```bash
mkdir -p public/vendor
```

Download jQuery:

```bash
wget -O public/vendor/jquery-3.7.1.min.js https://code.jquery.com/jquery-3.7.1.min.js
```

Download jQuery UI CSS:

```bash
wget -O public/vendor/jquery-ui.min.css https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css
```

Download jQuery UI JavaScript:

```bash
wget -O public/vendor/jquery-ui.min.js https://code.jquery.com/ui/1.13.2/jquery-ui.min.js
```

### 2. d3.js Library

Download d3 v7:

```bash
wget -O public/vendor/d3.v7.min.js https://d3js.org/d3.v7.min.js
```

### 3. PedigreeJS

RequiForm uses [pedigreejs](https://github.com/CCGE-BOADICEA/pedigreejs) for rendering pedigree charts.

Create a directory for PedigreeJS assets:

```bash
mkdir -p src/vendor
```

Download the ES module build of PedigreeJS:

```bash
wget -O src/vendor/pedigreejs.es.v3.0.0-rc8.js https://raw.githubusercontent.com/CCGE-BOADICEA/pedigreejs/refs/heads/master/build/pedigreejs.es.v3.0.0-rc8.js
```

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions in the form of pull requests or feature suggestions are welcome. Whether it’s improving the interface, adding tests, or enhancing PDF/QR functionality, all help is greatly appreciated!

---

**Disclaimer**: This application is not intended to replace professional medical systems but rather to streamline the data collection and documentation process for genetic test requests. Users are responsible for adhering to relevant healthcare and privacy regulations in their region.
