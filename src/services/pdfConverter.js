/**
 * PDF to JSON Conversion Service
 * Integrates EstimateX PDF2JSON functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class PDFConverterService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.converterScript = path.join(__dirname, '../../scripts/pdf_converter.py');
  }

  /**
   * Convert PDF file to JSON
   * @param {string} pdfPath - Path to the PDF file
   * @param {Object} options - Conversion options
   * @returns {Promise<Object>} Converted JSON data
   */
  async convertPDFToJSON(pdfPath, options = {}) {
    const { includeMetadata = false, extractTables = false, outputPath = null } = options;

    try {
      logger.info(`Converting PDF to JSON: ${pdfPath}`);

      // Check if PDF file exists
      await fs.access(pdfPath);

      const args = [
        this.converterScript,
        pdfPath,
        '--include-metadata',
        includeMetadata.toString(),
        '--extract-tables',
        extractTables.toString(),
      ];

      if (outputPath) {
        args.push('--output', outputPath);
      }

      const result = await this._executePython(args);

      logger.info(`PDF conversion successful: ${pdfPath}`);
      return result;
    } catch (error) {
      logger.error(`PDF conversion failed: ${error.message}`);
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Execute Python script
   * @private
   */
  _executePython(args) {
    return new Promise((resolve, reject) => {
      // Set environment to suppress PyMuPDF warnings
      const env = { ...process.env, PYTHONWARNINGS: 'ignore' };
      const python = spawn(this.pythonPath, args, { env });
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', data => {
        stdout += data.toString();
      });

      python.stderr.on('data', data => {
        stderr += data.toString();
      });

      python.on('close', code => {
        if (code !== 0) {
          reject(new Error(stderr || `Python script exited with code ${code}`));
        } else {
          try {
            // Log stderr if present (warnings, etc.)
            if (stderr) {
              logger.debug('Python script warnings:', stderr);
            }

            // Extract JSON from stdout (filter out any warning messages)
            const lines = stdout.trim().split('\n');
            const jsonLine = lines.find(line => line.trim().startsWith('{'));

            if (!jsonLine) {
              throw new Error('No JSON output found in Python script output');
            }

            const result = JSON.parse(jsonLine);
            resolve(result);
          } catch (error) {
            // Log the actual output for debugging
            logger.error('Failed to parse Python output:', {
              stdout: stdout.substring(0, 200),
              stderr: stderr.substring(0, 200),
              error: error.message,
            });
            reject(new Error(`Failed to parse JSON output: ${error.message}`));
          }
        }
      });

      python.on('error', error => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Get conversion status
   * @param {string} conversionId - Conversion ID
   * @returns {Promise<Object>} Conversion status
   */
  async getConversionStatus(conversionId) {
    // This could be implemented with a job queue system
    // For now, return a simple status
    return {
      id: conversionId,
      status: 'completed',
      progress: 100,
    };
  }
}

module.exports = new PDFConverterService();
