# Low Cost Browsing MCP Server - Docker Testing Makefile

# Variables
PROJECT_NAME = lc-browser-mcp
IMAGE_BASE = $(PROJECT_NAME)
DOCKER_REGISTRY ?= localhost
VERSION ?= latest

# Docker images
IMAGE_DEV = $(IMAGE_BASE):dev-$(VERSION)
IMAGE_TEST = $(IMAGE_BASE):test-$(VERSION)
IMAGE_PROD = $(IMAGE_BASE):$(VERSION)

# Container names
CONTAINER_DEV = $(PROJECT_NAME)-dev
CONTAINER_TEST = $(PROJECT_NAME)-test

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Low Cost Browsing MCP Server - Docker Testing"
	@echo "=============================================="
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Environment variables:"
	@echo "  VERSION              Docker image version (default: latest)"
	@echo "  DOCKER_REGISTRY      Docker registry (default: localhost)"
	@echo "  BROWSERS             Browsers to test (default: chromium,firefox,webkit)"

# Build targets
.PHONY: build build-dev build-test build-prod build-all
build: build-test ## Build test image (default)

build-dev: ## Build development image
	@echo "Building development image..."
	docker build --target development -t $(IMAGE_DEV) .
	@echo "✅ Development image built: $(IMAGE_DEV)"

build-test: ## Build testing image
	@echo "Building testing image..."
	docker build --target testing -t $(IMAGE_TEST) .
	@echo "✅ Testing image built: $(IMAGE_TEST)"

build-prod: ## Build production image
	@echo "Building production image..."
	docker build --target production -t $(IMAGE_PROD) .
	@echo "✅ Production image built: $(IMAGE_PROD)"

build-all: build-dev build-test build-prod ## Build all images

# Test targets
.PHONY: test test-unit test-e2e test-coverage test-all test-quick
test: test-unit ## Run unit tests (default)

test-unit: build-test ## Run unit tests in Docker
	@echo "Running unit tests..."
	docker run --rm \
		--name $(CONTAINER_TEST)-unit \
		-v $(PWD)/coverage:/app/coverage \
		$(IMAGE_TEST) unit
	@echo "✅ Unit tests completed"

test-e2e: build-test ## Run E2E tests in Docker
	@echo "Running E2E tests..."
	docker run --rm \
		--name $(CONTAINER_TEST)-e2e \
		-v $(PWD)/test-results:/app/test-results \
		-v $(PWD)/playwright-report:/app/playwright-report \
		--shm-size=1gb \
		$(IMAGE_TEST) e2e
	@echo "✅ E2E tests completed"

test-coverage: build-test ## Run tests with coverage
	@echo "Running tests with coverage..."
	docker run --rm \
		--name $(CONTAINER_TEST)-coverage \
		-v $(PWD)/coverage:/app/coverage \
		$(IMAGE_TEST) coverage
	@echo "✅ Coverage tests completed"
	@echo "📊 Coverage report available in ./coverage/lcov-report/index.html"

test-all: build-test ## Run all tests
	@echo "Running all tests..."
	docker run --rm \
		--name $(CONTAINER_TEST)-all \
		-v $(PWD)/coverage:/app/coverage \
		-v $(PWD)/test-results:/app/test-results \
		-v $(PWD)/playwright-report:/app/playwright-report \
		--shm-size=1gb \
		$(IMAGE_TEST) all
	@echo "✅ All tests completed"

test-quick: ## Run quick unit tests without rebuilding
	@echo "Running quick unit tests..."
	docker run --rm \
		--name $(CONTAINER_TEST)-quick \
		$(IMAGE_TEST) unit
	@echo "✅ Quick tests completed"

# Browser-specific tests
.PHONY: test-chromium test-firefox test-webkit test-browsers
test-chromium: build-test ## Run tests on Chromium only
	@echo "Running tests on Chromium..."
	docker run --rm \
		--name $(CONTAINER_TEST)-chromium \
		-e PLAYWRIGHT_PROJECT=chromium \
		-v $(PWD)/test-results:/app/test-results \
		--shm-size=1gb \
		$(IMAGE_TEST) e2e

test-firefox: build-test ## Run tests on Firefox only
	@echo "Running tests on Firefox..."
	docker run --rm \
		--name $(CONTAINER_TEST)-firefox \
		-e PLAYWRIGHT_PROJECT=firefox \
		-v $(PWD)/test-results:/app/test-results \
		--shm-size=1gb \
		$(IMAGE_TEST) e2e

test-webkit: build-test ## Run tests on WebKit only
	@echo "Running tests on WebKit..."
	docker run --rm \
		--name $(CONTAINER_TEST)-webkit \
		-e PLAYWRIGHT_PROJECT=webkit \
		-v $(PWD)/test-results:/app/test-results \
		--shm-size=1gb \
		$(IMAGE_TEST) e2e

test-browsers: test-chromium test-firefox test-webkit ## Run tests on all browsers

# Development targets
.PHONY: dev dev-shell dev-logs
dev: build-dev ## Start development container
	@echo "Starting development container..."
	docker run -d \
		--name $(CONTAINER_DEV) \
		-p 3000:3000 \
		-v $(PWD):/app \
		-v /app/node_modules \
		--workdir /app \
		$(IMAGE_DEV) \
		npm run dev
	@echo "✅ Development container started"
	@echo "🌐 Server available at http://localhost:3000"

