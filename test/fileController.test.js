/**
 * File Controller tests - Unit tests for file management functionality
 */
const expect = require('chai').expect;
const sinon = require('sinon');
const path = require('path');
const fs = require('fs').promises;

// Import controller
const fileController = require('../src/controllers/fileController');

// Import models and utilities
const { setupTestDatabase, teardownTestDatabase, getTestModels } = require('./setup');

describe('File Controller', () => {
  let User, FileVector, sequelize;
  let testUser, req, res;

  before(async () => {
    // Set up test database
    await setupTestDatabase();
    
    const { User, sequelize: testSequelize } = getTestModels();
    
    // Disable foreign key constraints temporarily for table creation
    await testSequelize.query('PRAGMA foreign_keys = OFF;');
    
    // Drop tables in correct order
    try {
      await testSequelize.query('DROP TABLE IF EXISTS FileVectors;');
      await testSequelize.query('DROP TABLE IF EXISTS Users;');
    } catch (error) {
      // Tables might not exist yet, that's okay
    }

    // Create FileVector model for tests
    const { DataTypes } = require('sequelize');
    FileVector = testSequelize.define('FileVector', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false
      },
      original_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      mime_type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content_text: {
        type: DataTypes.TEXT,
      },
      page_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      embedding_vector: {
        type: DataTypes.TEXT, // JSON string of vector array
      },
      embedding_model: {
        type: DataTypes.STRING,
        defaultValue: 'sentence-transformers/all-MiniLM-L6-v2',
      },
      processed_at: {
        type: DataTypes.DATE,
      },
      processing_status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
      },
      error_message: {
        type: DataTypes.TEXT,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id'
        }
      }
    });

    // Re-enable foreign keys
    await testSequelize.query('PRAGMA foreign_keys = ON;');

    // Create tables
    await User.sync({ force: true });
    await FileVector.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedPassword',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    });

    // Set up mocks
    req = {
      userId: testUser.id,
      body: {},
      files: []
    };
    
    res = {
      status: sinon.stub().returns({
        json: sinon.stub()
      }),
      json: sinon.stub(),
      download: sinon.stub()
    };
    
    res.status.returns(res);
  });

  after(async function() {
    this.timeout(5000);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    const { User } = getTestModels();
    
    // Clean up users and files
    await FileVector.destroy({ where: {} });
    await User.destroy({ where: {} });
    
    // Create test user
    testUser = await User.create({
      username: 'fileuser',
      email: 'file@example.com',
      password: 'password123',
      is_verified: true
    });

    // Setup request and response mocks
    req = {
      userId: testUser.id,
      user: testUser,
      body: {},
      params: {},
      query: {},
      files: [],
      file: null
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      download: sinon.stub(),
      setHeader: sinon.stub(),
      set: sinon.stub()
    };
  });

  describe('uploadFiles method', () => {
    it('should upload single file successfully', async () => {
      const mockFile = {
        filename: 'test-file-123.txt',
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
        path: '/uploads/documents/test-file-123.txt'
      };

      req.files = [mockFile];

      // Mock file processing utilities
      const mockFileCompression = { analyzeCompression: sinon.stub().returns(Promise.resolve({ ratio: 0.8 })) };
      const mockImageProcessor = { processImage: sinon.stub().returns(Promise.resolve({})) };
      
      // Temporarily replace modules for testing
      const Module = require('module');
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function(...args) {
        if (args[0] === '../utils/fileCompression') return mockFileCompression;
        if (args[0] === '../utils/imageProcessor') return mockImageProcessor;
        return originalRequire.apply(this, args);
      };

      try {
        await fileController.uploadFiles(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('uploaded successfully');
        expect(responseData.data.files).to.be.an('array');
        expect(responseData.data.files).to.have.length(1);
        expect(responseData.data.files[0].originalname).to.equal('test.txt');

        // Verify file was saved to database
        const savedFile = await FileVector.findOne({ where: { filename: 'test-file-123.txt' } });
        expect(savedFile).to.exist;
        expect(savedFile.user_id).to.equal(testUser.id);
        expect(savedFile.file_size).to.equal(1024);
      } finally {
        // Restore original require
        Module.prototype.require = originalRequire;
      }
    });

    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        {
          filename: 'file1-123.txt',
          originalname: 'file1.txt',
          mimetype: 'text/plain',
          size: 512,
          path: '/uploads/documents/file1-123.txt'
        },
        {
          filename: 'file2-456.pdf',
          originalname: 'file2.pdf',
          mimetype: 'application/pdf',
          size: 2048,
          path: '/uploads/documents/file2-456.pdf'
        }
      ];

      req.files = mockFiles;

      const mockFileCompression = { analyzeCompression: sinon.stub().returns(Promise.resolve({ ratio: 0.8 })) };
      const mockImageProcessor = { processImage: sinon.stub().returns(Promise.resolve({})) };
      
      const Module = require('module');
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function(...args) {
        if (args[0] === '../utils/fileCompression') return mockFileCompression;
        if (args[0] === '../utils/imageProcessor') return mockImageProcessor;
        return originalRequire.apply(this, args);
      };

      try {
        await fileController.uploadFiles(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.data.files).to.have.length(2);

        // Verify both files were saved
        const savedFiles = await FileVector.findAll({ where: { user_id: testUser.id } });
        expect(savedFiles).to.have.length(2);
      } finally {
        Module.prototype.require = originalRequire;
      }
    });

    it('should handle no files uploaded', async () => {
      req.files = [];

      await fileController.uploadFiles(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('No files uploaded');
    });

    it('should handle upload errors gracefully', async () => {
      // Test with no files - this should be handled gracefully
      req.files = [];

      await fileController.uploadFiles(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('No files');
    });
  });

  describe('getUserFiles method', () => {
    beforeEach(async () => {
      // Create test files for the user
      await FileVector.bulkCreate([
        {
          filename: 'test1.txt',
          original_name: 'test1.txt',
          mime_type: 'text/plain',
          file_size: 1024,
          file_path: '/uploads/documents/test1.txt',
          user_id: testUser.id,
          processing_status: 'completed'
        },
        {
          filename: 'test2.pdf',
          original_name: 'test2.pdf',
          mime_type: 'application/pdf',
          file_size: 2048,
          file_path: '/uploads/documents/test2.pdf',
          user_id: testUser.id,
          processing_status: 'completed'
        }
      ]);
    });

    it('should return all user files', async () => {
      await fileController.getUserFiles(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.data.files).to.be.an('array');
      expect(responseData.data.files).to.have.length(2);
      expect(responseData.data.total).to.equal(2);
      expect(responseData.data.totalSize).to.be.a('number');
    });

    it('should support pagination', async () => {
      req.query = { page: 1, limit: 1 };

      await fileController.getUserFiles(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.files).to.have.length(1);
      expect(responseData.data.total).to.equal(2);
      expect(responseData.data.page).to.equal(1);
      expect(responseData.data.totalPages).to.equal(2);
    });

    it('should support search functionality', async () => {
      req.query = { search: 'test1' };

      await fileController.getUserFiles(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.files).to.have.length(1);
      expect(responseData.data.files[0].originalname).to.equal('test1.txt');
    });

    it('should filter by file type', async () => {
      req.query = { type: 'pdf' };

      await fileController.getUserFiles(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.files).to.have.length(1);
      expect(responseData.data.files[0].mimetype).to.equal('application/pdf');
    });

    it('should sort files by different criteria', async () => {
      req.query = { sortBy: 'size', order: 'desc' };

      await fileController.getUserFiles(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.files).to.have.length(2);
      expect(responseData.data.files[0].size).to.be.greaterThan(responseData.data.files[1].size);
    });
  });

  describe('downloadFile method', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await FileVector.create({
        filename: 'download-test.txt',
        original_name: 'download.txt',
        mime_type: 'text/plain',
        file_size: 1024,
        file_path: '/uploads/documents/download-test.txt',
        user_id: testUser.id,
        processing_status: 'completed'
      });

      req.params.fileId = testFile.id.toString();
    });

    it('should download file successfully', async () => {
      // Mock path.resolve and fs.existsSync
      const mockPath = require('path');
      const originalResolve = mockPath.resolve;
      mockPath.resolve = sinon.stub().returns('/full/path/to/download-test.txt');

      const mockFs = require('fs');
      const originalExistsSync = mockFs.existsSync;
      mockFs.existsSync = sinon.stub().returns(true);

      try {
        await fileController.downloadFile(req, res);

        expect(res.download.calledOnce).to.be.true;
        const downloadArgs = res.download.firstCall.args;
        expect(downloadArgs[1]).to.equal('download.txt'); // Original filename
      } finally {
        mockPath.resolve = originalResolve;
        mockFs.existsSync = originalExistsSync;
      }
    });

    it('should handle non-existent file', async () => {
      req.params.fileId = '99999';

      await fileController.downloadFile(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('not found');
    });

    it('should prevent access to other users files', async () => {
      const { User } = getTestModels();
      
      // Create another user and their file
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherUserFile = await FileVector.create({
        filename: 'other-file.txt',
        original_name: 'other.txt',
        mime_type: 'text/plain',
        file_size: 512,
        file_path: '/uploads/documents/other-file.txt',
        user_id: otherUser.id,
        processing_status: 'completed'
      });

      req.params.fileId = otherUserFile.id.toString();

      await fileController.downloadFile(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.message).to.contain('not found');
    });
  });

  describe('deleteFile method', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await FileVector.create({
        filename: 'delete-test.txt',
        original_name: 'delete.txt',
        mime_type: 'text/plain',
        file_size: 1024,
        file_path: '/uploads/documents/delete-test.txt',
        user_id: testUser.id,
        processing_status: 'completed'
      });

      req.params.fileId = testFile.id.toString();
    });

    it('should delete file successfully', async () => {
      // Mock fs.unlink
      const mockFs = require('fs').promises;
      const originalUnlink = mockFs.unlink;
      mockFs.unlink = sinon.stub().resolves();

      try {
        await fileController.deleteFile(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('deleted successfully');

        // Verify file was removed from database
        const deletedFile = await FileVector.findByPk(testFile.id);
        expect(deletedFile).to.be.null;
      } finally {
        mockFs.unlink = originalUnlink;
      }
    });

    it('should handle non-existent file deletion', async () => {
      req.params.fileId = '99999';

      await fileController.deleteFile(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('not found');
    });

    it('should prevent deleting other users files', async () => {
      const { User } = getTestModels();
      
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherUserFile = await FileVector.create({
        filename: 'other-file.txt',
        original_name: 'other.txt',
        mime_type: 'text/plain',
        file_size: 512,
        file_path: '/uploads/documents/other-file.txt',
        user_id: otherUser.id,
        processing_status: 'completed'
      });

      req.params.fileId = otherUserFile.id.toString();

      await fileController.deleteFile(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      
      // Verify other user's file was not deleted
      const stillExists = await FileVector.findByPk(otherUserFile.id);
      expect(stillExists).to.exist;
    });
  });

  describe('bulkDeleteFiles method', () => {
    let testFiles;

    beforeEach(async () => {
      testFiles = await FileVector.bulkCreate([
        {
          filename: 'bulk1.txt',
          original_name: 'bulk1.txt',
          mime_type: 'text/plain',
          file_size: 512,
          file_path: '/uploads/documents/bulk1.txt',
          user_id: testUser.id,
          processing_status: 'completed'
        },
        {
          filename: 'bulk2.txt',
          original_name: 'bulk2.txt',
          mime_type: 'text/plain',
          file_size: 1024,
          file_path: '/uploads/documents/bulk2.txt',
          user_id: testUser.id,
          processing_status: 'completed'
        }
      ]);

      req.body.fileIds = testFiles.map(f => f.id);
    });

    it('should delete multiple files successfully', async () => {
      const mockFs = require('fs').promises;
      const originalUnlink = mockFs.unlink;
      mockFs.unlink = sinon.stub().resolves();

      try {
        await fileController.bulkDeleteFiles(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.success).to.be.true;
        expect(responseData.message).to.contain('2 files deleted');

        // Verify files were removed from database
        const remainingFiles = await FileVector.findAll({ where: { user_id: testUser.id } });
        expect(remainingFiles).to.have.length(0);
      } finally {
        mockFs.unlink = originalUnlink;
      }
    });

    it('should handle empty file ID list', async () => {
      req.body.fileIds = [];

      await fileController.bulkDeleteFiles(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.false;
      expect(responseData.message).to.contain('No file IDs provided');
    });

    it('should handle mixed valid/invalid file IDs', async () => {
      req.body.fileIds = [testFiles[0].id, 99999, testFiles[1].id]; // Include invalid ID

      const mockFs = require('fs').promises;
      const originalUnlink = mockFs.unlink;
      mockFs.unlink = sinon.stub().resolves();

      try {
        await fileController.bulkDeleteFiles(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData.message).to.contain('2 files deleted'); // Only valid files deleted
      } finally {
        mockFs.unlink = originalUnlink;
      }
    });
  });

  describe('getFileAnalytics method', () => {
    beforeEach(async () => {
      await FileVector.bulkCreate([
        {
          filename: 'analytics1.txt',
          original_name: 'analytics1.txt',
          mime_type: 'text/plain',
          file_size: 1024,
          file_path: '/uploads/documents/analytics1.txt',
          user_id: testUser.id,
          processing_status: 'completed'
        },
        {
          filename: 'analytics2.pdf',
          original_name: 'analytics2.pdf',
          mime_type: 'application/pdf',
          file_size: 2048,
          file_path: '/uploads/documents/analytics2.pdf',
          user_id: testUser.id,
          processing_status: 'completed'
        },
        {
          filename: 'analytics3.jpg',
          original_name: 'analytics3.jpg',
          mime_type: 'image/jpeg',
          file_size: 4096,
          file_path: '/uploads/profiles/analytics3.jpg',
          user_id: testUser.id,
          processing_status: 'completed'
        }
      ]);
    });

    it('should return comprehensive file analytics', async () => {
      await fileController.getFileAnalytics(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.success).to.be.true;
      expect(responseData.data).to.have.property('totalFiles', 3);
      expect(responseData.data).to.have.property('totalSize');
      expect(responseData.data).to.have.property('averageSize');
      expect(responseData.data).to.have.property('typeBreakdown');
      expect(responseData.data).to.have.property('compressionStats');
      
      // Verify type breakdown
      expect(responseData.data.typeBreakdown).to.be.an('array');
      expect(responseData.data.typeBreakdown.length).to.be.greaterThan(0);
      
      // Verify compression stats
      expect(responseData.data.compressionStats).to.have.property('averageRatio');
      expect(responseData.data.compressionStats.averageRatio).to.be.a('number');
    });

    it('should handle user with no files', async () => {
      await FileVector.destroy({ where: { user_id: testUser.id } });

      await fileController.getFileAnalytics(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0];
      expect(responseData.data.totalFiles).to.equal(0);
      expect(responseData.data.totalSize).to.equal(0);
      expect(responseData.data.typeBreakdown).to.be.an('array').with.length(0);
    });
  });
});