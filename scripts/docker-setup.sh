#!/bin/bash

# Docker Setup Script for Low Cost Browsing MCP Server
# This script sets up the Docker environment for testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check for Docker Compose v2 (preferred) or v1 (fallback)
    if docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose (v2) is available"
        DOCKER_COMPOSE_CMD="docker compose"
    elif command_exists docker-compose; then
        print_warning "Using Docker Compose v1 (deprecated). Consider upgrading to Docker Compose v2."
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        print_error "Docker Compose is not available. Please install Docker with Compose plugin."
        exit 1
    fi
    
    if ! command_exists make; then
        print_warning "Make is not installed. You can still use Docker commands directly."
    else
        print_success "Make is available"
    fi
    
    print_success "Prerequisites check completed"
}

# Setup directories
setup_directories() {
    print_status "Setting up directories..."
    
    mkdir -p coverage
    mkdir -p test-results
    mkdir -p playwright-report
    mkdir -p logs
    mkdir -p data/ollama
    mkdir -p data/jan
    
    print_success "Directories created"
}

# Set permissions
set_permissions() {
    print_status "Setting permissions..."
    
    # Make scripts executable
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod +x Makefile 2>/dev/null || true
    
    # Set directory permissions for Docker
    chmod 755 coverage test-results playwright-report logs 2>/dev/null || true
    
    print_success "Permissions set"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build base testing image
    print_status "Building testing image..."
    docker build --target testing -t lc-browser-mcp:test-latest .
    
    print_status "Building development image..."
    docker build --target development -t lc-browser-mcp:dev-latest .
    
    print_success "Docker images built successfully"
}

# Install Playwright browsers
install_browsers() {
    print_status "Installing Playwright browsers in Docker image..."
    
    # This is already done in the Dockerfile, but we can verify
    docker run --rm lc-browser-mcp:test-latest npx playwright install --dry-run
    
    print_success "Playwright browsers are installed"
}

# Test setup
test_setup() {
    print_status "Testing Docker setup..."
    
    # Run a simple test to verify everything works
    print_status "Running unit tests..."
    docker run --rm \
        -v $(pwd)/coverage:/app/coverage \
        lc-browser-mcp:test-latest unit
    
    print_success "Docker setup test completed"
}

# Start services
start_services() {
    if [ "$1" = "--with-llm" ]; then
        print_status "Starting services with LLM providers..."
        $DOCKER_COMPOSE_CMD --profile llm up -d ollama
        
        # Wait for Ollama to be ready
        print_status "Waiting for Ollama to be ready..."
        sleep 10
        
        # Pull a test model
        print_status "Pulling test model for Ollama..."
        docker exec lc-browser-ollama ollama pull llama3.1 || print_warning "Failed to pull model, you can do it manually later"
    fi
    
    print_status "Starting development service..."
    $DOCKER_COMPOSE_CMD up -d app-dev
    
    print_success "Services started successfully"
    print_status "Development server available at http://localhost:3000"
    
    if [ "$1" = "--with-llm" ]; then
        print_status "Ollama API available at http://localhost:11434"
    fi
}

# Show usage information
show_usage() {
    echo "Docker Environment Setup Complete!"
    echo "=================================="
    echo ""
    echo "Available commands:"
    echo ""
    echo "Using Make (recommended):"
    echo "  make help                 - Show all available targets"
    echo "  make test                 - Run unit tests"
    echo "  make test-e2e            - Run E2E tests"
    echo "  make test-coverage       - Run tests with coverage"
    echo "  make test-browsers       - Test on all browsers"
    echo "  make dev                 - Start development environment"
    echo "  make clean               - Clean up containers"
    echo ""
    echo "Using Docker Compose:"
    echo "  docker compose up app-dev           - Start development"
    echo "  docker compose --profile testing up - Start testing"
    echo "  docker compose --profile llm up     - Start with LLM"
    echo ""
    echo "Using Docker directly:"
    echo "  docker run --rm lc-browser-mcp:test-latest unit  - Run unit tests"
    echo "  docker run --rm lc-browser-mcp:test-latest e2e   - Run E2E tests"
    echo ""
    echo "View reports:"
    echo "  Coverage: ./coverage/lcov-report/index.html"
    echo "  E2E Tests: ./playwright-report/index.html"
    echo ""
    echo "Useful development commands:"
    echo "  make dev-shell           - Open development shell"
    echo "  make logs                - View container logs"
    echo "  make info                - Show environment info"
    echo ""
}

# Cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Setup failed. Cleaning up..."
        docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Main execution
main() {
    echo "🐳 Docker Setup for Low Cost Browsing MCP Server"
    echo "================================================="
    echo ""
    
    check_prerequisites
    setup_directories
    set_permissions
    build_images
    install_browsers
    test_setup
    
    # Check if user wants to start services
    if [ "$1" = "--start" ]; then
        start_services "$2"
    elif [ "$1" = "--start-with-llm" ]; then
        start_services "--with-llm"
    fi
    
    show_usage
    
    print_success "🎉 Docker environment setup completed successfully!"
}

# Parse arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --start              Start development services after setup"
        echo "  --start-with-llm     Start with LLM providers (Ollama)"
        echo "  --help, -h           Show this help"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
