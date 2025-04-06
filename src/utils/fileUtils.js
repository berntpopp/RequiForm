/**
 * @fileoverview Utility functions for file operations.
 * @module utils/fileUtils
 */

/**
 * Downloads data as a JSON file.
 * @param {Object} data - The data to be saved.
 * @param {string} fileName - The name of the file (without extension).
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
 * @param {File} file - The file to read.
 * @return {Promise<Object>} A promise that resolves to the parsed JSON data.
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
