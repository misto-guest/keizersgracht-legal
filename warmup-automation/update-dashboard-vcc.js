/**
 * Dashboard Update - Add VCC Tracking
 * Run this to update existing dashboard with VCC status tracking
 */

const fs = require('fs');
const path = require('path');

const STATUS_FILE = './users/account-status.json';
const ACCOUNTS_FILE = './users/accounts.json';

console.log('\n🔄 Updating Dashboard with VCC Tracking...\n');

// Update status file structure
if (fs.existsSync(STATUS_FILE)) {
    const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    let updated = false;

    // Add VCC fields to each account status
    Object.keys(status.statuses).forEach(email => {
        if (!status.statuses[email].hasOwnProperty('vccAdded')) {
            status.statuses[email].vccAdded = false;
            console.log(`  ✅ Added VCC tracking for: ${email}`);
            updated = true;
        }
    });

    if (updated) {
        fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
        console.log('\n✅ Status file updated\n');
    } else {
        console.log('✅ Status file already has VCC tracking\n');
    }
} else {
    console.log('⚠️  Status file not found. Will be created on first run.\n');
}

// Update accounts file structure
if (fs.existsSync(ACCOUNTS_FILE)) {
    const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    let updated = false;

    // Add VCC fields to each account
    accounts.accounts.forEach(account => {
        if (!account.hasOwnProperty('vcc')) {
            account.vcc = {
                added: false,
                lastFour: null,
                type: null,
                addedAt: null
            };
            console.log(`  ✅ Added VCC info for: ${account.email}`);
            updated = true;
        }
    });

    if (updated) {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        console.log('\n✅ Accounts file updated\n');
    } else {
        console.log('✅ Accounts file already has VCC tracking\n');
    }
}

console.log('✅ Dashboard update complete!\n');
console.log('The dashboard will now track VCC status for all accounts.');
console.log('VCC fields: vccAdded, vccLastDigits, vccType, vccAddedAt\n');
