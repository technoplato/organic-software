#!/bin/bash

# View supervisor logs
if [ -f logs/supervisor.log ]; then
    # Default to showing last 50 lines, or use provided argument
    LINES=${1:-50}
    echo "📝 Showing last $LINES lines of supervisor logs..."
    echo "========================================"
    tail -n $LINES logs/supervisor.log
    echo "========================================"
    echo "ℹ️  Use 'npm run supervisor:logs [number]' to see more lines"
    echo "ℹ️  Or 'tail -f logs/supervisor.log' to follow in real-time"
else
    echo "❌ No log file found at logs/supervisor.log"
    echo "ℹ️  Start the supervisor first with: npm run supervisor:background"
fi