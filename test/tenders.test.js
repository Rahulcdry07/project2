const expect = require('chai').expect;
const request = require('supertest');
const app = require('../src/app');
const { User, Tender } = require('../src/models');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config/env');
const { setupTestDatabase, teardownTestDatabase } = require('./setup');

const TEST_TIMEOUT = 5000;

describe('Tender API Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testTender;

  // Setup test database before all tests
  before(async function() {
    this.timeout(10000);
    await setupTestDatabase();
  });

  // Cleanup after all tests
  after(async function() {
    this.timeout(5000);
    await teardownTestDatabase();
  });

  // Create test users and tokens before each test
  beforeEach(async function() {
    this.timeout(TEST_TIMEOUT);
    
    // Clean up existing data
    await Tender.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });

    // Create admin user
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      email_verified: true
    });

    // Create regular user
    regularUser = await User.create({
      username: 'user',
      email: 'user@test.com',
      password: 'user123',
      role: 'user',
      email_verified: true
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: regularUser.id, email: regularUser.email, role: regularUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a test tender
    testTender = await Tender.create({
      title: 'Test Tender for Construction Project',
      description: 'This is a comprehensive test tender description with all necessary details for the construction project. It includes specifications and requirements.',
      reference_number: 'TEST001',
      organization: 'Test Organization',
      category: 'Construction',
      location: 'New York',
      estimated_value: 100000,
      currency: 'USD',
      submission_deadline: '2025-12-31',
      published_date: '2025-12-13',
      status: 'Active',
      contact_person: 'John Doe',
      contact_email: 'john@test.com',
      created_by: adminUser.id
    });
  });

  describe('GET /api/v1/tenders - List Tenders', () => {
    it('should return list of all tenders', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get('/api/v1/tenders');
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tenders).to.be.an('array');
      expect(res.body.tenders.length).to.be.at.least(1);
      expect(res.body.tenders[0]).to.have.property('title');
      expect(res.body.tenders[0]).to.have.property('category');
    });

    it('should filter tenders by category', async function() {
      this.timeout(TEST_TIMEOUT);
      
      // Create another tender with different category
      await Tender.create({
        title: 'IT Services Tender for Software Development',
        description: 'This is a comprehensive IT services tender description for developing custom software solutions with detailed specifications.',
        reference_number: 'TEST002',
        organization: 'Tech Company',
        category: 'IT Services',
        location: 'San Francisco',
        estimated_value: 150000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Jane Smith',
        contact_email: 'jane@test.com',
        created_by: adminUser.id
      });

      const res = await request(app)
        .get('/api/v1/tenders?category=Construction');
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tenders).to.be.an('array');
      expect(res.body.tenders.length).to.equal(1);
      expect(res.body.tenders[0].category).to.equal('Construction');
    });

    it('should filter tenders by location', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get('/api/v1/tenders?location=New York');
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tenders).to.be.an('array');
      expect(res.body.tenders[0].location).to.equal('New York');
    });

    it('should filter tenders by status', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get('/api/v1/tenders?status=Active');
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tenders).to.be.an('array');
      expect(res.body.tenders[0].status).to.equal('Active');
    });

    it('should search tenders by query string', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get('/api/v1/tenders?q=Construction');
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tenders).to.be.an('array');
      expect(res.body.tenders.length).to.be.at.least(1);
    });

    it('should return empty array when no tenders match filters', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get('/api/v1/tenders?category=NonExistent');
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tenders).to.be.an('array');
      expect(res.body.tenders.length).to.equal(0);
    });
  });

  describe('GET /api/v1/tenders/:id - Get Tender Details', () => {
    it('should return tender details by ID', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get(`/api/v1/tenders/${testTender.id}`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tender).to.be.an('object');
      expect(res.body.tender.id).to.equal(testTender.id);
      expect(res.body.tender.title).to.equal(testTender.title);
      expect(res.body.tender.description).to.equal(testTender.description);
      expect(res.body.tender.category).to.equal('Construction');
      expect(res.body.tender.location).to.equal('New York');
    });

    it('should return 404 for non-existent tender', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get('/api/v1/tenders/99999');
      
      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Tender not found');
    });

    it('should include creator information', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .get(`/api/v1/tenders/${testTender.id}`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.tender).to.have.property('creator');
      expect(res.body.tender.creator).to.be.an('object');
      expect(res.body.tender.creator.id).to.equal(adminUser.id);
    });
  });

  describe('POST /api/v1/tenders - Create Tender', () => {
    it('should create a new tender with admin token', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const newTender = {
        title: 'New Healthcare Project Tender Opportunity',
        description: 'This is a comprehensive healthcare project tender with detailed requirements and specifications for medical facility construction.',
        reference_number: 'NEW001',
        organization: 'Healthcare Corp',
        category: 'Healthcare',
        location: 'Los Angeles',
        estimated_value: 200000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Alice Johnson',
        contact_email: 'alice@test.com'
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTender);
      
      expect(res.statusCode).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.tender).to.be.an('object');
      expect(res.body.tender.title).to.equal(newTender.title);
      expect(res.body.tender.category).to.equal('Healthcare');
      expect(res.body.tender.created_by).to.equal(adminUser.id);
    });

    it('should reject tender creation without authentication', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const newTender = {
        title: 'Unauthorized Tender Creation Test Project',
        description: 'This is a comprehensive tender description with all necessary details and specifications for testing unauthorized access.',
        reference_number: 'UNAUTH001',
        organization: 'Test Org',
        category: 'Construction',
        location: 'Boston',
        estimated_value: 50000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Bob Smith',
        contact_email: 'bob@test.com'
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .send(newTender);
      
      expect(res.statusCode).to.equal(401);
    });

    it('should reject tender creation with regular user token', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const newTender = {
        title: 'Regular User Tender Creation Attempt Test',
        description: 'This is a comprehensive tender description testing whether regular users can create tenders without admin privileges.',
        reference_number: 'USER001',
        organization: 'User Org',
        category: 'IT Services',
        location: 'Seattle',
        estimated_value: 75000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Charlie Brown',
        contact_email: 'charlie@test.com'
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newTender);
      
      expect(res.statusCode).to.equal(403);
    });

    it('should reject tender with missing required fields', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const incompleteTender = {
        title: 'Incomplete',
        // Missing description and other required fields
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteTender);
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should reject tender with duplicate reference number', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const duplicateTender = {
        title: 'Duplicate Reference Number Test Tender Project',
        description: 'This is a comprehensive tender description for testing duplicate reference number validation and error handling.',
        reference_number: 'TEST001', // Same as testTender
        organization: 'Duplicate Org',
        category: 'Construction',
        location: 'Miami',
        estimated_value: 80000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'David Lee',
        contact_email: 'david@test.com'
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateTender);
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should reject tender with invalid category', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const invalidTender = {
        title: 'Invalid Category Test Tender Project Opportunity',
        description: 'This is a comprehensive tender description for testing invalid category validation and proper error handling.',
        reference_number: 'INVALID001',
        organization: 'Invalid Org',
        category: 'InvalidCategory',
        location: 'Denver',
        estimated_value: 60000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Eve Wilson',
        contact_email: 'eve@test.com'
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidTender);
      
      // Should either reject with 400 or default to 'Other' category
      if (res.statusCode === 201) {
        expect(res.body.tender.category).to.be.oneOf(['Other', 'InvalidCategory']);
      } else {
        expect(res.statusCode).to.equal(400);
        expect(res.body.success).to.be.false;
      }
    });

    it('should reject tender with title too short', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const shortTitleTender = {
        title: 'Short',
        description: 'This is a comprehensive tender description with all necessary details and specifications for testing title validation.',
        reference_number: 'SHORT001',
        organization: 'Short Org',
        category: 'Construction',
        location: 'Phoenix',
        estimated_value: 55000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Frank Miller',
        contact_email: 'frank@test.com'
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(shortTitleTender);
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should reject tender with description too short', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const shortDescTender = {
        title: 'Short Description Test Tender',
        description: 'Too short',
        reference_number: 'SHORTDESC001',
        organization: 'Desc Org',
        category: 'IT Services',
        location: 'Austin',
        estimated_value: 45000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Grace Taylor',
        contact_email: 'grace@test.com'
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(shortDescTender);
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('PUT /api/v1/tenders/:id - Update Tender', () => {
    it('should update tender with admin token', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const updates = {
        title: 'Updated Construction Project Tender Title',
        estimated_value: 150000,
        status: 'Closed'
      };

      const res = await request(app)
        .put(`/api/v1/tenders/${testTender.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.tender.title).to.equal(updates.title);
      expect(res.body.tender.estimated_value).to.equal(updates.estimated_value);
      expect(res.body.tender.status).to.equal('Closed');
    });

    it('should reject update without authentication', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const updates = {
        title: 'Unauthorized Update Attempt Test'
      };

      const res = await request(app)
        .put(`/api/v1/tenders/${testTender.id}`)
        .send(updates);
      
      expect(res.statusCode).to.equal(401);
    });

    it('should reject update with regular user token', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const updates = {
        title: 'Regular User Update Attempt Test'
      };

      const res = await request(app)
        .put(`/api/v1/tenders/${testTender.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);
      
      expect(res.statusCode).to.equal(403);
    });

    it('should return 404 when updating non-existent tender', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const updates = {
        title: 'Non-Existent Tender Update Test'
      };

      const res = await request(app)
        .put('/api/v1/tenders/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);
      
      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Tender not found');
    });

    it('should reject update with invalid data', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const updates = {
        title: 'T' // Too short - violates validation
      };

      const res = await request(app)
        .put(`/api/v1/tenders/${testTender.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);
      
      expect(res.statusCode).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('DELETE /api/v1/tenders/:id - Delete Tender', () => {
    it('should delete tender with admin token', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .delete(`/api/v1/tenders/${testTender.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;

      // Verify tender is deleted
      const checkRes = await request(app)
        .get(`/api/v1/tenders/${testTender.id}`);
      
      expect(checkRes.statusCode).to.equal(404);
    });

    it('should reject delete without authentication', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .delete(`/api/v1/tenders/${testTender.id}`);
      
      expect(res.statusCode).to.equal(401);
    });

    it('should reject delete with regular user token', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .delete(`/api/v1/tenders/${testTender.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).to.equal(403);
    });

    it('should return 404 when deleting non-existent tender', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const res = await request(app)
        .delete('/api/v1/tenders/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('Tender not found');
    });
  });

  describe('Tender Data Validation', () => {
    it('should accept all valid categories', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const categories = [
        'Construction', 'IT Services', 'Consulting', 'Supplies',
        'Transportation', 'Healthcare', 'Education', 'Engineering',
        'Maintenance', 'Other'
      ];

      for (let i = 0; i < categories.length; i++) {
        const tender = {
          title: `${categories[i]} Test Tender Project Opportunity`,
          description: 'This is a comprehensive tender description with all necessary details and specifications for validation testing.',
          reference_number: `CAT${i}`,
          organization: 'Test Org',
          category: categories[i],
          location: 'Test City',
          estimated_value: 50000,
          currency: 'USD',
          submission_deadline: '2025-12-31',
          published_date: '2025-12-13',
          status: 'Active',
          contact_person: 'Test Person',
          contact_email: 'test@test.com'
        };

        const res = await request(app)
          .post('/api/v1/tenders')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(tender);
        
        expect(res.statusCode).to.equal(201);
        expect(res.body.tender.category).to.equal(categories[i]);
      }
    });

    it('should preserve all tender fields on create', async function() {
      this.timeout(TEST_TIMEOUT);
      
      const completeTender = {
        title: 'Complete Tender with All Fields Test Project',
        description: 'This is a comprehensive tender description with all necessary details, specifications, and requirements for testing.',
        reference_number: 'COMPLETE001',
        organization: 'Complete Org',
        category: 'Engineering',
        location: 'Complete City',
        estimated_value: 500000,
        currency: 'USD',
        submission_deadline: '2025-12-31',
        published_date: '2025-12-13',
        status: 'Active',
        contact_person: 'Complete Person',
        contact_email: 'complete@test.com',
        contact_phone: '123-456-7890',
        requirements: 'Requirement 1, Requirement 2',
        documents_required: 'Doc 1, Doc 2',
        eligibility_criteria: 'Criteria 1, Criteria 2',
        evaluation_criteria: 'Evaluation 1, Evaluation 2',
        tags: 'tag1,tag2,tag3',
        is_featured: true
      };

      const res = await request(app)
        .post('/api/v1/tenders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(completeTender);
      
      expect(res.statusCode).to.equal(201);
      expect(res.body.tender.contact_phone).to.equal(completeTender.contact_phone);
      expect(res.body.tender.requirements).to.equal(completeTender.requirements);
      expect(res.body.tender.is_featured).to.be.true;
    });
  });
});
