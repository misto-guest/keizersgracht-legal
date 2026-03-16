#!/bin/bash
# Quick test script for Adspower remote integration
# Run this from a network that can access 77.42.21.134:50325

cd "$(dirname "$0")"

echo "========================================"
echo "Adspower Remote Integration Test"
echo "========================================"
echo ""
echo "Server: 77.42.21.134:50325"
echo "Profile: ${1:-k12am9a2}"
echo ""

# Test connection first
echo "Step 1: Testing API connection..."
node -e "
const AdsPowerClient = require('./adspower-client-remote');
const client = new AdsPowerClient();
client.testConnection().then(r => {
    if (r.success) {
        console.log('✅ Connection OK');
        process.exit(0);
    } else {
        console.log('❌ Connection failed: ' + r.message);
        process.exit(1);
    }
}).catch(e => {
    console.log('❌ Error: ' + e.message);
    process.exit(1);
});
"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Cannot connect to Adspower server."
    echo "   The server may be behind a firewall or not accessible from this network."
    exit 1
fi

echo ""
echo "Step 2: Running warmup on profile ${1:-k12am9a2}..."
node warmup-remote.js "${1:-k12am9a2}"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Warmup completed successfully!"
else
    echo ""
    echo "❌ Warmup failed. Check logs for details."
fi
