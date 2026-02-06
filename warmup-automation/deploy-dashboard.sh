#!/bin/bash

###############################################################################
# Dashboard Deployment Script
# Starts the dashboard as a background service with logging
###############################################################################

set -e

# Configuration
PORT=${PORT:-3000}
LOG_DIR="./logs"
PID_FILE="./dashboard.pid"
LOG_FILE="$LOG_DIR/dashboard.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║     Gmail Warmup Dashboard Deployment                      ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

# Create log directory
mkdir -p "$LOG_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Dashboard is already running (PID: $OLD_PID)${NC}"
        echo -e "To stop it first: ${YELLOW}./stop-dashboard.sh${NC}"
        exit 1
    else
        echo -e "${YELLOW}Removing stale PID file${NC}"
        rm "$PID_FILE"
    fi
fi

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}❌ Port $PORT is already in use${NC}"
    echo -e "Please stop the service using port $PORT or change the port:"
    echo -e "  ${YELLOW}PORT=3001 ./deploy-dashboard.sh${NC}"
    exit 1
fi

# Check Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check dependencies
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if express is installed
if ! npm list express &> /dev/null; then
    echo -e "${YELLOW}Installing Express...${NC}"
    npm install express
fi

# Check if puppeteer is installed
if ! npm list puppeteer &> /dev/null; then
    echo -e "${YELLOW}Installing Puppeteer...${NC}"
    npm install puppeteer
fi

echo -e "${GREEN}✅ All dependencies OK${NC}"

# Start dashboard in background
echo -e "${BLUE}🚀 Starting dashboard server on port $PORT...${NC}"

nohup node dashboard-server.js > "$LOG_FILE" 2>&1 &
PID=$!

# Save PID
echo $PID > "$PID_FILE"

# Wait a moment for startup
sleep 2

# Check if it's running
if ps -p $PID > /dev/null; then
    echo -e "${GREEN}✅ Dashboard started successfully!${NC}"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Dashboard is now running                                    ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  URL:        http://localhost:$PORT                         ║${NC}"
    echo -e "${GREEN}║  PID:        $PID                                           ║${NC}"
    echo -e "${GREEN}║  Logs:       $LOG_FILE                ║${NC}"
    echo -e "${GREEN}║  PID file:   $PID_FILE                                 ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}💡 To view logs:${NC}"
    echo -e "   ${YELLOW}tail -f $LOG_FILE${NC}"
    echo ""
    echo -e "${BLUE}🛑 To stop the dashboard:${NC}"
    echo -e "   ${YELLOW}./stop-dashboard.sh${NC}"
    echo -e "   ${YELLOW}kill $PID${NC}"
    echo ""
    echo -e "${BLUE}🔄 To restart:${NC}"
    echo -e "   ${YELLOW}./stop-dashboard.sh && ./deploy-dashboard.sh${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to start dashboard${NC}"
    echo -e "${RED}Check log file: $LOG_FILE${NC}"
    rm "$PID_FILE"
    exit 1
fi
