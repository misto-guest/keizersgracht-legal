import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';
import crypto from 'crypto';

// Configuration with enhanced human emulation
const CONFIG = {
  // Enhanced time-on-page settings (in seconds)
  timeOnPage: {
    trends: {
      min: 8,
      max: 15,
      description: 'Time to scan Google Trends page'
    },
    newsSearch: {
      min: 5,
      max: 12,
      description: 'Time to review search results'
    },
    article: {
      min: 20,
      max: 45,
      description: 'Time to read the article'
    },
    scrollPause: {
      min: 0.5,
      max: 2,
      description: 'Pause between scrolls'
    }
  },
  
  // Random scroll settings
  scroll: {
    amount: {
      min: 100,
      max: 400,
      description: 'Pixels to scroll per action'
    },
    count: {
      min: 1,
      max: 4,
      description: 'Number of scrolls to perform'
    }
  },

  // Mouse movement settings
  mouse: {
    moveCount: {
      min: 2,
      max: 5,
      description: 'Random mouse movements'
    }
  },

  // Browser settings
  headless: false,
  viewport: {
    width: 1920,
    height: 1080
  },
  numTrendsToProcess: 1,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
};

// Helper: Random delay within range (human-like)
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay * 1000;
}

// Helper: Random integer
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Generate random viewport offset
function randomOffset() {
  return {
    x: Math.floor(Math.random() * 200) + 100,
    y: Math.floor(Math.random() * 200) + 100
  };
}

// Human-like random scrolling
async function humanScroll(page) {
  const scrollCount = randomInt(CONFIG.scroll.count.min, CONFIG.scroll.count.max);
  
  for (let i = 0; i < scrollCount; i++) {
    const scrollAmount = randomInt(CONFIG.scroll.amount.min, CONFIG.scroll.amount.max);
    await page.evaluate((amount) => {
      window.scrollBy({
        top: amount,
        left: 0,
        behavior: 'smooth'
      });
    }, scrollAmount);
    
    await setTimeout(randomDelay(
      CONFIG.timeOnPage.scrollPause.min * 1000,
      CONFIG.timeOnPage.scrollPause.max * 1000
    ));
  }
}

// Random mouse movements (human-like)
async function humanMouseMovements(page) {
  const moveCount = randomInt(CONFIG.mouse.moveCount.min, CONFIG.mouse.moveCount.max);
  
  for (let i = 0; i < moveCount; i++) {
    const offset = randomOffset();
    await page.mouse.move(offset.x, offset, {
      steps: randomInt(5, 15)
    });
    await setTimeout(randomDelay(100, 500));
  }
}

// Human-like delay with logging
async function humanDelay(page, minMs, maxMs, action) {
  const delay = randomDelay(minMs, maxMs);
  const seconds = Math.round(delay / 1000);
  console.log(`⏱️  ${action || 'Waiting'} ${seconds}s...`);
  
  // Add some random micro-movements during delay
  await setTimeout(delay / 2);
  await humanMouseMovements(page);
  await setTimeout(delay / 2);
}

