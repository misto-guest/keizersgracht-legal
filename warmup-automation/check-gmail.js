/**
 * Check Gmail account
 */
const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');

const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';
const PROFILE_ID = 'k12am9a2';

async function checkGmail() {
    console.log('🔍 Checking Gmail account...\n');

    const client = new AdsPowerClient(API_KEY);

    try {
        // Launch profile
        console.log('1️⃣ Launching Profile 1...');
        const launchResult = await client.startProfile(PROFILE_ID);

        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            throw new Error('Failed to launch profile');
        }

        console.log('✅ Profile launched');
        console.log('   Waiting 5 seconds for browser to load...\n');

        // Wait for browser
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Connect Puppeteer
        console.log('2️⃣ Connecting to browser...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();

        console.log('✅ Connected\n');

        // Navigate to Gmail
        console.log('3️⃣ Navigating to Gmail...');
        await page.goto('https://mail.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('✅ Page loaded\n');

        // Check current URL
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}\n`);

        // Try to get account email
        console.log('4️⃣ Attempting to extract account email...');

        const accountInfo = await page.evaluate(() => {
            // Method 1: Check if on login page
            if (window.location.href.includes('accounts.google.com')) {
                return { status: 'NOT_LOGGED_IN', email: null };
            }

            // Method 2: Try to find email in page
            const emailSelectors = [
                'div[data-hovercard-owner-id]',
                'div[role="button"][aria-label*="Google Account"]',
                'div[aria-label*="Account"]',
                'span[data-email]',
                '.gb_Ob',
                '.gb_zb',
            ];

            for (const selector of emailSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const email = element.getAttribute('data-email') ||
                                  element.getAttribute('data-hovercard-owner-id') ||
                                  element.getAttribute('aria-label') ||
                                  element.textContent;
                    if (email && email.includes('@')) {
                        return { status: 'LOGGED_IN', email: email, method: selector };
                    }
                }
            }

            // Method 3: Check page title
            const title = document.title;
            if (title && title.includes('@')) {
                return { status: 'LOGGED_IN', email: title, method: 'page_title' };
            }

            return { status: 'CANNOT_DETERMINE', url: window.location.href };
        });

        console.log('\n📊 Result:');
        console.log('─'.repeat(50));

        if (accountInfo.status === 'LOGGED_IN') {
            console.log(`✅ LOGGED IN`);
            console.log(`📧 Email: ${accountInfo.email}`);
            console.log(`🔍 Found via: ${accountInfo.method}`);
        } else if (accountInfo.status === 'NOT_LOGGED_IN') {
            console.log(`❌ NOT LOGGED IN`);
            console.log(`   Redirected to login page`);
        } else {
            console.log(`⚠️  CANNOT DETERMINE`);
            console.log(`   URL: ${accountInfo.url}`);
        }

        console.log('\n💡 Browser window should be visible.');
        console.log('   Press Ctrl+C to close and keep profile open.\n');

        // Keep browser open
        await new Promise(() => {});

    } catch (error) {
        console.log('\n❌ Error:', error.message);
        console.log(error.stack);
    }
}

checkGmail();
