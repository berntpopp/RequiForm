# RequiForm

**RequiForm** is a client-side web application for generating and managing genetic test requisition forms. It aims to streamline the process of filling out patient information, selecting specific genetic tests or panels, and producing a final PDF (with an embedded QR code) that can be shared or printed.

## Key Features

1. **Patient Data Entry**  
   - Collect core patient information such as name, birthdate, and insurance details.  
   - Required fields limited to patient identifiers (first/last name) and diagnosis/suspicion.  
   - Other fields including test panels and category are optional for flexibility.  
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
- **Interoperability**: Accept URL parameters so other systems (e.g., EHRs) can link directly into RequiForm with pre-populated data. See [URL Parameters](#url-parameters) section for details.

## FAQ: Approach and Security Measures

RequiForm includes a detailed FAQ that explains:

- **Data Handling**:  
  RequiForm operates entirely in your browser without a backend. This means all patient data remains local, significantly reducing security risks.

- **Encryption & URL Security**:  
  The application uses client-side encryption and hash-based URL parsing to secure URL parameters. This ensures sensitive information is not stored in your browser history or transmitted over the network.

- **Non-Medical Disclaimer**:  
  RequiForm is intended solely as a tool for streamlining the genetic test requisition process. It is not a substitute for professional medical advice or diagnosis. Users must consult a healthcare professional for medical decisions.

- **Additional Security**:  
  All functionalities are designed using modern JavaScript libraries and best practices to further protect your data from unauthorized access.

You can access this FAQ directly within the application via the top menu bar.

## Getting Started

- **Clone or Download**: Obtain a copy of this repository.  
- **Static Hosting**: Serve the app as static files in a secure environment, or run it locally in a browser.  
- **Electron Option**: Package the app for desktop use with Electron if an offline, self-contained application is preferred.

## URL Parameters

RequiForm supports URL parameters to pre-populate form fields, allowing integration with other systems such as Electronic Health Records (EHRs). Parameters can be passed via hash fragment (preferred) or query string.

### Basic Usage

Parameters are passed after a hash (`#`) in the URL. For example:

```url
http://localhost:5173/#givenName=John&familyName=Doe&diagnosis=Suspected%20Renal%20Disease
```

### Supported Parameters

#### Patient Information

- `givenName` or `firstName`: Patient's given/first name
- `familyName` or `lastName`: Patient's family/last name
- `birthdate`: Patient's birthdate in YYYY-MM-DD format
- `sex`: Patient's sex ("male", "female", or "other")
- `insurance`: Insurance provider name
- `insuranceId`: Insurance ID number
- `physicianName` or `referrer`: Referring physician's name

#### Clinical Information

- `diagnosis`: Patient's diagnosis or clinical suspicion (required field)
- `category`: Test category (e.g., "nephrology", "cancer", "neurology")
- `panels`: Comma-separated list of panel IDs to select (e.g., "nephronophthise,alport_thin_basement")

#### Legacy Parameters

- `selectedTests`: Alias for `panels` (maintained for backward compatibility)

### Example URL

```url
http://localhost:5173/#givenName=Jane&familyName=Doe&birthdate=1990-02-01&insurance=ABC&physicianName=Bernt+Popp&sex=female&category=nephrology&diagnosis=Suspected+Chronic+Kidney+Disease&panels=nephronophthise,alport_thin_basement
```

This URL will pre-populate the form with Jane Doe's information and select the specified panels in the nephrology category.

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
