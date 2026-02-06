/**
 * Add VCC to Gmail Account
 * Adds the shared VCC to a Gmail account via Google Payments
 */

const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';

// VCC Details from shared image
const VCC_DETAILS = {
    cardholder: 'Bram van der Veer',
    number: '5236860158511545',
    expiry: '02/32',
    cvv: '200',
    lastFour: '1545',
    type: 'Mastercard debit',
    billingAddress: {
        street: '4365 Okemos Rd',
        city: 'Okemos',
        state: 'MI',
        zipCode: '48864',
        country: 'United States'
    }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Cookie consent handler
 */
async function handleCookieConsent(page) {
    const selectors = [
        'button[aria-label*="Accept"]',
        'button:has-text("Accept all")',
        'button:has-text("Accept cookies")',
        '.cookie-banner button',
        'button:has-text("Akkoord")',
    ];

    for (const selector of selectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            await page.click(selector);
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
async function addVCC(page, vcc) {
    console.log('\n💳 Adding VCC to Google Payments\n');
    console.log('   Card:', vcc.type);
    console.log('   Number:', '**** **** **** ' + vcc.lastFour);
    console.log('   Cardholder:', vcc.cardholder);
    console.log('   Billing:', vcc.billingAddress.city, vcc.billingAddress.state, vcc.billingAddress.zipCode);
    console.log('');

    try {
        // Go to Google Payments
        console.log('1️⃣  Navigating to Google Payments...');
        await page.goto('https://pay.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(5000);

        // Handle cookies
        await handleCookieConsent(page);
        await wait(2000);

        // Take initial screenshot
        const screenshotDir = './screenshots/vcc-addition';
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const screenshot1 = path.join(screenshotDir, `step1_payments_${Date.now()}.png`);
        await page.screenshot({ path: screenshot1, fullPage: true });
        console.log('  📸 Screenshot saved');

        // Look for Payment Methods section
        console.log('\n2️⃣  Looking for Payment Methods section...');
        
        // Try to find and click Payment Methods
        const paymentSelectors = [
            'a[href*="paymentmethods"]',
            'div[role="button"] span:has-text("Payment methods")',
            '[data-action-id="payment-methods"]',
        ];

        let clicked = false;
        for (const selector of paymentSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    console.log('  ✅ Clicked Payment Methods');
                    clicked = true;
                    await wait(3000);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!clicked) {
            console.log('  ⚠️  Could not click Payment Methods automatically');
            console.log('  📸 Taking screenshot...');
        }

        // Take screenshot after navigation
        const screenshot2 = path.join(screenshotDir, `step2_payment_methods_${Date.now()}.png`);
        await page.screenshot({ path: screenshot2, fullPage: true });
        console.log('  📸 Screenshot saved');

        // Look for "Add payment method" button
        console.log('\n3️⃣  Looking for "Add payment method" button...');
        
        const addPaymentSelectors = [
            'button span:has-text("Add payment method")',
            'button:has-text("Add a payment method")',
            '[data-action-id="add-payment-method"]',
            'div[role="button"] span:has-text("Add payment method")',
        ];

        let addClicked = false;
        for (const selector of addPaymentSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    console.log('  ✅ Clicked "Add payment method"');
                    addClicked = true;
                    await wait(3000);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!addClicked) {
            console.log('  ⚠️  Could not click "Add payment method" automatically');
        }

        // Take screenshot
        const screenshot3 = path.join(screenshotDir, `step3_add_payment_${Date.now()}.png`);
        await page.screenshot({ path: screenshot3, fullPage: true });
        console.log('  📸 Screenshot saved');

        // Try to find card input form
        console.log('\n4️⃣  Looking for card entry form...');

        // Try to find card number input
        const cardInputSelectors = [
            'input[name="cardNumber"]',
            'input[id*="card"]',
            'input[placeholder*="card"]',
            'input[type="tel"]',
        ];

        let cardInput = null;
        for (const selector of cardInputSelectors) {
            try {
                cardInput = await page.$(selector);
                if (cardInput) {
                    console.log('  ✅ Found card input');
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (cardInput) {
            console.log('\n5️⃣  Filling in card details...');
            
            // Card number
            await cardInput.click();
            await wait(500);
            await cardInput.type(vcc.number, { delay: 100 });
            console.log('  ✅ Entered card number');
            await wait(1000);

            // Name on card
            const nameSelectors = ['input[name="name"]', 'input[id*="name"]', 'input[placeholder*="name"]'];
            for (const sel of nameSelectors) {
                try {
                    const nameInput = await page.$(sel);
                    if (nameInput) {
                        await nameInput.click();
                        await wait(500);
                        await nameInput.type(vcc.cardholder, { delay: 50 });
                        console.log('  ✅ Entered cardholder name');
                        await wait(500);
                        break;
                    }
                } catch (e) {}
            }

            // Expiry (MM/YY format)
            const expirySelectors = ['input[name="expiry"]', 'input[id*="expiry"]', 'input[placeholder*="MM"]'];
            for (const sel of expirySelectors) {
                try {
                    const expiryInput = await page.$(sel);
                    if (expiryInput) {
                        await expiryInput.click();
                        await wait(500);
                        await expiryInput.type('0232', { delay: 50 });
                        console.log('  ✅ Entered expiry');
                        await wait(500);
                        break;
                    }
                } catch (e) {}
            }

            // CVC
            const cvcSelectors = ['input[name="cvc"]', 'input[id*="cvc"]', 'input[placeholder*="CVC"]'];
            for (const sel of cvcSelectors) {
                try {
                    const cvcInput = await page.$(sel);
                    if (cvcInput) {
                        await cvcInput.click();
                        await wait(500);
                        await cvcInput.type(vcc.cvv, { delay: 50 });
                        console.log('  ✅ Entered CVC');
                        await wait(500);
                        break;
                    }
                } catch (e) {}
            }

            // Screenshot after filling
            const screenshot4 = path.join(screenshotDir, `step4_card_filled_${Date.now()}.png`);
            await page.screenshot({ path: screenshot4, fullPage: true });
            console.log('  📸 Screenshot saved');

            console.log('\n✅ VCC details entered!');
            console.log('   Browser will stay open for you to:');
            console.log('   - Review the card details');
            console.log('   - Confirm billing address');
            console.log('   - Click "Save" or "Add"');
            console.log('');

        } else {
            console.log('  ⚠️  Could not find card input form');
            console.log('\n📝 Manual entry required:');
            console.log('   Card Number: ' + vcc.number);
            console.log('   Name: ' + vcc.cardholder);
            console.log('   Expiry: ' + vcc.expiry);
            console.log('   CVC: ' + vcc.cvv);
            console.log('   Billing: ' + vcc.billingAddress.street);
            console.log('            ' + vcc.billingAddress.city + ', ' + vcc.billingAddress.state + ' ' + vcc.billingAddress.zipCode);
            console.log('');
        }

        // Final screenshot
        const screenshot5 = path.join(screenshotDir, `step5_final_${Date.now()}.png`);
        await page.screenshot({ path: screenshot5, fullPage: true });
        console.log('  📸 Final screenshot saved');

        return { success: true };

    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main function
 */
async function addVCCToProfile(profileId) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Add VCC to Gmail Account                                 ║
╚══════════════════════════════════════════════════════════════╝

👤 Profile: ${profileId}
💳 Card: ${VCC_DETAILS.type} (**** ${VCC_DETAILS.lastFour})
📧 Cardholder: ${VCC_DETAILS.cardholder}

`);

    const client = new AdsPowerClient(API_KEY);

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

        // Add VCC
        const result = await addVCC(page, VCC_DETAILS);

        if (result.success) {
            console.log('\n' + '═'.repeat(60));
            console.log('\n✅ VCC Addition Initiated!');
            console.log('\n📝 Card Details:');
            console.log('   Number: **** **** **** ' + VCC_DETAILS.lastFour);
            console.log('   Type: ' + VCC_DETAILS.type);
            console.log('   Cardholder: ' + VCC_DETAILS.cardholder);
            console.log('   Billing: ' + VCC_DETAILS.billingAddress.city + ', ' + VCC_DETAILS.billingAddress.state);
            console.log('\n⚠️  BROWSER REMAINS OPEN');
            console.log('   Complete these steps manually:');
            console.log('   1. Verify all card details are correct');
            console.log('   2. Confirm billing address matches');
            console.log('   3. Click "Save" or "Add" button');
            console.log('   4. Complete any verification if prompted');
            console.log('\n   Press Ctrl+C when done.\n');

            // Update account status
            const statusPath = './users/account-status.json';
            if (fs.existsSync(statusPath)) {
                try {
                    const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
                    
                    // Try to get email from page
                    const email = await page.evaluate(() => {
                        return document.querySelector('[data-email]')?.textContent || 
                               document.querySelector('.email-address')?.textContent ||
                               'unknown';
                    }).catch(() => 'unknown');

                    if (status.statuses[email]) {
                        status.statuses[email].vccAdded = true;
                        status.statuses[email].vccLastDigits = VCC_DETAILS.lastFour;
                        status.statuses[email].vccType = VCC_DETAILS.type;
                        status.statuses[email].vccAddedAt = new Date().toISOString();
                        
                        fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
                        console.log('✅ Updated account status with VCC info\n');
                    }
                } catch (e) {
                    console.log('⚠️  Could not update account status\n');
                }
            }

            // Keep browser open
            await new Promise(() => {});
        }

    } catch (error) {
        console.log('\n❌ Error:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    const profileId = process.argv[2] || 'k12am9a2';
    addVCCToProfile(profileId);
}

module.exports = { addVCCToProfile, VCC_DETAILS };
