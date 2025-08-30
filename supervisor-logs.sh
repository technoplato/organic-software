#!/bin/bash

# View supervisor logs
if [ -f logs/supervisor.log ]; then
    echo "📝 Showing supervisor logs (Ctrl+C to exit)..."
    echo "=" 
    tail -f logs/supervisor.log
else
    echo "❌ No log file found at logs/supervisor.log"
    echo "ℹ️  Start the supervisor first with: ./start-supervisor.sh"
fi