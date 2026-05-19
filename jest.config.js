export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          }
        }]
      ]
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(cloudinary|multer-storage-cloudinary)/)'
  ],
  moduleNameMapper: {
    '^../src/utils/logger.util.js$': '<rootDir>/src/utils/logger.util.mock.js',
    '^../src/config/db.js$': '<rootDir>/tests/mocks/db.mock.js',
    '^../src/app.js$': '<rootDir>/tests/mocks/app.mock.js'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**',
    '!src/middlewares/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
