#!/bin/bash

# LLM Real-time Monitor
# Monitors LLM operations in real-time with live statistics

set -e

# Configuration
LOG_FILE="${LOG_FILE:-logs/app.log}"
REFRESH_INTERVAL="${REFRESH_INTERVAL:-5}"
STATS_FILE="/tmp/llm_monitor_stats.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Initialize stats
init_stats() {
    cat > "$STATS_FILE" << EOF
{
    "start_time": "$(date +%s)",
    "total_requests": 0,
    "total_responses": 0,
    "total_errors": 0,
    "preprocessing_ops": 0,
    "total_tokens": 0,
    "total_cost": 0,
    "last_operation": null,
    "operations_by_type": {},
    "operations_by_model": {},
    "response_times": [],
    "recent_errors": []
}
EOF
}

# Update stats from log file
update_stats() {
    if [ ! -f "$LOG_FILE" ]; then
        return
    fi
    
    # Get current file size to track new lines
    local current_size=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")
    local last_size=$(cat "$STATS_FILE" | jq -r '.last_file_size // 0')
    
    if [ "$current_size" -le "$last_size" ]; then
        return
    fi
    
    # Process new lines
    local new_lines=$(tail -c +$((last_size + 1)) "$LOG_FILE" 2>/dev/null || echo "")
    
    if [ -z "$new_lines" ]; then
        return
    }
    
    # Update stats based on new lines
    local temp_stats=$(mktemp)
    cp "$STATS_FILE" "$temp_stats"
    
    # Count new requests
    local new_requests=$(echo "$new_lines" | grep -c '"LLM Request"' || echo "0")
    local new_responses=$(echo "$new_lines" | grep -c '"LLM Response"' || echo "0")
    local new_errors=$(echo "$new_lines" | grep -c '"success": false' || echo "0")
    local new_preprocessing=$(echo "$new_lines" | grep -c '"operationType": "preprocessing"' || echo "0")
    
    # Update counters
    local total_requests=$(($(cat "$temp_stats" | jq -r '.total_requests') + new_requests))
    local total_responses=$(($(cat "$temp_stats" | jq -r '.total_responses') + new_responses))
    local total_errors=$(($(cat "$temp_stats" | jq -r '.total_errors') + new_errors))
    local preprocessing_ops=$(($(cat "$temp_stats" | jq -r '.preprocessing_ops') + new_preprocessing))
    
    # Update tokens and cost from new responses
    local new_tokens=$(echo "$new_lines" | grep '"tokensUsed"' | jq -r 'select(.tokensUsed) | .tokensUsed.total' | awk '{sum+=$1} END {print sum+0}' || echo "0")
    local total_tokens=$(($(cat "$temp_stats" | jq -r '.total_tokens') + new_tokens))
    
    # Update operations by type
    local ops_by_type=$(cat "$temp_stats" | jq -r '.operations_by_type')
    echo "$new_lines" | grep '"operationType"' | jq -r '.operationType' | sort | uniq -c | while read count type; do
        ops_by_type=$(echo "$ops_by_type" | jq --arg type "$type" --argjson count "$count" '. + {($type): (. + {($type): 0} | .[$type] + $count)}')
    done
    
    # Update operations by model
    local ops_by_model=$(cat "$temp_stats" | jq -r '.operations_by_model')
    echo "$new_lines" | grep '"model"' | jq -r '.model' | sort | uniq -c | while read count model; do
        ops_by_model=$(echo "$ops_by_model" | jq --arg model "$model" --argjson count "$count" '. + {($model): (. + {($model): 0} | .[$model] + $count)}')
    done
    
    # Update response times
    local response_times=$(cat "$temp_stats" | jq -r '.response_times')
    echo "$new_lines" | grep '"LLM Response"' | jq -r 'select(.duration) | .duration' | while read duration; do
        response_times=$(echo "$response_times" | jq --argjson duration "$duration" '. + [$duration]')
    done
    
    # Keep only last 100 response times
    response_times=$(echo "$response_times" | jq '.[-100:]')
    
    # Update recent errors
    local recent_errors=$(cat "$temp_stats" | jq -r '.recent_errors')
    echo "$new_lines" | grep '"success": false' | jq -r 'select(.error) | .error' | while read error; do
        recent_errors=$(echo "$recent_errors" | jq --arg error "$error" '. + [$error]')
    done
    
    # Keep only last 10 errors
    recent_errors=$(echo "$recent_errors" | jq '.[-10:]')
    
    # Update stats file
    cat > "$temp_stats" << EOF
{
    "start_time": $(cat "$temp_stats" | jq -r '.start_time'),
    "total_requests": $total_requests,
    "total_responses": $total_responses,
    "total_errors": $total_errors,
    "preprocessing_ops": $preprocessing_ops,
    "total_tokens": $total_tokens,
    "total_cost": $(cat "$temp_stats" | jq -r '.total_cost'),
    "last_file_size": $current_size,
    "last_operation": "$(date +%s)",
    "operations_by_type": $ops_by_type,
    "operations_by_model": $ops_by_model,
    "response_times": $response_times,
    "recent_errors": $recent_errors
}
EOF
    
    mv "$temp_stats" "$STATS_FILE"
}

# Calculate average response time
get_avg_response_time() {
    local times=$(cat "$STATS_FILE" | jq -r '.response_times[]' | awk '{sum+=$1; count++} END {if(count>0) printf "%.0f", sum/count; else print "0"}')
    echo "${times:-0}"
}

