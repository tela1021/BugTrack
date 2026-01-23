#!/bin/bash

# stop.sh
# Script to stop the BugTrack application running on port 3002

PORT=3002

echo "Stopping BugTrack on port $PORT..."

PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
    echo "No process found running on port $PORT."
else
    kill -9 $PID
    echo "✅ Process $PID stopped."
fi
