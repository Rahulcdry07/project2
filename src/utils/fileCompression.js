/**
 * File compression utilities
 */
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('./logger');

class FileCompression {
    constructor() {
        this.pipeline = promisify(require('stream').pipeline);
        this.supportedFormats = ['zip', 'tar', 'gzip'];
        this.compressionLevels = {
            fast: 1,
            normal: 6,
            best: 9
        };
    }

    /**
     * Compress a single file using gzip
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Compression options
     * @returns {Promise<Object>} Compression result
     */
    async compressFile(inputPath, outputPath, options = {}) {
        try {
            const { level = this.compressionLevels.normal } = options;
            
            const startTime = Date.now();
            const inputStats = await fs.promises.stat(inputPath);
            
            await this.pipeline(
                fs.createReadStream(inputPath),
                zlib.createGzip({ level }),
                fs.createWriteStream(outputPath)
            );

            const outputStats = await fs.promises.stat(outputPath);
            const compressionTime = Date.now() - startTime;
            
            const result = {
                success: true,
                inputSize: inputStats.size,
                outputSize: outputStats.size,
                compressionRatio: (1 - (outputStats.size / inputStats.size)) * 100,
                compressionTime,
                inputPath,
                outputPath
            };

            logger.info('File compressed successfully', {
                inputPath: path.basename(inputPath),
                compressionRatio: `${result.compressionRatio.toFixed(2)}%`,
                compressionTime: `${compressionTime}ms`
            });

            return result;
        } catch (error) {
            logger.error('File compression failed', {
                inputPath,
                outputPath,
                error: error.message
            });
            throw new Error(`File compression failed: ${error.message}`);
        }
    }

    /**
     * Decompress a gzip file
     * @param {string} inputPath - Compressed file path
     * @param {string} outputPath - Output file path
     * @returns {Promise<Object>} Decompression result
     */
    async decompressFile(inputPath, outputPath) {
        try {
            const startTime = Date.now();
            const inputStats = await fs.promises.stat(inputPath);
            
            await this.pipeline(
                fs.createReadStream(inputPath),
                zlib.createGunzip(),
                fs.createWriteStream(outputPath)
            );

            const outputStats = await fs.promises.stat(outputPath);
            const decompressionTime = Date.now() - startTime;
            
            const result = {
                success: true,
                inputSize: inputStats.size,
                outputSize: outputStats.size,
                expansionRatio: (outputStats.size / inputStats.size) * 100,
                decompressionTime,
                inputPath,
                outputPath
            };

            logger.info('File decompressed successfully', {
                inputPath: path.basename(inputPath),
                expansionRatio: `${result.expansionRatio.toFixed(2)}%`,
                decompressionTime: `${decompressionTime}ms`
            });

            return result;
        } catch (error) {
            logger.error('File decompression failed', {
                inputPath,
                outputPath,
                error: error.message
            });
            throw new Error(`File decompression failed: ${error.message}`);
        }
    }

