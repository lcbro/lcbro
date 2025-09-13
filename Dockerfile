# Multi-stage Docker build for browser testing
FROM node:18-bullseye-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Essential tools
    curl \
    wget \
    gnupg \
    ca-certificates \
    # X11 and display dependencies
    xvfb \
    x11vnc \
    fluxbox \
    # Browser dependencies
    libgtk-3-0 \
    libgbm-dev \
    libxss1 \
    libasound2 \
    # Additional browser dependencies
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgconf-2-4 \
    libxkbcommon0 \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libatspi2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgconf-2-4 \
    libxkbcommon0 \
    # Fonts
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    # Process management
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Development stage with all browsers
FROM base as development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Install Playwright browsers with all dependencies
RUN npx playwright install chromium firefox
RUN npx playwright install-deps chromium firefox

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set up display for browser testing
ENV DISPLAY=:99
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create entrypoint script
RUN echo '#!/bin/bash\n\
# Start Xvfb\n\
Xvfb :99 -ac -screen 0 1280x1024x16 &\n\
# Wait for display to be ready\n\
sleep 2\n\
# Execute the command\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# Testing stage - optimized for CI
FROM base as testing

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies first
RUN npm ci --only=production

# Install dev dependencies for testing
RUN npm ci

# Install Playwright browsers
RUN npx playwright install chromium firefox
RUN npx playwright install-deps chromium firefox

# Copy source and tests
COPY src/ ./src/
COPY tests/ ./tests/
COPY tsconfig.json ./
COPY jest.config.js ./
COPY playwright.config.ts ./

# Build the application
RUN npm run build

# Set environment for testing
ENV NODE_ENV=test
ENV DISPLAY=:99
ENV CI=true
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create test runner script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start Xvfb for headless testing\n\
Xvfb :99 -ac -screen 0 1280x1024x16 &\n\
XVFB_PID=$!\n\
\n\
# Wait for display\n\
sleep 2\n\
\n\
# Function to cleanup\n\
cleanup() {\n\
    echo "Cleaning up..."\n\
    kill $XVFB_PID 2>/dev/null || true\n\
    exit $1\n\
}\n\
\n\
# Set trap for cleanup\n\
trap "cleanup 1" INT TERM\n\
\n\
# Run the tests\n\
echo "Running tests..."\n\
if [ "$1" = "unit" ]; then\n\
    npm test\n\
elif [ "$1" = "e2e" ]; then\n\
    npm run test:e2e\n\
elif [ "$1" = "coverage" ]; then\n\
    npm run test:coverage\n\
elif [ "$1" = "all" ]; then\n\
    npm run test:all\n\
else\n\
    npm test\n\
fi\n\
\n\
# Store exit code\n\
TEST_EXIT_CODE=$?\n\
\n\
# Cleanup and exit with test result\n\
cleanup $TEST_EXIT_CODE' > /test-runner.sh && chmod +x /test-runner.sh

ENTRYPOINT ["/test-runner.sh"]

# Production stage - minimal runtime
FROM node:18-alpine as production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=development /app/dist ./dist
COPY --from=development /app/config ./config

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Change ownership
RUN chown -R mcp:nodejs /app
USER mcp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

CMD ["node", "dist/index.js"]
