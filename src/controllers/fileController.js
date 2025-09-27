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
 * Upload and process document
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
 * Get user's documents
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
 * Download document
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
 * Delete document
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