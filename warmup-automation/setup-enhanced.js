#!/usr/bin/env node
/**
 * Enhanced Warmup Setup Script
 * Initializes configuration files and dependencies
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Enhanced Gmail Warmup System - Setup                    ║
╚══════════════════════════════════════════════════════════════╝
`);

// Create necessary directories
const dirs = [
    './users',
    './screenshots/enhanced-warmup',
    './screenshots/2fa-setup',
    './screenshots/profile-warmup',
    './logs',
    './public'
];

console.log('📁 Creating directories...');
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
    } else {
        console.log(`  ✓ Exists: ${dir}`);
    }
});

// Create sample accounts file
const accountsFile = './users/accounts.json';
if (!fs.existsSync(accountsFile)) {
    const sampleAccounts = {
        accounts: [
            {
                email: 'patmcgee727@gmail.com',
                profileId: 'k12am9a2',
                name: 'Pat McGee',
                status: 'new'
            }
        ],
        lastUpdated: new Date().toISOString(),
        notes: 'Add your Gmail accounts here with corresponding AdsPower profile IDs'
    };
    fs.writeFileSync(accountsFile, JSON.stringify(sampleAccounts, null, 2));
    console.log(`  ✅ Created: ${accountsFile}`);
} else {
    console.log(`  ✓ Exists: ${accountsFile}`);
}

// Create account status file
const statusFile = './users/account-status.json';
if (!fs.existsSync(statusFile)) {
    const sampleStatus = {
        statuses: {},
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(statusFile, JSON.stringify(sampleStatus, null, 2));
    console.log(`  ✅ Created: ${statusFile}`);
} else {
    console.log(`  ✓ Exists: ${statusFile}`);
}

// Create warmup logs file
const logsFile = './users/warmup-logs.json';
if (!fs.existsSync(logsFile)) {
    const sampleLogs = {
        logs: [],
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(logsFile, JSON.stringify(sampleLogs, null, 2));
    console.log(`  ✅ Created: ${logsFile}`);
} else {
    console.log(`  ✓ Exists: ${logsFile}`);
}

// Create sent emails log
const emailsFile = './logs/sent-emails.json';
if (!fs.existsSync(emailsFile)) {
    const sampleEmails = {
        emails: [],
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(emailsFile, JSON.stringify(sampleEmails, null, 2));
    console.log(`  ✅ Created: ${emailsFile}`);
} else {
    console.log(`  ✓ Exists: ${emailsFile}`);
}

// Create public directory with simple landing page
const indexFile = './public/index.html';
if (!fs.existsSync(indexFile)) {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Warmup Dashboard</title>
    <meta http-equiv="refresh" content="0; url=/">
</head>
<body>
    <p>Redirecting to dashboard...</p>
</body>
</html>`;
    fs.writeFileSync(indexFile, htmlContent);
    console.log(`  ✅ Created: ${indexFile}`);
} else {
    console.log(`  ✓ Exists: ${indexFile}`);
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     Setup Complete!                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Next steps:                                                 ║
║                                                              ║
║  1. Edit users/accounts.json with your Gmail accounts       ║
║                                                              ║
║  2. Run enhanced warmup:                                    ║
║     node warmup-enhanced.js <profileId>                     ║
║                                                              ║
║  3. Start dashboard server:                                 ║
║     node dashboard-server.js                                ║
║     Then visit: http://localhost:3000                       ║
║                                                              ║
║  4. Run daily email warmup:                                 ║
║     node email-warmup.js run                                ║
║                                                              ║
║  5. Setup 2FA (optional):                                  ║
║     node 2fa-setup.js <profileId> setup                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

📚 Full documentation: ENHANCED_WARMUP_GUIDE.md

🔥 Ready to warm up!
`);

// Display current configuration
try {
    const accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
    console.log('📊 Current accounts:');
    accounts.accounts.forEach((acc, i) => {
        console.log(`   ${i + 1}. ${acc.email} (${acc.profileId}) - ${acc.status}`);
    });
    console.log('');
} catch (e) {
    console.log('⚠️  Could not read accounts file\n');
}
