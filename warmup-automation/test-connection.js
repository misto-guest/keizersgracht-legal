/**
 * Simple test to connect to AdsPower profile
 */
const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');

const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';
const PROFILE_ID = 'k12am9a2';

async function testConnection() {
    console.log('🧪 Testing AdsPower connection...\n');

    const client = new AdsPowerClient(API_KEY);

    try {
        // Launch profile
        console.log('1️⃣ Launching profile...');
        const launchResult = await client.startProfile(PROFILE_ID);

        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            console.log('❌ Failed to get WebSocket URL');
            console.log('Response:', JSON.stringify(launchResult, null, 2));
            return;
        }

        console.log('✅ Profile launched');
        console.log(`   WebSocket: ${launchResult.ws.puppeteer.substring(0, 50)}...`);

        // Connect Puppeteer
        console.log('\n2️⃣ Connecting Puppeteer...');
        let browser;
        try {
            // Add timeout to connection
            browser = await Promise.race([
                puppeteer.connect({
                    browserWSEndpoint: launchResult.ws.puppeteer,
                    defaultViewport: null
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout after 30s')), 30000)
                )
            ]);
            console.log('✅ Connected to browser');
        } catch (error) {
            console.log('❌ Failed to connect:', error.message);
            console.log('   WebSocket URL:', launchResult.ws.puppeteer);
            console.log('   Hint: Make sure the browser window has fully loaded');
            return;
        }

        // Get page
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();

        console.log(`✅ Got page (URL: ${page.url()})`);

        // Navigate to a test page
        console.log('\n3️⃣ Navigating to Google...');
        await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
        console.log(`✅ Navigated (URL: ${page.url()})`);

        // Take screenshot
        console.log('\n4️⃣ Taking screenshot...');
        await page.screenshot({ path: './screenshots/profile-1-warmup/test-connection.png', fullPage: true });
        console.log('✅ Screenshot saved');

        // Keep browser open
        console.log('\n✅ Test successful! Browser stays open.');
        console.log('Check AdsPower to see the browser window.');

    } catch (error) {
        console.log('\n❌ Error:', error.message);
        console.log(error.stack);
    }
}

testConnection();
