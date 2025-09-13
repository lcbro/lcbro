#!/bin/bash

# Test script for remote CDP server functionality
# Tests connection to remote CDP servers and validates API responses

set -e

# Configuration
DEFAULT_TIMEOUT=10
DEFAULT_SSL_MODE="auto"
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Help function
show_help() {
    cat << EOF
Remote CDP Server Test Script

Usage: $0 [OPTIONS] <URL>

Options:
    -t, --timeout SECONDS    Request timeout in seconds [default: $DEFAULT_TIMEOUT]
    -s, --ssl-mode MODE      SSL mode: auto, enabled, disabled, insecure [default: $DEFAULT_SSL_MODE]
    -k, --api-key KEY        API key for authentication
    -h, --header HEADER      Additional HTTP header (format: "Name: Value")
    -v, --verbose           Verbose output
    --help                  Show this help

Examples:
    $0 https://cdp.example.com:9222
    $0 -k "secret-key" https://cdp.example.com:9222
    $0 -s insecure https://localhost:9222
    $0 -h "X-Client-ID: test" https://cdp.example.com:9222

EOF
}

# Test remote CDP server
test_remote_cdp() {
    local url="$1"
    local timeout="$2"
    local ssl_mode="$3"
    local api_key="$4"
    local headers=("${@:5}")

    log_info "Testing remote CDP server: $url"
    log_info "Timeout: ${timeout}s, SSL Mode: $ssl_mode"

    # Prepare headers array
    local header_args=()
    for header in "${headers[@]}"; do
        header_args+=("-H" "$header")
    done

    # Add API key if provided
    if [ -n "$api_key" ]; then
        header_args+=("-H" "Authorization: Bearer $api_key")
        header_args+=("-H" "X-API-Key: $api_key")
        log_info "Using API key: ${api_key:0:8}..."
    fi

    # Test server health
    test_health "$url" "$timeout" "${header_args[@]}"
    
    # Test server info
    test_server_info "$url" "$timeout" "${header_args[@]}"
    
    # Test browsers list
    test_browsers_list "$url" "$timeout" "${header_args[@]}"
}

# Test server health endpoint
test_health() {
    local url="$1"
    local timeout="$2"
    shift 2
    local header_args=("$@")

    log_info "Testing health endpoint..."
    
    local health_url="${url%/}/api/health"
    
    if [ "$VERBOSE" = true ]; then
        log_info "Health URL: $health_url"
        log_info "Headers: ${header_args[*]}"
    fi

    local response
    local status_code

    if response=$(curl -s -w "\n%{http_code}" --max-time "$timeout" "${header_args[@]}" "$health_url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        if [ "$status_code" -eq 200 ]; then
            log_success "Health check passed (HTTP $status_code)"
            if [ "$VERBOSE" = true ]; then
                echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
            fi
        else
            log_warning "Health check failed (HTTP $status_code)"
            if [ "$VERBOSE" = true ]; then
                echo "$response_body"
            fi
        fi
    else
        log_error "Health check failed: connection error"
        return 1
    fi
}

# Test server info endpoint
test_server_info() {
    local url="$1"
    local timeout="$2"
    shift 2
    local header_args=("$@")

    log_info "Testing server info endpoint..."
    
    local info_url="${url%/}/api/info"
    
    if [ "$VERBOSE" = true ]; then
        log_info "Info URL: $info_url"
    fi

    local response
    local status_code

    if response=$(curl -s -w "\n%{http_code}" --max-time "$timeout" "${header_args[@]}" "$info_url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        if [ "$status_code" -eq 200 ]; then
            log_success "Server info retrieved (HTTP $status_code)"
            if command -v jq >/dev/null 2>&1; then
                echo "$response_body" | jq .
            else
                echo "$response_body"
            fi
        else
            log_warning "Server info failed (HTTP $status_code)"
            if [ "$VERBOSE" = true ]; then
                echo "$response_body"
            fi
        fi
    else
        log_error "Server info failed: connection error"
        return 1
    fi
}

# Test browsers list endpoint
test_browsers_list() {
    local url="$1"
    local timeout="$2"
    shift 2
    local header_args=("$@")

    log_info "Testing browsers list endpoint..."
    
    local browsers_url="${url%/}/api/browsers"
    
    if [ "$VERBOSE" = true ]; then
        log_info "Browsers URL: $browsers_url"
    fi

    local response
    local status_code

    if response=$(curl -s -w "\n%{http_code}" --max-time "$timeout" "${header_args[@]}" "$browsers_url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        if [ "$status_code" -eq 200 ]; then
            log_success "Browsers list retrieved (HTTP $status_code)"
            
            if command -v jq >/dev/null 2>&1; then
                local browser_count
                browser_count=$(echo "$response_body" | jq '.browsers | length' 2>/dev/null || echo "0")
                log_info "Found $browser_count browsers"
                
                echo "$response_body" | jq '.browsers[] | {id, title, type, url}' 2>/dev/null || echo "$response_body"
            else
                echo "$response_body"
            fi
        else
            log_warning "Browsers list failed (HTTP $status_code)"
            if [ "$VERBOSE" = true ]; then
                echo "$response_body"
            fi
        fi
    else
        log_error "Browsers list failed: connection error"
        return 1
    fi
}

# Validate URL
validate_url() {
    local url="$1"
    
    if [[ ! "$url" =~ ^https?:// ]]; then
        log_error "URL must start with http:// or https://"
        return 1
    fi
    
    # Basic URL validation
    if ! curl -s --head --max-time 5 "$url" >/dev/null 2>&1; then
        log_warning "URL may not be reachable: $url"
    fi
    
    return 0
}

# Main function
main() {
    local url=""
    local timeout="$DEFAULT_TIMEOUT"
    local ssl_mode="$DEFAULT_SSL_MODE"
    local api_key=""
    local headers=()

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--timeout)
                timeout="$2"
                shift 2
                ;;
            -s|--ssl-mode)
                ssl_mode="$2"
                shift 2
                ;;
            -k|--api-key)
                api_key="$2"
                shift 2
                ;;
            -h|--header)
                headers+=("$2")
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                if [ -z "$url" ]; then
                    url="$1"
                else
                    log_error "Multiple URLs provided"
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Check if URL is provided
    if [ -z "$url" ]; then
        log_error "URL is required"
        show_help
        exit 1
    fi

    # Validate URL
    if ! validate_url "$url"; then
        exit 1
    fi

    # Check dependencies
    if ! command -v curl >/dev/null 2>&1; then
        log_error "curl is required but not installed"
        exit 1
    fi

    # Display configuration
    echo
    log_info "Remote CDP Server Test"
    log_info "======================"
    log_info "URL: $url"
    log_info "Timeout: ${timeout}s"
    log_info "SSL Mode: $ssl_mode"
    if [ -n "$api_key" ]; then
        log_info "API Key: ${api_key:0:8}..."
    fi
    if [ ${#headers[@]} -gt 0 ]; then
        log_info "Headers: ${#headers[@]} custom headers"
    fi
    echo

    # Run tests
    if test_remote_cdp "$url" "$timeout" "$ssl_mode" "$api_key" "${headers[@]}"; then
        echo
        log_success "All tests completed successfully"
        exit 0
    else
        echo
        log_error "Some tests failed"
        exit 1
    fi
}

# Run main function
main "$@"
