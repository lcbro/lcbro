# Testing Suite

This directory contains comprehensive tests for the Low Cost Browsing MCP Server.

## Test Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── browser-manager.test.ts     # BrowserManager tests
│   ├── llm-provider.test.ts        # LLM provider tests
│   ├── navigation.test.ts          # Navigation tools tests
│   ├── extraction.test.ts          # Extraction tools tests
│   ├── llm-tools.test.ts           # LLM transformation tests
│   ├── error-scenarios.test.ts     # Error handling tests
│   └── llm-errors.test.ts          # LLM-specific error tests
├── e2e/                    # End-to-end tests
│   ├── basic-navigation.spec.ts    # Basic navigation flows
│   └── interaction-flow.spec.ts    # Complex interaction scenarios
├── integration/            # Integration tests
│   ├── llm-integration.test.ts     # LLM integration tests
│   └── real-website.test.ts        # Real website tests
├── mocks/                  # Mock implementations
│   └── llm-providers.ts            # Mock LLM providers and browser
├── fixtures/               # Test data and configurations
│   └── test-config.yaml            # Test configuration
└── setup.ts               # Global test setup
```

## Test Types

### Unit Tests
- Test individual components in isolation
- Use mocks for external dependencies
- Fast execution, no network calls
- Coverage: BrowserManager, LLM providers, all tools

### E2E Tests
- Test complete user scenarios
- Use real browser automation
- Test actual tool interactions
- Scenarios: navigation, form filling, data extraction

### Integration Tests
- Test with real external services
- Require actual LLM providers
- May require API keys or local models
- Test real website interactions

### Error Tests
- Test all error scenarios
- Verify proper error codes and messages
- Cover timeouts, network issues, invalid inputs
- Test graceful degradation

## Running Tests

### All Tests
```bash
npm test               # Run unit tests only
npm run test:e2e       # Run E2E tests only
npm run test:all       # Run all tests
npm run test:coverage  # Run with coverage report
```

### Specific Test Categories
```bash
# Unit tests
npx jest tests/unit/

# E2E tests
npx playwright test

# Integration tests (requires setup)
npx jest tests/integration/

# Error scenarios
npx jest tests/unit/error-scenarios.test.ts
```

### Watch Mode
```bash
npm run test:watch    # Watch unit tests
npm run test:e2e:ui   # Playwright UI mode
```

## Test Configuration

### Jest (Unit Tests)
- Configuration: `jest.config.js`
- TypeScript support with `ts-jest`
- ESM module support
- Coverage threshold: 80%
- Timeout: 30 seconds

### Playwright (E2E Tests)
- Configuration: `playwright.config.ts`
- Browsers: Chromium, Firefox, WebKit
- Parallel execution
- Trace collection on failures

## Environment Setup

### Required Environment Variables

For integration tests that use real LLM providers:

```bash
# Optional - enables LLM integration tests
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
OLLAMA_AVAILABLE=true  # Set to true if Ollama is running
```

### Local Model Setup

For Ollama tests:
```bash
# Install and start Ollama
ollama serve

# Pull test model
ollama pull llama3.1
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format

### Coverage Targets
- Statements: >80%
- Branches: >80%
- Functions: >80%
- Lines: >80%

## Mock Strategy

### External Dependencies
- **OpenAI API**: Mocked to return predictable responses
- **Anthropic API**: Mocked for consistent testing
- **Ollama/JAN APIs**: Mocked HTTP requests
- **Playwright Browser**: Mocked for unit tests, real for E2E

### Mock Data
- Predefined responses for various scenarios
- Error conditions for testing edge cases
- Large content for testing limits
- CAPTCHA detection scenarios

## Test Scenarios

### Navigation Tests
- ✅ Basic URL opening
- ✅ Page navigation
- ✅ Session persistence
- ✅ Timeout handling
- ✅ Invalid URLs

### Interaction Tests
- ✅ Form filling
- ✅ Button clicking
- ✅ Text input
- ✅ Wait conditions
- ✅ Dynamic content

### Extraction Tests
- ✅ HTML content extraction
- ✅ Text content extraction
- ✅ Table extraction
- ✅ Attribute extraction
- ✅ Screenshot capture
- ✅ Size limits

### LLM Tests
- ✅ Text transformation
- ✅ JSON schema validation
- ✅ Preprocessing
- ✅ Multiple providers
- ✅ Error handling

### Error Scenarios
- ✅ Navigation timeouts
- ✅ Element not found
- ✅ CAPTCHA detection
- ✅ Content too large
- ✅ LLM failures
- ✅ API errors

## Continuous Integration

Tests are designed to run in CI environments:
- Headless browser mode
- No external dependencies for unit tests
- Optional integration tests with proper env vars
- Coverage reporting
- Parallel execution support

## Debugging Tests

### Failed Tests
```bash
# Run specific test
npx jest navigation.test.ts

# Run with debug output
npx jest --verbose navigation.test.ts

# Playwright debug mode
npx playwright test --debug
```

### Coverage Analysis
```bash
# Generate detailed coverage
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Logs and Traces
- E2E test traces in `test-results/`
- Playwright screenshots on failures
- Jest verbose output for debugging
- Browser console logs captured

## Contributing

When adding new features:
1. Add unit tests for new components
2. Add E2E tests for new user scenarios
3. Test error conditions
4. Maintain >80% coverage
5. Update this README if needed

### Test Naming Convention
- Unit tests: `component-name.test.ts`
- E2E tests: `scenario-name.spec.ts`
- Integration tests: `integration-name.test.ts`
- Error tests: `error-type.test.ts`
