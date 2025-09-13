#!/bin/bash

# LLM Log Analysis Script
# Analyzes LLM performance logs and generates reports

set -e

# Configuration
LOG_DIR="${LOG_DIR:-logs}"
REPORT_DIR="${REPORT_DIR:-reports}"
DATE_FILTER="${DATE_FILTER:-$(date +%Y-%m-%d)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v awk &> /dev/null; then
        missing_deps+=("awk")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install missing dependencies and try again"
        exit 1
    fi
}

# Find log files
find_log_files() {
    local log_files=()
    
    if [ -f "$LOG_DIR/app.log" ]; then
        log_files+=("$LOG_DIR/app.log")
    fi
    
    # Find dated log files
    for file in "$LOG_DIR"/app-*.log; do
        if [ -f "$file" ]; then
            log_files+=("$file")
        fi
    done
    
    echo "${log_files[@]}"
}

# Analyze LLM operations
analyze_llm_operations() {
    local log_file="$1"
    local output_file="$2"
    
    log_info "Analyzing LLM operations from $log_file"
    
    {
        echo "=== LLM Operations Analysis ==="
        echo "Log file: $log_file"
        echo "Analysis date: $(date)"
        echo ""
        
        # Total operations
        local total_requests=$(grep -c '"LLM Request"' "$log_file" 2>/dev/null || echo "0")
        echo "Total LLM Requests: $total_requests"
        
        # Operations by type
        echo ""
        echo "Operations by type:"
        grep '"operationType"' "$log_file" 2>/dev/null | jq -r '.operationType' | sort | uniq -c | while read count type; do
            echo "  $type: $count"
        done
        
        # Operations by model
        echo ""
        echo "Operations by model:"
        grep '"model"' "$log_file" 2>/dev/null | jq -r '.model' | sort | uniq -c | while read count model; do
            echo "  $model: $count"
        done
        
        # Success rate
        local total_responses=$(grep -c '"LLM Response"' "$log_file" 2>/dev/null || echo "0")
        local failed_responses=$(grep -c '"success": false' "$log_file" 2>/dev/null || echo "0")
        local success_rate=0
        if [ "$total_responses" -gt 0 ]; then
            success_rate=$(echo "scale=2; ($total_responses - $failed_responses) * 100 / $total_responses" | bc -l 2>/dev/null || echo "0")
        fi
        echo ""
        echo "Success Rate: ${success_rate}%"
        echo "Total Responses: $total_responses"
        echo "Failed Responses: $failed_responses"
        
    } > "$output_file"
}

# Analyze token usage
analyze_token_usage() {
    local log_file="$1"
    local output_file="$2"
    
    log_info "Analyzing token usage from $log_file"
    
    {
        echo ""
        echo "=== Token Usage Analysis ==="
        
        # Extract token usage data
        local token_data=$(grep '"tokensUsed"' "$log_file" 2>/dev/null | jq -r 'select(.tokensUsed) | [.tokensUsed.prompt, .tokensUsed.completion, .tokensUsed.total] | @csv' 2>/dev/null || echo "")
        
        if [ -n "$token_data" ]; then
            # Calculate totals
            local total_prompt_tokens=$(echo "$token_data" | awk -F',' '{sum+=$1} END {print sum+0}')
            local total_completion_tokens=$(echo "$token_data" | awk -F',' '{sum+=$2} END {print sum+0}')
            local total_tokens=$(echo "$token_data" | awk -F',' '{sum+=$3} END {print sum+0}')
            
            echo "Total Prompt Tokens: $total_prompt_tokens"
            echo "Total Completion Tokens: $total_completion_tokens"
            echo "Total Tokens: $total_tokens"
            
            # Average tokens per operation
            local avg_prompt=$(echo "scale=2; $total_prompt_tokens / $(echo "$token_data" | wc -l)" | bc -l 2>/dev/null || echo "0")
            local avg_completion=$(echo "scale=2; $total_completion_tokens / $(echo "$token_data" | wc -l)" | bc -l 2>/dev/null || echo "0")
            local avg_total=$(echo "scale=2; $total_tokens / $(echo "$token_data" | wc -l)" | bc -l 2>/dev/null || echo "0")
            
            echo ""
            echo "Average Tokens per Operation:"
            echo "  Prompt: $avg_prompt"
            echo "  Completion: $avg_completion"
            echo "  Total: $avg_total"
        else
            echo "No token usage data found"
        fi
        
    } >> "$output_file"
}

