/**
 * Working Profile 1 Warmup with Cookie Acceptance
 */

const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';
const PROFILE_ID = 'k12am9a2';
const SCREENSHOT_DIR = './screenshots/profile-1-warmup';

// Helper for delays
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cookie consent handler
async function handleCookieConsent(page) {
    const cookieSelectors = [
        'button[aria-label*="Accept"]',
        'button[aria-label*="accept"]',
        'button:has-text("Accept")',
        'button:has-text("Accept all")',
        'button:has-text("Accept cookies")',
        'button[id*="cookie"]',
        'button[class*="cookie"]',
        '.cookie-banner button',
        '#cookie-banner button',
        '[data-testid="cookie-accept"]',
        // Dutch selectors
        'button:has-text("Akkoord")',
        'button:has-text("Accepteer")',
        'button:has-text("Ik ga akkoord")',
    ];

    for (const selector of cookieSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 1000 });
            await page.click(selector);
            console.log('  ✅ Accepted cookies');
            await wait(500);
            return true;
        } catch (e) {
            continue;
        }
    }
    return false;
}

async function runWarmup() {
    console.log('🚀 Profile 1 Warmup with Cookie Acceptance\n');

    const client = new AdsPowerClient(API_KEY);

    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    try {
        // Step 1: Launch profile
        console.log('1️⃣ Launching Profile 1...');
        const launchResult = await client.startProfile(PROFILE_ID);

        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            throw new Error('Failed to launch profile');
        }

        console.log('✅ Profile launched');
        console.log('   Waiting for browser to fully load...\n');

        // Wait for browser to be ready
        await wait(5000);

        // Step 2: Connect Puppeteer
        console.log('2️⃣ Connecting Puppeteer...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();

        console.log('✅ Connected\n');

        // Step 3: Run warmup activities
        console.log('3️⃣ Running warmup activities...\n');

        const activities = [
            {
                name: '📧 Gmail',
                url: 'https://mail.google.com',
                waitTime: 3000
            },
            {
                name: '🔍 Google',
                url: 'https://www.google.com',
                action: async (p) => {
                    const searchBox = await p.$('textarea[name="q"]') || await p.$('input[name="q"]');
                    if (searchBox) {
                        await searchBox.click();
                        await searchBox.type('latest technology news');
                        await p.keyboard.press('Enter');
                        await wait(5000);
                    }
                },
                waitTime: 5000
            },
            {
                name: '🇳🇱 nu.nl (Dutch news)',
                url: 'https://www.nu.nl',
                waitTime: 5000
            },
            {
                name: '💻 tweakers.net (Tech)',
                url: 'https://tweakers.net',
                waitTime: 5000
            }
        ];

        for (let i = 0; i < activities.length; i++) {
            const activity = activities[i];
            console.log(`\n${activity.name}`);
            console.log('─'.repeat(50));

            try {
                // Navigate to URL
                await page.goto(activity.url, { waitUntil: 'networkidle2', timeout: 20000 });

                // Try to accept cookies
                await handleCookieConsent(page);

                // Run custom action if provided
                if (activity.action) {
                    await activity.action(page);
                }

                // Wait specified time
                await wait(activity.waitTime);

                // Take screenshot
                const screenshotPath = path.join(SCREENSHOT_DIR, `warmup_${i + 1}_${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`  📸 Screenshot saved`);

            } catch (error) {
                console.log(`  ⚠️  Error: ${error.message}`);
            }
        }

        // Final screenshot
        console.log('\n✅ Warmup completed!');
        const finalScreenshot = path.join(SCREENSHOT_DIR, `final_${Date.now()}.png`);
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`📸 Final screenshot saved: ${finalScreenshot}\n`);

        console.log('📊 Summary:');
        console.log(`   - Screenshots: ${SCREENSHOT_DIR}`);
        console.log(`   - Profile 1 is active in AdsPower`);
        console.log('   - Browser stays open for manual inspection\n');

    } catch (error) {
        console.log('\n❌ Error:', error.message);
        if (error.stack) {
            console.log(error.stack);
        }
    }
}

runWarmup();
