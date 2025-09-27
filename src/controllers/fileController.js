/**
 * File controller for document upload and processing
 */
const { FileVector, User } = require('../models');
// const { dbUtils } = require('../database');
const { deleteUploadedFile, getFileSize } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');

/**
 * Upload multiple files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'No files uploaded' 
            });
        }

        const user = await User.findByPk(req.userId);
        if (!user) {
            // Clean up uploaded files
            req.files.forEach(file => deleteUploadedFile(file.path));
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        const uploadedFiles = [];
        const errors = [];

        for (const file of req.files) {
            try {
                const fileRecord = await FileVector.create({
                    filename: file.filename,
                    original_name: file.originalname,
                    file_path: file.path,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    user_id: req.userId,
                    processing_status: 'pending'
                });

                uploadedFiles.push({
                    id: fileRecord.id,
                    filename: fileRecord.filename,
                    originalname: fileRecord.original_name,
                    size: fileRecord.file_size,
                    mimetype: fileRecord.mime_type,
                    created_at: fileRecord.createdAt
                });

                // Start background processing
                if (file.mimetype === 'application/pdf') {
                    setImmediate(() => processPDF(fileRecord.id));
                }
            } catch (error) {
                console.error('Error creating file record:', error);
                deleteUploadedFile(file.path);
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        // If all files failed, return error
        if (errors.length === req.files.length) {
            return res.status(500).json({
                success: false,
                message: 'Upload failed',
                errors: errors
            });
        }

        // Partial success or full success
        const response = {
            success: true,
            message: uploadedFiles.length === req.files.length 
                ? 'Files uploaded successfully' 
                : 'Some files uploaded successfully',
            data: {
                files: uploadedFiles
            }
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        res.status(200).json(response);

    } catch (error) {
        if (req.files) {
            req.files.forEach(file => deleteUploadedFile(file.path));
        }
        res.status(500).json({ 
            success: false,
            message: 'Upload failed',
            error: error.message 
        });
    }
};

/**
 * Upload and process document (legacy method)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user = await User.findByPk(req.userId);
        if (!user) {
            deleteUploadedFile(req.file.path);
            return res.status(404).json({ error: 'User not found' });
        }

        // Create initial file record
        const fileRecord = await FileVector.create({
            filename: req.file.filename,
            original_name: req.file.originalname,
            file_path: req.file.path,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            user_id: req.userId,
            processing_status: 'pending'
        });

        // Start background processing for PDFs
        if (req.file.mimetype === 'application/pdf') {
            setImmediate(() => processPDF(fileRecord.id));
        } else {
            // For other document types, just extract basic info
            setImmediate(() => processTextDocument(fileRecord.id));
        }

        res.status(201).json({
            message: 'Document uploaded successfully and queued for processing',
            file: {
                id: fileRecord.id,
                filename: fileRecord.filename,
                original_name: fileRecord.original_name,
                size: getFileSize(fileRecord.file_size),
                mime_type: fileRecord.mime_type,
                processing_status: fileRecord.processing_status,
                upload_date: fileRecord.createdAt
            }
        });
    } catch (error) {
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get user's files with pagination and filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserFiles = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, type, sortBy = 'created_at', order = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        const { Op } = require('sequelize');
        const whereClause = { user_id: req.userId };

        // Add search filter
        if (search) {
            whereClause[Op.or] = [
                { original_name: { [Op.like]: `%${search}%` } },
                { filename: { [Op.like]: `%${search}%` } }
            ];
        }

        // Add type filter
        if (type) {
            whereClause.mime_type = { [Op.like]: `%${type}%` };
        }

        // Map API field names to database field names for sorting
        const sortFieldMap = {
            'size': 'file_size',
            'mimetype': 'mime_type',
            'originalname': 'original_name',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
        };
        
        const dbSortBy = sortFieldMap[sortBy] || sortBy;

        const { count, rows: files } = await FileVector.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[dbSortBy, order]],
            attributes: [
                'id', 'filename', 'original_name', 'file_size', 'mime_type',
                'processing_status', 'createdAt', 'updatedAt'
            ]
        });

        const totalSize = await FileVector.sum('file_size', {
            where: { user_id: req.userId }
        });

        res.status(200).json({
            success: true,
            data: {
                files: files.map(file => ({
                    id: file.id,
                    filename: file.filename,
                    originalname: file.original_name,
                    size: file.file_size,
                    mimetype: file.mime_type,
                    processing_status: file.processing_status,
                    created_at: file.createdAt,
                    updated_at: file.updatedAt
                })),
                total: count,
                totalSize: totalSize || 0,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get user's documents (legacy method)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDocuments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { user_id: req.userId };
        if (status) {
            whereClause.processing_status = status;
        }

        const { count, rows: documents } = await FileVector.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            attributes: [
                'id', 'filename', 'original_name', 'file_size', 'mime_type',
                'page_count', 'processing_status', 'processed_at', 'error_message',
                'createdAt', 'updatedAt'
            ]
        });

        const formattedDocuments = documents.map(doc => ({
            ...doc.toJSON(),
            size: getFileSize(doc.file_size),
            download_url: `/api/files/${doc.id}/download`
        }));

        res.json({
            documents: formattedDocuments,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(count / limit),
                total_documents: count,
                has_next: page * limit < count,
                has_prev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get document details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await FileVector.findOne({
            where: { id, user_id: req.userId },
            attributes: [
                'id', 'filename', 'original_name', 'file_size', 'mime_type',
                'content_text', 'page_count', 'processing_status', 'processed_at',
                'error_message', 'embedding_model', 'createdAt', 'updatedAt'
            ]
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({
            ...document.toJSON(),
            size: getFileSize(document.file_size),
            download_url: `/api/files/${document.id}/download`,
            has_embeddings: !!document.embedding_vector
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Download file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await FileVector.findOne({
            where: { id: fileId, user_id: req.userId }
        });

        if (!file) {
            return res.status(404).json({ 
                success: false,
                message: 'File not found' 
            });
        }

        const filePath = file.file_path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false,
                message: 'File not found on server' 
            });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.setHeader('Content-Type', file.mime_type);
        res.download(path.resolve(filePath), file.original_name);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Download document (legacy method)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await FileVector.findOne({
            where: { id, user_id: req.userId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const filePath = document.file_path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
        res.setHeader('Content-Type', document.mime_type);
        res.sendFile(path.resolve(filePath));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await FileVector.findOne({
            where: { id: fileId, user_id: req.userId }
        });

        if (!file) {
            return res.status(404).json({ 
                success: false,
                message: 'File not found' 
            });
        }

        // Delete file from filesystem
        try {
            if (fs.existsSync(file.file_path)) {
                fs.unlinkSync(file.file_path);
            }
        } catch (fsError) {
            console.error('Error deleting file from filesystem:', fsError);
        }

        // Delete database record
        await file.destroy();

        res.status(200).json({ 
            success: true,
            message: 'File deleted successfully' 
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Bulk delete files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.bulkDeleteFiles = async (req, res) => {
    try {
        const { fileIds } = req.body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No file IDs provided'
            });
        }

        const files = await FileVector.findAll({
            where: { 
                id: fileIds,
                user_id: req.userId 
            }
        });

        let deletedCount = 0;

        for (const file of files) {
            try {
                // Delete file from filesystem
                if (fs.existsSync(file.file_path)) {
                    fs.unlinkSync(file.file_path);
                }

                // Delete database record
                await file.destroy();
                deletedCount++;
            } catch (error) {
                console.error(`Error deleting file ${file.id}:`, error);
            }
        }

        res.status(200).json({
            success: true,
            message: `${deletedCount} files deleted successfully`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get file analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFileAnalytics = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        const totalFiles = await FileVector.count({
            where: { user_id: req.userId }
        });

        const totalSize = await FileVector.sum('file_size', {
            where: { user_id: req.userId }
        }) || 0;

        const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

        // Get type breakdown
        const typeBreakdown = await FileVector.findAll({
            where: { user_id: req.userId },
            attributes: [
                'mime_type',
                [require('sequelize').fn('COUNT', '*'), 'count'],
                [require('sequelize').fn('SUM', require('sequelize').col('file_size')), 'size']
            ],
            group: ['mime_type']
        });

        // Get compression stats (mock since we don't have compression_ratio)
        const compressionStats = {
            averageRatio: 1.0
        };

        res.status(200).json({
            success: true,
            data: {
                totalFiles,
                totalSize,
                averageSize: Math.round(averageSize),
                typeBreakdown: typeBreakdown.map(item => ({
                    type: item.mime_type.split('/')[1] || item.mime_type,
                    count: parseInt(item.dataValues.count),
                    size: parseInt(item.dataValues.size) || 0
                })),
                compressionStats
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Delete document (legacy method)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await FileVector.findOne({
            where: { id, user_id: req.userId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete file from filesystem
        deleteUploadedFile(document.file_path);

        // Delete database record
        await document.destroy();

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Search documents by content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchDocuments = async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Simple text search for now
        const { Op } = require('sequelize');
        const documents = await FileVector.findAll({
            where: {
                user_id: req.userId,
                processing_status: 'completed',
                content_text: { [Op.like]: `%${query}%` }
            },
            limit: parseInt(limit),
            order: [['processed_at', 'DESC']],
            attributes: [
                'id', 'filename', 'original_name', 'file_size', 'mime_type',
                'page_count', 'processed_at', 'createdAt'
            ]
        });

        const formattedResults = documents.map(doc => ({
            ...doc.toJSON(),
            size: getFileSize(doc.file_size),
            download_url: `/api/files/${doc.id}/download`
        }));

        res.json({
            query,
            results: formattedResults,
            total_results: formattedResults.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Background function to process PDF files
 * @param {number} fileId - FileVector record ID
 */
