/**
 * Enhanced Model tests - Unit tests for FileVector model and enhanced User model
 */
const expect = require('chai').expect;
const bcrypt = require('bcrypt');

// Import test utilities
const { setupTestDatabase, teardownTestDatabase, getTestModels } = require('./setup');

describe('Enhanced Models', () => {
  let User, FileVector, sequelize;

  before(async function() {
    this.timeout(10000);
    await setupTestDatabase();
    const testModels = getTestModels();
    User = testModels.User;
    FileVector = testModels.FileVector;
    sequelize = testModels.sequelize;
  });

  after(async function() {
    this.timeout(5000);
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await FileVector.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Enhanced User Model', () => {
    it('should create user with enhanced fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        bio: 'Test user bio',
        date_of_birth: '1990-01-01',
        profile_picture_url: '/uploads/profiles/pic.jpg',
        two_factor_enabled: false,
        notification_preferences: {
          email_notifications: true,
          security_alerts: true
        },
        session_timeout: 3600
      };

      const user = await User.create(userData);

      expect(user).to.exist;
      expect(user.id).to.be.a('number');
      expect(user.username).to.equal('testuser');
      expect(user.email).to.equal('test@example.com');
      expect(user.first_name).to.equal('John');
      expect(user.last_name).to.equal('Doe');
      expect(user.phone).to.equal('+1234567890');
      expect(user.bio).to.equal('Test user bio');
      expect(user.date_of_birth).to.equal('1990-01-01');
      expect(user.profile_picture_url).to.equal('/uploads/profiles/pic.jpg');
      expect(user.two_factor_enabled).to.be.false;
      expect(user.notification_preferences).to.be.an('object');
      expect(user.session_timeout).to.equal(3600);
      expect(user.is_verified).to.be.false; // Default value
      expect(user.role).to.equal('user'); // Default value
    });

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('email');
      }
    });

    it('should validate username length', async () => {
      const userData = {
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'password123'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('username');
      }
    });

    it('should validate password length', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Too short
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('password');
      }
    });

    it('should validate phone number format', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        phone: '123' // Invalid format
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('phone');
      }
    });

    it('should validate bio length', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        bio: 'a'.repeat(1001) // Too long
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('bio');
      }
    });

    it('should validate role enum values', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid_role'
      };

      try {
        await User.create(userData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('role');
      }
    });

    it('should enforce unique email constraint', async () => {
      const userData1 = {
        username: 'user1',
        email: 'same@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'user2',
        email: 'same@example.com', // Duplicate email
        password: 'password456'
      };

      await User.create(userData1);

      try {
        await User.create(userData2);
        expect.fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeUniqueConstraintError');
      }
    });

    it('should enforce unique username constraint', async () => {
      const userData1 = {
        username: 'sameuser',
        email: 'user1@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'sameuser', // Duplicate username
        email: 'user2@example.com',
        password: 'password456'
      };

      await User.create(userData1);

      try {
        await User.create(userData2);
        expect.fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeUniqueConstraintError');
      }
    });

    it('should hash password automatically', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };

      const user = await User.create(userData);
      
      expect(user.password).to.not.equal('plainpassword');
      expect(user.password).to.have.length.greaterThan(20); // Hashed password should be longer
      
      // Verify password can be compared
      const isValid = await bcrypt.compare('plainpassword', user.password);
      expect(isValid).to.be.true;
    });

    it('should set default values correctly', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user.role).to.equal('user');
      expect(user.is_verified).to.be.false;
      expect(user.two_factor_enabled).to.be.false;
      expect(user.login_count).to.equal(0);
      expect(user.session_timeout).to.equal(3600);
      expect(user.notification_preferences).to.deep.equal({
        email_notifications: true,
        security_alerts: true
      });
    });

    it('should update login statistics', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      // Simulate login
      await user.update({
        login_count: user.login_count + 1,
        last_login_at: new Date()
      });

      expect(user.login_count).to.equal(1);
      expect(user.last_login_at).to.be.a('date');
    });
  });

  describe('FileVector Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'fileuser',
        email: 'file@example.com',
        password: 'password123'
      });
    });

    it('should create FileVector with all required fields', async () => {
      const fileData = {
        filename: 'test-file-123.pdf',
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/documents/test-file-123.pdf',
        user_id: testUser.id,
        compression_ratio: 0.8,
        metadata: {
          pages: 5,
          author: 'Test Author'
        }
      };

      const file = await FileVector.create(fileData);

      expect(file).to.exist;
      expect(file.id).to.be.a('number');
      expect(file.filename).to.equal('test-file-123.pdf');
      expect(file.originalname).to.equal('document.pdf');
      expect(file.mimetype).to.equal('application/pdf');
      expect(file.size).to.equal(1024);
      expect(file.path).to.equal('/uploads/documents/test-file-123.pdf');
      expect(file.user_id).to.equal(testUser.id);
      expect(file.compression_ratio).to.equal(0.8);
      expect(file.metadata).to.deep.equal({
        pages: 5,
        author: 'Test Author'
      });
      expect(file.is_processed).to.be.false; // Default value
    });

    it('should validate required fields', async () => {
      const fileData = {
        // Missing required fields
        originalname: 'document.pdf'
      };

      try {
        await FileVector.create(fileData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });

    it('should validate filename length', async () => {
      const fileData = {
        filename: '', // Empty filename
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/documents/file.pdf',
        user_id: testUser.id
      };

      try {
        await FileVector.create(fileData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('filename');
      }
    });

    it('should validate mimetype format', async () => {
      const fileData = {
        filename: 'test.pdf',
        originalname: 'document.pdf',
        mimetype: 'invalid-mimetype', // Invalid format
        size: 1024,
        path: '/uploads/documents/test.pdf',
        user_id: testUser.id
      };

      try {
        await FileVector.create(fileData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('mimetype');
      }
    });

    it('should validate file size limits', async () => {
      const fileData = {
        filename: 'huge-file.pdf',
        originalname: 'huge.pdf',
        mimetype: 'application/pdf',
        size: 200 * 1024 * 1024, // 200MB - exceeds limit
        path: '/uploads/documents/huge-file.pdf',
        user_id: testUser.id
      };

      try {
        await FileVector.create(fileData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('size');
      }
    });

    it('should validate compression ratio range', async () => {
      const fileData = {
        filename: 'test.pdf',
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/documents/test.pdf',
        user_id: testUser.id,
        compression_ratio: 1.5 // Invalid - greater than 1.0
      };

      try {
        await FileVector.create(fileData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
        expect(error.errors[0].path).to.equal('compression_ratio');
      }
    });

    it('should handle JSON metadata properly', async () => {
      const complexMetadata = {
        imageProperties: {
          width: 1920,
          height: 1080,
          colorSpace: 'RGB'
        },
        exifData: {
          camera: 'Canon EOS',
          dateTaken: '2024-01-01T12:00:00Z'
        },
        tags: ['vacation', 'nature', 'landscape']
      };

      const fileData = {
        filename: 'photo.jpg',
        originalname: 'vacation.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
        path: '/uploads/profiles/photo.jpg',
        user_id: testUser.id,
        metadata: complexMetadata
      };

      const file = await FileVector.create(fileData);

      expect(file.metadata).to.deep.equal(complexMetadata);
      expect(file.metadata.imageProperties.width).to.equal(1920);
      expect(file.metadata.tags).to.include('vacation');
    });

    it('should set default values correctly', async () => {
      const fileData = {
        filename: 'simple.txt',
        originalname: 'simple.txt',
        mimetype: 'text/plain',
        size: 512,
        path: '/uploads/documents/simple.txt',
        user_id: testUser.id
      };

      const file = await FileVector.create(fileData);

      expect(file.compression_ratio).to.equal(1.0);
      expect(file.metadata).to.deep.equal({});
      expect(file.is_processed).to.be.false;
      expect(file.thumbnail_path).to.be.null;
      expect(file.webp_path).to.be.null;
    });

    it('should enforce foreign key constraint', async () => {
      const fileData = {
        filename: 'orphan.txt',
        originalname: 'orphan.txt',
        mimetype: 'text/plain',
        size: 512,
        path: '/uploads/documents/orphan.txt',
        user_id: 99999 // Non-existent user
      };

      try {
        await FileVector.create(fileData);
        expect.fail('Should have thrown foreign key constraint error');
      } catch (error) {
        expect(error.name).to.equal('SequelizeForeignKeyConstraintError');
      }
    });

    it('should support bulk operations', async () => {
      const filesData = [
        {
          filename: 'file1.txt',
          originalname: 'file1.txt',
          mimetype: 'text/plain',
          size: 100,
          path: '/uploads/documents/file1.txt',
          user_id: testUser.id
        },
        {
          filename: 'file2.pdf',
          originalname: 'file2.pdf',
          mimetype: 'application/pdf',
          size: 200,
          path: '/uploads/documents/file2.pdf',
          user_id: testUser.id
        }
      ];

      const files = await FileVector.bulkCreate(filesData);

      expect(files).to.have.length(2);
      expect(files[0].filename).to.equal('file1.txt');
      expect(files[1].filename).to.equal('file2.pdf');
    });

    it('should support complex queries and associations', async () => {
      await FileVector.create({
        filename: 'user-file.pdf',
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/documents/user-file.pdf',
        user_id: testUser.id
      });

      // Query with association
      const userWithFiles = await User.findOne({
        where: { id: testUser.id },
        include: [FileVector]
      });

      expect(userWithFiles.FileVectors).to.have.length(1);
      expect(userWithFiles.FileVectors[0].filename).to.equal('user-file.pdf');

      // Query files by mimetype
      const pdfFiles = await FileVector.findAll({
        where: {
          mimetype: 'application/pdf'
        }
      });

      expect(pdfFiles).to.have.length(1);

      // Aggregate queries
      const totalSize = await FileVector.sum('size', {
        where: { user_id: testUser.id }
      });

      expect(totalSize).to.equal(1024);
    });

    it('should handle file processing updates', async () => {
      const file = await FileVector.create({
        filename: 'image.jpg',
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
        path: '/uploads/profiles/image.jpg',
        user_id: testUser.id
      });

      // Simulate image processing
      await file.update({
        is_processed: true,
        thumbnail_path: '/uploads/profiles/thumb-image.jpg',
        webp_path: '/uploads/profiles/image.webp',
        compression_ratio: 0.7,
        metadata: {
          originalSize: 2048,
          compressedSize: 1434,
          dimensions: { width: 800, height: 600 }
        }
      });

      expect(file.is_processed).to.be.true;
      expect(file.thumbnail_path).to.equal('/uploads/profiles/thumb-image.jpg');
      expect(file.webp_path).to.equal('/uploads/profiles/image.webp');
      expect(file.compression_ratio).to.equal(0.7);
      expect(file.metadata.dimensions.width).to.equal(800);
    });
  });

  describe('Model Associations', () => {
    let testUser, testFiles;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'associationuser',
        email: 'assoc@example.com',
        password: 'password123'
      });

      testFiles = await FileVector.bulkCreate([
        {
          filename: 'file1.txt',
          originalname: 'file1.txt',
          mimetype: 'text/plain',
          size: 100,
          path: '/uploads/documents/file1.txt',
          user_id: testUser.id
        },
        {
          filename: 'file2.jpg',
          originalname: 'photo.jpg',
          mimetype: 'image/jpeg',
          size: 2000,
          path: '/uploads/profiles/file2.jpg',
          user_id: testUser.id
        }
      ]);
    });

    it('should maintain user-file associations', async () => {
      const userFiles = await testUser.getFileVectors();
      expect(userFiles).to.have.length(2);

      const file = await FileVector.findByPk(testFiles[0].id);
      const fileOwner = await file.getUser();
      expect(fileOwner.id).to.equal(testUser.id);
    });

    it('should cascade delete files when user is deleted', async () => {
      await testUser.destroy();

      const remainingFiles = await FileVector.findAll({
        where: { user_id: testUser.id }
      });

      // This depends on your cascade configuration
      // If set to CASCADE, files should be deleted
      // If set to RESTRICT, this would throw an error
      expect(remainingFiles).to.have.length(0);
    });

    it('should support filtering files by user', async () => {
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123'
      });

      await FileVector.create({
        filename: 'another-file.txt',
        originalname: 'another.txt',
        mimetype: 'text/plain',
        size: 300,
        path: '/uploads/documents/another-file.txt',
        user_id: anotherUser.id
      });

      const userFiles = await FileVector.findAll({
        where: { user_id: testUser.id }
      });

      const anotherUserFiles = await FileVector.findAll({
        where: { user_id: anotherUser.id }
      });

      expect(userFiles).to.have.length(2);
      expect(anotherUserFiles).to.have.length(1);
      expect(anotherUserFiles[0].filename).to.equal('another-file.txt');
    });
  });
});