    /**
     * Create archive from multiple files
     * @param {Array} files - Array of file objects {path, name}
     * @param {string} outputPath - Output archive path
     * @param {Object} options - Archive options
     * @returns {Promise<Object>} Archive result
     */
    async createArchive(files, outputPath, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const {
                    format = 'zip',
                    level = this.compressionLevels.normal,
                    comment = `Archive created on ${new Date().toISOString()}`
                } = options;

                if (!this.supportedFormats.includes(format)) {
                    throw new Error(`Unsupported archive format: ${format}`);
                }

                const startTime = Date.now();
                const output = fs.createWriteStream(outputPath);
                let archive;

                switch (format) {
                    case 'zip':
                        archive = archiver('zip', { 
                            zlib: { level },
                            comment
                        });
                        break;
                    case 'tar':
                        archive = archiver('tar', {
                            gzip: true,
                            gzipOptions: { level }
                        });
                        break;
                    default:
                        throw new Error(`Unsupported format: ${format}`);
                }

                output.on('close', async () => {
                    try {
                        const outputStats = await fs.promises.stat(outputPath);
                        const archiveTime = Date.now() - startTime;
                        
                        const result = {
                            success: true,
                            fileCount: files.length,
                            outputSize: outputStats.size,
                            archiveTime,
                            outputPath,
                            format
                        };

                        logger.info('Archive created successfully', {
                            outputPath: path.basename(outputPath),
                            fileCount: files.length,
                            outputSize: `${(outputStats.size / 1024 / 1024).toFixed(2)}MB`,
                            archiveTime: `${archiveTime}ms`
                        });

                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });

                archive.on('error', (error) => {
                    logger.error('Archive creation failed', {
                        outputPath,
                        error: error.message
                    });
                    reject(new Error(`Archive creation failed: ${error.message}`));
                });

                archive.pipe(output);

                // Add files to archive
                for (const file of files) {
                    if (fs.existsSync(file.path)) {
                        archive.file(file.path, { name: file.name || path.basename(file.path) });
                    } else {
                        logger.warn('File not found, skipping', { path: file.path });
                    }
                }

                archive.finalize();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Compress text data in memory
     * @param {string|Buffer} data - Data to compress
     * @param {Object} options - Compression options
     * @returns {Promise<Buffer>} Compressed data
     */
    async compressData(data, options = {}) {
        try {
            const { level = this.compressionLevels.normal } = options;
            const input = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
            
            return new Promise((resolve, reject) => {
                zlib.gzip(input, { level }, (error, compressed) => {
                    if (error) {
                        reject(new Error(`Data compression failed: ${error.message}`));
                    } else {
                        const compressionRatio = (1 - (compressed.length / input.length)) * 100;
                        logger.debug('Data compressed', {
                            originalSize: input.length,
                            compressedSize: compressed.length,
                            compressionRatio: `${compressionRatio.toFixed(2)}%`
                        });
                        resolve(compressed);
                    }
                });
            });
        } catch (error) {
            throw new Error(`Data compression failed: ${error.message}`);
        }
    }

    /**
     * Decompress text data in memory
     * @param {Buffer} compressedData - Compressed data buffer
     * @returns {Promise<Buffer>} Decompressed data
     */
    async decompressData(compressedData) {
        try {
            return new Promise((resolve, reject) => {
                zlib.gunzip(compressedData, (error, decompressed) => {
                    if (error) {
                        reject(new Error(`Data decompression failed: ${error.message}`));
                    } else {
                        logger.debug('Data decompressed', {
                            compressedSize: compressedData.length,
                            decompressedSize: decompressed.length
                        });
                        resolve(decompressed);
                    }
                });
            });
        } catch (error) {
            throw new Error(`Data decompression failed: ${error.message}`);
        }
    }

    /**
     * Get compression stats for a file
     * @param {string} filePath - File path to analyze
     * @returns {Promise<Object>} Compression analysis
     */
    async analyzeCompressionPotential(filePath) {
        try {
            const fileStats = await fs.promises.stat(filePath);
            const fileBuffer = await fs.promises.readFile(filePath);
            
            // Test different compression levels
            const results = {};
            for (const [levelName, level] of Object.entries(this.compressionLevels)) {
                const startTime = Date.now();
                const compressed = await new Promise((resolve, reject) => {
                    zlib.gzip(fileBuffer, { level }, (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    });
                });
                const compressionTime = Date.now() - startTime;

                results[levelName] = {
                    level,
                    originalSize: fileStats.size,
                    compressedSize: compressed.length,
                    compressionRatio: (1 - (compressed.length / fileStats.size)) * 100,
                    compressionTime,
                    sizeSavings: fileStats.size - compressed.length
                };
            }

            return {
                filePath,
                originalSize: fileStats.size,
                results,
                recommendation: this.getCompressionRecommendation(results)
            };
        } catch (error) {
            throw new Error(`Compression analysis failed: ${error.message}`);
        }
    }

    /**
     * Get compression recommendation based on analysis
     * @param {Object} results - Compression results
     * @returns {Object} Recommendation
     */
    getCompressionRecommendation(results) {
        let bestLevel = 'normal';
        let bestRatio = results.normal.compressionRatio;
        
        // Find best compression ratio within reasonable time constraints
        for (const [level, data] of Object.entries(results)) {
            if (data.compressionRatio > bestRatio && data.compressionTime < 5000) {
                bestLevel = level;
                bestRatio = data.compressionRatio;
            }
        }

        return {
            recommendedLevel: bestLevel,
            expectedRatio: bestRatio,
            expectedSavings: results[bestLevel].sizeSavings,
            reason: bestRatio > 50 ? 'High compression potential' : 
                   bestRatio > 20 ? 'Moderate compression potential' : 
                   'Low compression potential'
        };
    }

    /**
     * Batch compress multiple files
     * @param {Array} files - Array of file paths
     * @param {string} outputDir - Output directory
     * @param {Object} options - Compression options
     * @returns {Promise<Array>} Array of compression results
     */
    async batchCompress(files, outputDir, options = {}) {
        try {
            await fs.promises.mkdir(outputDir, { recursive: true });
            
            const results = [];
            const { concurrency = 3 } = options;

            // Process files in batches to avoid overwhelming the system
            for (let i = 0; i < files.length; i += concurrency) {
                const batch = files.slice(i, i + concurrency);
                const batchPromises = batch.map(async (filePath) => {
                    try {
                        const filename = path.basename(filePath);
                        const outputPath = path.join(outputDir, `${filename}.gz`);
                        return await this.compressFile(filePath, outputPath, options);
                    } catch (error) {
                        return {
                            success: false,
                            inputPath: filePath,
                            error: error.message
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }

            const successful = results.filter(r => r.success).length;
            const failed = results.length - successful;

            logger.info('Batch compression completed', {
                total: files.length,
                successful,
                failed,
                outputDir
            });

            return results;
        } catch (error) {
            throw new Error(`Batch compression failed: ${error.message}`);
        }
    }
}

module.exports = FileCompression;