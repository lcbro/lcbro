#!/bin/bash

# Logs Manager Script
# Utility script for managing log files and directories

set -e

# Configuration
DEFAULT_LOGS_DIR="/data/logs"
DEFAULT_MAX_AGE_DAYS=30
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
Logs Manager - Utility for managing log files and directories

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    list                    List all log files
    summary                 Show logs summary with statistics
    cleanup [DAYS]          Clean up old log files (default: $DEFAULT_MAX_AGE_DAYS days)
    compress                Compress uncompressed log files
    rotate                  Perform log rotation
    size                    Show disk usage statistics
    tail [CATEGORY]         Tail log files (optionally filter by category)
    search [PATTERN]        Search for patterns in log files
    export [CATEGORY]       Export logs to archive
    help                    Show this help

Options:
    -d, --directory DIR     Logs directory (default: $DEFAULT_LOGS_DIR)
    -v, --verbose          Verbose output
    -f, --follow           Follow mode for tail command
    -n, --lines NUM        Number of lines for tail command (default: 100)
    -g, --grep PATTERN     Grep pattern for search/filtering
    -o, --output FILE      Output file for export

Examples:
    $0 list                                    # List all log files
    $0 summary                                 # Show logs summary
    $0 cleanup 7                               # Clean up files older than 7 days
    $0 tail browser                           # Tail browser logs
    $0 search "error"                          # Search for errors in logs
    $0 export browser -o browser-logs.tar.gz  # Export browser logs

EOF
}

# Check if directory exists and is writable
check_logs_directory() {
    local dir="$1"
    
    if [ ! -d "$dir" ]; then
        log_error "Logs directory does not exist: $dir"
        return 1
    fi
    
    if [ ! -w "$dir" ]; then
        log_error "Logs directory is not writable: $dir"
        return 1
    fi
    
    return 0
}

