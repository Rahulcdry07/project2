/**
 * Image processing utilities using Sharp
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

class ImageProcessor {
    constructor() {
        this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
        this.maxSize = 5 * 1024 * 1024; // 5MB
        this.thumbnailSizes = {
            small: { width: 150, height: 150 },
            medium: { width: 300, height: 300 },
            large: { width: 600, height: 600 }
        };
    }

    /**
     * Validate image file
     * @param {Buffer} buffer - Image buffer
     * @param {string} originalName - Original filename
     * @returns {Promise<Object>} Validation result
     */
    async validateImage(buffer, originalName) {
        try {
            const metadata = await sharp(buffer).metadata();
            
            const validation = {
                isValid: true,
                errors: [],
                metadata: {
                    format: metadata.format,
                    width: metadata.width,
                    height: metadata.height,
                    size: buffer.length,
                    hasAlpha: metadata.hasAlpha,
                    density: metadata.density
                }
            };

            // Check file size
            if (buffer.length > this.maxSize) {
                validation.isValid = false;
                validation.errors.push(`File size exceeds maximum allowed size of ${this.maxSize / 1024 / 1024}MB`);
            }

            // Check format
            if (!this.supportedFormats.includes(metadata.format)) {
                validation.isValid = false;
                validation.errors.push(`Unsupported image format: ${metadata.format}. Supported: ${this.supportedFormats.join(', ')}`);
            }

            // Check dimensions
            if (metadata.width > 4096 || metadata.height > 4096) {
                validation.isValid = false;
                validation.errors.push('Image dimensions too large (max: 4096x4096)');
            }

            if (metadata.width < 50 || metadata.height < 50) {
                validation.isValid = false;
                validation.errors.push('Image dimensions too small (min: 50x50)');
            }

            return validation;
        } catch (error) {
            return {
                isValid: false,
                errors: [`Invalid image file: ${error.message}`],
                metadata: null
            };
        }
    }

    /**
     * Process profile picture with multiple sizes
     * @param {Buffer} inputBuffer - Input image buffer
     * @param {string} outputDir - Output directory
     * @param {string} filename - Base filename (without extension)
     * @returns {Promise<Object>} Processing result
     */
    async processProfilePicture(inputBuffer, outputDir, filename) {
        try {
            // Ensure output directory exists
            await fs.mkdir(outputDir, { recursive: true });

            const results = {
                original: null,
                thumbnails: {},
                metadata: null
            };

            // Get image metadata first
            const metadata = await sharp(inputBuffer).metadata();
            results.metadata = metadata;

            // Create sharp instance with auto-rotation
            const image = sharp(inputBuffer).rotate();

            // Process original (optimized)
            const originalPath = path.join(outputDir, `${filename}.webp`);
            await image
                .clone()
                .webp({ quality: 90, effort: 4 })
                .toFile(originalPath);
            
            results.original = {
                path: originalPath,
                format: 'webp',
                relativePath: path.relative(process.cwd(), originalPath)
            };

            // Create thumbnails
            for (const [size, dimensions] of Object.entries(this.thumbnailSizes)) {
                const thumbnailPath = path.join(outputDir, `${filename}_${size}.webp`);
                
                await image
                    .clone()
                    .resize(dimensions.width, dimensions.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .webp({ quality: 85, effort: 4 })
                    .toFile(thumbnailPath);

                results.thumbnails[size] = {
                    path: thumbnailPath,
                    format: 'webp',
                    dimensions,
                    relativePath: path.relative(process.cwd(), thumbnailPath)
                };
            }

            logger.info('Profile picture processed successfully', {
                filename,
                originalSize: inputBuffer.length,
                thumbnailCount: Object.keys(results.thumbnails).length
            });

            return results;
        } catch (error) {
            logger.error('Image processing failed', {
                filename,
                error: error.message,
                stack: error.stack
            });
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }

    /**
     * Create optimized image from buffer
     * @param {Buffer} inputBuffer - Input image buffer
     * @param {Object} options - Processing options
     * @returns {Promise<Buffer>} Processed image buffer
     */
    async optimizeImage(inputBuffer, options = {}) {
        const {
            width = null,
            height = null,
            quality = 85,
            format = 'webp',
            fit = 'cover'
        } = options;

        try {
            let image = sharp(inputBuffer).rotate();

            // Resize if dimensions provided
            if (width || height) {
                image = image.resize(width, height, { fit, position: 'center' });
            }

            // Apply format and quality
            switch (format.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    image = image.jpeg({ quality, progressive: true });
                    break;
                case 'png':
                    image = image.png({ quality, progressive: true });
                    break;
                case 'webp':
                default:
                    image = image.webp({ quality, effort: 4 });
                    break;
            }

            return await image.toBuffer();
        } catch (error) {
            throw new Error(`Image optimization failed: ${error.message}`);
        }
    }

    /**
     * Extract image information
     * @param {Buffer} buffer - Image buffer
     * @returns {Promise<Object>} Image information
     */
    async getImageInfo(buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            const stats = await sharp(buffer).stats();

            return {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                channels: metadata.channels,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                hasProfile: metadata.hasProfile,
                size: buffer.length,
                aspectRatio: metadata.width / metadata.height,
                stats: {
                    entropy: stats.entropy,
                    min: stats.channels.map(c => c.min),
                    max: stats.channels.map(c => c.max),
                    mean: stats.channels.map(c => c.mean),
                    stdev: stats.channels.map(c => c.stdev)
                }
            };
        } catch (error) {
            throw new Error(`Failed to extract image info: ${error.message}`);
        }
    }

    /**
     * Delete processed images
     * @param {string} basePath - Base path for images
     * @param {string} filename - Base filename
     * @returns {Promise<void>}
     */
    async deleteProcessedImages(basePath, filename) {
        try {
            const filesToDelete = [
                `${filename}.webp`,
                `${filename}_small.webp`,
                `${filename}_medium.webp`,
                `${filename}_large.webp`
            ];

            const deletePromises = filesToDelete.map(async (file) => {
                const filePath = path.join(basePath, file);
                try {
                    await fs.unlink(filePath);
                    logger.debug('Deleted image file', { filePath });
                } catch (error) {
                    if (error.code !== 'ENOENT') {
                        logger.warn('Failed to delete image file', { 
                            filePath, 
                            error: error.message 
                        });
                    }
                }
            });

            await Promise.all(deletePromises);
        } catch (error) {
            logger.error('Error during image cleanup', {
                basePath,
                filename,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Convert image to different format
     * @param {Buffer} inputBuffer - Input image buffer
     * @param {string} targetFormat - Target format (jpeg, png, webp)
     * @param {Object} options - Conversion options
     * @returns {Promise<Buffer>} Converted image buffer
     */
    async convertFormat(inputBuffer, targetFormat, options = {}) {
        try {
            let image = sharp(inputBuffer);

            switch (targetFormat.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    return await image.jpeg({
                        quality: options.quality || 85,
                        progressive: options.progressive !== false
                    }).toBuffer();
                
                case 'png':
                    return await image.png({
                        quality: options.quality || 85,
                        progressive: options.progressive !== false
                    }).toBuffer();
                
                case 'webp':
                    return await image.webp({
                        quality: options.quality || 85,
                        effort: options.effort || 4
                    }).toBuffer();
                
                default:
                    throw new Error(`Unsupported target format: ${targetFormat}`);
            }
        } catch (error) {
            throw new Error(`Format conversion failed: ${error.message}`);
        }
    }

    /**
     * Generate image variations for responsive design
     * @param {Buffer} inputBuffer - Input image buffer
     * @param {Array} sizes - Array of size objects {width, height, suffix}
     * @param {string} outputDir - Output directory
     * @param {string} filename - Base filename
     * @returns {Promise<Array>} Array of generated file info
     */
    async generateResponsiveImages(inputBuffer, sizes, outputDir, filename) {
        try {
            await fs.mkdir(outputDir, { recursive: true });
            
            const results = [];
            const image = sharp(inputBuffer).rotate();

            for (const size of sizes) {
                const outputPath = path.join(outputDir, `${filename}${size.suffix}.webp`);
                
                await image
                    .clone()
                    .resize(size.width, size.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .webp({ quality: 85, effort: 4 })
                    .toFile(outputPath);

                results.push({
                    width: size.width,
                    height: size.height,
                    suffix: size.suffix,
                    path: outputPath,
                    relativePath: path.relative(process.cwd(), outputPath)
                });
            }

            logger.info('Responsive images generated', {
                filename,
                count: results.length,
                sizes: sizes.map(s => `${s.width}x${s.height}`)
            });

            return results;
        } catch (error) {
            logger.error('Responsive image generation failed', {
                filename,
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = ImageProcessor;