# Analyze preprocessing effectiveness
analyze_preprocessing() {
    local log_file="$1"
    local output_file="$2"
    
    log_info "Analyzing preprocessing effectiveness from $log_file"
    
    {
        echo ""
        echo "=== Preprocessing Analysis ==="
        
        # Count preprocessing operations
        local preprocess_ops=$(grep -c '"operationType": "preprocessing"' "$log_file" 2>/dev/null || echo "0")
        echo "Preprocessing Operations: $preprocess_ops"
        
        # Analyze preprocessing results
        local preprocessing_data=$(grep '"Preprocessing Analysis & Results"' "$log_file" 2>/dev/null | jq -r 'select(.reductionPercentage) | .reductionPercentage' 2>/dev/null || echo "")
        
        if [ -n "$preprocessing_data" ]; then
            local avg_reduction=$(echo "$preprocessing_data" | awk '{sum+=$1; count++} END {if(count>0) printf "%.2f", sum/count; else print "0"}')
            echo "Average Data Reduction: ${avg_reduction}%"
            
            local max_reduction=$(echo "$preprocessing_data" | awk 'BEGIN{max=0} {if($1>max) max=$1} END {printf "%.2f", max}')
            echo "Maximum Data Reduction: ${max_reduction}%"
            
            local min_reduction=$(echo "$preprocessing_data" | awk 'BEGIN{min=100} {if($1<min) min=$1} END {printf "%.2f", min}')
            echo "Minimum Data Reduction: ${min_reduction}%"
        fi
        
        # Analyze cost savings
        local cost_savings=$(grep '"Preprocessing Cost Analysis"' "$log_file" 2>/dev/null | jq -r 'select(.estimatedCostSaved) | .estimatedCostSaved' 2>/dev/null || echo "")
        
        if [ -n "$cost_savings" ]; then
            local total_savings=$(echo "$cost_savings" | awk '{sum+=$1} END {printf "%.4f", sum}')
            echo "Total Estimated Cost Savings: \$$total_savings"
            
            local avg_savings=$(echo "$cost_savings" | awk '{sum+=$1; count++} END {if(count>0) printf "%.4f", sum/count; else print "0"}')
            echo "Average Cost Savings per Operation: \$$avg_savings"
        fi
        
    } >> "$output_file"
}

# Analyze performance metrics
analyze_performance() {
    local log_file="$1"
    local output_file="$2"
    
    log_info "Analyzing performance metrics from $log_file"
    
    {
        echo ""
        echo "=== Performance Analysis ==="
        
        # Response times
        local response_times=$(grep '"LLM Response"' "$log_file" 2>/dev/null | jq -r 'select(.duration) | .duration' 2>/dev/null || echo "")
        
        if [ -n "$response_times" ]; then
            local avg_time=$(echo "$response_times" | awk '{sum+=$1; count++} END {if(count>0) printf "%.0f", sum/count; else print "0"}')
            echo "Average Response Time: ${avg_time}ms"
            
            local max_time=$(echo "$response_times" | awk 'BEGIN{max=0} {if($1>max) max=$1} END {print max}')
            echo "Maximum Response Time: ${max_time}ms"
            
            local min_time=$(echo "$response_times" | awk 'BEGIN{min=999999} {if($1<min) min=$1} END {if(min==999999) print "0"; else print min}')
            echo "Minimum Response Time: ${min_time}ms"
        fi
        
        # Performance by operation type
        echo ""
        echo "Performance by Operation Type:"
        for type in analysis preprocessing main; do
            local type_times=$(grep "\"operationType\": \"$type\"" "$log_file" 2>/dev/null | jq -r 'select(.duration) | .duration' 2>/dev/null || echo "")
            if [ -n "$type_times" ]; then
                local type_avg=$(echo "$type_times" | awk '{sum+=$1; count++} END {if(count>0) printf "%.0f", sum/count; else print "0"}')
                echo "  $type: ${type_avg}ms average"
            fi
        done
        
    } >> "$output_file"
}

