import { jest } from '@jest/globals';

// Mock OpenAI
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"result": "mocked response"}'
            }
          }
        ]
      })
    }
  }
};

// Mock Anthropic
export const mockAnthropic = {
  messages: {
    create: jest.fn().mockResolvedValue({
      content: [
        {
          text: '{"result": "mocked response"}'
        }
      ]
    })
  }
};

// Mock Axios for Ollama/JAN
export const mockAxios = {
  post: jest.fn().mockResolvedValue({
    data: {
      response: '{"result": "mocked response"}'
    }
  })
};

// Mock Browser/Page
export const mockPage = {
  goto: jest.fn().mockResolvedValue(null),
  click: jest.fn().mockResolvedValue(null),
  type: jest.fn().mockResolvedValue(null),
  waitForSelector: jest.fn().mockResolvedValue({}),
  waitForURL: jest.fn().mockResolvedValue(null),
  content: jest.fn().mockResolvedValue('<html><body>Test content</body></html>'),
  screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
  locator: jest.fn().mockReturnValue({
    textContent: jest.fn().mockResolvedValue('Sample text'),
    getAttribute: jest.fn().mockResolvedValue('sample-value')
  }),
  $eval: jest.fn().mockResolvedValue('Sample result'),
  $$eval: jest.fn().mockResolvedValue([]),
  close: jest.fn().mockResolvedValue(null)
};

// Mock PageInfo
export const mockPageInfo = {
  id: 'test-page-id',
  page: mockPage,
  context: null,
  createdAt: new Date()
};

// Mock Logger
export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis()
};

export const mockContext = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(null)
};

export const mockBrowser = {
  newContext: jest.fn().mockResolvedValue(mockContext),
  close: jest.fn().mockResolvedValue(null)
};
