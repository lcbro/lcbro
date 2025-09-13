# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the LCBro project.

## 📋 Available Workflows

### 🔄 [CI/CD Pipeline](workflows/ci.yml)
**Triggers:** Push to main/develop, Pull requests, Manual dispatch

Core continuous integration pipeline that includes:
- **Lint & Format Check** - Code quality and formatting validation
- **Unit Tests** - Automated test execution with coverage
- **Docker Tests** - Container testing and validation
- **E2E Tests** - End-to-end browser automation tests
- **Security Scan** - Vulnerability and dependency scanning
- **Build** - Production image building
- **Coverage Analysis** - Code coverage reporting
- **Deploy** - Automated deployment (main branch only)

### 🐳 [Docker Testing](workflows/docker.yml)
**Triggers:** Dockerfile changes, Pull requests, Daily schedule, Manual dispatch

Comprehensive Docker testing including:
- **Multi-target Build Matrix** - Development, testing, and production images
- **Docker Compose Testing** - Multi-container environment validation
- **Make Commands Testing** - Build automation verification
- **CI Scripts Testing** - Automated script validation
- **Security Scanning** - Container vulnerability assessment
- **Performance Testing** - Build and runtime performance metrics
- **Multi-Architecture Testing** - Cross-platform compatibility

### 🌙 [Nightly Tests](workflows/nightly.yml)
**Triggers:** Daily at 2 AM UTC, Manual dispatch

Extended testing suite for comprehensive validation:
- **Health Check** - Repository and environment validation
- **Comprehensive Tests** - Multi-Node.js version testing
- **Docker Comprehensive** - Full container test suite
- **Extended E2E** - Multi-browser and viewport testing
- **Performance Benchmark** - Detailed performance analysis
- **Stress Testing** - Resource limit and load testing
- **Dependency Audit** - Security and license compliance
- **Cleanup** - System resource management

### 🔀 [Pull Request Validation](workflows/pr.yml)
**Triggers:** Pull requests to main

Focused validation for pull requests:
- **Code Quality** - Linting and formatting checks
- **Unit Tests** - Quick test execution
- **Build Validation** - Compilation and build verification
- **Security Check** - Basic security scanning

### 🚀 [Release Workflow](workflows/release.yml)
**Triggers:** Tags, Manual dispatch

Automated release process:
- **Version Validation** - Tag and version verification
- **Build Artifacts** - Production-ready builds
- **Testing** - Release candidate validation
- **Deployment** - Automated deployment pipeline
- **Notification** - Release status notifications

### 🔧 [Artifacts Fix](workflows/artifacts-fix.yml)
**Triggers:** Manual dispatch only

Utility workflow for artifact recovery:
- **Manual Artifact Download** - Recovery from specific run IDs
- **Artifact Validation** - Content verification
- **Re-upload** - Fix broken artifact references

## 🛠️ Workflow Features

### ✅ Quality Gates
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Security**: CodeQL analysis, dependency vulnerability scanning
- **Testing**: Unit tests (>80% coverage), E2E tests, Docker tests
- **Build**: Multi-platform builds, dependency validation
- **Performance**: Bundle size tracking, performance regression detection

### 🚀 Smart Optimization
- **Parallel Execution**: Jobs run concurrently when possible
- **Conditional Execution**: Only relevant tests run based on changes
- **Caching Strategy**: Node modules, Docker layers, test artifacts
- **Auto-retry**: Flaky tests automatically retry with backoff

### 📊 Monitoring & Reporting
- **Coverage Reports**: Detailed test coverage with trend analysis
- **Performance Metrics**: Bundle size, build time, test duration
- **Failure Alerts**: Immediate notification on critical failures
- **PR Comments**: Automated feedback on pull requests

## 🐳 Docker Integration

All workflows support Docker-based testing:

```bash
# Local Docker testing (mirrors CI)
make test-unit          # Unit tests in Docker
make test-e2e           # E2E tests in Docker
make test-all           # Complete test suite
make ci                 # Full CI pipeline locally
```

## 🛡️ Security & Compliance

- **Dependency Scanning**: Daily vulnerability checks
- **Code Analysis**: Static security analysis with CodeQL
- **Container Security**: Docker image vulnerability scanning
- **Supply Chain**: Verification of all dependencies
- **SARIF Reporting**: Security findings in standardized format

## 📊 Monitoring & Metrics

Track project health through:
- **[Actions Tab](https://github.com/nightweb/lc-browser-mcp/actions)** - Real-time workflow status
- **[Security Tab](https://github.com/nightweb/lc-browser-mcp/security)** - Security advisories and alerts
- **[Insights](https://github.com/nightweb/lc-browser-mcp/pulse)** - Repository activity and statistics
- **[Dependency Graph](https://github.com/nightweb/lc-browser-mcp/network/dependencies)** - Dependency health

## 🔧 Maintenance Commands

```bash
# Trigger specific workflows manually
gh workflow run ci.yml
gh workflow run docker.yml
gh workflow run nightly.yml

# View workflow status
gh run list --workflow=ci.yml

# Download artifacts
gh run download <run-id>

# View logs
gh run view <run-id> --log
```

## 📞 Support

- **Workflow Issues**: [GitHub Issues](https://github.com/nightweb/lc-browser-mcp/issues)
- **Documentation**: [Main README](../README.md)
- **Examples**: [Usage Examples](../examples/)

---

**LCBro Workflows** - Automated CI/CD for Browser Automation  
**Status**: ✅ Production Ready • **License**: MIT
