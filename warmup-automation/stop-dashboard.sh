#!/bin/bash

###############################################################################
# Dashboard Stop Script
# Stops the running dashboard service
###############################################################################

set -e

# Configuration
PID_FILE="./dashboard.pid"
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/dashboard.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  Dashboard is not running (no PID file)${NC}"
    exit 0
fi

# Read PID
PID=$(cat "$PID_FILE")

# Check if process is running
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${BLUE}🛑 Stopping dashboard (PID: $PID)...${NC}"
    
    # Send SIGTERM (graceful shutdown)
    kill "$PID" 2>/dev/null || true
    
    # Wait for process to terminate
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Dashboard stopped successfully${NC}"
            rm "$PID_FILE"
            exit 0
        fi
        sleep 1
    done
    
    # If still running, force kill
    echo -e "${YELLOW}⚠️  Force killing...${NC}"
    kill -9 "$PID" 2>/dev/null || true
    sleep 1
    
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Dashboard force stopped${NC}"
        rm "$PID_FILE"
        exit 0
    fi
    
    echo -e "${RED}❌ Could not stop dashboard${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  Dashboard process not found (stale PID file)${NC}"
    rm "$PID_FILE"
    exit 0
fi
