import { jest } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Global setup before all tests
  process.env.NODE_ENV = 'test';
  process.env.CONFIG_PATH = './tests/fixtures/test-config.yaml';
});

afterAll(async () => {
  // Global cleanup after all tests
});

// Mock external services by default
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

// Increase timeout for browser tests
jest.setTimeout(30000);