dev-shell: build-dev ## Open shell in development container
	@echo "Opening development shell..."
	docker run -it --rm \
		--name $(CONTAINER_DEV)-shell \
		-v $(PWD):/app \
		-v /app/node_modules \
		--workdir /app \
		$(IMAGE_DEV) \
		/bin/bash

dev-logs: ## Show development container logs
	docker logs -f $(CONTAINER_DEV)

# Utility targets
.PHONY: clean clean-images clean-containers clean-volumes clean-all
clean: clean-containers ## Clean containers (default)

clean-containers: ## Remove all project containers
	@echo "Removing containers..."
	-docker rm -f $$(docker ps -aq --filter "name=$(PROJECT_NAME)")
	@echo "✅ Containers removed"

clean-images: ## Remove all project images
	@echo "Removing images..."
	-docker rmi -f $$(docker images --filter "reference=$(IMAGE_BASE)*" -q)
	@echo "✅ Images removed"

clean-volumes: ## Remove project volumes
	@echo "Removing volumes..."
	-docker volume rm $$(docker volume ls --filter "name=$(PROJECT_NAME)" -q)
	@echo "✅ Volumes removed"

clean-all: clean-containers clean-images clean-volumes ## Remove everything

# CI/CD targets
.PHONY: ci-test ci-build ci-push ci-deploy
ci-test: ## Run tests for CI/CD
	@echo "Running CI tests..."
	docker build --target testing -t $(IMAGE_TEST) .
	docker run --rm \
		--name ci-test \
		-v $(PWD)/coverage:/app/coverage \
		-v $(PWD)/test-results:/app/test-results \
		--shm-size=1gb \
		$(IMAGE_TEST) all
	@echo "✅ CI tests completed"

ci-build: build-all ## Build all images for CI/CD

ci-push: ci-build ## Push images to registry
	@echo "Pushing images to $(DOCKER_REGISTRY)..."
	docker tag $(IMAGE_PROD) $(DOCKER_REGISTRY)/$(IMAGE_PROD)
	docker push $(DOCKER_REGISTRY)/$(IMAGE_PROD)
	@echo "✅ Images pushed"

# Health and info targets
.PHONY: info health status
info: ## Show Docker environment info
	@echo "Docker Environment Information"
	@echo "=============================="
	@echo "Project Name: $(PROJECT_NAME)"
	@echo "Images:"
	@echo "  Development: $(IMAGE_DEV)"
	@echo "  Testing:     $(IMAGE_TEST)"
	@echo "  Production:  $(IMAGE_PROD)"
	@echo ""
	@echo "Containers:"
	@docker ps --filter "name=$(PROJECT_NAME)" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" || true
	@echo ""
	@echo "Images:"
	@docker images --filter "reference=$(IMAGE_BASE)*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" || true

health: ## Check container health
	@echo "Checking container health..."
	@docker ps --filter "name=$(PROJECT_NAME)" --filter "status=running" --format "{{.Names}}" | \
		xargs -I {} sh -c 'echo "Container: {}"; docker exec {} npm run health || echo "Health check failed"'

status: info health ## Show full status

# Interactive targets
.PHONY: shell exec logs
shell: ## Open shell in test container
	docker run -it --rm \
		--name $(CONTAINER_TEST)-shell \
		-v $(PWD):/app \
		--workdir /app \
		$(IMAGE_TEST) \
		/bin/bash

exec: ## Execute command in running container (use: make exec CMD="npm test")
	@if [ "$(CMD)" = "" ]; then \
		echo "Usage: make exec CMD=\"command to run\""; \
		exit 1; \
	fi
	@CONTAINER=$$(docker ps --filter "name=$(PROJECT_NAME)" --format "{{.Names}}" | head -1); \
	if [ "$$CONTAINER" = "" ]; then \
		echo "No running containers found"; \
		exit 1; \
	fi; \
	echo "Executing in $$CONTAINER: $(CMD)"; \
	docker exec -it $$CONTAINER $(CMD)

logs: ## Show logs from running containers
	@CONTAINER=$$(docker ps --filter "name=$(PROJECT_NAME)" --format "{{.Names}}" | head -1); \
	if [ "$$CONTAINER" = "" ]; then \
		echo "No running containers found"; \
		exit 1; \
	fi; \
	echo "Showing logs for $$CONTAINER:"; \
	docker logs -f $$CONTAINER

# Documentation targets
.PHONY: docs docs-coverage docs-tests
docs: ## Generate documentation
	@echo "Generating documentation..."
	docker run --rm \
		-v $(PWD):/app \
		--workdir /app \
		$(IMAGE_TEST) \
		npm run docs || echo "Documentation generation not configured"

docs-coverage: test-coverage ## Open coverage report
	@if command -v open >/dev/null 2>&1; then \
		open coverage/lcov-report/index.html; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open coverage/lcov-report/index.html; \
	else \
		echo "Coverage report available at: coverage/lcov-report/index.html"; \
	fi

docs-tests: test-e2e ## Open test report
	@if command -v open >/dev/null 2>&1; then \
		open playwright-report/index.html; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open playwright-report/index.html; \
	else \
		echo "Test report available at: playwright-report/index.html"; \
	fi
