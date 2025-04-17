# RequiForm

**RequiForm** is a client-side web application for generating and managing genetic test requisition forms. It aims to streamline the process of filling out patient information, selecting specific genetic tests or panels, and producing a final PDF (with an embedded QR code) that can be shared or printed.

## Project Documentation (Wiki)

**For detailed user guides, technical information, security details, and development instructions, please visit the [Project Wiki](https://github.com/BerntPopp/RequiForm/wiki).**

The Wiki is automatically updated from the `/docs` directory in this repository via GitHub Actions.

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

6. **In-App Logging**
   - Provides a built-in log viewer accessible via a button (log icon) in the footer.
   - Displays timestamped application events, warnings, and errors, color-coded by severity (Debug, Info, Warn, Error).
   - Allows users to filter logs by severity level using a dropdown menu in the log viewer header.
   - Includes a button to download the current log entries as a JSON file for troubleshooting or record-keeping.
   - Helps diagnose issues without requiring browser developer tools.

7. **Secure Link Sharing**
   - Create password-protected links to share the collected data.
   - The data is encrypted client-side in your browser using strong AES-GCM encryption (Web Crypto API) before generating the link.
   - Decryption also happens client-side in the recipient's browser only when the correct password is entered.

## Configuration

### UI Branding

RequiForm allows customization of certain UI elements like colors and the application title to match specific deployment needs (e.g., a self-hosted instance for a specific institution). This includes:

- Top bar color (`styles.topBarColor`)
- Footer background color (`styles.footerBackgroundColor`)
- Phenotype selection panel background color (`styles.phenotypeSelectorBackgroundColor`)
- Main theme colors like Primary and Secondary (`themeColors.primary`, `themeColors.secondary`), which affect buttons, highlights, etc.
- Application Title (`appTitle`)
- Header Logo URL (`logoUrl`) - A URL pointing to an image file to display next to the title.

- **Default Configuration:** The default branding settings are defined in `src/config/defaultBrandingConfig.json`. This file serves as the base configuration and fallback.
- **External Override:** You can override the default branding by placing a custom JSON file (e.g., `branding.json`) in your web server's deployment directory (e.g., in the `public` folder before building, or placed alongside the built `index.html` afterwards).
- **Environment Variable:** To tell RequiForm where to find this external file, set the `VITE_BRANDING_CONFIG_PATH` environment variable during the build process. The path should be relative to the root of the deployed application (e.g., `/config/my-lab-branding.json`).

```bash
# Example for build command
VITE_BRANDING_CONFIG_PATH=/config/my-lab-branding.json npm run build
```

- **File Structure:** Your external JSON file should mirror the structure of `defaultBrandingConfig.json`. You only need to include the keys you wish to override. For example:

```json
// Example: /config/my-lab-branding.json
{
  "styles": {
    "topBarColor": "#0055A4",                   // Custom top bar color
    "phenotypeSelectorBackgroundColor": "#EFEFEF" // Custom phenotype panel background
  },
  "appTitle": "My Lab RequiForm",             // Custom title
  "themeColors": {
    "primary": "#D40000",                    // Custom primary button/element color
    "secondary": "#666666"                   // Custom secondary element color
  },
  "logoUrl": "/path/to/your/logo.png"     // Custom logo image URL (relative to deployment root)
}
```

- **Fallback:** If `VITE_BRANDING_CONFIG_PATH` is not set, or if the specified file cannot be fetched or parsed, RequiForm will gracefully fall back to using the default values from `src/config/defaultBrandingConfig.json`.

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

## Deployment & Configuration

### Customizing Metadata (SEO & Social Sharing)

RequiForm uses Vite's environment variable system to allow customization of HTML metadata (like titles, descriptions, canonical URLs, and social media previews) for different deployments (e.g., self-hosted instances). This is useful for branding or setting context specific to your organization.

The following variables can be set in a `.env` file (e.g., `.env.local` for local overrides, or a specific `.env.[mode]` file) at the project root **before building the application** (`npm run build`):

- `VITE_APP_BASE_TITLE`: The main application title (Default: `RequiForm`).
- `VITE_APP_TITLE_SUFFIX`: A suffix added to the base title (e.g., `| My Institution`). Useful for branding. (Default: empty).
- `VITE_APP_DESCRIPTION`: The meta description used for SEO and social sharing. (Default: Focuses on general form generation).
- `VITE_CANONICAL_URL`: The canonical URL for the deployment. Crucial for SEO if hosting on a different domain. (Default: GitHub Pages URL).
- `VITE_ORGANIZATION_NAME`: Name of the organization deploying the instance. Used in structured data and potentially `og:site_name`. (Default: empty).
- `VITE_ORGANIZATION_URL`: URL of the deploying organization. Used in structured data. (Default: empty).
- `VITE_SOCIAL_IMAGE_URL`: Absolute URL to the image used for Open Graph and Twitter cards (recommended size: 1200x630px). (Default: Points to the default image in the `/public` folder of the GitHub Pages deployment).

**Example `.env.local` for customization:**

```env
# .env.local - Example overrides for a self-hosted instance
VITE_APP_BASE_TITLE=Clinical Forms
VITE_APP_TITLE_SUFFIX=| University Hospital
VITE_APP_DESCRIPTION=Secure form tool provided by University Hospital.
VITE_CANONICAL_URL=https://forms.university-hospital.org/
VITE_ORGANIZATION_NAME=University Hospital Genetics Clinic
VITE_ORGANIZATION_URL=https://university-hospital.org/genetics
VITE_SOCIAL_IMAGE_URL=https://forms.university-hospital.org/assets/social-preview.png
```

**Important:** After creating or modifying your `.env` file, you must rebuild the application (`npm run build`) for the changes to take effect in the generated `index.html`. Ensure your custom `VITE_SOCIAL_IMAGE_URL` points to an accessible image if you override it.

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
