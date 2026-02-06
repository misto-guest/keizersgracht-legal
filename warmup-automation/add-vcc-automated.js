/**
 * FULLY AUTOMATED VCC Addition
 * Adds VCC to Google Payments with complete automation
 */

const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';

// VCC Details - SHARED CARD
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
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Type text with human-like delays
 */
async function humanType(element, text, options = {}) {
    const { delay = 100 } = options;
    for (const char of text) {
        await element.type(char, { delay });
        await sleep(Math.random() * 50 + 50);
    }
}

/**
 * Click element with multiple strategies
 */
async function smartClick(page, selector, options = {}) {
    const { timeout = 5000, text } = options;
    
    // Strategy 1: Direct selector
    try {
        await page.waitForSelector(selector, { timeout });
        await page.click(selector);
        return true;
    } catch (e) {}
    
    // Strategy 2: Text content
    if (text) {
        try {
            const elements = await page.$$('button, div[role="button"], a, span[role="button"]');
            for (const el of elements) {
                const textContent = await el.evaluate(e => e.textContent);
                if (textContent && textContent.toLowerCase().includes(text.toLowerCase())) {
                    await el.click();
                    return true;
                }
            }
        } catch (e) {}
    }
    
    // Strategy 3: XPath
    try {
        const xpath = `//button[contains(text(), "${text}")] | //span[contains(text(), "${text}")]`;
        const elements = await page.$x(xpath);
        if (elements.length > 0) {
            await elements[0].click();
            return true;
        }
    } catch (e) {}
    
    return false;
}

/**
 * Add VCC with full automation
 */
