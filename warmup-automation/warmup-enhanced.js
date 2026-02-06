/**
 * Enhanced Google Warmup Automation
 * Supports: Docs, Sheets, Maps, Photos, Alerts, YouTube, Gmail inter-account email
 */

const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    apiKey: '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329',
    screenshotDir: './screenshots/enhanced-warmup',
    activitiesPerSession: 5, // Number of activities to run per session
    minDelayBetweenActions: 3000, // 3 seconds
    maxDelayBetweenActions: 8000, // 8 seconds
};

// Helper functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDelay = () => wait(randomInt(CONFIG.minDelayBetweenActions, CONFIG.maxDelayBetweenActions));

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

// Activity: Google Docs
async function googleDocsActivity(page) {
    console.log('  📄 Creating Google Doc...');
    
    try {
        await page.goto('https://docs.google.com/document', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Click blank document
        try {
            await page.waitForSelector('.docs-home-greeting-container', { timeout: 5000 });
            const blankBtn = await page.$x('//button//div[contains(text(), "Blank") or contains(text(), "Blank")]');
            if (blankBtn.length > 0) {
                await blankBtn[0].click();
                await wait(2000);
            }
        } catch (e) {
            // Might already be in a doc
        }
        
        // Type content
        const content = [
            'Project Planning Notes',
 '',
            'Today we accomplished several important tasks:',
            '- Reviewed project requirements',
            '- Updated documentation',
            '- Team meeting scheduled for tomorrow',
 '',
            'Action items:',
            '1. Complete technical review',
            '2. Send status update',
            '3. Prepare presentation materials'
        ];
        
        await wait(2000);
        const editableArea = await page.$('.kix-canvas-tex-content') || await page.$('[contenteditable="true"]');
        if (editableArea) {
            await editableArea.click();
            await wait(1000);
            await page.keyboard.type(content.join('\n'));
            await wait(2000);
            
            // Make some text bold (Ctrl+B on first line)
            await page.keyboard.down('Control');
            await page.keyboard.press('a');
            await page.keyboard.up('Control');
            await wait(500);
            await page.keyboard.down('Control');
            await page.keyboard.press('b');
            await page.keyboard.up('Control');
            
            console.log('  ✅ Created doc with content and formatting');
        }
        
        // Add a comment
        await wait(1000);
        try {
            // Insert comment shortcut (Ctrl+Alt+M)
            await page.keyboard.down('Control');
            await page.keyboard.down('Alt');
            await page.keyboard.press('m');
            await page.keyboard.up('Alt');
            await page.keyboard.up('Control');
            await wait(1000);
            
            // Type comment
            await page.keyboard.type('Review this section');
            await wait(1000);
            
            // Submit comment (Ctrl+Enter)
            await page.keyboard.down('Control');
            await page.keyboard.press('Enter');
            await page.keyboard.up('Control');
            
            console.log('  ✅ Added comment');
        } catch (e) {
            console.log('  ⚠️  Could not add comment');
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ Google Docs error: ${error.message}`);
        return false;
    }
}

// Activity: Google Sheets
async function googleSheetsActivity(page) {
    console.log('  📊 Creating Google Sheet...');
    
    try {
        await page.goto('https://sheets.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Click blank spreadsheet
        try {
            const blankBtn = await page.$x('//button//div[contains(text(), "Blank") or contains(text(), "Blank spreadsheet")]');
            if (blankBtn.length > 0) {
                await blankBtn[0].click();
                await wait(3000);
            }
        } catch (e) {
            // Might already be in a sheet
        }
        
        // Enter data
        const data = [
            ['Item', 'Quantity', 'Price', 'Total'],
            ['Product A', '5', '10.50', '=B2*C2'],
            ['Product B', '3', '25.00', '=B3*C3'],
            ['Product C', '8', '7.75', '=B4*C4'],
            ['', '', 'Grand Total', '=SUM(D2:D4)']
        ];
        
        const cellSelector = '.cell-input' || '#t-formula-bar-input';
        const firstCell = await page.$('.ritz.cellwrapper');
        if (firstCell) {
            await firstCell.click();
            await wait(1000);
            
            // Type data into cells
            for (let row = 0; row < data.length; row++) {
                for (let col = 0; col < data[row].length; col++) {
                    await page.keyboard.type(data[row][col]);
                    await wait(500);
                    await page.keyboard.press('Tab');
                    await wait(300);
                }
                await page.keyboard.press('Enter');
                await wait(500);
                // Navigate back to start of row
                for (let i = 0; i < data[row].length; i++) {
                    await page.keyboard.press('ArrowLeft');
                }
                await page.keyboard.press('ArrowDown');
            }
            
            console.log('  ✅ Created sheet with data and formulas');
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ Google Sheets error: ${error.message}`);
        return false;
    }
}

// Activity: Google Maps
async function googleMapsActivity(page) {
    console.log('  🗺️  Google Maps activity...');
    
    try {
        await page.goto('https://www.google.com/maps', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Search for a location
        const searchBox = await page.$('#searchboxinput') || await page.$('input[aria-label="Search Google Maps"]');
        if (searchBox) {
            await searchBox.click();
            await searchBox.type('Amsterdam Netherlands');
            await wait(1000);
            await page.keyboard.press('Enter');
            await wait(3000);
            console.log('  ✅ Searched for location');
        }
        
        // Get directions
        await wait(2000);
        const directionsBtn = await page.$('button[aria-label*="Directions"]') || await page.$('button[data-tooltip="Directions"]');
        if (directionsBtn) {
            await directionsBtn.click();
            await wait(2000);
            console.log('  ✅ Opened directions');
        }
        
        // Save place (try to find save button)
        await wait(2000);
        try {
            const saveBtn = await page.$('button[aria-label*="Save"]') || await page.$('button[aria-label*="star"]');
            if (saveBtn) {
                await saveBtn.click();
                await wait(1000);
                console.log('  ✅ Saved place');
            }
        } catch (e) {
            // Save might not be available
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ Google Maps error: ${error.message}`);
        return false;
    }
}

// Activity: Google Photos
async function googlePhotosActivity(page) {
    console.log('  📷 Google Photos activity...');
    
    try {
        await page.goto('https://photos.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Try to upload a photo (if there's a file available)
        // This would require having a test photo file
        
        // Create an album
        try {
            const albumBtn = await page.$('button[aria-label*="Album"]') || await page.$('[data-action-id="new-album"]');
            if (albumBtn) {
                await albumBtn.click();
                await wait(2000);
                console.log('  ✅ Opened album creation');
            }
        } catch (e) {
            console.log('  ⚠️  Could not create album');
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ Google Photos error: ${error.message}`);
        return false;
    }
}

// Activity: Google Alerts
async function googleAlertsActivity(page) {
    console.log('  🔔 Google Alerts activity...');
    
    try {
        await page.goto('https://www.google.com/alerts', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Create an alert
        const alertInput = await page.$('#alert_text_input') || await page.$('input[name="q"]');
        if (alertInput) {
            const topics = ['technology news', 'AI developments', 'cloud computing'];
            const topic = topics[randomInt(0, topics.length - 1)];
            
            await alertInput.click();
            await alertInput.type(topic);
            await wait(1000);
            
            // Click create alert button
            const createBtn = await page.$('button[aria-label*="Create"]') || await page.$('[data-action="create"]');
            if (createBtn) {
                await createBtn.click();
                await wait(2000);
                console.log(`  ✅ Created alert for: ${topic}`);
            }
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ Google Alerts error: ${error.message}`);
        return false;
    }
}

// Activity: YouTube account creation
async function youtubeActivity(page) {
    console.log('  ▶️  YouTube activity...');
    
    try {
        await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Search for videos
        const searchBox = await page.$('#search-input') || await page.$('input[id="search"]');
        if (searchBox) {
            const searchTerms = ['programming tutorials', 'tech reviews', 'music videos'];
            const term = searchTerms[randomInt(0, searchTerms.length - 1)];
            
            await searchBox.click();
            await searchBox.type(term);
            await wait(1000);
            await page.keyboard.press('Enter');
            await wait(3000);
            console.log(`  ✅ Searched: ${term}`);
        }
        
        // Click a video
        await wait(2000);
        const video = await page.$('a#video-title');
        if (video) {
            await video.click();
            await wait(3000);
            console.log('  ✅ Watching video');
            
            // Watch for random duration
            const watchDuration = randomInt(10000, 30000); // 10-30 seconds
            await wait(watchDuration);
            
            // Like the video
            try {
                const likeBtn = await page.$('button[aria-label*="like"]') || await page.$('#like-button');
                if (likeBtn) {
                    await likeBtn.click();
                    console.log('  ✅ Liked video');
                }
            } catch (e) {
                // Already liked or couldn't like
            }
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ YouTube error: ${error.message}`);
        return false;
    }
}

// Activity: Gmail profile update
async function gmailProfileActivity(page, profileData = {}) {
    console.log('  👤 Gmail profile update...');
    
    try {
        // Go to Google Account settings
        await page.goto('https://myaccount.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Try to update profile photo if provided
        if (profileData.photoPath) {
            try {
                const photoSection = await page.$('a[href*="photo"]') || await page.$('[data-action-id="photo"]');
                if (photoSection) {
                    await photoSection.click();
                    await wait(2000);
                    console.log('  ✅ Opened photo settings');
                }
            } catch (e) {
                console.log('  ⚠️  Could not update photo');
            }
        }
        
        // Update name if provided
        if (profileData.name) {
            try {
                const nameSection = await page.$('a[href*="name"]') || await page.$('[data-action-id="name"]');
                if (nameSection) {
                    await nameSection.click();
                    await wait(2000);
                    console.log('  ✅ Opened name settings');
                }
            } catch (e) {
                console.log('  ⚠️  Could not update name');
            }
        }
        
        // Update birthday if provided
        if (profileData.birthday) {
            try {
                const birthdaySection = await page.$('a[href*="birthday"]') || await page.$('[data-action-id="birthday"]');
                if (birthdaySection) {
                    await birthdaySection.click();
                    await wait(2000);
                    console.log('  ✅ Opened birthday settings');
                }
            } catch (e) {
                console.log('  ⚠️  Could not update birthday');
            }
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ Profile update error: ${error.message}`);
        return false;
    }
}

// Activity: Add VCC (optional)
async function addVCCActivity(page, cardData) {
    if (!cardData) {
        console.log('  💳 No VCC data provided, skipping');
        return false;
    }
    
    console.log('  💳 Adding VCC...');
    
    try {
        await page.goto('https://payments.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(3000);
        
        // Navigate to payment methods
        try {
            const paymentMethodsBtn = await page.$('a[href*="paymentmethods"]') || await page.$('[data-action-id="payment-methods"]');
            if (paymentMethodsBtn) {
                await paymentMethodsBtn.click();
                await wait(2000);
                console.log('  ✅ Opened payment methods');
                
                // Add payment method button would be here
                // This is sensitive and requires manual verification
            }
        } catch (e) {
            console.log('  ⚠️  Could not add VCC - requires manual verification');
        }
        
        return true;
    } catch (error) {
        console.log(`  ❌ VCC error: ${error.message}`);
        return false;
    }
}

// Main warmup orchestrator
async function runEnhancedWarmup(profileId, options = {}) {
    console.log('\n🚀 Enhanced Google Warmup Automation\n');
    
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
        
        // Define all available activities
        const allActivities = [
            { name: 'Google Docs', func: googleDocsActivity },
            { name: 'Google Sheets', func: googleSheetsActivity },
            { name: 'Google Maps', func: googleMapsActivity },
            { name: 'Google Photos', func: googlePhotosActivity },
            { name: 'Google Alerts', func: googleAlertsActivity },
            { name: 'YouTube', func: youtubeActivity },
            { name: 'Gmail Profile', func: (p) => gmailProfileActivity(p, options.profileData || {}) },
            { name: 'Add VCC', func: (p) => addVCCActivity(p, options.cardData) },
        ];
        
        // Shuffle and select activities
        const selectedActivities = allActivities
            .sort(() => Math.random() - 0.5)
            .slice(0, CONFIG.activitiesPerSession);
        
        console.log(`3️⃣  Running ${selectedActivities.length} activities...\n`);
        console.log('═'.repeat(60));
        
        let completedCount = 0;
        
        for (let i = 0; i < selectedActivities.length; i++) {
            const activity = selectedActivities[i];
            const activityNum = i + 1;
            
            console.log(`\n${activityNum}. ${activity.name}`);
            console.log('─'.repeat(50));
            
            try {
                // Handle cookies if needed
                await handleCookieConsent(page);
                
                // Run activity
                const success = await activity.func(page);
                
                if (success) {
                    completedCount++;
                }
                
                // Random delay between activities
                if (i < selectedActivities.length - 1) {
                    console.log(`  ⏳ Waiting before next activity...`);
                    await randomDelay();
                }
                
                // Take screenshot
                const screenshotPath = path.join(CONFIG.screenshotDir, 
                    `${profileId}_activity_${activityNum}_${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: false });
                console.log(`  📸 Screenshot saved`);
                
            } catch (error) {
                console.log(`  ⚠️  Activity error: ${error.message}`);
            }
        }
        
        console.log('\n' + '═'.repeat(60));
        console.log('\n✅ Warmup session completed!');
        console.log(`   Completed: ${completedCount}/${selectedActivities.length} activities`);
        console.log(`   Screenshots: ${CONFIG.screenshotDir}\n`);
        
        return {
            success: true,
            completed: completedCount,
            total: selectedActivities.length,
            profileId
        };
        
    } catch (error) {
        console.log('\n❌ Error:', error.message);
        return {
            success: false,
            error: error.message,
            profileId
        };
    }
}

// Run if called directly
if (require.main === module) {
    const profileId = process.argv[2] || 'k12am9a2';
    runEnhancedWarmup(profileId)
        .then(result => {
            console.log('\n📊 Result:', JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runEnhancedWarmup };
