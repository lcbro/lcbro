# Docker Testing Guide

This guide explains how to set up and run tests using Docker for the Low Cost Browsing MCP Server.

## Overview

The Docker testing environment provides:
- **Isolated Testing**: Tests run in clean, reproducible containers
- **Multiple Browsers**: Chromium, Firefox, and WebKit pre-installed
- **CI/CD Ready**: Optimized for continuous integration pipelines
- **Cross-Platform**: Works on Linux, macOS, and Windows
- **Parallel Testing**: Run tests across different browsers simultaneously

## Quick Start

### 1. Setup Environment

```bash
# Make setup script executable
chmod +x scripts/docker-setup.sh

# Run automated setup
./scripts/docker-setup.sh

# Or with LLM providers
./scripts/docker-setup.sh --start-with-llm
```

### 2. Run Tests

```bash
# Using Make (recommended)
make test                    # Unit tests
make test-e2e               # E2E tests
make test-coverage          # Tests with coverage
make test-browsers          # All browsers

# Using Docker directly
docker run --rm lc-browser-mcp:test-latest unit
docker run --rm lc-browser-mcp:test-latest e2e
```

## Docker Images

### Available Images

| Image | Target | Purpose | Size |
|-------|--------|---------|------|
| `lc-browser-mcp:dev-latest` | development | Development with hot reload | ~2GB |
| `lc-browser-mcp:test-latest` | testing | Testing with all browsers | ~1.5GB |
| `lc-browser-mcp:latest` | production | Production runtime | ~200MB |

### Build Images

```bash
# Build all images
make build-all

# Build specific images
make build-dev      # Development image
make build-test     # Testing image
make build-prod     # Production image
```

## Testing Commands

### Make Commands

```bash
# Basic testing
make test                    # Run unit tests
make test-e2e               # Run E2E tests
make test-coverage          # Run with coverage report
make test-all               # Run all tests

# Browser-specific testing
make test-chromium          # Test on Chromium only
make test-firefox           # Test on Firefox only  
make test-webkit            # Test on WebKit only
make test-browsers          # Test on all browsers

# Development
make dev                    # Start development environment
make dev-shell              # Open development shell
make dev-logs              # View development logs

# Cleanup
make clean                  # Remove containers
make clean-images          # Remove images
make clean-all             # Remove everything
```

### Docker Compose Commands

```bash
# Development
docker-compose up app-dev                    # Start development
docker-compose logs -f app-dev              # View logs

# Testing
docker-compose --profile testing up app-test    # Run tests
docker-compose --profile browsers up            # Test all browsers

# With LLM providers
docker-compose --profile llm up ollama          # Start Ollama
docker-compose --profile llm up jan-ai          # Start JAN AI

# Reports server
docker-compose --profile reports up test-reports  # Serve reports at :8080
```

### Direct Docker Commands

```bash
# Unit tests
docker run --rm \
  -v $(pwd)/coverage:/app/coverage \
  lc-browser-mcp:test-latest unit

# E2E tests
docker run --rm \
  -v $(pwd)/test-results:/app/test-results \
  -v $(pwd)/playwright-report:/app/playwright-report \
  --shm-size=1gb \
  lc-browser-mcp:test-latest e2e

# Coverage tests
docker run --rm \
  -v $(pwd)/coverage:/app/coverage \
  lc-browser-mcp:test-latest coverage

# Browser-specific tests
docker run --rm \
  -e PLAYWRIGHT_PROJECT=chromium \
  -v $(pwd)/test-results:/app/test-results \
  --shm-size=1gb \
  lc-browser-mcp:test-latest e2e
```

## CI/CD Integration

### Using the CI Script

```bash
# Run all CI tests
./scripts/ci-test.sh

# Run specific test types
./scripts/ci-test.sh --unit-only
./scripts/ci-test.sh --e2e-only
./scripts/ci-test.sh --browsers-only

# With custom settings
./scripts/ci-test.sh --timeout 900 --threshold 85
```

### GitHub Actions Example

```yaml
name: Docker Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run CI Tests
        run: ./scripts/ci-test.sh
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            test-results/
            playwright-report/
```

### GitLab CI Example

