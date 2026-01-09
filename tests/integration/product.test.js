import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import { connect, closeDatabase, clearDatabase } from '../utils/test_db.js';
import User from '../../src/models/user.model.js';
import Category from '../../src/models/category.model.js';
import Product from '../../src/models/product.model.js';

// Setup Mocks
let app;

// Mock Cloudinary
jest.unstable_mockModule('../../src/config/cloudinary.config.js', () => ({
  default: {
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
        public_id: 'sample'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}));

// Mock DB config
jest.unstable_mockModule('../../src/config/db.js', () => ({
  connectDB: jest.fn(),
  connectCloudinary: jest.fn()
}));

const imagePath = path.resolve('tests/fixtures/test_image.jpg');

describe('Product Integration Tests', () => {
  let adminToken;
  let categoryId;

  beforeAll(async () => {
    // Setup env
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET = "test_access_secret";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
    process.env.CLOUDINARY_CLOUD_NAME = "test";
    process.env.CLOUDINARY_API_KEY = "test";
    process.env.CLOUDINARY_API_SECRET_KEY = "test";

    // Import app
    const mod = await import('../../src/app.js');
    app = mod.default;

    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    // Create Admin User
    const adminUser = await User.create({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "Password@123",
      role: "admin"
    });

    // Login to get token
    const res = await request(app).post('/api/auth/login').send({
      email: "admin@example.com",
      password: "Password@123"
    });
    adminToken = res.body.data.accessToken;

    // Create a Category
    const category = await Category.create({
      name: "Breads",
      description: "Delicious breads"
    });
    categoryId = category._id.toString();
  });

  describe('POST /api/products/create', () => {
    it('should create a product successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/products/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Croissant')
        .field('description', 'Buttery flaky croissant')
        .field('price', 25000)
        .field('category_id', categoryId)
        .attach('file', imagePath);

      // If middleware is bugged, this will typically return 400 (validation error) 
      // because fields are not parsed before validation.
      
      if (res.status !== 201) {
          console.log('Create Product Failed:', res.body);
      }

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Croissant');
    });

    it('should fail if image is missing', async () => {
        const res = await request(app)
          .post('/api/products/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('name', 'Croissant No Image')
          .field('description', 'Buttery flaky croissant')
          .field('price', 25000)
          .field('category_id', categoryId);
  
        // Expect 400
        expect(res.status).toBe(400);
    });
  });

  describe('GET /api/products/all', () => {
      it('should get all products', async () => {
          // Create a product without API first (directly to DB)
          await Product.create({
              name: "Baguette",
              description: "Long bread",
              price: 15000,
              category_id: categoryId,
              imgUrl: "http://example.com/img.jpg"
          });

          const res = await request(app).get('/api/products/all');
          expect(res.status).toBe(200);
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].name).toBe("Baguette");
      });
  });
});
