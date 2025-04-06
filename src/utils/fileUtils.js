/**
 * @fileoverview Utility functions for client-side file operations in the RequiForm application.
 * 
 * This module provides functionality for importing and exporting patient data as JSON files,
 * enabling users to save their work locally and reload it later. All operations are performed
 * entirely within the browser using the File API, maintaining client-side data processing.
 * 
 * These utilities support the data persistence features of the application, working in
 * conjunction with the useDataPersistence composable to provide a comprehensive solution
 * for managing patient data files.
 * 
 * @module utils/fileUtils
 */

/**
 * Downloads data as a JSON file to the user's device.
 * 
 * This function serializes the provided data object to JSON, creates a Blob with the
 * appropriate MIME type, and triggers a download in the browser. The file is formatted
 * with indentation for readability.
 * 
 * The function handles the entire download process including:
 * 1. Converting the data to a properly formatted JSON string
 * 2. Creating a temporary download link
 * 3. Triggering the download programmatically
 * 4. Cleaning up resources after download is initiated
 * 
 * @param {Object} data - The data object to be saved as JSON
 * @param {string} [fileName='requiform-data'] - The name of the file (without extension)
 * @return {boolean} True if the download was initiated successfully, false otherwise
 */
export function downloadJsonFile(data, fileName = 'requiform-data') {
  try {
    // Create Blob and trigger download
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = `${fileName}.json`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Cleanup
    URL.revokeObjectURL(downloadLink.href);
    
    return true;
  } catch (error) {
    console.error('Error saving to file:', error);
    return false;
  }
}

/**
 * Reads a file and returns its contents as parsed JSON.
 * 
 * This function takes a File object (typically from a file input element) and reads
 * its contents asynchronously. It returns a Promise that resolves with the parsed JSON
 * data or rejects with an appropriate error message if the file is invalid or cannot
 * be parsed as JSON.
 * 
 * The function handles several potential error cases:
 * - No file provided
 * - Read errors from the FileReader API
 * - Invalid JSON format in the file
 * 
 * @param {File} file - The File object to read (from file input or drag-and-drop)
 * @return {Promise<Object>} A promise that resolves to the parsed JSON data
 * @throws {Error} If no file is provided, the file cannot be read, or it contains invalid JSON
 */
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        resolve(jsonData);
      } catch {
        reject(new Error('Invalid JSON format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}
