/**
 * 2FA Setup Integration (Web-Based)
 * Enables 2FA for Gmail accounts via Google Account settings web interface
 * 
 * This is a WEB APPLICATION approach - opens browser for manual verification
 * The browser stays open for you to complete 2FA setup manually via:
 * - SMS verification
 * - Google Authenticator app
 * - Google Prompt
 * - Voice call
 * 
 * SECURITY: Manual completion required for safety
 */

const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    apiKey: '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329',
    screenshotDir: './screenshots/2fa-setup',
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Navigate to 2FA settings
 */
async function navigateTo2FASettings(page) {
    console.log('  🔐 Navigating to 2FA settings...');
    
    try {
        // Go to Google Account security settings
        await page.goto('https://myaccount.google.com/security', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Look for 2-Step Verification section
        const twoStepSection = await page.$('a[href*="signin/v2/challenge/pw"]') || 
                               await page.$('[data-action-id="2SV"]');
        
        if (twoStepSection) {
            await twoStepSection.click();
            await wait(3000);
            console.log('  ✅ Opened 2FA settings');
            return true;
        } else {
            console.log('  ⚠️  Could not find 2FA section');
            return false;
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return false;
    }
}

/**
 * Check if 2FA is already enabled
 */
async function check2FAStatus(page) {
    console.log('  🔍 Checking 2FA status...');
    
    try {
        await page.goto('https://myaccount.google.com/signinoptions/two-step-verification', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        await wait(3000);
        
        // Look for indicators that 2FA is enabled
        const isEnabled = await page.evaluate(() => {
            const text = document.body.innerText;
            return text.includes('2-Step Verification is ON') || 
                   text.includes('is turned on') ||
                   !text.includes('Get started');
        });
        
        console.log(`  ${isEnabled ? '✅' : '❌'} 2FA is ${isEnabled ? 'enabled' : 'disabled'}`);
        return isEnabled;
    } catch (error) {
        console.log(`  ❌ Error checking status: ${error.message}`);
        return false;
    }
}

/**
 * Start 2FA setup process
 * Note: This initiates the process but requires manual completion
 */
async function start2FASetup(profileId, options = {}) {
    console.log('\n🔐 2FA Setup Process\n');
    console.log('═'.repeat(60));
    
    const client = new AdsPowerClient(CONFIG.apiKey);
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(CONFIG.screenshotDir)) {
        fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
    }
    
    try {
        // Launch profile
        console.log('1️⃣  Launching profile...');
        const launchResult = await client.startProfile(profileId);
        
        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            throw new Error('Failed to launch profile');
        }
        
        console.log('✅ Profile launched');
        await wait(5000);
        
        // Connect Puppeteer
        console.log('2️⃣  Connecting Puppeteer...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        console.log('✅ Connected\n');
        
        // Check current status
        console.log('3️⃣  Checking current 2FA status...');
        const isAlreadyEnabled = await check2FAStatus(page);
        
        if (isAlreadyEnabled) {
            console.log('\n✅ 2FA is already enabled for this account!');
            console.log('   Browser will stay open for manual verification.\n');
            return { success: true, alreadyEnabled: true };
        }
        
        // Navigate to 2FA setup
        console.log('\n4️⃣  Starting 2FA setup...');
        const navigated = await navigateTo2FASettings(page);
        
        if (!navigated) {
            throw new Error('Could not navigate to 2FA settings');
        }
        
        // Take screenshot
        const screenshotPath = path.join(CONFIG.screenshotDir, `${profileId}_2fa_setup_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  📸 Screenshot saved: ${screenshotPath}`);
        
        console.log('\n' + '═'.repeat(60));
        console.log('\n⚠️  MANUAL ACTION REQUIRED');
        console.log('   The browser is now on the 2FA setup page.');
        console.log('   You must complete the setup manually by choosing one of:');
        console.log('');
        console.log('   1. 📱 SMS verification');
        console.log('   2. 📲 Authenticator app (Google Authenticator, Authy, etc.)');
        console.log('   3. 🔑 Google Prompt');
        console.log('   4. 📞 Voice call');
        console.log('');
        console.log('   Instructions:');
        console.log('   • Follow the on-screen prompts in the AdsPower browser');
        console.log('   • Complete the verification steps');
        console.log('   • Save backup codes when prompted');
        console.log('');
        console.log('   The browser will remain open for you to complete this.');
        console.log('   Press Ctrl+C in this terminal when done.\n');
        
        return { 
            success: true, 
            requiresManualCompletion: true,
            screenshotPath
        };
        
    } catch (error) {
        console.log('\n❌ Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Generate TOTP secret for authenticator apps
 * This would require a QR code scanning library or integration
 */
async function generateTOTPSecret(page) {
    console.log('  📱 Setting up authenticator...');
    
    try {
        // Look for QR code
        const qrCode = await page.$('img[src*="chart.googleapis"]');
        
        if (qrCode) {
            const qrData = await qrCode.screenshot();
            const qrPath = path.join(CONFIG.screenshotDir, `totp_qr_${Date.now()}.png`);
            fs.writeFileSync(qrPath, qrData);
            
            console.log(`  ✅ QR code saved: ${qrPath}`);
            console.log('  📲 Scan this with your authenticator app');
            
            return { success: true, qrPath };
        }
        
        return { success: false, error: 'No QR code found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Verify 2FA is working
 */
async function verify2FA(profileId) {
    console.log('\n🔍 Verifying 2FA Setup\n');
    
    const client = new AdsPowerClient(CONFIG.apiKey);
    
    try {
        const launchResult = await client.startProfile(profileId);
        
        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            throw new Error('Failed to launch profile');
        }
        
        await wait(5000);
        
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        // Try to access a secured page (e.g., Gmail)
        await page.goto('https://mail.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(5000);
        
        // Check if 2FA prompt appears
        const has2FAPrompt = await page.evaluate(() => {
            return document.body.innerText.includes('2-Step Verification') ||
                   document.body.innerText.includes('Enter your code');
        });
        
        if (has2FAPrompt) {
            console.log('✅ 2FA is active and working!');
            console.log('   Account is now protected with 2FA.\n');
            
            await browser.close();
            return { success: true, isActive: true };
        } else {
            console.log('⚠️  Could not verify 2FA status');
            console.log('   The account might already be signed in or 2FA is not enabled.\n');
            
            await browser.close();
            return { success: true, isActive: false };
        }
        
    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    const profileId = process.argv[2] || 'k12am9a2';
    const action = process.argv[3] || 'setup';
    
    if (action === 'setup') {
        start2FASetup(profileId)
            .then(result => {
                console.log('\n📊 Result:', JSON.stringify(result, null, 2));
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                console.error('\n❌ Fatal error:', error);
                process.exit(1);
            });
    } else if (action === 'verify') {
        verify2FA(profileId)
            .then(result => {
                console.log('\n📊 Result:', JSON.stringify(result, null, 2));
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                console.error('\n❌ Fatal error:', error);
                process.exit(1);
            });
    } else {
        console.log('\nUsage:');
        console.log('  node 2fa-setup.js <profileId> setup  - Start 2FA setup (manual)');
        console.log('  node 2fa-setup.js <profileId> verify - Verify 2FA is working\n');
    }
}

module.exports = { start2FASetup, verify2FA };
