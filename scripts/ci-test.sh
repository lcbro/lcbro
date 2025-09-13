#!/bin/bash

# CI/CD Test Script for Low Cost Browsing MCP Server
# This script runs comprehensive tests in CI environment

set -e

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
DOCKER_IMAGE="lc-browser-mcp:test-ci"
TEST_TIMEOUT=600  # 10 minutes
COVERAGE_THRESHOLD=80

# Function to print formatted output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}\n"
}

# Function to run command with timeout
run_with_timeout() {
    local timeout=$1
    shift
    local cmd="$@"
    
    log_info "Running: $cmd"
    
    if timeout $timeout $cmd; then
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log_error "Command timed out after ${timeout}s"
        else
            log_error "Command failed with exit code $exit_code"
        fi
        return $exit_code
    fi
}

# Function to check if Docker is available
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Docker is available"
}

# Function to build test image
build_test_image() {
    log_step "Building Test Image"
    
    run_with_timeout 600 docker build \
        --target testing \
        --tag $DOCKER_IMAGE \
        --build-arg NODE_ENV=test \
        --build-arg CI=true \
        .
    
    log_success "Test image built successfully"
}

# Function to run unit tests
run_unit_tests() {
    log_step "Running Unit Tests"
    
    mkdir -p coverage
    
    run_with_timeout $TEST_TIMEOUT docker run \
        --rm \
        --name ci-unit-tests \
        -v $(pwd)/coverage:/app/coverage \
        -e CI=true \
        -e NODE_ENV=test \
        $DOCKER_IMAGE unit
    
    # Check if coverage files exist
    if [ -f "coverage/lcov-report/index.html" ]; then
        log_success "Unit tests completed with coverage report"
    else
        log_warning "Unit tests completed but no coverage report found"
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    log_step "Running E2E Tests"
    
    mkdir -p test-results playwright-report
    
    run_with_timeout $TEST_TIMEOUT docker run \
        --rm \
        --name ci-e2e-tests \
        -v $(pwd)/test-results:/app/test-results \
        -v $(pwd)/playwright-report:/app/playwright-report \
        -e CI=true \
        -e NODE_ENV=test \
        --shm-size=1gb \
        $DOCKER_IMAGE e2e
    
    # Check if test results exist
    if [ -d "test-results" ] && [ "$(ls -A test-results)" ]; then
        log_success "E2E tests completed with results"
    else
        log_warning "E2E tests completed but no results found"
    fi
}

