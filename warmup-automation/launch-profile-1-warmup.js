/**
 * Launch Profile 1 and Run Warmup
 *
 * This script will:
 * 1. Connect to AdsPower API
 * 2. Launch Profile 1
 * 3. Run warmup automation on the profile (Gmail should be logged in)
 * 4. Take screenshots during warmup
 * 5. Save results
 */

const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';
const PROFILE_ID = 'k12am9a2'; // Profile 1 user ID
const SCREENSHOT_DIR = './screenshots/profile-1-warmup';
const WARMUP_DURATION = 300; // 5 minutes for testing

// Helper function to replace deprecated waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cookie consent handler
async function handleCookieConsent(page) {
    try {
        // Common cookie consent selectors
        const cookieSelectors = [
            'button[aria-label*="Accept"]',
            'button[aria-label*="accept"]',
            'button:has-text("Accept")',
            'button:has-text("Accept all")',
            'button:has-text("Accept cookies")',
            'button[id*="cookie"]',
            'button[class*="cookie"]',
            'button[onclick*="cookie"]',
            '.cookie-banner button',
            '#cookie-banner button',
            '[data-testid="cookie-accept"]',
            'button:text("Akkoord")',  // Dutch
            'button:text("Accepteer")', // Dutch
            'button:text("Ik ga akkoord")', // Dutch
        ];

        for (const selector of cookieSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 1000 });
                await page.click(selector);
                console.log('✅ Accepted cookies');
                await wait(500);
                return true;
            } catch (e) {
                // Selector not found, try next
                continue;
            }
        }
    } catch (error) {
        // No cookie banner found or unable to click
    }
    return false;
}

async function launchAndWarmup() {
    console.log('🚀 AdsPower Profile 1 Warmup Test\n');
    console.log('====================================\n');

    const client = new AdsPowerClient(API_KEY);

    // Step 1: Test Connection
    console.log('1️⃣ Testing AdsPower API connection...');
    try {
        const connection = await client.testConnection();
        if (!connection.success) {
            console.log('❌ Cannot connect to AdsPower');
            console.log(`   Error: ${connection.message}`);
            console.log(`   Hint: ${connection.hint}`);
            return;
        }
        console.log('✅ Connected to AdsPower API');
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        console.log('\n⚠️  Please ensure AdsPower is running with API enabled');
        console.log('   - Check: Settings > API & MCP');
        console.log('   - Verify local server shows "Connected"');
        return;
    }

    // Step 2: Get Profile Info (optional - skip if fails)
    console.log('\n2️⃣ Getting Profile 1 information...');
    try {
        profileInfo = await client.getProfileInfo(PROFILE_ID);
        console.log(`✅ Profile found: ${profileInfo.name || 'Unnamed'}`);
        console.log(`   User ID: ${profileInfo.user_id}`);
        console.log(`   Browser: ${profileInfo.browser_type || 'Unknown'}`);
        console.log(`   OS: ${profileInfo.os || 'Unknown'}`);
    } catch (error) {
        console.log('⚠️  Could not get profile info (continuing anyway):', error.message);
        console.log(`   Using profile ID: ${PROFILE_ID}`);
    }

    // Step 3: Launch Profile
    console.log('\n3️⃣ Launching Profile 1...');
    let launchResult;
    try {
        launchResult = await client.startProfile(PROFILE_ID);

        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            console.log('❌ Failed to launch profile');
            console.log('   Response:', JSON.stringify(launchResult, null, 2));
            return;
        }

        console.log('✅ Profile launched successfully!');
        console.log(`   WebSocket URL received`);
    } catch (error) {
        console.log('❌ Error launching profile:', error.message);
        return;
    }

    // Step 4: Create screenshot directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    console.log(`\n📸 Screenshots will be saved to: ${SCREENSHOT_DIR}`);

    // Step 5: Connect Puppeteer and Run Warmup
    console.log('\n4️⃣ Connecting to browser and running warmup...');
    console.log(`   Duration: ${WARMUP_DURATION} seconds`);
    console.log('\n================================\n');

    try {
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();

        console.log('✅ Connected to browser');
        console.log('✅ Profile 1 is ready for warmup\n');

        // Check if Gmail is open or logged in
        console.log('🔍 Checking Gmail login status...');

        try {
            // Navigate to Gmail
            await page.goto('https://mail.google.com', { waitUntil: 'networkidle2', timeout: 15000 });
            await wait(3000);

            const url = page.url();
            console.log(`   Current URL: ${url}`);

            if (url.includes('mail.google.com') && !url.includes('accounts.google.com')) {
                console.log('✅ Gmail appears to be logged in!');
            } else {
                console.log('⚠️  Gmail may not be logged in');
                console.log('   Profile may need manual login first');
            }
        } catch (error) {
            console.log('⚠️  Could not verify Gmail status:', error.message);
        }

        // Take initial screenshot
        const initialScreenshot = path.join(SCREENSHOT_DIR, `initial_${Date.now()}.png`);
        await page.screenshot({ path: initialScreenshot, fullPage: true });
        console.log(`\n📸 Initial screenshot saved: ${initialScreenshot}`);

        // Run warmup activities
        console.log('\n🎯 Starting warmup activities...\n');
        await runWarmupActivities(page, SCREENSHOT_DIR);

        // Take final screenshot
        const finalScreenshot = path.join(SCREENSHOT_DIR, `final_${Date.now()}.png`);
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`\n📸 Final screenshot saved: ${finalScreenshot}`);

        // Don't close the browser - let the user see it
        console.log('\n================================');
        console.log('✅ Warmup completed!');
        console.log('\n📊 Summary:');
        console.log(`   - Screenshots saved to: ${SCREENSHOT_DIR}`);
        console.log(`   - Profile 1 is still active in AdsPower`);
        console.log(`   - Browser window should be visible`);
        console.log('\n💡 Tip: Check the AdsPower window to see the profile in action');

    } catch (error) {
        console.log('\n❌ Error during warmup:', error.message);
        console.log(error.stack);
    }
}