async function processPDF(fileId) {
    try {
        const fileRecord = await FileVector.findByPk(fileId);
        if (!fileRecord) return;

        // Update status to processing
        await fileRecord.update({ processing_status: 'processing' });

        const dataBuffer = fs.readFileSync(fileRecord.file_path);
        const pdfData = await pdfParse(dataBuffer);

        // Extract text and metadata
        const contentText = pdfData.text;
        const pageCount = pdfData.numpages;

        // Update record with extracted content
        await fileRecord.update({
            content_text: contentText,
            page_count: pageCount,
            processing_status: 'completed',
            processed_at: new Date()
        });

        // Optionally generate embeddings (would need external service)
        // await generateEmbeddings(fileRecord);

        console.log(`PDF processed successfully: ${fileRecord.original_name}`);
    } catch (error) {
        console.error('Error processing PDF:', error);
        
        const fileRecord = await FileVector.findByPk(fileId);
        if (fileRecord) {
            await fileRecord.update({
                processing_status: 'failed',
                error_message: error.message,
                processed_at: new Date()
            });
        }
    }
}

/**
 * Background function to process text documents
 * @param {number} fileId - FileVector record ID
 */
async function processTextDocument(fileId) {
    try {
        const fileRecord = await FileVector.findByPk(fileId);
        if (!fileRecord) return;

        await fileRecord.update({ processing_status: 'processing' });

        if (fileRecord.mime_type === 'text/plain') {
            const contentText = fs.readFileSync(fileRecord.file_path, 'utf8');
            await fileRecord.update({
                content_text: contentText,
                processing_status: 'completed',
                processed_at: new Date()
            });
        } else {
            // For other document types, mark as completed without text extraction
            await fileRecord.update({
                processing_status: 'completed',
                processed_at: new Date()
            });
        }

        console.log(`Document processed successfully: ${fileRecord.original_name}`);
    } catch (error) {
        console.error('Error processing document:', error);
        
        const fileRecord = await FileVector.findByPk(fileId);
        if (fileRecord) {
            await fileRecord.update({
                processing_status: 'failed',
                error_message: error.message,
                processed_at: new Date()
            });
        }
    }
}

/**
 * Generate embeddings for document (placeholder for external service)
 * @param {Object} fileRecord - FileVector record
 */
async function generateEmbeddings(fileRecord) {
    try {
        // This would integrate with an embedding service
        // For now, just log that embeddings would be generated
        console.log(`Embeddings would be generated for: ${fileRecord.original_name}`);
        
        // Example of how you might call an external embedding service:
        // const response = await axios.post('http://localhost:8000/embed', {
        //     text: fileRecord.content_text
        // });
        // 
        // if (response.data.embedding) {
        //     fileRecord.setEmbeddingVector(response.data.embedding);
        //     await fileRecord.save();
        // }
    } catch (error) {
        console.error('Error generating embeddings:', error);
    }
}