# List all log files
list_log_files() {
    local dir="$1"
    
    log_info "Listing log files in: $dir"
    echo
    
    if [ ! -d "$dir" ]; then
        log_error "Directory does not exist: $dir"
        return 1
    fi
    
    # Find all log files
    local files=($(find "$dir" -name "*.log" -o -name "*.gz" | sort))
    
    if [ ${#files[@]} -eq 0 ]; then
        log_warning "No log files found in: $dir"
        return 0
    fi
    
    # Display files with details
    printf "%-50s %-12s %-20s %-10s\n" "FILENAME" "SIZE" "MODIFIED" "COMPRESSED"
    printf "%-50s %-12s %-20s %-10s\n" "$(printf '%*s' 50 | tr ' ' '-')" "$(printf '%*s' 12 | tr ' ' '-')" "$(printf '%*s' 20 | tr ' ' '-')" "$(printf '%*s' 10 | tr ' ' '-')"
    
    for file in "${files[@]}"; do
        local filename=$(basename "$file")
        local size=$(du -h "$file" | cut -f1)
        local modified=$(stat -c %y "$file" | cut -d' ' -f1,2 | cut -d'.' -f1)
        local compressed="No"
        
        if [[ "$file" == *.gz ]]; then
            compressed="Yes"
        fi
        
        printf "%-50s %-12s %-20s %-10s\n" "$filename" "$size" "$modified" "$compressed"
    done
    
    echo
    log_info "Total files: ${#files[@]}"
}

# Show logs summary
show_logs_summary() {
    local dir="$1"
    
    log_info "Logs Summary for: $dir"
    echo
    
    if [ ! -d "$dir" ]; then
        log_error "Directory does not exist: $dir"
        return 1
    fi
    
    # Get file counts and sizes
    local total_files=0
    local total_size=0
    local compressed_files=0
    local uncompressed_files=0
    local categories=()
    
    # Process all log files
    while IFS= read -r -d '' file; do
        total_files=$((total_files + 1))
        
        local size=$(stat -c %s "$file")
        total_size=$((total_size + size))
        
        if [[ "$file" == *.gz ]]; then
            compressed_files=$((compressed_files + 1))
        else
            uncompressed_files=$((uncompressed_files + 1))
        fi
        
        # Extract category (first part before dash)
        local filename=$(basename "$file")
        local category=$(echo "$filename" | cut -d'-' -f1)
        categories+=("$category")
        
    done < <(find "$dir" -name "*.log" -o -name "*.gz" -print0)
    
    # Calculate unique categories
    local unique_categories=($(printf '%s\n' "${categories[@]}" | sort -u))
    
    # Format total size
    local format_size() {
        local bytes=$1
        local units=('B' 'KB' 'MB' 'GB' 'TB')
        local size=$bytes
        local unit_index=0
        
        while [ $size -ge 1024 ] && [ $unit_index -lt $((${#units[@]} - 1)) ]; do
            size=$((size / 1024))
            unit_index=$((unit_index + 1))
        done
        
        printf "%.1f%s" $(echo "scale=1; $size" | bc) "${units[$unit_index]}"
    }
    
    # Display summary
    echo "Directory: $dir"
    echo "Total Files: $total_files"
    echo "Total Size: $(format_size $total_size)"
    echo "Compressed Files: $compressed_files"
    echo "Uncompressed Files: $uncompressed_files"
    echo "Categories: ${#unique_categories[@]}"
    echo
    
    # Show categories
    if [ ${#unique_categories[@]} -gt 0 ]; then
        echo "Categories found:"
        for category in "${unique_categories[@]}"; do
            local count=$(printf '%s\n' "${categories[@]}" | grep -c "^$category$")
            echo "  - $category: $count files"
        done
        echo
    fi
    
    # Show oldest and newest files
    local oldest_file=$(find "$dir" -name "*.log" -o -name "*.gz" -printf '%T@ %p\n' | sort -n | head -1 | cut -d' ' -f2-)
    local newest_file=$(find "$dir" -name "*.log" -o -name "*.gz" -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    
    if [ -n "$oldest_file" ]; then
        echo "Oldest File: $(basename "$oldest_file")"
        echo "Newest File: $(basename "$newest_file")"
    fi
}

# Clean up old log files
cleanup_old_logs() {
    local dir="$1"
    local max_age_days="$2"
    
    log_info "Cleaning up log files older than $max_age_days days in: $dir"
    
    if [ ! -d "$dir" ]; then
        log_error "Directory does not exist: $dir"
        return 1
    fi
    
    local deleted_count=0
    local cutoff_date=$(date -d "$max_age_days days ago" +%Y%m%d)
    
    # Find and delete old files
    while IFS= read -r -d '' file; do
        local file_date=$(stat -c %y "$file" | cut -d' ' -f1 | tr -d '-')
        
        if [ "$file_date" -lt "$cutoff_date" ]; then
            if [ "$VERBOSE" = true ]; then
                log_info "Deleting old file: $(basename "$file")"
            fi
            
            if rm "$file"; then
                deleted_count=$((deleted_count + 1))
            else
                log_warning "Failed to delete: $file"
            fi
        fi
    done < <(find "$dir" -name "*.log" -o -name "*.gz" -print0)
    
    if [ $deleted_count -gt 0 ]; then
        log_success "Deleted $deleted_count old log files"
    else
        log_info "No old log files found to delete"
    fi
}

# Compress uncompressed log files
compress_log_files() {
    local dir="$1"
    
    log_info "Compressing uncompressed log files in: $dir"
    
    if [ ! -d "$dir" ]; then
        log_error "Directory does not exist: $dir"
        return 1
    fi
    
    local compressed_count=0
    
    # Find uncompressed log files
    while IFS= read -r -d '' file; do
        if [ "$VERBOSE" = true ]; then
            log_info "Compressing: $(basename "$file")"
        fi
        
        if gzip "$file"; then
            compressed_count=$((compressed_count + 1))
        else
            log_warning "Failed to compress: $file"
        fi
    done < <(find "$dir" -name "*.log" -print0)
    
    if [ $compressed_count -gt 0 ]; then
        log_success "Compressed $compressed_count log files"
    else
        log_info "No uncompressed log files found"
    fi
}

# Show disk usage statistics
show_disk_usage() {
    local dir="$1"
    
    log_info "Disk usage statistics for: $dir"
    echo
    
    if [ ! -d "$dir" ]; then
        log_error "Directory does not exist: $dir"
        return 1
    fi
    
    # Overall directory size
    local total_size=$(du -sh "$dir" | cut -f1)
    echo "Total Directory Size: $total_size"
    
    # Size by file type
    local log_size=$(find "$dir" -name "*.log" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "0B")
    local gz_size=$(find "$dir" -name "*.gz" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "0B")
    
    echo "Uncompressed Logs: $log_size"
    echo "Compressed Logs: $gz_size"
    echo
    
    # Top 10 largest files
    echo "Top 10 Largest Files:"
    find "$dir" -name "*.log" -o -name "*.gz" -exec du -h {} + | sort -hr | head -10 | while read size file; do
        echo "  $size  $(basename "$file")"
    done
}

# Tail log files
tail_log_files() {
    local dir="$1"
    local category="$2"
    local lines="$3"
    local follow="$4"
    local grep_pattern="$5"
    
    local pattern="*.log"
    if [ -n "$category" ]; then
        pattern="${category}-*.log"
    fi
    
    local files=($(find "$dir" -name "$pattern" -type f | sort))
    
    if [ ${#files[@]} -eq 0 ]; then
        log_warning "No log files found matching pattern: $pattern"
        return 1
    fi
    
    local tail_cmd="tail -n $lines"
    if [ "$follow" = true ]; then
        tail_cmd="$tail_cmd -f"
    fi
    
    if [ -n "$grep_pattern" ]; then
        tail_cmd="$tail_cmd | grep '$grep_pattern'"
    fi
    
    log_info "Tailing log files (pattern: $pattern, lines: $lines)"
    if [ "$follow" = true ]; then
        log_info "Press Ctrl+C to stop following"
    fi
    echo
    
    # Tail all matching files
    for file in "${files[@]}"; do
        echo "=== $(basename "$file") ==="
        if [ -n "$grep_pattern" ]; then
            tail -n $lines "$file" | grep "$grep_pattern" || true
        else
            tail -n $lines "$file"
        fi
        echo
    done
    
    if [ "$follow" = true ]; then
        # Follow the most recent file
        local most_recent_file=$(find "$dir" -name "$pattern" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
        if [ -n "$most_recent_file" ]; then
            log_info "Following: $(basename "$most_recent_file")"
            tail -f "$most_recent_file"
        fi
    fi
}

# Search in log files
search_log_files() {
    local dir="$1"
    local pattern="$2"
    local grep_pattern="$3"
    
    log_info "Searching for '$pattern' in log files"
    
    if [ ! -d "$dir" ]; then
        log_error "Directory does not exist: $dir"
        return 1
    fi
    
    local search_cmd="grep -r"
    if [ "$VERBOSE" = true ]; then
        search_cmd="$search_cmd -n"
    fi
    
    if [ -n "$grep_pattern" ]; then
        search_cmd="$search_cmd -E '$grep_pattern'"
    else
        search_cmd="$search_cmd '$pattern'"
    fi
    
    local files=($(find "$dir" -name "*.log" -o -name "*.gz" | sort))
    local match_count=0
    
    for file in "${files[@]}"; do
        local matches
        if [[ "$file" == *.gz ]]; then
            matches=$(zgrep -c "$pattern" "$file" 2>/dev/null || echo "0")
        else
            matches=$(grep -c "$pattern" "$file" 2>/dev/null || echo "0")
        fi
        
        if [ "$matches" -gt 0 ]; then
            match_count=$((match_count + 1))
            echo "=== $(basename "$file") ($matches matches) ==="
            
            if [[ "$file" == *.gz ]]; then
                zgrep "$pattern" "$file" 2>/dev/null || true
            else
                grep "$pattern" "$file" 2>/dev/null || true
            fi
            echo
        fi
    done
    
    if [ $match_count -eq 0 ]; then
        log_info "No matches found for: $pattern"
    else
        log_info "Found matches in $match_count files"
    fi
}

# Export logs to archive
export_logs() {
    local dir="$1"
    local category="$2"
    local output_file="$3"
    
    if [ -z "$output_file" ]; then
        local timestamp=$(date +%Y%m%d_%H%M%S)
        if [ -n "$category" ]; then
            output_file="${category}_logs_${timestamp}.tar.gz"
        else
            output_file="all_logs_${timestamp}.tar.gz"
        fi
    fi
    
    local pattern="*.log *.gz"
    if [ -n "$category" ]; then
        pattern="${category}-*.log ${category}-*.gz"
    fi
    
    log_info "Exporting logs to: $output_file"
    
    if [ ! -d "$dir" ]; then
        log_error "Directory does not exist: $dir"
        return 1
    fi
    
    # Create archive
    if tar -czf "$output_file" -C "$dir" $pattern; then
        local archive_size=$(du -h "$output_file" | cut -f1)
        log_success "Exported logs to: $output_file ($archive_size)"
    else
        log_error "Failed to create archive: $output_file"
        return 1
    fi
}

# Main function
main() {
    local command=""
    local logs_dir="$DEFAULT_LOGS_DIR"
    local max_age_days="$DEFAULT_MAX_AGE_DAYS"
    local follow=false
    local lines=100
    local grep_pattern=""
    local output_file=""
    local category=""

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            list|summary|cleanup|compress|rotate|size|tail|search|export|help)
                if [ -z "$command" ]; then
                    command="$1"
                fi
                shift
                ;;
            -d|--directory)
                logs_dir="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -f|--follow)
                follow=true
                shift
                ;;
            -n|--lines)
                lines="$2"
                shift 2
                ;;
            -g|--grep)
                grep_pattern="$2"
                shift 2
                ;;
            -o|--output)
                output_file="$2"
                shift 2
                ;;
            [0-9]*)
                if [ "$command" = "cleanup" ]; then
                    max_age_days="$1"
                elif [ "$command" = "tail" ] || [ "$command" = "search" ] || [ "$command" = "export" ]; then
                    category="$1"
                fi
                shift
                ;;
            *)
                if [ "$command" = "search" ] && [ -z "$grep_pattern" ]; then
                    grep_pattern="$1"
                elif [ "$command" = "tail" ] || [ "$command" = "export" ]; then
                    category="$1"
                else
                    log_error "Unknown argument: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Check if command is provided
    if [ -z "$command" ]; then
        log_error "Command is required"
        show_help
        exit 1
    fi

    # Handle help command
    if [ "$command" = "help" ]; then
        show_help
        exit 0
    fi

    # Check logs directory for most commands
    if [ "$command" != "list" ] && [ "$command" != "summary" ]; then
        if ! check_logs_directory "$logs_dir"; then
            exit 1
        fi
    fi

    # Execute command
    case $command in
        list)
            list_log_files "$logs_dir"
            ;;
        summary)
            show_logs_summary "$logs_dir"
            ;;
        cleanup)
            cleanup_old_logs "$logs_dir" "$max_age_days"
            ;;
        compress)
            compress_log_files "$logs_dir"
            ;;
        rotate)
            log_info "Log rotation not implemented in this script"
            log_info "Use the application's built-in rotation or cron jobs"
            ;;
        size)
            show_disk_usage "$logs_dir"
            ;;
        tail)
            tail_log_files "$logs_dir" "$category" "$lines" "$follow" "$grep_pattern"
            ;;
        search)
            search_log_files "$logs_dir" "$grep_pattern" "$grep_pattern"
            ;;
        export)
            export_logs "$logs_dir" "$category" "$output_file"
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Check dependencies
if ! command -v find >/dev/null 2>&1; then
    log_error "find command is required but not installed"
    exit 1
fi

if ! command -v du >/dev/null 2>&1; then
    log_error "du command is required but not installed"
    exit 1
fi

# Run main function
main "$@"