// Get trending keywords from Google Trends (updated selectors)
async function getTrendingKeywords(page) {
  console.log('📊 Fetching top 10 trending keywords...');

  try {
    await page.goto('https://trends.google.com/trends/?geo=US', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await setTimeout(5000);

    // Human-like scroll and mouse movements
    await humanScroll(page);
    await humanMouseMovements(page);
    await humanDelay(page, 3000, 5000, 'Analyzing trends page');

    // Try multiple selector strategies for Google Trends
    const trends = await page.evaluate(() => {
      // Strategy 1: Look for feed-item (new format)
      let items = document.querySelectorAll('feed-item');
      
      // Strategy 2: Look for specific div structures
      if (items.length === 0) {
        items = document.querySelectorAll('[data-module="TrendingSearches"] div');
      }
      
      // Strategy 3: Look for list items
      if (items.length === 0) {
        items = document.querySelectorAll('ul li');
      }
      
      // Strategy 4: Look for any element with ranking
      if (items.length === 0) {
        items = document.querySelectorAll('[class*="ranking"], [class*="trend"]');
      }

      const results = [];
      
      for (let i = 0; i < Math.min(items.length, 15); i++) {
        const item = items[i];
        const text = item.textContent?.trim();
        
        // Extract trending keyword (filter out UI text)
        if (text && 
            text.length > 2 && 
            text.length < 100 &&
            !text.includes('Sign in') &&
            !text.includes('Explore') &&
            !text.includes('Search') &&
            !/^\d+$/.test(text) &&
            !text.includes('Year in Search') &&
            !text.includes('Subscribe')) {
          
          // Clean up the text
          let cleaned = text
            .replace(/^\d+\.\s*/, '') // Remove leading numbers
            .replace(/\s*Search\s*$/, '') // Remove "Search" suffix
            .replace(/\s*related searches.*$/i, '') // Remove "related searches"
            .trim();
          
          if (cleaned && cleaned.length > 2 && !results.includes(cleaned)) {
            results.push(cleaned);
          }
        }
      }
      
      return results.slice(0, 10);
    });

    if (trends.length > 0) {
      console.log(`✅ Found ${trends.length} trending keywords:`);
      trends.forEach((trend, i) => {
        console.log(`   ${i + 1}. ${trend}`);
      });
    } else {
      console.log('⚠️  No trends extracted, using fallback keywords');
      return ['Election', 'Technology', 'Climate Change', 'Economy', 'Sports'];
    }

    return trends;

  } catch (error) {
    console.error('❌ Error fetching trends:', error.message);
    // Return fallback trends if scraping fails
    return ['Election', 'Technology', 'Climate Change', 'Economy', 'Sports'];
  }
}

// Search on Google News and visit first article
async function searchNewsAndVisit(page, keyword) {
  console.log(`\n🔍 Searching for: "${keyword}"`);

  try {
    // Navigate to Google News
    await page.goto('https://news.google.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Human-like interaction
    await humanMouseMovements(page);
    await humanScroll(page);

    // Wait for search input (multiple selectors)
    await page.waitForFunction(() => {
      const selectors = [
        'input[placeholder*="Search"]',
        'input[type="text"]',
        '[data-testid="search-input"]',
        'input[aria-label*="search" i]'
      ];
      return selectors.some(sel => document.querySelector(sel));
    }, { timeout: 10000 });

    // Type keyword with human-like typing
    console.log('⌨️  Typing search query...');
    const inputSelector = await page.evaluate(() => {
      const selectors = [
        'input[placeholder*="Search"]',
        'input[type="text"]',
        '[data-testid="search-input"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && !el.value) return sel;
      }
      return 'input[placeholder*="Search"]';
    });

    // Human-like typing with random delays
    for (let i = 0; i < keyword.length; i++) {
      await page.type(inputSelector, keyword[i], {
        delay: Math.random() * 100 + 50
      });
    }

    // Small pause before submitting
    await setTimeout(randomDelay(500, 1500));

    // Submit search
    await page.keyboard.press('Enter');

    // Wait for results
    await setTimeout(5000);

    // Human-like behavior on search results
    await humanScroll(page);
    await humanMouseMovements(page);
    await humanDelay(
      page,
      CONFIG.timeOnPage.newsSearch.min * 1000,
      CONFIG.timeOnPage.newsSearch.max * 1000,
      'Reviewing search results'
    );

    // Click first article
    console.log('📰 Clicking first article...');
    const firstArticle = await page.evaluate(() => {
      const selectors = [
        'article',
        '[data-testid="news-article"]',
        'div[class*="article"]',
        'a[href*="/articles"]'
      ];
      
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const link = sel === 'a[href*="/articles"]' ? el : el.querySelector('a');
          return link ? link.href : null;
        }
      }
      return null;
    });

    if (firstArticle) {
      console.log(`🔗 Opening: ${firstArticle.substring(0, 80)}...`);
      
      // Navigate to article
      await page.goto(firstArticle, {
        waitUntil: 'networkidle2',
        timeout: 20000
      });

      // Human-like reading behavior
      await humanScroll(page);
      await humanMouseMovements(page);
      
      const articleDelay = randomDelay(
        CONFIG.timeOnPage.article.min * 1000,
        CONFIG.timeOnPage.article.max * 1000
      );
      const seconds = Math.round(articleDelay / 1000);
      console.log(`📖 Reading article for ${seconds}s...`);
      
      // Simulate reading with periodic scrolling
      const readingChunks = 4;
      for (let i = 0; i < readingChunks; i++) {
        await setTimeout(articleDelay / readingChunks);
        if (i < readingChunks - 1) {
          await humanScroll(page);
        }
      }

      return { success: true, url: firstArticle };
    }

    return { success: false };

  } catch (error) {
    console.error('❌ Error during news search:', error.message);
    return { success: false };
  }
}

// Main warm-up routine
async function runWarmup() {
  console.log('🚀 Starting warm-up routine...\n');
  console.log('📋 Configuration:');
  console.log(`   Trends page: ${CONFIG.timeOnPage.trends.min}-${CONFIG.timeOnPage.trends.max}s`);
  console.log(`   News search: ${CONFIG.timeOnPage.newsSearch.min}-${CONFIG.timeOnPage.newsSearch.max}s`);
  console.log(`   Article read: ${CONFIG.timeOnPage.article.min}-${CONFIG.timeOnPage.article.max}s`);
  console.log('');

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();

  // Set viewport and user agent
  await page.setViewport(CONFIG.viewport);
  await page.setUserAgent(CONFIG.userAgent);

  // Hide webdriver flag
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
    
    // Add fake plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
    
    // Fake languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });
  });

  try {
    // Step 1: Get trending keywords
    const trends = await getTrendingKeywords(page);

    if (trends.length === 0) {
      console.log('⚠️  No trends found. Exiting.');
      return;
    }

    // Step 2: Process top keyword(s)
    const numToProcess = Math.min(CONFIG.numTrendsToProcess, trends.length);

    for (let i = 0; i < numToProcess; i++) {
      const trend = trends[i];
      console.log(`\n📌 Processing trend ${i + 1}/${numToProcess}: ${trend}`);

      const result = await searchNewsAndVisit(page, trend);

      if (result.success) {
        console.log(`✅ Completed warm-up for: ${trend}`);
      } else {
        console.log(`❌ Failed to process: ${trend}`);
      }

      // Go back to news for next iteration
      if (i < numToProcess - 1) {
        await page.goto('https://news.google.com', { waitUntil: 'networkidle2' });
        await setTimeout(2000);
      }
    }

    console.log('\n✅ Warm-up routine completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Keywords processed: ${numToProcess}`);
    console.log(`   Random delays used: Yes`);
    console.log(`   Human emulation: Enhanced`);

  } catch (error) {
    console.error('\n❌ Fatal error during warm-up:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed.');
  }
}

// Run the script
runWarmup().catch(console.error);
