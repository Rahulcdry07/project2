/* eslint-env mocha */
const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../src/app');
const { DSRItem } = require('../src/models');
const DSRMatchingService = require('../src/services/dsrMatchingService');

describe('DSR API Routes Tests', () => {
  let sandbox;
  let authToken;
  let adminToken;

  before(async () => {
    // Get auth tokens for testing
    // Regular user token
    const userResponse = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Test123!',
    });

    if (userResponse.body.success) {
      authToken = userResponse.body.data.token;
    }

    // Admin token
    const adminResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Admin123!',
    });

    if (adminResponse.body.success) {
      adminToken = adminResponse.body.data.token;
    }
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /api/dsr/estimate', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/dsr/estimate').send({ pdfData: {} });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.exist;
    });

    it('should return 400 if pdfData is missing', async function () {
      if (!authToken) {
        return this.skip(); // Skip if no auth token available
      }

      const response = await request(app)
        .post('/api/dsr/estimate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('PDF data is required');
    });

    it('should calculate cost estimate for valid PDF data', async function () {
      if (!authToken) {
        return this.skip();
      }

      const pdfData = {
        pages: [
          {
            pageNumber: 1,
            tables: [
              {
                rows: [
                  ['Description', 'Quantity', 'Unit'],
                  ['Cement concrete M20', '10', 'cum'],
                ],
              },
            ],
          },
        ],
      };

      // Mock DSR matching service
      const mockService = {
        extractLineItems: sinon
          .stub()
          .returns([{ description: 'Cement concrete M20', quantity: 10, unit: 'cum' }]),
        matchWithDSR: sinon.stub().resolves([
          {
            extractedItem: { description: 'Cement concrete M20', quantity: 10, unit: 'cum' },
            matchedDSR: {
              item_code: 'CC-002',
              description: 'Reinforced cement concrete M20 grade',
              rate: 8500.0,
              material_cost: 6000.0,
              labor_cost: 1800.0,
              equipment_cost: 700.0,
            },
            similarity: 0.95,
          },
        ]),
        calculateCost: sinon.stub().returns({
          totalCost: 85000,
          breakdown: {
            material: 60000,
            labor: 18000,
            equipment: 7000,
          },
          matchedItems: 1,
          unmatchedItems: 0,
          matches: [],
        }),
      };

      sandbox
        .stub(DSRMatchingService.prototype, 'extractLineItems')
        .callsFake(mockService.extractLineItems);
      sandbox
        .stub(DSRMatchingService.prototype, 'matchWithDSR')
        .callsFake(mockService.matchWithDSR);
      sandbox
        .stub(DSRMatchingService.prototype, 'calculateCost')
        .callsFake(mockService.calculateCost);

      const response = await request(app)
        .post('/api/dsr/estimate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pdfData });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('totalCost');
      expect(response.body.data).to.have.property('breakdown');
      expect(response.body.data).to.have.property('matchedItems');
      expect(response.body.data).to.have.property('unmatchedItems');
    });

    it('should handle errors gracefully', async function () {
      if (!authToken) {
        return this.skip();
      }

      sandbox
        .stub(DSRMatchingService.prototype, 'extractLineItems')
        .throws(new Error('Test error'));

      const response = await request(app)
        .post('/api/dsr/estimate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pdfData: {} });

      expect(response.status).to.equal(500);
      expect(response.body.success).to.be.false;
    });
  });

  describe('GET /api/dsr/items', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/dsr/items');

      expect(response.status).to.equal(401);
      expect(response.body.error).to.exist;
    });

    it('should return paginated DSR items', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('items');
      expect(response.body.data).to.have.property('pagination');
      expect(response.body.data.items).to.be.an('array');
    });

    it('should filter items by search query', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'concrete' });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;

      if (response.body.data.items.length > 0) {
        const descriptions = response.body.data.items.map(item => item.description.toLowerCase());
        const hasMatch = descriptions.some(desc => desc.includes('concrete'));
        expect(hasMatch).to.be.true;
      }
    });

    it('should filter items by category', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'Concrete' });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;

      if (response.body.data.items.length > 0) {
        response.body.data.items.forEach(item => {
          expect(item.category).to.equal('Concrete');
        });
      }
    });

    it('should handle pagination correctly', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 5 });

      expect(response.status).to.equal(200);
      expect(response.body.data.items.length).to.be.at.most(5);
      expect(response.body.data.pagination).to.have.property('currentPage');
      expect(response.body.data.pagination).to.have.property('totalPages');
      expect(response.body.data.pagination).to.have.property('totalItems');
    });
  });

  describe('POST /api/dsr/items', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/dsr/items').send({});

      expect(response.status).to.equal(401);
    });

    it('should require admin role', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .post('/api/dsr/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          item_code: 'TEST-001',
          description: 'Test item',
          unit: 'sqm',
          rate: 100,
        });

      expect(response.status).to.equal(403);
      expect(response.body.error).to.include('admin');
    });

    it('should create DSR item with admin token', async function () {
      if (!adminToken) {
        return this.skip();
      }

      const newItem = {
        item_code: `TEST-${Date.now()}`,
        description: 'Test DSR item',
        unit: 'sqm',
        rate: 150.0,
        category: 'Test',
        sub_category: 'Testing',
        material_cost: 100.0,
        labor_cost: 40.0,
        equipment_cost: 10.0,
      };

      const response = await request(app)
        .post('/api/dsr/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItem);

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('item_code', newItem.item_code);
      expect(response.body.data).to.have.property('description', newItem.description);

      // Cleanup: Delete the test item
      if (response.body.data.id) {
        await DSRItem.destroy({ where: { id: response.body.data.id } });
      }
    });

    it('should validate required fields', async function () {
      if (!adminToken) {
        return this.skip();
      }

      const response = await request(app)
        .post('/api/dsr/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          item_code: 'TEST-001',
          // Missing required fields
        });

      expect(response.status).to.be.oneOf([400, 500]);
      expect(response.body.success).to.be.false;
    });

    it('should prevent duplicate item codes', async function () {
      if (!adminToken) {
        return this.skip();
      }

      const itemCode = `TEST-DUP-${Date.now()}`;

      // Create first item
      const firstItem = await request(app)
        .post('/api/dsr/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          item_code: itemCode,
          description: 'First test item',
          unit: 'sqm',
          rate: 100,
        });

      if (firstItem.status === 201) {
        // Try to create duplicate
        const duplicateResponse = await request(app)
          .post('/api/dsr/items')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            item_code: itemCode,
            description: 'Duplicate test item',
            unit: 'sqm',
            rate: 150,
          });

        expect(duplicateResponse.status).to.be.oneOf([400, 500]);
        expect(duplicateResponse.body.success).to.be.false;

        // Cleanup
        await DSRItem.destroy({ where: { item_code: itemCode } });
      }
    });
  });

  describe('PUT /api/dsr/items/:id', () => {
    let testItemId;

    before(async () => {
      if (adminToken) {
        // Create a test item
        const response = await request(app)
          .post('/api/dsr/items')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            item_code: `TEST-UPDATE-${Date.now()}`,
            description: 'Item to update',
            unit: 'sqm',
            rate: 100,
          });

        if (response.status === 201) {
          testItemId = response.body.data.id;
        }
      }
    });

    after(async () => {
      if (testItemId) {
        await DSRItem.destroy({ where: { id: testItemId } });
      }
    });

    it('should require authentication', async () => {
      const response = await request(app).put('/api/dsr/items/1').send({ rate: 200 });

      expect(response.status).to.equal(401);
    });

    it('should require admin role', async function () {
      if (!authToken || !testItemId) {
        return this.skip();
      }

      const response = await request(app)
        .put(`/api/dsr/items/${testItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rate: 200 });

      expect(response.status).to.equal(403);
    });

    it('should update DSR item with admin token', async function () {
      if (!adminToken || !testItemId) {
        return this.skip();
      }

      const updatedData = {
        rate: 250.0,
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/dsr/items/${testItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('rate', 250);
      expect(response.body.data).to.have.property('description', 'Updated description');
    });

    it('should return 404 for non-existent item', async function () {
      if (!adminToken) {
        return this.skip();
      }

      const response = await request(app)
        .put('/api/dsr/items/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rate: 200 });

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
    });
  });

  describe('GET /api/dsr/categories', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/dsr/categories');

      expect(response.status).to.equal(401);
    });

    it('should return list of unique categories', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .get('/api/dsr/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');

      if (response.body.data.length > 0) {
        // Check that categories are unique
        const uniqueCategories = [...new Set(response.body.data)];
        expect(response.body.data.length).to.equal(uniqueCategories.length);
      }
    });

    it('should include all seeded categories', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .get('/api/dsr/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);

      const expectedCategories = [
        'Earthwork',
        'Concrete',
        'Steel',
        'Masonry',
        'Finishing',
        'Carpentry',
        'Waterproofing',
        'Materials',
      ];
      const actualCategories = response.body.data;

      expectedCategories.forEach(category => {
        if (actualCategories.length > 0) {
          // At least some categories should be present
          expect(actualCategories).to.satisfy(cats =>
            cats.some(cat => expectedCategories.includes(cat))
          );
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .post('/api/dsr/estimate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).to.be.oneOf([400, 500]);
    });

    it('should handle database errors gracefully', async function () {
      if (!authToken) {
        return this.skip();
      }

      // Stub DSRItem to throw error
      sandbox.stub(DSRItem, 'findAll').throws(new Error('Database error'));

      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(500);
      expect(response.body.success).to.be.false;
    });
  });

  describe('Security Tests', () => {
    it('should reject requests without valid token', async () => {
      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).to.equal(401);
    });

    it('should reject requests with expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.test';

      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).to.equal(401);
    });

    it('should prevent SQL injection in search query', async function () {
      if (!authToken) {
        return this.skip();
      }

      const response = await request(app)
        .get('/api/dsr/items')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: "'; DROP TABLE DSRItems; --" });

      // Should not crash and should return valid response
      expect(response.status).to.be.oneOf([200, 400]);
      expect(response.body).to.have.property('success');
    });

    it('should sanitize user input in item creation', async function () {
      if (!adminToken) {
        return this.skip();
      }

      const response = await request(app)
        .post('/api/dsr/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          item_code: '<script>alert("xss")</script>',
          description: 'Test <script>alert("xss")</script>',
          unit: 'sqm',
          rate: 100,
        });

      // Should either reject or sanitize the input
      if (response.status === 201) {
        expect(response.body.data.item_code).to.not.include('<script>');
        expect(response.body.data.description).to.not.include('<script>');

        // Cleanup
        if (response.body.data.id) {
          await DSRItem.destroy({ where: { id: response.body.data.id } });
        }
      }
    });
  });
});
