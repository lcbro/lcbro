#!/bin/bash

# Check Artifacts Script
# This script helps diagnose and fix artifact download issues

set -e

echo "🔍 LCBro Artifacts Checker"
echo "=========================="

# Function to check if directory exists and has files
check_directory() {
    local dir=$1
    local name=$2
    
    echo "Checking $name directory: $dir"
    
    if [ -d "$dir" ]; then
        file_count=$(find "$dir" -type f | wc -l)
        if [ "$file_count" -gt 0 ]; then
            echo "✅ $name directory exists with $file_count files"
            echo "Files:"
            find "$dir" -type f -exec basename {} \; | head -10
            if [ "$file_count" -gt 10 ]; then
                echo "... and $((file_count - 10)) more files"
            fi
            return 0
        else
            echo "⚠️ $name directory exists but is empty"
            return 1
        fi
    else
        echo "❌ $name directory does not exist"
        return 1
    fi
}

# Check common artifact directories
echo ""
echo "📁 Checking artifact directories:"

coverage_exists=false
test_results_exists=false

if check_directory "coverage" "Coverage"; then
    coverage_exists=true
fi

if check_directory "test-results" "Test Results"; then
    test_results_exists=true
fi

if check_directory "playwright-report" "Playwright Report"; then
    test_results_exists=true
fi

# Summary
echo ""
echo "📊 Summary:"
echo "==========="

if [ "$coverage_exists" = true ]; then
    echo "✅ Coverage reports: Available"
else
    echo "❌ Coverage reports: Missing"
fi

if [ "$test_results_exists" = true ]; then
    echo "✅ Test results: Available"
else
    echo "❌ Test results: Missing"
fi

# Recommendations
echo ""
echo "💡 Recommendations:"
echo "==================="

if [ "$coverage_exists" = false ]; then
    echo "• Run 'npm test' to generate coverage reports"
    echo "• Check if test configuration includes coverage collection"
fi

if [ "$test_results_exists" = false ]; then
    echo "• Run 'npm run test:e2e' to generate E2E test results"
    echo "• Check Playwright configuration"
fi

# Check for common issues
echo ""
echo "🔧 Common Issues & Solutions:"
echo "============================="

if [ ! -d "node_modules" ]; then
    echo "• Missing node_modules: Run 'npm install'"
fi

if [ ! -f "package.json" ]; then
    echo "• Missing package.json: Check if you're in the right directory"
fi

# Check Jest configuration
if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ]; then
    echo "• Jest configuration found"
    if grep -q "coverage" jest.config.* 2>/dev/null; then
        echo "  ✅ Coverage collection configured"
    else
        echo "  ⚠️ Coverage collection may not be configured"
    fi
else
    echo "• No Jest configuration found"
fi

# Check Playwright configuration
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
    echo "• Playwright configuration found"
else
    echo "• No Playwright configuration found"
fi

echo ""
echo "🏁 Artifact check completed!"
