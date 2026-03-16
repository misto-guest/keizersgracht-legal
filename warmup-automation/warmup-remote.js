/**
 * Warmup Automation with Remote Adspower
 * Uses Adspower server: 77.42.21.134:50325
 * 
 * This script:
 * 1. Starts browser via Adspower API
 * 2. Runs warmup activities
 * 3. Properly closes all pages then browser to avoid memory leaks
 */

const AdsPowerClient = require('./adspower-client-remote');
const puppeteer = require('puppeteer-core');
const { setTimeout } = require('timers/promises');

// Configuration
const CONFIG = {
    // Remote Adspower server
    apiKey: 'e2ec8f83a615248b26844ce7b4180780000f879a7a0e5329',
    
    // Test profile - can be overridden via command line
    profileId: process.argv[2] || 'k12am9a2',
    
    // Time on page settings (in seconds)
    timeOnPage: {
        trends: { min: 5, max: 10 },
        newsSearch: { min: 3, max: 7 },
        article: { min: 10, max: 30 }
    },
    
    // Browser settings
    headless: false,
    viewport: { width: 1920, height: 1080 },
    
    // Number of top trends to process
    numTrendsToProcess: 1,
    
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
};

// Helper: Random delay within range
function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return delay * 1000;
}

// Helper: Random human-like delay
async function humanDelay(page, minMs, maxMs) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    console.log(`⏱️  Waiting ${Math.round(delay / 1000)}s...`);
    await setTimeout(delay);
}

/**
 * Test Adspower API connection
 */
async function testConnection() {
    console.log('🔍 Testing Adspower API connection...\n');
    
    const client = new AdsPowerClient(CONFIG.apiKey);
    const result = await client.testConnection();
    
    if (result.success) {
        console.log('✅ Connected to Adspower API!');
        console.log(`   Server: ${client.baseUrl}`);
        console.log(`   API Version: ${client.apiVersion}`);
        return client;
    } else {
        console.log('❌ Failed to connect to Adspower API');
        console.log(`   Error: ${result.message}`);
        if (result.hint) console.log(`   Hint: ${result.hint}`);
        return null;
    }
}

/**
 * Start browser via Adspower and connect
 */
async function startBrowser(client, profileId) {
    console.log(`\n🚀 Starting browser for profile: ${profileId}`);
    
    try {
        const startResult = await client.startProfile(profileId, {
            headless: CONFIG.headless ? '1' : '0',
            clear_cache_after_closing: '1'
        });
        
        if (!startResult || !startResult.ws) {
            throw new Error('No WebSocket URL in response');
        }
        
        console.log(`   WebSocket: ${startResult.ws}`);
        
        // Connect to the browser via CDP
        const browser = await puppeteer.connect({
            browserWSEndpoint: startResult.ws,
            defaultViewport: CONFIG.viewport
        });
        
        console.log('✅ Connected to browser via CDP');
        
        return { browser, startResult };
        
    } catch (error) {
        console.error(`❌ Failed to start browser: ${error.message}`);
        throw error;
    }
}

/**
 * Properly close browser - close all pages first to avoid memory leaks
 */
async function closeBrowser(browser) {
    if (!browser) return;
    
    try {
        console.log('\n🧹 Closing browser properly...');
        
        // Get all pages
        const pages = await browser.pages();
        
        // Close all pages first
        console.log(`   Closing ${pages.length} page(s)...`);
        for (const page of pages) {
            try {
                await page.close();
            } catch (e) {
                // Ignore errors when closing pages
            }
        }
        
        // Wait a moment for cleanup
        await setTimeout(500);
        
        // Then disconnect from browser
        await browser.disconnect();
        
        console.log('✅ Browser closed properly');
        
    } catch (error) {
        console.error(`   Error closing browser: ${error.message}`);
        try {
            await browser.disconnect();
        } catch (e) {
            // Ignore
        }
    }
}

/**
 * Extract top trending keywords from Google Trends
 */
