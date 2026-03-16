/**
 * Unified Warmup Automation Script
 * Supports both Adspower and Unified Remote Browser API
 * 
 * Usage:
 *   node warmup-unified.js [profileId] [browserType]
 *   
 *   browserType: 'adspower' (default) or 'remote'
 *   
 * Examples:
 *   node warmup-unified.js k12am9a2 adspower
 *   node warmup-unified.js profile123 remote
 */

const UnifiedBrowserClient = require('./unified-browser-client');
const puppeteer = require('puppeteer-core');
const { setTimeout } = require('timers/promises');
const fs = require('fs');
const path = require('path');

// Load configuration
const CONFIG = {
    // Browser settings
    headless: false,
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    
    // Time on page settings (in seconds)
    timeOnPage: {
        trends: { min: 5, max: 10 },
        newsSearch: { min: 3, max: 7 },
        article: { min: 10, max: 30 }
    },
    
    // Number of top trends to process
    numTrendsToProcess: 1,
    
    // Clear cache after closing
    clearCacheAfterClosing: true
};

// Parse command line arguments
const profileId = process.argv[2] || 'k12am9a2';
const browserType = process.argv[3] || 'adspower'; // 'adspower' or 'remote'

// Get API key from environment variable for remote browser
const remoteApiKey = process.env.REMOTE_BROWSER_API_KEY;

// Configuration based on browser type
function getBrowserConfig(type) {
    if (type === 'adspower') {
        return {
            type: 'adspower',
            apiKey: process.env.ADSPOWER_API_KEY || 'e2ec8f83a615248b26844ce7b4180780000f879a7a0e5329',
            baseUrl: process.env.ADSPOWER_BASE_URL || 'http://77.42.21.134:50325'
        };
    } else {
        return {
            type: 'remote',
            apiKey: remoteApiKey,
            baseUrl: process.env.REMOTE_BROWSER_BASE_URL || 'http://95.217.224.154:3000'
        };
    }
}

// Helper: Random delay
function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return delay * 1000;
}

// Helper: Human-like delay
async function humanDelay(page, minMs, maxMs) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    console.log(`⏱️  Waiting ${Math.round(delay / 1000)}s...`);
    await setTimeout(delay);
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
        
        console.log('✅ Browser disconnected');
        
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
    console.log('║       Gmail Warmup - Unified Browser API                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📋 Profile ID: ${profileId}`);
    console.log(`🌐 Browser Type: ${browserType}`);
    
    if (browserType === 'remote' && !remoteApiKey) {
        console.log('\n❌ ERROR: Remote Browser API key not set!');
        console.log('   Set environment variable: export REMOTE_BROWSER_API_KEY=your_key');
        return { success: false, error: 'Missing REMOTE_BROWSER_API_KEY' };
    }
    
    const browserConfig = getBrowserConfig(browserType);
    console.log(`🔗 Server: ${browserConfig.baseUrl}\n`);

    // Create unified browser client
    const client = new UnifiedBrowserClient(browserConfig);

    // Test connection
    console.log('🧪 Testing connection...');
    const connResult = await client.testConnection();
    
    if (!connResult.success) {
        console.log(`❌ Connection failed: ${connResult.message}`);
        if (connResult.hint) console.log(`   Hint: ${connResult.hint}`);
        return { success: false, error: connResult.message };
    }
    
    console.log(`✅ Connected to ${browserType === 'adspower' ? 'AdsPower' : 'Remote Browser'} API`);

    let browser = null;
    let browserConnection = null;
    let browserId = null;
    
    try {
        // Start browser
        console.log(`\n🚀 Starting browser for profile: ${profileId}`);
        
        browserConnection = await client.startBrowser(profileId, {
            headless: CONFIG.headless,
            clear_cache_after_closing: CONFIG.clearCacheAfterClosing ? '1' : '0'
        });
        
        console.log(`   Browser type: ${browserConnection.type}`);
        
        // Get WebSocket URL based on browser type
        let wsUrl;
        if (browserConnection.type === 'adspower') {
            wsUrl = browserConnection.wsUrl;
            console.log(`   WebSocket: ${wsUrl}`);
        } else {
            wsUrl = browserConnection.puppeteerUrl;
            browserId = browserConnection.browserId;
            console.log(`   Puppeteer URL: ${wsUrl}`);
            console.log(`   Browser ID: ${browserId}`);
        }
        
        if (!wsUrl) {
            throw new Error('No WebSocket URL received from browser API');
        }
        
        // Connect to browser via CDP
        browser = await puppeteer.connect({
            browserWSEndpoint: wsUrl,
            defaultViewport: CONFIG.viewport
        });
        
        console.log('✅ Connected to browser via CDP');

        // Create new page
        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport(CONFIG.viewport);
        await page.setUserAgent(CONFIG.userAgent);

        // Hide webdriver flag
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Get trending keywords
        console.log('\n📈 Getting trending topics...');
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

        // Process top keyword(s)
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

        // Close browser properly (pages first, then disconnect)
        await closeBrowser(browser);
        browser = null;

        // Stop the browser via API
        console.log('\n🛑 Stopping browser...');
        
        if (browserType === 'remote' && browserId) {
            await client.stopBrowser(profileId, browserId);
        } else {
            await client.stopBrowser(profileId);
        }
        
        console.log('✅ Browser stopped');
        
        console.log('\n✅ Warm-up routine completed successfully!');
        
        return {
            success: true,
            profileId,
            browserType,
            completed,
            total: numToProcess
        };

    } catch (error) {
        console.error('\n❌ Fatal error during warm-up:', error.message);
        
        // Try to close browser on error
        if (browser) {
            await closeBrowser(browser);
            try {
                if (browserType === 'remote' && browserId) {
                    await client.stopBrowser(profileId, browserId);
                } else {
                    await client.stopBrowser(profileId);
                }
            } catch (e) {}
        }
        
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    console.log('');
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

module.exports = { runWarmup, UnifiedBrowserClient };
