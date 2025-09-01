#!/bin/bash

# Stop the supervisor process
if [ -f .supervisor.pid ]; then
    PID=$(cat .supervisor.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "🛑 Stopping supervisor (PID: $PID)..."
        kill $PID
        sleep 2
        
        # Force kill if still running
        if ps -p $PID > /dev/null 2>&1; then
            echo "⚠️  Force stopping supervisor..."
            kill -9 $PID
        fi
        
        echo "✅ Supervisor stopped"
    else
        echo "ℹ️  Supervisor not running (PID: $PID not found)"
    fi
    rm .supervisor.pid
else
    echo "ℹ️  No supervisor PID file found"
fi

# Also kill any orphaned processes
pkill -f "npx tsx supervisor.ts" 2>/dev/null || true
pkill -f "npx tsx instant-message-handler.ts" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true

echo "✅ Cleanup complete"