async function getTrendingKeywords(page) {
    console.log('📊 Fetching trending keywords...');

    try {
        await page.goto('https://trends.google.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForSelector('feed-item', { timeout: 10000 });

        const trends = await page.evaluate(() => {
            const items = document.querySelectorAll('feed-item');
            return Array.from(items)
                .slice(0, 10)
                .map(item => ({
                    title: item.querySelector('[title]')?.getAttribute('title') || item.textContent?.trim(),
                    index: 0
                }))
                .filter(t => t.title && t.title.length > 0);
        });

        console.log(`✅ Found ${trends.length} trending keywords`);
        trends.forEach((trend, i) => console.log(`   ${i + 1}. ${trend.title}`));

        return trends;

    } catch (error) {
        console.error('❌ Error fetching trends:', error.message);
        return [];
    }
}

/**
 * Search Google News and click first result
 */
async function searchNewsAndVisit(page, keyword) {
    console.log(`\n🔍 Searching for: "${keyword}"`);

    try {
        await page.goto('https://news.google.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });

        // Type with human-like delay
        console.log('⌨️  Typing search query...');
        await page.type('input[placeholder*="Search"]', keyword, {
            delay: Math.random() * 100 + 50
        });

        await page.keyboard.press('Enter');
        await page.waitForSelector('article', { timeout: 15000 });

        await humanDelay(
            page,
            CONFIG.timeOnPage.newsSearch.min * 1000,
            CONFIG.timeOnPage.newsSearch.max * 1000
        );

        // Click first article
        console.log('📰 Clicking first article...');
        const firstArticle = await page.$('article');
        
        if (firstArticle) {
            const articleUrl = await page.evaluate(el => {
                const link = el.querySelector('a');
                return link ? link.href : null;
            }, firstArticle);

            if (articleUrl) {
                console.log(`🔗 Opening: ${articleUrl.substring(0, 50)}...`);
                await firstArticle.click();

                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

                const articleDelay = randomDelay(
                    CONFIG.timeOnPage.article.min,
                    CONFIG.timeOnPage.article.max
                );
                console.log(`📖 Reading article for ${Math.round(articleDelay / 1000)}s...`);
                await setTimeout(articleDelay);

                return { success: true, url: articleUrl };
            }
        }

        return { success: false };

    } catch (error) {
        console.error('❌ Error during news search:', error.message);
        return { success: false };
    }
}

/**
 * Main warmup routine
 */
async function runWarmup() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       Gmail Warmup with Remote Adspower                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📋 Profile ID: ${CONFIG.profileId}`);
    console.log(`🖥️  Adspower Server: 77.42.21.134:50325\n`);

    // Step 1: Test connection
    const client = await testConnection();
    if (!client) {
        console.log('\n❌ Cannot proceed without Adspower connection');
        return { success: false, error: 'Connection failed' };
    }

    let browser = null;
    
    try {
        // Step 2: Start browser
        const { browser: b, startResult } = await startBrowser(client, CONFIG.profileId);
        browser = b;

        // Create new page
        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport(CONFIG.viewport);
        await page.setUserAgent(CONFIG.userAgent);

        // Hide webdriver flag
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Step 3: Get trending keywords
        await page.goto('https://trends.google.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await humanDelay(
            page,
            CONFIG.timeOnPage.trends.min * 1000,
            CONFIG.timeOnPage.trends.max * 1000
        );

        const trends = await getTrendingKeywords(page);

        if (trends.length === 0) {
            console.log('⚠️  No trends found. Using default keyword.');
            trends.push({ title: 'technology' });
        }

        // Step 4: Process top keyword(s)
        const numToProcess = Math.min(CONFIG.numTrendsToProcess, trends.length);
        const completed = [];

        for (let i = 0; i < numToProcess; i++) {
            const trend = trends[i];
            console.log(`\n📌 Processing trend ${i + 1}/${numToProcess}: ${trend.title}`);

            const result = await searchNewsAndVisit(page, trend.title);

            if (result.success) {
                console.log(`✅ Completed warm-up for: ${trend.title}`);
                completed.push(trend.title);
            } else {
                console.log(`❌ Failed to process: ${trend.title}`);
            }

            // Go back to news for next iteration
            if (i < numToProcess - 1) {
                await page.goto('https://news.google.com', { waitUntil: 'networkidle2' });
                await setTimeout(2000);
            }
        }

        // Step 5: Close browser properly (pages first, then browser)
        await closeBrowser(browser);
        browser = null;

        // Step 6: Stop the Adspower profile
        console.log('\n🛑 Stopping Adspower profile...');
        await client.stopProfile(CONFIG.profileId);
        
        console.log('\n✅ Warm-up routine completed successfully!');
        
        return {
            success: true,
            completed,
            total: numToProcess
        };

    } catch (error) {
        console.error('\n❌ Fatal error during warm-up:', error.message);
        
        // Try to close browser on error
        if (browser) {
            await closeBrowser(browser);
            try {
                await client.stopProfile(CONFIG.profileId);
            } catch (e) {}
        }
        
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    runWarmup()
        .then(result => {
            console.log('\n📊 Result:', JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runWarmup, testConnection, startBrowser, closeBrowser };