async function runWarmupActivities(page, screenshotDir) {
    const activities = [
        {
            name: 'Gmail Check',
            action: async () => {
                console.log('📧 Checking Gmail...');
                await page.goto('https://mail.google.com', { waitUntil: 'networkidle2', timeout: 15000 });
                await handleCookieConsent(page);
                await wait(3000);
            }
        },
        {
            name: 'Google Search',
            action: async () => {
                console.log('🔍 Performing Google search...');
                await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
                await handleCookieConsent(page);
                const searchBox = await page.$('textarea[name="q"]') || await page.$('input[name="q"]');
                if (searchBox) {
                    await searchBox.click();
                    await searchBox.type('latest technology news');
                    await page.keyboard.press('Enter');
                    await wait(5000);
                }
            }
        },
        {
            name: 'Dutch News Site',
            action: async () => {
                console.log('🇳🇱 Visiting Dutch news site (nu.nl)...');
                await page.goto('https://www.nu.nl', { waitUntil: 'networkidle2', timeout: 15000 });
                await handleCookieConsent(page);
                await wait(5000);
            }
        },
        {
            name: 'Tech Site',
            action: async () => {
                console.log('💻 Visiting tech site (tweakers.net)...');
                await page.goto('https://tweakers.net', { waitUntil: 'networkidle2', timeout: 15000 });
                await handleCookieConsent(page);
                await wait(5000);
            }
        }
    ];

    let screenshotCount = 0;

    for (const activity of activities) {
        try {
            console.log(`\n${activity.name}`);
            console.log('─'.repeat(50));
            await activity.action();

            // Take screenshot after each activity
            screenshotCount++;
            const screenshotPath = path.join(screenshotDir, `activity_${screenshotCount}_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot saved: ${path.basename(screenshotPath)}`);

            // Random pause
            const pauseTime = Math.floor(Math.random() * 3000) + 2000;
            console.log(`⏸️  Pausing for ${pauseTime}ms...`);
            await wait(pauseTime);

        } catch (error) {
            console.log(`⚠️  Activity failed: ${error.message}`);
        }
    }

    console.log('\n✅ All warmup activities completed');
}

// Run the script
console.log('⚠️  IMPORTANT: This script will launch Profile 1 and run warmup');
console.log('⚠️  Make sure AdsPower is running before proceeding\n');

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Press Enter to start, or Ctrl+C to cancel...', async () => {
    rl.close();
    await launchAndWarmup();
});