```yaml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - chmod +x scripts/ci-test.sh
    - ./scripts/ci-test.sh
  artifacts:
    reports:
      junit: test-results/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
      - test-results/
      - playwright-report/
    expire_in: 1 week
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | test | Environment mode |
| `CI` | false | CI environment flag |
| `DISPLAY` | :99 | X11 display for browsers |
| `PLAYWRIGHT_BROWSERS_PATH` | /ms-playwright | Browser installation path |
| `PLAYWRIGHT_PROJECT` | all | Specific browser to test |

### Docker Compose Profiles

| Profile | Services | Purpose |
|---------|----------|---------|
| default | app-dev | Development |
| testing | app-test | Testing |
| browsers | test-* | Browser-specific testing |
| llm | ollama, jan-ai | LLM providers |
| reports | test-reports | Report server |
| production | app-prod | Production |

### Volume Mounts

```yaml
volumes:
  - ./coverage:/app/coverage           # Test coverage
  - ./test-results:/app/test-results   # E2E results
  - ./playwright-report:/app/playwright-report  # E2E reports
  - ./logs:/app/logs                   # Application logs
```

## Browser Testing

### Supported Browsers

- **Chromium**: Latest stable version
- **Firefox**: Latest stable version  
- **WebKit**: Latest stable version

### Browser-Specific Options

```bash
# Test specific browser
PLAYWRIGHT_PROJECT=chromium make test-e2e
PLAYWRIGHT_PROJECT=firefox make test-e2e
PLAYWRIGHT_PROJECT=webkit make test-e2e

# Browser launch options (in playwright.config.ts)
launchOptions: {
  args: [
    '--no-sandbox',              # Required for Docker
    '--disable-setuid-sandbox',  # Security for containers
    '--disable-dev-shm-usage',   # Shared memory
    '--disable-gpu',             # GPU acceleration
    '--no-first-run',           # Skip first run
    '--no-zygote',              # Process model
    '--single-process'           # Single process mode
  ]
}
```

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**
   ```bash
   # Increase shared memory
   docker run --shm-size=1gb ...
   
   # Check browser installation
   docker run --rm lc-browser-mcp:test-latest npx playwright install --dry-run
   ```

2. **Permission Errors**
   ```bash
   # Fix permissions
   chmod -R 755 coverage test-results playwright-report
   ```

3. **Network Issues**
   ```bash
   # Use host network
   docker run --network=host ...
   ```

4. **Out of Memory**
   ```bash
   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   ```

### Debug Mode

```bash
# Enable debug logging
docker run --rm \
  -e DEBUG=* \
  -e PLAYWRIGHT_DEBUG=1 \
  lc-browser-mcp:test-latest e2e

# Interactive debugging
make dev-shell
npx playwright test --debug
```

### Performance Optimization

```bash
# Parallel browser testing
docker-compose --profile browsers up

# Use test cache
docker run --rm \
  -v playwright-cache:/ms-playwright \
  lc-browser-mcp:test-latest e2e

# Resource limits
docker run --rm \
  --memory=2g \
  --cpus="2.0" \
  lc-browser-mcp:test-latest e2e
```

## Reports and Artifacts

### Coverage Reports
- **Location**: `./coverage/lcov-report/index.html`
- **Format**: HTML, LCOV, JSON
- **Threshold**: 80% by default

### E2E Test Reports  
- **Location**: `./playwright-report/index.html`
- **Videos**: `./test-results/videos/`
- **Screenshots**: `./test-results/screenshots/`
- **Traces**: `./test-results/traces/`

### CI Reports
- **JUnit XML**: `./test-results/junit.xml`
- **JSON Results**: `./test-results/results.json`
- **Summary**: `./reports/test-summary.md`

### Viewing Reports

```bash
# Open coverage report
make docs-coverage

# Open test report
make docs-tests

# Serve reports via HTTP
docker-compose --profile reports up test-reports
# View at http://localhost:8080
```

## Best Practices

### Performance
- Use `--shm-size=1gb` for browser tests
- Limit parallel workers in CI: `workers: 1`
- Use browser-specific projects for targeted testing

### Reliability
- Set appropriate timeouts: `timeout: 30000`
- Enable retries in CI: `retries: 2`
- Use `--no-sandbox` in containers

### Security
- Run containers as non-root user
- Use minimal base images
- Scan images for vulnerabilities

### Monitoring
- Enable health checks
- Collect logs and metrics
- Monitor resource usage

## Examples

### Complete Test Suite

```bash
# Full CI pipeline
./scripts/docker-setup.sh
make ci-test
make docs-coverage
```

### Development Workflow

```bash
# Start development
make dev

# Run tests during development
make test-quick

# Debug specific test
make dev-shell
npx playwright test specific-test.spec.ts --debug
```

### Production Validation

```bash
# Build production image
make build-prod

# Test production image
docker run --rm \
  -p 3000:3000 \
  lc-browser-mcp:latest

# Health check
curl http://localhost:3000/health
```
