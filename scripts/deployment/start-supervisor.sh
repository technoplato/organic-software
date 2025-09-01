#!/bin/bash

# Start supervisor in background and redirect output to log file
echo "🚀 Starting supervisor in background..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill any existing supervisor process
if [ -f .supervisor.pid ]; then
    OLD_PID=$(cat .supervisor.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  Stopping existing supervisor (PID: $OLD_PID)"
        kill $OLD_PID 2>/dev/null || true
        sleep 2
    fi
fi

# Start supervisor in background
nohup npm run supervisor > logs/supervisor.log 2>&1 &
SUPERVISOR_PID=$!

# Save PID for later reference
echo $SUPERVISOR_PID > .supervisor.pid

echo "✅ Supervisor started with PID: $SUPERVISOR_PID"
echo "📝 Logs: tail -f logs/supervisor.log"
echo "🛑 To stop: ./stop-supervisor.sh"