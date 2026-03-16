/**
 * Test Adspower Remote Integration
 * Tests connection and starts browser on 1 profile
 */

const AdsPowerClient = require('./adspower-client-remote');
const puppeteer = require('puppeteer-core');
const { setTimeout } = require('timers/promises');

// Configuration
const CONFIG = {
    apiKey: 'e2ec8f83a615248b26844ce7b4180780000f879a7a0e5329',
    profileId: process.argv[2] || 'k12am9a2',
    headless: false
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testConnection() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       Testing Adspower Remote Connection                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📡 Server: 77.42.21.134:50325`);
    console.log(`🔑 API Key: ${CONFIG.apiKey.substring(0, 10)}...`);
    console.log(`👤 Profile ID: ${CONFIG.profileId}\n`);
    
    const client = new AdsPowerClient(CONFIG.apiKey);
    
    // Test 1: Connection
    console.log('🧪 Test 1: Testing API connection...');
    const connResult = await client.testConnection();
    
    if (connResult.success) {
        console.log('   ✅ Connection successful!');
        console.log(`   📬 Response: ${JSON.stringify(connResult.data || connResult.message)}`);
    } else {
        console.log('   ❌ Connection failed!');
        console.log(`   Error: ${connResult.message}`);
        if (connResult.hint) console.log(`   Hint: ${connResult.hint}`);
        return { success: false, step: 'connection', error: connResult.message };
    }
    
    // Test 2: List profiles
    console.log('\n🧪 Test 2: Listing profiles...');
    try {
        const profiles = await client.getProfiles({ page_size: 10 });
        if (profiles && profiles.list) {
            console.log(`   ✅ Found ${profiles.list.length} profile(s):`);
            profiles.list.forEach((p, i) => {
                console.log(`      ${i+1}. ${p.user_id} - ${p.name || 'Unnamed'}`);
            });
        } else {
            console.log('   ⚠️  No profiles found or unexpected response');
            console.log(`   📋 Response: ${JSON.stringify(profiles).substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ Error listing profiles: ${error.message}`);
    }
    
    // Test 3: Start profile browser
    console.log(`\n🧪 Test 3: Starting browser for profile ${CONFIG.profileId}...`);
    let browser = null;
    
    try {
        const startResult = await client.startProfile(CONFIG.profileId, {
            headless: CONFIG.headless ? '1' : '0',
            clear_cache_after_closing: '1'
        });
        
        console.log('   ✅ Browser started!');
        console.log(`   🌐 WebSocket: ${startResult.ws}`);
        console.log(`   🔗 HTTP: ${startResult.http}`);
        
        // Test 4: Connect via CDP
        console.log('\n🧪 Test 4: Connecting via CDP...');
        
        browser = await puppeteer.connect({
            browserWSEndpoint: startResult.ws,
            defaultViewport: { width: 1920, height: 1080 }
        });
        
        console.log('   ✅ Connected via CDP!');
        
        // Test 5: Open a page and navigate
        console.log('\n🧪 Test 5: Opening page and navigating...');
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
        
        await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const title = await page.title();
        console.log(`   ✅ Page loaded: ${title}`);
        
        // Wait a moment
        await sleep(2000);
        
        // Test 6: Close page properly (important for memory!)
        console.log('\n🧪 Test 6: Closing page...');
        await page.close();
        console.log('   ✅ Page closed');
        
        // Test 7: Disconnect browser
        console.log('\n🧪 Test 7: Disconnecting browser...');
        await browser.disconnect();
        browser = null;
        console.log('   ✅ Browser disconnected');
        
        // Test 8: Stop profile via API
        console.log('\n🧪 Test 8: Stopping profile...');
        await client.stopProfile(CONFIG.profileId);
        console.log('   ✅ Profile stopped');
        
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                    ✅ ALL TESTS PASSED                       ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        
        return { success: true };
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        
        // Try to clean up
        if (browser) {
            try {
                await browser.disconnect();
            } catch (e) {}
        }
        
        try {
            await client.stopProfile(CONFIG.profileId);
        } catch (e) {}
        
        return { success: false, step: 'browser', error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    testConnection()
        .then(result => {
            if (result.success) {
                console.log('🎉 Adspower integration test PASSED!');
                process.exit(0);
            } else {
                console.log(`\n💥 Test FAILED at step: ${result.step}`);
                console.log(`   Error: ${result.error}`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { testConnection };
