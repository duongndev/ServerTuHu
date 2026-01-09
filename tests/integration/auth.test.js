import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../../src/models/user.model.js';
import BlacklistedToken from '../../src/models/blacklistedToken.model.js';
import { connect, closeDatabase, clearDatabase } from '../utils/test_db.js';

// Define app variable
let app;

// Mock db config to prevent app.js from connecting
jest.unstable_mockModule('../../src/config/db.js', () => ({
  connectDB: jest.fn(),
  connectCloudinary: jest.fn()
}));

describe('Auth Integration Tests', () => {
  let server;

  beforeAll(async () => {
    // Set environment variables
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET = "test_access_secret";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
    
    // Import app dynamically (will use mocked db.js)
    const mod = await import('../../src/app.js');
    app = mod.default;

    // Connect to test database
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    const newUser = {
      fullName: "Test User",
      email: "test@example.com",
      password: "Password@123",
      confirmPassword: "Password@123"
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', newUser.email);
    });

    it('should fail if email already exists', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(newUser);

      // Second registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exists/i);
    });

    it('should fail if passwords do not match', async () => {
      const badUser = { ...newUser, confirmPassword: "WrongPassword" };
      const res = await request(app)
        .post('/api/auth/register')
        .send(badUser);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginUser = {
      fullName: "Login User",
      email: "login@example.com",
      password: "Password@123",
      confirmPassword: "Password@123"
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(loginUser);
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginUser.email,
          password: loginUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginUser.email,
          password: "WrongPassword@123"
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;

    beforeEach(async () => {
      // Register
      const user = {
        fullName: "Logout User",
        email: "logout@example.com",
        password: "Password@123",
        confirmPassword: "Password@123"
      };
      await request(app).post('/api/auth/register').send(user);

      // Login
      const res = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: user.password
      });
      accessToken = res.body.data.accessToken;
    });

    it('should logout and blacklist token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      // Verify token is blacklisted in DB
      const blacklisted = await BlacklistedToken.findOne({ token: accessToken });
      expect(blacklisted).toBeTruthy();
    });

    it('should not allow access with blacklisted token', async () => {
      // 1. Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      // 2. Try to access profile
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(401);
    });
  });
});
