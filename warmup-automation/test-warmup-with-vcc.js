/**
 * Test Warmup with VCC Integration
 * Tests enhanced warmup + VCC addition at pay.google.com
 */

const AdsPowerClient = require('./adspower-client');
const { generatePerson } = require('./address-generator');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';

// VCC Details from image
const TEST_VCC = {
    cardholder: 'Bram van der Veer',
    number: '5236860158511545',
    expiry: '02/32',
    cvc: '200',
    type: 'Mastercard debit',
    label: 'MA-2',
    billingAddress: {
        street: null, // Will be generated
        city: 'Okemos',
        state: 'MI',
        postalCode: '48864',
        country: 'United States'
    }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Cookie consent handler
 */
async function handleCookieConsent(page) {
    const cookieSelectors = [
        'button[aria-label*="Accept"]',
        'button:has-text("Accept all")',
        'button:has-text("Accept cookies")',
        '.cookie-banner button',
        'button:has-text("Akkoord")',
    ];

    for (const selector of cookieSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
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

/**
 * Add VCC at Google Payments
 */
async function addVCCAtGooglePayments(page, vcc) {
    console.log('\n💳 Adding VCC at Google Payments...\n');
    console.log('   Card:', vcc.type);
    console.log('   Number:', '**** **** **** ' + vcc.number.slice(-4));
    console.log('   Expiry:', vcc.expiry);
    console.log('   Cardholder:', vcc.cardholder);
    console.log('');

    try {
        // Go to Google Payments
        console.log('1️⃣  Navigating to Google Payments...');
        await page.goto('https://pay.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(5000);

        // Handle cookies
        await handleCookieConsent(page);
        await wait(2000);

        // Look for Payment Methods section
        console.log('2️⃣  Looking for Payment Methods...');
        
        // Try multiple selectors for payment methods
        const paymentSelectors = [
            'a[href*="paymentmethods"]',
            '[data-action-id="payment-methods"]',
            'div[role="button"]:has-text("Payment methods")',
            'a:has-text("Payment methods")',
        ];

        let paymentMethodsLink = null;
        for (const selector of paymentSelectors) {
            try {
                paymentMethodsLink = await page.$(selector);
                if (paymentMethodsLink) {
                    console.log(`  ✅ Found: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (paymentMethodsLink) {
            await paymentMethodsLink.click();
            await wait(3000);
        } else {
            console.log('  ⚠️  Could not find Payment Methods link');
            console.log('  📸 Taking screenshot for manual inspection...');
        }

        // Look for "Add payment method" button
        console.log('3️⃣  Looking for "Add payment method" button...');
        const addPaymentSelectors = [
            'button:has-text("Add payment method")',
            'button:has-text("Add")',
            '[data-action-id="add-payment-method"]',
            'div[role="button"]:has-text("Add a payment method")',
        ];

        let addButton = null;
        for (const selector of addPaymentSelectors) {
            try {
                addButton = await page.$(selector);
                if (addButton) {
                    console.log(`  ✅ Found: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (addButton) {
            console.log('  ✅ Clicking "Add payment method"...');
            await addButton.click();
            await wait(3000);
        }

        // Take screenshot at this point to show current state
        const screenshotPath = path.join('./screenshots/vcc-test', `vcc_step1_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  📸 Screenshot: ${screenshotPath}`);

        console.log('\n⚠️  MANUAL ACTION REQUIRED');
        console.log('   The browser is now on the Google Payments page.');
        console.log('   You need to:');
        console.log('   1. Click "Add payment method" if not already clicked');
        console.log('   2. Select "Credit or debit card"');
        console.log('   3. Enter card details:');
        console.log(`      - Number: ${vcc.number}`);
        console.log(`      - Name: ${vcc.cardholder}`);
        console.log(`      - Expiry: ${vcc.expiry}`);
        console.log(`      - CVC: ${vcc.cvc}`);
        console.log(`      - Billing: ${vcc.billingAddress.city}, ${vcc.billingAddress.state} ${vcc.billingAddress.postalCode}`);
        console.log('   4. Click "Save"');
        console.log('\n   The browser will stay open for manual completion.\n');

        return { success: true, requiresManualCompletion: true };

    } catch (error) {
        console.log(`\n❌ Error adding VCC: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Run quick warmup before VCC
 */
async function runQuickWarmup(page) {
    console.log('\n🔥 Running Quick Warmup Activities...\n');

    const activities = [
        {
            name: 'Gmail',
            url: 'https://mail.google.com',
            wait: 3000
        },
        {
            name: 'Google Search',
            url: 'https://www.google.com',
            action: async (p) => {
                const searchBox = await p.$('textarea[name="q"]') || await p.$('input[name="q"]');
                if (searchBox) {
                    await searchBox.click();
                    await searchBox.type('weather today');
                    await p.keyboard.press('Enter');
                    await wait(3000);
                }
            },
            wait: 5000
        },
        {
            name: 'Google Maps',
            url: 'https://www.google.com/maps',
            action: async (p) => {
                const searchBox = await p.$('#searchboxinput');
                if (searchBox) {
                    await searchBox.click();
                    await searchBox.type('Amsterdam');
                    await wait(1000);
                    await p.keyboard.press('Enter');
                    await wait(3000);
                }
            },
            wait: 5000
        }
    ];

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        console.log(`${i + 1}. ${activity.name}`);

        try {
            await page.goto(activity.url, { waitUntil: 'networkidle2', timeout: 20000 });
            await handleCookieConsent(page);
            
            if (activity.action) {
                await activity.action(page);
            }
            
            await wait(activity.wait);
            console.log('   ✅ Completed');
        } catch (error) {
            console.log(`   ⚠️  Error: ${error.message}`);
        }
    }
}

/**
 * Main test function
 */
async function testWarmupWithVCC(profileId) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Test Warmup + VCC Integration                            ║
╚══════════════════════════════════════════════════════════════╝

👤 Profile: ${profileId}
💳 Card: ${TEST_VCC.type} (**** ${TEST_VCC.number.slice(-4)})
📧 Cardholder: ${TEST_VCC.cardholder}

`);

    const client = new AdsPowerClient(API_KEY);

    // Ensure screenshot directory exists
    const screenshotDir = './screenshots/vcc-test';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    try {
        // Launch profile
        console.log('🚀 Launching profile...');
        const launchResult = await client.startProfile(profileId);

        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            throw new Error('Failed to launch profile');
        }

        console.log('✅ Profile launched');
        await wait(5000);

        // Connect Puppeteer
        console.log('🔌 Connecting Puppeteer...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        console.log('✅ Connected\n');

        // Step 1: Quick warmup
        console.log('═'.repeat(60));
        await runQuickWarmup(page);

        // Step 2: Add VCC
        console.log('\n' + '═'.repeat(60));
        const vccResult = await addVCCAtGooglePayments(page, TEST_VCC);

        // Take final screenshot
        const finalScreenshot = path.join(screenshotDir, `final_${Date.now()}.png`);
        await page.screenshot({ path: finalScreenshot, fullPage: true });

        console.log('\n' + '═'.repeat(60));
        console.log('\n📊 Test Summary:');
        console.log(`   Profile: ${profileId}`);
        console.log(`   Warmup: ✅ Completed`);
        console.log(`   VCC: ${vccResult.success ? '✅ Initiated' : '❌ Failed'}`);
        console.log(`   Screenshots: ${screenshotDir}`);
        console.log('\n⚠️  Browser remains open for manual VCC completion.');
        console.log('   Press Ctrl+C to close.\n');

        // Update account status in dashboard
        const statusPath = './users/account-status.json';
        if (fs.existsSync(statusPath)) {
            const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
            
            // Find the email for this profile (try to get from page)
            const email = await page.evaluate(() => {
                const emailElement = document.querySelector('[data-email]') || 
                                   document.querySelector('.email-address');
                return emailElement ? emailElement.textContent : 'unknown';
            }).catch(() => 'unknown');

            if (status.statuses[email]) {
                status.statuses[email].vccAdded = vccResult.success;
                status.statuses[email].vccLastDigits = TEST_VCC.number.slice(-4);
                status.statuses[email].vccType = TEST_VCC.type;
                status.statuses[email].vccAddedAt = new Date().toISOString();
                
                fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
                console.log('✅ Updated account status with VCC info\n');
            }
        }

        // Keep browser open
        console.log('🌐 Browser is open. Complete VCC setup manually.');
        console.log('   Press Ctrl+C in this terminal when done.\n');

        // Wait indefinitely (until Ctrl+C)
        await new Promise(() => {});

    } catch (error) {
        console.log('\n❌ Error:', error.message);
        console.log(error.stack);
    }
}

// Run test
if (require.main === module) {
    const profileId = process.argv[2] || 'k12am9a2';
    testWarmupWithVCC(profileId)
        .then(() => {
            console.log('\n✅ Test completed');
        })
        .catch(error => {
            console.error('\n❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { testWarmupWithVCC, TEST_VCC };