# Calculate success rate
get_success_rate() {
    local total_responses=$(cat "$STATS_FILE" | jq -r '.total_responses')
    local total_errors=$(cat "$STATS_FILE" | jq -r '.total_errors')
    
    if [ "$total_responses" -eq 0 ]; then
        echo "0"
        return
    fi
    
    local success_rate=$(echo "scale=1; ($total_responses - $total_errors) * 100 / $total_responses" | bc -l 2>/dev/null || echo "0")
    echo "$success_rate"
}

# Get uptime
get_uptime() {
    local start_time=$(cat "$STATS_FILE" | jq -r '.start_time')
    local current_time=$(date +%s)
    local uptime=$((current_time - start_time))
    
    local hours=$((uptime / 3600))
    local minutes=$(((uptime % 3600) / 60))
    local seconds=$((uptime % 60))
    
    printf "%02d:%02d:%02d" $hours $minutes $seconds
}

# Display dashboard
display_dashboard() {
    clear
    
    # Header
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${NC}                          ${CYAN}LLM Operations Monitor${NC}                           ${WHITE}║${NC}"
    echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Basic stats
    local total_requests=$(cat "$STATS_FILE" | jq -r '.total_requests')
    local total_responses=$(cat "$STATS_FILE" | jq -r '.total_responses')
    local total_errors=$(cat "$STATS_FILE" | jq -r '.total_errors')
    local preprocessing_ops=$(cat "$STATS_FILE" | jq -r '.preprocessing_ops')
    local total_tokens=$(cat "$STATS_FILE" | jq -r '.total_tokens')
    local success_rate=$(get_success_rate)
    local avg_response_time=$(get_avg_response_time)
    local uptime=$(get_uptime)
    
    echo -e "${WHITE}║${NC} ${BLUE}Uptime:${NC} $uptime"
    echo -e "${WHITE}║${NC} ${BLUE}Total Requests:${NC} $total_requests"
    echo -e "${WHITE}║${NC} ${BLUE}Total Responses:${NC} $total_responses"
    echo -e "${WHITE}║${NC} ${BLUE}Success Rate:${NC} $success_rate%"
    echo -e "${WHITE}║${NC} ${BLUE}Total Errors:${NC} $total_errors"
    echo -e "${WHITE}║${NC} ${BLUE}Preprocessing Ops:${NC} $preprocessing_ops"
    echo -e "${WHITE}║${NC} ${BLUE}Total Tokens:${NC} $total_tokens"
    echo -e "${WHITE}║${NC} ${BLUE}Avg Response Time:${NC} ${avg_response_time}ms"
    
    echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Operations by type
    echo -e "${WHITE}║${NC} ${YELLOW}Operations by Type:${NC}"
    local ops_by_type=$(cat "$STATS_FILE" | jq -r '.operations_by_type')
    echo "$ops_by_type" | jq -r 'to_entries[] | "\(.key): \(.value)"' | while read line; do
        echo -e "${WHITE}║${NC}   $line"
    done
    
    echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Operations by model
    echo -e "${WHITE}║${NC} ${YELLOW}Operations by Model:${NC}"
    local ops_by_model=$(cat "$STATS_FILE" | jq -r '.operations_by_model')
    echo "$ops_by_model" | jq -r 'to_entries[] | "\(.key): \(.value)"' | while read line; do
        echo -e "${WHITE}║${NC}   $line"
    done
    
    echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Recent errors
    local recent_errors=$(cat "$STATS_FILE" | jq -r '.recent_errors')
    local error_count=$(echo "$recent_errors" | jq -r 'length')
    
    if [ "$error_count" -gt 0 ]; then
        echo -e "${WHITE}║${NC} ${RED}Recent Errors:${NC}"
        echo "$recent_errors" | jq -r '.[-3:] | .[]' | while read error; do
            echo -e "${WHITE}║${NC}   ${RED}$error${NC}"
        done
    else
        echo -e "${WHITE}║${NC} ${GREEN}No recent errors${NC}"
    fi
    
    echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Footer
    echo -e "${WHITE}║${NC} ${CYAN}Log File:${NC} $LOG_FILE"
    echo -e "${WHITE}║${NC} ${CYAN}Refresh:${NC} Every ${REFRESH_INTERVAL}s | ${CYAN}Press Ctrl+C to exit${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
}

# Main monitoring loop
monitor() {
    log_info "Starting LLM monitor"
    log_info "Log file: $LOG_FILE"
    log_info "Refresh interval: ${REFRESH_INTERVAL}s"
    log_info "Press Ctrl+C to stop"
    
    # Initialize stats
    init_stats
    
    # Check if log file exists
    if [ ! -f "$LOG_FILE" ]; then
        log_error "Log file not found: $LOG_FILE"
        log_info "Creating empty log file and waiting for data..."
        mkdir -p "$(dirname "$LOG_FILE")"
        touch "$LOG_FILE"
    fi
    
    # Main loop
    while true; do
        update_stats
        display_dashboard
        sleep "$REFRESH_INTERVAL"
    done
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Cleanup on exit
cleanup() {
    log_info "Shutting down monitor..."
    rm -f "$STATS_FILE"
    exit 0
}

# Handle signals
trap cleanup SIGINT SIGTERM

# Check dependencies
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_error "bc is required but not installed"
    exit 1
fi

# Run monitor
monitor
