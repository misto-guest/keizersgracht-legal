import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';

// Simple script to get trending keywords
async function getTrends() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

  try {
    console.log('📊 Loading Google Trends...\n');
    
    await page.goto('https://trends.google.com/trends/?geo=US', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await setTimeout(8000);

    console.log('🔍 Extracting trending keywords...\n');

    const trends = await page.evaluate(() => {
      const results = [];
      
      // Look for text content that might be trending topics
      const allText = document.body.innerText;
      const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      
      // Extract potential trending topics (short, meaningful phrases)
      for (const line of lines) {
        if (line.length > 3 && line.length < 80 &&
            !line.includes('Sign in') &&
            !line.includes('Google') &&
            !line.includes('Trends') &&
            !line.includes('Search') &&
            !line.includes('Explore') &&
            !line.includes('©') &&
            !line.includes('Privacy') &&
            !/^\d+$/.test(line) &&
            !line.includes('Subscriptions') &&
            results.length < 15) {
          
          // Clean and deduplicate
          const cleaned = line.replace(/^\d+\.\s*/, '').trim();
          if (!results.includes(cleaned)) {
            results.push(cleaned);
          }
        }
      }
      
      return results.slice(0, 10);
    });

    if (trends.length > 0) {
      console.log('✅ TRENDING KEYWORDS FOUND:\n');
      trends.forEach((trend, i) => {
        console.log(`${i + 1}. ${trend}`);
      });
    } else {
      console.log('⚠️  No clear trends found');
      console.log('💡 Using fallback trending topics:\n');
      const fallbackTrends = [
        'Donald Trump',
        'Election 2024',
        'Technology News',
        'Climate Change',
        'Economy Update',
        'Sports Highlights',
        'Entertainment',
        'World News',
        'Science',
        'Health'
      ];
      fallbackTrends.forEach((trend, i) => {
        console.log(`${i + 1}. ${trend}`);
      });
    }

    console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
    await setTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed.');
  }
}

getTrends().catch(console.error);
