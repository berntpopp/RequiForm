# Development Guide

This guide provides instructions for setting up the RequiForm project locally for development and contribution.

## Getting Started

### Prerequisites

* Node.js (LTS version recommended)
* npm (usually included with Node.js) or yarn
* Git

### Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/BerntPopp/RequiForm.git # Replace with the correct repository URL if needed
   cd RequiForm
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Download Local Assets (Optional but Recommended for Offline Use):**
   RequiForm relies on some external libraries (jQuery, jQuery UI, d3.js, PedigreeJS) for specific features like the Pedigree Editor. While the application *can* load these from CDNs, downloading them ensures offline functionality and avoids reliance on external services.

   * **Create Vendor Directories:**

     ```bash
     mkdir -p public/vendor
     mkdir -p src/vendor
     ```

   * **Download jQuery & jQuery UI:**

     ```bash
     # Download jQuery
     wget -O public/vendor/jquery-3.7.1.min.js https://code.jquery.com/jquery-3.7.1.min.js

     # Download jQuery UI CSS
     wget -O public/vendor/jquery-ui.min.css https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css

     # Download jQuery UI JS
     wget -O public/vendor/jquery-ui.min.js https://code.jquery.com/ui/1.13.2/jquery-ui.min.js
     ```
     *(Note: Ensure `index.html` references these local paths instead of CDN links if you download them.)*

   * **Download d3.js:**

     ```bash
     wget -O public/vendor/d3.v7.min.js https://d3js.org/d3.v7.min.js
     ```
     *(Note: Ensure `index.html` or relevant component references this local path.)*

   * **Download PedigreeJS:**

     ```bash
     wget -O src/vendor/pedigreejs.es.v3.0.0-rc8.js https://raw.githubusercontent.com/CCGE-BOADICEA/pedigreejs/refs/heads/master/build/pedigreejs.es.v3.0.0-rc8.js
     ```
     *(Note: The `PedigreeEditor.vue` component should import this local module.)*

   *(Alternative: You can manually download these files from the provided URLs using your browser and place them in the correct `public/vendor` or `src/vendor` directories.)*

4. **Run Development Server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```
   This will start the Vite development server, typically available at `http://localhost:5173`. The server provides hot module replacement (HMR) for a fast development experience.

5. **Build for Production:**

   ```bash
   npm run build
   # or
   yarn build
   ```
   This command compiles and minifies the application into the `dist` directory, ready for deployment as static files.

## Code Style and Linting

* **ESLint:** The project uses ESLint with the Google JavaScript Style Guide configuration (`eslint-config-google`).
* **Prettier:** Prettier is used for automatic code formatting.
* **Run Linters/Formatters:**

   ```bash
   npm run lint # Check for linting errors
   npm run format # Format code with Prettier
   ```
   It's recommended to integrate these tools with your code editor for real-time feedback and automatic formatting on save.

## Contributing

Contributions are welcome!

1. **Fork the Repository:** Create your own fork of the project on GitHub.
2. **Create a Branch:** Create a new branch in your fork for your feature or bug fix (e.g., `git checkout -b feature/add-new-phenotype-source` or `git checkout -b fix/pdf-generation-error`).
3. **Make Changes:** Implement your changes, adhering to the project's coding style and conventions (see User Rules/Memory).
4. **Test:** Ensure your changes don't break existing functionality. Add tests if applicable (test framework setup might be needed).
5. **Lint & Format:** Run `npm run lint` and `npm run format` to ensure code quality.
6. **Commit:** Write clear and concise commit messages.
7. **Push:** Push your branch to your fork on GitHub.
8. **Open a Pull Request:** Submit a pull request from your branch to the `main` branch of the original RequiForm repository. Provide a clear description of your changes in the pull request.

We appreciate contributions that improve the interface, add useful features, fix bugs, enhance documentation, or improve the overall robustness of the application.