# Function to run browser-specific tests
run_browser_tests() {
    log_step "Running Browser-Specific Tests"
    
    local browsers=("chromium" "firefox" "webkit")
    local failed_browsers=()
    
    for browser in "${browsers[@]}"; do
        log_info "Testing on $browser..."
        
        if run_with_timeout $TEST_TIMEOUT docker run \
            --rm \
            --name ci-test-$browser \
            -v $(pwd)/test-results:/app/test-results \
            -e CI=true \
            -e NODE_ENV=test \
            -e PLAYWRIGHT_PROJECT=$browser \
            --shm-size=1gb \
            $DOCKER_IMAGE e2e; then
            log_success "$browser tests passed"
        else
            log_error "$browser tests failed"
            failed_browsers+=($browser)
        fi
    done
    
    if [ ${#failed_browsers[@]} -eq 0 ]; then
        log_success "All browser tests passed"
    else
        log_error "Failed browsers: ${failed_browsers[*]}"
        return 1
    fi
}

# Function to check test coverage
check_coverage() {
    log_step "Checking Test Coverage"
    
    if [ ! -f "coverage/coverage-summary.json" ]; then
        log_warning "Coverage summary not found, skipping coverage check"
        return 0
    fi
    
    # Extract coverage percentages using node if available, otherwise skip
    if command -v node >/dev/null 2>&1; then
        local coverage_lines=$(node -e "
            const fs = require('fs');
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            console.log(coverage.total.lines.pct);
        " 2>/dev/null || echo "0")
        
        if (( $(echo "$coverage_lines >= $COVERAGE_THRESHOLD" | bc -l) )); then
            log_success "Coverage check passed: ${coverage_lines}% (threshold: ${COVERAGE_THRESHOLD}%)"
        else
            log_error "Coverage check failed: ${coverage_lines}% (threshold: ${COVERAGE_THRESHOLD}%)"
            return 1
        fi
    else
        log_warning "Node.js not available, skipping coverage validation"
    fi
}

# Function to generate test reports
generate_reports() {
    log_step "Generating Test Reports"
    
    # Create reports directory
    mkdir -p reports
    
    # Copy coverage report
    if [ -d "coverage" ]; then
        cp -r coverage reports/
        log_info "Coverage report copied to reports/coverage/"
    fi
    
    # Copy E2E test report
    if [ -d "playwright-report" ]; then
        cp -r playwright-report reports/
        log_info "E2E test report copied to reports/playwright-report/"
    fi
    
    # Copy test results
    if [ -d "test-results" ]; then
        cp -r test-results reports/
        log_info "Test results copied to reports/test-results/"
    fi
    
    # Generate summary report
    cat > reports/test-summary.md << EOF
# Test Summary Report

Generated: $(date)
Environment: CI
Docker Image: $DOCKER_IMAGE

## Test Results

### Unit Tests
- Status: $([ -f "coverage/lcov-report/index.html" ] && echo "✅ Passed" || echo "❌ Failed")
- Coverage Report: [View Report](./coverage/lcov-report/index.html)

### E2E Tests
- Status: $([ -d "test-results" ] && echo "✅ Passed" || echo "❌ Failed")
- Test Report: [View Report](./playwright-report/index.html)

### Browser Tests
- Chromium: $([ -f "test-results/chromium-results.json" ] && echo "✅" || echo "❌")
- Firefox: $([ -f "test-results/firefox-results.json" ] && echo "✅" || echo "❌")
- WebKit: $([ -f "test-results/webkit-results.json" ] && echo "✅" || echo "❌")

## Files
- Test Results: [View Directory](./test-results/)
- Coverage Data: [View Directory](./coverage/)
EOF

    log_success "Test reports generated in reports/ directory"
}

# Function to cleanup
cleanup() {
    local exit_code=$?
    
    log_info "Cleaning up..."
    
    # Remove test containers
    docker rm -f ci-unit-tests ci-e2e-tests ci-test-chromium ci-test-firefox ci-test-webkit 2>/dev/null || true
    
    # Remove test image if requested
    if [ "$CLEANUP_IMAGES" = "true" ]; then
        docker rmi $DOCKER_IMAGE 2>/dev/null || true
    fi
    
    if [ $exit_code -eq 0 ]; then
        log_success "🎉 All tests completed successfully!"
    else
        log_error "❌ Tests failed with exit code $exit_code"
    fi
    
    exit $exit_code
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

CI/CD Test Script for Low Cost Browsing MCP Server

OPTIONS:
    --unit-only         Run only unit tests
    --e2e-only          Run only E2E tests
    --browsers-only     Run only browser-specific tests
    --no-coverage       Skip coverage check
    --cleanup-images    Remove Docker images after tests
    --timeout SECONDS   Set test timeout (default: $TEST_TIMEOUT)
    --threshold PCT     Set coverage threshold (default: $COVERAGE_THRESHOLD)
    --help              Show this help

ENVIRONMENT VARIABLES:
    CI                  Set to 'true' for CI environment
    CLEANUP_IMAGES      Set to 'true' to cleanup images
    TEST_TIMEOUT        Override default timeout
    COVERAGE_THRESHOLD  Override coverage threshold

EXAMPLES:
    $0                          # Run all tests
    $0 --unit-only              # Run only unit tests
    $0 --e2e-only --no-coverage # Run E2E tests without coverage
    $0 --timeout 900            # Run with 15-minute timeout

EOF
}

# Main execution function
main() {
    local run_unit=true
    local run_e2e=true
    local run_browsers=true
    local check_coverage_flag=true
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit-only)
                run_e2e=false
                run_browsers=false
                shift
                ;;
            --e2e-only)
                run_unit=false
                run_browsers=false
                shift
                ;;
            --browsers-only)
                run_unit=false
                run_e2e=false
                shift
                ;;
            --no-coverage)
                check_coverage_flag=false
                shift
                ;;
            --cleanup-images)
                CLEANUP_IMAGES=true
                shift
                ;;
            --timeout)
                TEST_TIMEOUT="$2"
                shift 2
                ;;
            --threshold)
                COVERAGE_THRESHOLD="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Main execution
    log_step "Starting CI Tests"
    log_info "Test timeout: ${TEST_TIMEOUT}s"
    log_info "Coverage threshold: ${COVERAGE_THRESHOLD}%"
    
    check_docker
    build_test_image
    
    if [ "$run_unit" = true ]; then
        run_unit_tests
    fi
    
    if [ "$run_e2e" = true ]; then
        run_e2e_tests
    fi
    
    if [ "$run_browsers" = true ]; then
        run_browser_tests
    fi
    
    if [ "$check_coverage_flag" = true ]; then
        check_coverage
    fi
    
    generate_reports
    
    log_success "🎉 All CI tests completed successfully!"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