# Generate summary report
generate_summary() {
    local output_file="$1"
    
    {
        echo ""
        echo "=== Summary ==="
        echo "Report generated: $(date)"
        echo "Log directory: $LOG_DIR"
        echo "Report directory: $REPORT_DIR"
        
        # Top recommendations
        echo ""
        echo "Recommendations:"
        echo "1. Monitor token usage trends to optimize prompts"
        echo "2. Analyze preprocessing effectiveness to improve data cleaning"
        echo "3. Track response times to identify performance bottlenecks"
        echo "4. Review error patterns to improve reliability"
        
    } >> "$output_file"
}

# Main analysis function
analyze_logs() {
    local log_files=($(find_log_files))
    
    if [ ${#log_files[@]} -eq 0 ]; then
        log_error "No log files found in $LOG_DIR"
        exit 1
    fi
    
    # Create report directory
    mkdir -p "$REPORT_DIR"
    
    # Generate timestamp for report
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="$REPORT_DIR/llm_analysis_$timestamp.txt"
    
    log_info "Starting analysis of ${#log_files[@]} log files"
    
    # Analyze each log file
    for log_file in "${log_files[@]}"; do
        log_info "Processing $log_file"
        
        # Add file header
        {
            echo "========================================"
            echo "LLM Log Analysis Report"
            echo "========================================"
            echo ""
        } > "$report_file"
        
        # Run all analyses
        analyze_llm_operations "$log_file" "$report_file"
        analyze_token_usage "$log_file" "$report_file"
        analyze_preprocessing "$log_file" "$report_file"
        analyze_performance "$log_file" "$report_file"
        generate_summary "$report_file"
        
        log_success "Analysis complete for $log_file"
    done
    
    log_success "Full analysis report saved to: $report_file"
    
    # Display quick summary
    echo ""
    log_info "Quick Summary:"
    echo "==============="
    tail -n 20 "$report_file" | grep -E "(Total LLM Requests|Success Rate|Average Response Time|Total Estimated Cost Savings)" || true
}

# Interactive mode
interactive_mode() {
    while true; do
        echo ""
        echo "=== LLM Log Analysis Menu ==="
        echo "1. Analyze all logs"
        echo "2. Analyze specific log file"
        echo "3. Quick stats"
        echo "4. View recent errors"
        echo "5. Exit"
        echo ""
        read -p "Select option (1-5): " choice
        
        case $choice in
            1)
                analyze_logs
                ;;
            2)
                read -p "Enter log file path: " log_file
                if [ -f "$log_file" ]; then
                    local report_file="$REPORT_DIR/llm_analysis_$(date +%Y%m%d_%H%M%S).txt"
                    analyze_llm_operations "$log_file" "$report_file"
                    analyze_token_usage "$log_file" "$report_file"
                    analyze_preprocessing "$log_file" "$report_file"
                    analyze_performance "$log_file" "$report_file"
                    generate_summary "$report_file"
                    log_success "Analysis saved to: $report_file"
                else
                    log_error "File not found: $log_file"
                fi
                ;;
            3)
                local log_files=($(find_log_files))
                if [ ${#log_files[@]} -gt 0 ]; then
                    local log_file="${log_files[0]}"
                    echo "Quick Stats for $log_file:"
                    echo "Total requests: $(grep -c '"LLM Request"' "$log_file" 2>/dev/null || echo "0")"
                    echo "Total errors: $(grep -c '"success": false' "$log_file" 2>/dev/null || echo "0")"
                    echo "Preprocessing ops: $(grep -c '"operationType": "preprocessing"' "$log_file" 2>/dev/null || echo "0")"
                fi
                ;;
            4)
                local log_files=($(find_log_files))
                if [ ${#log_files[@]} -gt 0 ]; then
                    local log_file="${log_files[0]}"
                    echo "Recent errors from $log_file:"
                    grep '"success": false' "$log_file" 2>/dev/null | tail -5 | jq -r '.error' 2>/dev/null || echo "No recent errors found"
                fi
                ;;
            5)
                log_info "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option. Please select 1-5."
                ;;
        esac
    done
}

# Main function
main() {
    log_info "LLM Log Analysis Tool"
    log_info "===================="
    
    # Check dependencies
    check_dependencies
    
    # Check if interactive mode is requested
    if [ "$1" = "--interactive" ] || [ "$1" = "-i" ]; then
        interactive_mode
    else
        analyze_logs
    fi
}

# Run main function with all arguments
main "$@"