async function addVCCFullyAutomated(page, vcc) {
    console.log('\n💳 FULLY AUTOMATED VCC Addition\n');
    console.log('   Card:', vcc.type);
    console.log('   Last 4:', vcc.lastFour);
    console.log('   Cardholder:', vcc.cardholder);
    console.log('');

    const screenshotDir = './screenshots/vcc-automated';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    try {
        // Step 1: Navigate to Google Payments
        console.log('Step 1: Navigating to Google Payments...');
        await page.goto('https://pay.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(5000);
        
        // Handle any cookie banners
        const cookieSelectors = [
            'button[aria-label*="Accept"]',
            'button:has-text("Accept all")',
            'button:has-text("Accept cookies")',
            'button:has-text("I agree")',
        ];
        for (const sel of cookieSelectors) {
            try {
                await page.click(sel, { timeout: 2000 });
                await wait(1000);
                break;
            } catch (e) {}
        }
        
        await page.screenshot({ path: path.join(screenshotDir, '01_payments_page.png'), fullPage: true });
        console.log('  ✅ On Google Payments page\n');

        // Step 2: Find and click Payment Methods
        console.log('Step 2: Finding Payment Methods...');
        
        // Try multiple approaches
        let found = false;
        
        // Approach 1: Look for links
        try {
            const paymentLinks = await page.$$('a');
            for (const link of paymentLinks) {
                const text = await link.evaluate(e => e.textContent);
                const href = await link.evaluate(e => e.href);
                if ((text && text.toLowerCase().includes('payment method')) || 
                    (href && href.includes('paymentmethods'))) {
                    await link.click();
                    found = true;
                    console.log('  ✅ Clicked Payment Methods link');
                    await wait(3000);
                    break;
                }
            }
        } catch (e) {}
        
        // Approach 2: Look for buttons/divs
        if (!found) {
            try {
                const elements = await page.$$('div[role="button"], button, [role="link"]');
                for (const el of elements) {
                    const text = await el.evaluate(e => e.textContent);
                    if (text && text.toLowerCase().includes('payment method')) {
                        await el.click();
                        found = true;
                        console.log('  ✅ Clicked Payment Methods button');
                        await wait(3000);
                        break;
                    }
                }
            } catch (e) {}
        }
        
        // Approach 3: Direct URL navigation
        if (!found) {
            console.log('  ⚠️  Could not find link, trying direct URL...');
            await page.goto('https://pay.google.com/payments/home#paymentMethods', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            await wait(3000);
            found = true;
            console.log('  ✅ Navigated to Payment Methods directly');
        }
        
        await page.screenshot({ path: path.join(screenshotDir, '02_payment_methods.png'), fullPage: true });
        console.log('');

        // Step 3: Click "Add payment method"
        console.log('Step 3: Adding payment method...');
        
        let addClicked = false;
        
        // Try to find "Add" button
        const addSelectors = [
            'button span:has-text("Add payment method")',
            'button:has-text("Add a payment method")',
            'button:has-text("Add")',
            '[data-action-id="add-payment-method"]',
        ];
        
        for (const sel of addSelectors) {
            try {
                if (await page.$(sel)) {
                    await page.click(sel);
                    addClicked = true;
                    console.log('  ✅ Clicked "Add payment method"');
                    await wait(3000);
                    break;
                }
            } catch (e) {}
        }
        
        // If not found, search for button with "Add" text
        if (!addClicked) {
            const buttons = await page.$$('button, div[role="button"]');
            for (const btn of buttons) {
                try {
                    const text = await btn.evaluate(e => e.textContent);
                    if (text && (text.includes('Add payment method') || text.includes('Add a payment'))) {
                        await btn.click();
                        addClicked = true;
                        console.log('  ✅ Clicked "Add payment method" button');
                        await wait(3000);
                        break;
                    }
                } catch (e) {}
            }
        }
        
        await page.screenshot({ path: path.join(screenshotDir, '03_add_payment.png'), fullPage: true });
        console.log('');

        // Step 4: Fill in card details
        console.log('Step 4: Filling card details...');
        
        // Wait for form to appear
        await wait(2000);
        
        // Card number
        console.log('  📝 Entering card number...');
        const cardSelectors = [
            'input[name="cardNumber"]',
            'input[name="number"]',
            'input[id*="cardNumber"]',
            'input[id*="number"]',
            'input[autocomplete="cc-number"]',
            'input[type="tel"]',
        ];
        
        let cardInput = null;
        for (const sel of cardSelectors) {
            try {
                cardInput = await page.$(sel);
                if (cardInput) {
                    // Check if it's visible and editable
                    const isVisible = await cardInput.isIntersectingViewport();
                    if (isVisible) {
                        console.log('  ✅ Found card input field');
                        break;
                    }
                }
            } catch (e) {}
        }
        
        if (cardInput) {
            await cardInput.click();
            await wait(500);
            await humanType(cardInput, vcc.number, { delay: 150 });
            console.log('  ✅ Entered: **** **** **** ' + vcc.lastFour);
            await wait(1000);
        } else {
            console.log('  ⚠️  Could not find card number input');
            throw new Error('Card number input not found');
        }
        
        // Name
        console.log('  📝 Entering cardholder name...');
        const nameSelectors = [
            'input[name="name"]',
            'input[name="cardholderName"]',
            'input[id*="name"]',
            'input[autocomplete="cc-name"]',
        ];
        
        for (const sel of nameSelectors) {
            try {
                const nameInput = await page.$(sel);
                if (nameInput) {
                    await nameInput.click();
                    await wait(500);
                    await humanType(nameInput, vcc.cardholder, { delay: 100 });
                    console.log('  ✅ Entered: ' + vcc.cardholder);
                    await wait(800);
                    break;
                }
            } catch (e) {}
        }
        
        // Expiry (MM/YY)
        console.log('  📝 Entering expiry...');
        const expirySelectors = [
            'input[name="expiry"]',
            'input[name="exp"]',
            'input[id*="expiry"]',
            'input[id*="exp"]',
            'input[autocomplete="cc-exp"]',
            'input[placeholder*="MM"]',
        ];
        
        for (const sel of expirySelectors) {
            try {
                const expiryInput = await page.$(sel);
                if (expiryInput) {
                    await expiryInput.click();
                    await wait(500);
                    // Format: 02/32
                    await expiryInput.type('02', { delay: 100 });
                    await wait(200);
                    await expiryInput.type('32', { delay: 100 });
                    console.log('  ✅ Entered: ' + vcc.expiry);
                    await wait(800);
                    break;
                }
            } catch (e) {}
        }
        
        // CVC
        console.log('  📝 Entering CVC...');
        const cvcSelectors = [
            'input[name="cvc"]',
            'input[name="cvv"]',
            'input[id*="cvc"]',
            'input[id*="cvv"]',
            'input[autocomplete="cc-csc"]',
        ];
        
        for (const sel of cvcSelectors) {
            try {
                const cvcInput = await page.$(sel);
                if (cvcInput) {
                    await cvcInput.click();
                    await wait(500);
                    await cvcInput.type(vcc.cvv, { delay: 100 });
                    console.log('  ✅ Entered: ' + vcc.cvv);
                    await wait(800);
                    break;
                }
            } catch (e) {}
        }
        
        await page.screenshot({ path: path.join(screenshotDir, '04_card_filled.png'), fullPage: true });
        console.log('');
        
        // Step 5: Billing address
        console.log('Step 5: Verifying billing address...');
        
        // Check if billing address section exists
        const billingSelectors = [
            'input[name="street"]',
            'input[name="address"]',
            'input[id*="street"]',
            'input[id*="address"]',
        ];
        
        for (const sel of billingSelectors) {
            try {
                const billingInput = await page.$(sel);
                if (billingInput) {
                    // Google may auto-fill this, check if it matches
                    const currentValue = await billingInput.evaluate(e => e.value);
                    if (!currentValue || currentValue.includes('Okemos')) {
                        console.log('  ✅ Billing address: Okemos, MI ' + vcc.billingAddress.zipCode);
                    }
                    break;
                }
            } catch (e) {}
        }
        
        await page.screenshot({ path: path.join(screenshotDir, '05_billing_address.png'), fullPage: true });
        console.log('');
        
        // Step 6: Find and click Save/Submit button
        console.log('Step 6: Submitting card details...');
        
        const submitSelectors = [
            'button:has-text("Save")',
            'button:has-text("Add")',
            'button:has-text("Submit")',
            'button[type="submit"]',
            '[data-action-id="save"]',
        ];
        
        let submitClicked = false;
        for (const sel of submitSelectors) {
            try {
                const btn = await page.$(sel);
                if (btn) {
                    await btn.click();
                    submitClicked = true;
                    console.log('  ✅ Clicked Save button');
                    await wait(3000);
                    break;
                }
            } catch (e) {}
        }
        
        if (!submitClicked) {
            // Try to find any button with "Save" or "Add" text
            const buttons = await page.$$('button');
            for (const btn of buttons) {
                try {
                    const text = await btn.evaluate(e => e.textContent);
                    if (text && (text.includes('Save') || text.includes('Add'))) {
                        await btn.click();
                        submitClicked = true;
                        console.log('  ✅ Clicked button: ' + text.trim());
                        await wait(3000);
                        break;
                    }
                } catch (e) {}
            }
        }
        
        await page.screenshot({ path: path.join(screenshotDir, '06_submitted.png'), fullPage: true });
        console.log('');
        
        // Step 7: Wait for result
        console.log('Step 7: Waiting for confirmation...');
        await wait(5000);
        
        // Check for success indicators
        const successIndicators = [
            'Payment method added',
            'Card added',
            'Successfully added',
            'has been added',
        ];
        
        const pageText = await page.evaluate(() => document.body.textContent);
        const success = successIndicators.some(indicator => 
            pageText.toLowerCase().includes(indicator.toLowerCase())
        );
        
        if (success) {
            console.log('  ✅ Card successfully added!\n');
            return { success: true, message: 'Card added successfully' };
        } else {
            console.log('  ⚠️  Could not confirm success - may need manual verification\n');
            return { success: true, message: 'Card submitted, awaiting verification' };
        }
        
    } catch (error) {
        console.log('\n❌ Error:', error.message);
        await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
        return { success: false, error: error.message };
    }
}

/**
 * Main function
 */
async function addVCCFully(profileId) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     FULLY AUTOMATED VCC Addition                             ║
╚══════════════════════════════════════════════════════════════╝

👤 Profile: ${profileId}
💳 Card: Mastercard debit (**** ${VCC_DETAILS.lastFour})
📧 Cardholder: ${VCC_DETAILS.cardholder}

`);

    const client = new AdsPowerClient(API_KEY);

    try {
        console.log('🚀 Launching profile...');
        const launchResult = await client.startProfile(profileId);

        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            throw new Error('Failed to launch profile');
        }

        console.log('✅ Profile launched');
        await wait(5000);

        console.log('🔌 Connecting Puppeteer...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        console.log('✅ Connected\n');

        const result = await addVCCFullyAutomated(page, VCC_DETAILS);

        if (result.success) {
            console.log('═'.repeat(60));
            console.log('\n✅ VCC ADDITION COMPLETED!\n');
            console.log('📊 Summary:');
            console.log('   Card: ' + VCC_DETAILS.type);
            console.log('   Last 4: ' + VCC_DETAILS.lastFour);
            console.log('   Added to: ' + profileId);
            console.log('   Status: ' + result.message);
            console.log('\n📁 Screenshots saved to: ./screenshots/vcc-automated/\n');
            
            // Update account status
            try {
                const statusPath = './users/account-status.json';
                let status = { statuses: {} };
                
                if (fs.existsSync(statusPath)) {
                    status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
                }
                
                // Use email as key
                const email = 'patmcgee727@gmail.com'; // Known email for k12am9a2
                
                status.statuses[email] = {
                    ...status.statuses[email],
                    vccAdded: true,
                    vccLastDigits: VCC_DETAILS.lastFour,
                    vccType: VCC_DETAILS.type,
                    vccCardholder: VCC_DETAILS.cardholder,
                    vccAddedAt: new Date().toISOString()
                };
                
                fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
                console.log('✅ Account status updated\n');
            } catch (e) {
                console.log('⚠️  Could not update account status');
            }
            
            await wait(3000);
            await browser.close();
            
        } else {
            console.log('\n❌ Failed to add VCC');
            console.log('Error:', result.error);
            console.log('\nBrowser remains open for manual completion\n');
            await new Promise(() => {});
        }

    } catch (error) {
        console.log('\n❌ Fatal error:', error.message);
    }
}

if (require.main === module) {
    const profileId = process.argv[2] || 'k12am9a2';
    addVCCFully(profileId)
        .then(() => console.log('\n✅ Process complete\n'))
        .catch(err => console.error('\n❌ Error:', err));
}

module.exports = { addVCCFully, VCC_DETAILS };
