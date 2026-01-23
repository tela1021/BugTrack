#!/bin/bash

# start.sh
# Script to start the BugTrack application

PORT=3002

echo "Starting BugTrack on port $PORT..."
npm start -- -p $PORT
