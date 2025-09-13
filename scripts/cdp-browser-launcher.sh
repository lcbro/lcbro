#!/bin/bash

# CDP Browser Launcher Script
# Automatically launches browsers with CDP enabled for MCP server

set -e

# Configuration
DEFAULT_PORTS=(9222 9223 9224 9225 9226)
DEFAULT_BROWSER="chrome"
DEFAULT_PROFILE_DIR="/tmp/cdp-profiles"
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
CDP Browser Launcher - Launch browsers with Chrome DevTools Protocol enabled

Usage: $0 [OPTIONS]

Options:
    -b, --browser BROWSER     Browser to launch (chrome|chromium|edge) [default: chrome]
    -p, --ports PORTS         Comma-separated list of ports [default: 9222,9223,9224,9225,9226]
    -d, --profile-dir DIR     Profile directory base [default: /tmp/cdp-profiles]
    -n, --num-browsers NUM    Number of browsers to launch [default: 1]
    -v, --verbose            Verbose output
    -h, --help               Show this help

Examples:
    $0                                    # Launch 1 Chrome browser on port 9222
    $0 -b chromium -p 9222,9223 -n 2     # Launch 2 Chromium browsers on ports 9222,9223
    $0 -b edge -d /tmp/edge-profiles      # Launch Edge with custom profile directory

Browser Detection:
    After launching, you can check available browsers:
    curl http://localhost:9222/json/version
    curl http://localhost:9223/json/version

EOF
}

# Check if browser is available
check_browser() {
    local browser="$1"
    
    case "$browser" in
        chrome)
            if command -v google-chrome &> /dev/null; then
                echo "google-chrome"
            elif command -v chrome &> /dev/null; then
                echo "chrome"
            elif command -v chromium-browser &> /dev/null; then
                echo "chromium-browser"
            else
                return 1
            fi
            ;;
        chromium)
            if command -v chromium &> /dev/null; then
                echo "chromium"
            elif command -v chromium-browser &> /dev/null; then
                echo "chromium-browser"
            else
                return 1
            fi
            ;;
        edge)
            if command -v msedge &> /dev/null; then
                echo "msedge"
            elif command -v microsoft-edge &> /dev/null; then
                echo "microsoft-edge"
            else
                return 1
            fi
            ;;
        *)
            return 1
            ;;
    esac
}

# Get browser executable path
get_browser_path() {
    local browser="$1"
    local path=$(check_browser "$browser")
    
    if [ $? -eq 0 ]; then
        which "$path"
    else
        return 1
    fi
}

# Launch browser with CDP
launch_browser() {
    local browser="$1"
    local port="$2"
    local profile_dir="$3"
    local browser_num="$4"
    
    local browser_path=$(get_browser_path "$browser")
    if [ $? -ne 0 ]; then
        log_error "Browser '$browser' not found. Available browsers:"
        log_info "Chrome: $(check_browser chrome 2>/dev/null || echo 'not found')"
        log_info "Chromium: $(check_browser chromium 2>/dev/null || echo 'not found')"
        log_info "Edge: $(check_browser edge 2>/dev/null || echo 'not found')"
        return 1
    fi
    
    local user_data_dir="${profile_dir}/browser-${browser_num}-port-${port}"
    
    # Create profile directory
    mkdir -p "$user_data_dir"
    
    # Browser-specific arguments
    local args=()
    case "$browser" in
        chrome|chromium)
            args=(
                "--remote-debugging-port=$port"
                "--user-data-dir=$user_data_dir"
                "--disable-web-security"
                "--disable-features=VizDisplayCompositor"
                "--no-first-run"
                "--no-default-browser-check"
                "--disable-default-apps"
                "--disable-popup-blocking"
            )
            ;;
        edge)
            args=(
                "--remote-debugging-port=$port"
                "--user-data-dir=$user_data_dir"
                "--disable-web-security"
                "--no-first-run"
                "--no-default-browser-check"
            )
            ;;
    esac
    
    # Additional arguments for better CDP support
    args+=(
        "--disable-background-timer-throttling"
        "--disable-backgrounding-occluded-windows"
        "--disable-renderer-backgrounding"
        "--disable-background-networking"
        "--disable-sync"
        "--metrics-recording-only"
        "--no-report-upload"
        "--disable-logging"
        "--silent"
    )
    
    if [ "$VERBOSE" = true ]; then
        log_info "Launching $browser on port $port with profile: $user_data_dir"
        log_info "Command: $browser_path ${args[*]}"
    fi
    
    # Launch browser in background
    nohup "$browser_path" "${args[@]}" > /dev/null 2>&1 &
    local pid=$!
    
    # Wait a moment for browser to start
    sleep 2
    
    # Check if browser started successfully
    if kill -0 $pid 2>/dev/null; then
        log_success "Launched $browser (PID: $pid) on port $port"
        echo "$pid" > "${user_data_dir}/browser.pid"
        return 0
    else
        log_error "Failed to launch $browser on port $port"
        return 1
    fi
}

