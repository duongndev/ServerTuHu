// Mock logger for tests
class MockLogger {
  async info(message, meta = {}) {
    console.log(`[INFO] ${message}`, meta);
  }

  async warn(message, meta = {}) {
    console.warn(`[WARN] ${message}`, meta);
  }

  async error(message, meta = {}) {
    console.error(`[ERROR] ${message}`, meta);
  }

  async debug(message, meta = {}) {
    console.debug(`[DEBUG] ${message}`, meta);
  }

  async rotateLogs() {
    // Mock implementation
  }
}

export default new MockLogger();