# Check if port is available
check_port() {
    local port="$1"
    
    if lsof -i :$port >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Wait for browser to be ready
wait_for_browser() {
    local port="$1"
    local timeout="${2:-30}"
    local count=0
    
    log_info "Waiting for browser on port $port to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -s "http://localhost:$port/json/version" >/dev/null 2>&1; then
            log_success "Browser on port $port is ready"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
        
        if [ $((count % 5)) -eq 0 ]; then
            log_info "Still waiting for browser on port $port... (${count}s)"
        fi
    done
    
    log_error "Browser on port $port did not become ready within ${timeout}s"
    return 1
}

# Get browser info
get_browser_info() {
    local port="$1"
    
    if curl -s "http://localhost:$port/json/version" >/dev/null 2>&1; then
        local version=$(curl -s "http://localhost:$port/json/version" | jq -r '.Browser // "Unknown"' 2>/dev/null || echo "Unknown")
        local webSocketUrl=$(curl -s "http://localhost:$port/json/version" | jq -r '.webSocketDebuggerUrl // "Unknown"' 2>/dev/null || echo "Unknown")
        
        echo "Version: $version"
        echo "WebSocket URL: $webSocketUrl"
        return 0
    else
        return 1
    fi
}

# List running browsers
list_browsers() {
    local ports=("$@")
    local found=false
    
    log_info "Checking for running CDP browsers..."
    
    for port in "${ports[@]}"; do
        if curl -s "http://localhost:$port/json/version" >/dev/null 2>&1; then
            found=true
            log_success "Browser found on port $port:"
            get_browser_info "$port" | sed 's/^/  /'
            echo
        fi
    done
    
    if [ "$found" = false ]; then
        log_warning "No CDP browsers found on ports: ${ports[*]}"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Kill browsers launched by this script
    if [ -d "$DEFAULT_PROFILE_DIR" ]; then
        for pid_file in "$DEFAULT_PROFILE_DIR"/*/browser.pid; do
            if [ -f "$pid_file" ]; then
                local pid=$(cat "$pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    log_info "Stopping browser (PID: $pid)"
                    kill "$pid"
                fi
                rm -f "$pid_file"
            fi
        done
    fi
    
    log_info "Cleanup completed"
}

# Main function
main() {
    local browser="$DEFAULT_BROWSER"
    local ports=()
    local profile_dir="$DEFAULT_PROFILE_DIR"
    local num_browsers=1
    local list_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--browser)
                browser="$2"
                shift 2
                ;;
            -p|--ports)
                IFS=',' read -ra ports <<< "$2"
                shift 2
                ;;
            -d|--profile-dir)
                profile_dir="$2"
                shift 2
                ;;
            -n|--num-browsers)
                num_browsers="$2"
                shift 2
                ;;
            -l|--list)
                list_only=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set default ports if not specified
    if [ ${#ports[@]} -eq 0 ]; then
        ports=("${DEFAULT_PORTS[@]}")
    fi
    
    # Handle list only mode
    if [ "$list_only" = true ]; then
        list_browsers "${ports[@]}"
        exit 0
    fi
    
    # Validate number of browsers
    if [ "$num_browsers" -gt ${#ports[@]} ]; then
        log_error "Number of browsers ($num_browsers) cannot exceed number of ports (${#ports[@]})"
        exit 1
    fi
    
    # Setup cleanup on exit
    trap cleanup EXIT INT TERM
    
    log_info "CDP Browser Launcher"
    log_info "===================="
    log_info "Browser: $browser"
    log_info "Ports: ${ports[*]}"
    log_info "Profile directory: $profile_dir"
    log_info "Number of browsers: $num_browsers"
    echo
    
    # Check if browsers are already running
    local running_count=0
    for port in "${ports[@]}"; do
        if curl -s "http://localhost:$port/json/version" >/dev/null 2>&1; then
            running_count=$((running_count + 1))
            log_warning "Browser already running on port $port"
        fi
    done
    
    if [ $running_count -gt 0 ]; then
        log_info "Found $running_count running browsers. Launching additional browsers..."
    fi
    
    # Launch browsers
    local launched=0
    for ((i=0; i<num_browsers; i++)); do
        local port="${ports[$i]}"
        
        # Check if port is available
        if check_port "$port"; then
            if launch_browser "$browser" "$port" "$profile_dir" "$((i+1))"; then
                launched=$((launched + 1))
                
                # Wait for browser to be ready
                if wait_for_browser "$port" 30; then
                    log_success "Browser $((i+1))/$num_browsers ready on port $port"
                else
                    log_error "Browser $((i+1))/$num_browsers failed to start on port $port"
                fi
            fi
        else
            log_warning "Port $port is already in use, skipping browser $((i+1))"
        fi
        
        echo
    done
    
    log_success "Launched $launched/$num_browsers browsers successfully"
    
    # Show browser information
    echo
    log_info "Browser Information:"
    echo "====================="
    for ((i=0; i<launched; i++)); do
        local port="${ports[$i]}"
        if curl -s "http://localhost:$port/json/version" >/dev/null 2>&1; then
            echo "Port $port:"
            get_browser_info "$port" | sed 's/^/  /'
            echo
        fi
    done
    
    # Show usage instructions
    echo
    log_info "Usage Instructions:"
    echo "==================="
    log_info "1. Configure your MCP server to use CDP:"
    log_info "   browser:"
    log_info "     engine: cdp"
    log_info "     cdp:"
    log_info "       enabled: true"
    log_info "       autoDetect: true"
    log_info "       detection:"
    log_info "         ports: [${ports[*]// /, }]"
    echo
    log_info "2. Or connect to specific browser:"
    for ((i=0; i<launched; i++)); do
        local port="${ports[$i]}"
        if curl -s "http://localhost:$port/json/version" >/dev/null 2>&1; then
            log_info "   Port $port: http://localhost:$port/json/version"
        fi
    done
    echo
    log_info "3. Keep this script running to maintain browsers"
    log_info "4. Press Ctrl+C to stop all browsers"
    
    # Keep script running
    if [ $launched -gt 0 ]; then
        echo
        log_info "Browsers are running. Press Ctrl+C to stop..."
        while true; do
            sleep 10
            
            # Check if browsers are still running
            local still_running=0
            for ((i=0; i<launched; i++)); do
                local port="${ports[$i]}"
                if curl -s "http://localhost:$port/json/version" >/dev/null 2>&1; then
                    still_running=$((still_running + 1))
                fi
            done
            
            if [ $still_running -eq 0 ]; then
                log_warning "All browsers have stopped"
                break
            fi
        done
    fi
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
fi

if ! command -v lsof &> /dev/null; then
    log_error "lsof is required but not installed"
    exit 1
fi

# Run main function
main "$@"
