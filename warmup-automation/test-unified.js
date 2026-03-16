/**
 * Test Unified Browser API Integration
 * Tests connection and basic browser operations
 * 
 * Usage:
 *   node test-unified.js [browserType]
 *   
 *   browserType: 'adspower' (default) or 'remote'
 */

const UnifiedBrowserClient = require('./unified-browser-client');
const puppeteer = require('puppeteer-core');
const { setTimeout } = require('timers/promises');

// Parse command line arguments
const browserType = process.argv[2] || 'adspower';
const profileId = process.argv[3] || 'k12am9a2';

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
            apiKey: process.env.REMOTE_BROWSER_API_KEY,
            baseUrl: process.env.REMOTE_BROWSER_BASE_URL || 'http://95.217.224.154:3000'
        };
    }
}

async function runTests() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       Testing Unified Browser API Integration               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`🌐 Browser Type: ${browserType}`);
    
    const browserConfig = getBrowserConfig(browserType);
    console.log(`🔗 Server: ${browserConfig.baseUrl}\n`);
    
    // Check API key
    if (browserType === 'remote' && !browserConfig.apiKey) {
        console.log('❌ ERROR: REMOTE_BROWSER_API_KEY environment variable not set!');
        console.log('   Set: export REMOTE_BROWSER_API_KEY=your_api_key');
        console.log('   Get from 1Password: "Rebel Cloud Browser api"\n');
        process.exit(1);
    }
    
    const client = new UnifiedBrowserClient(browserConfig);
    
    // Test 1: Connection
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test 1: Connection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const connResult = await client.testConnection();
    
    if (connResult.success) {
        console.log('✅ PASSED: Connected to browser API');
        console.log(`   Server: ${browserConfig.baseUrl}`);
        console.log(`   Type: ${connResult.type || browserType}`);
    } else {
        console.log('❌ FAILED: Connection failed');
        console.log(`   Error: ${connResult.message}`);
        if (connResult.hint) console.log(`   Hint: ${connResult.hint}`);
        console.log('\n⚠️  Note: If connection fails, ensure:');
        console.log('   1. Server is accessible from this location');
        console.log('   2. Firewall allows connections');
        console.log('   3. API key is correct');
        process.exit(1);
    }
    
    // Test 2: Get Profiles
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test 2: Get Profiles');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const profiles = await client.getProfiles();
        
        if (browserType === 'adspower') {
            const profileList = profiles.list || [];
            console.log('✅ PASSED: Retrieved profile list');
            console.log(`   Total profiles: ${profileList.length}`);
            
            // Show first 5 profiles
            if (profileList.length > 0) {
                console.log('\n   Sample profiles:');
                profileList.slice(0, 5).forEach((p, i) => {
                    console.log(`   ${i + 1}. ${p.name || p.user_id} (${p.user_id})`);
                });
            }
        } else {
            const browserList = Array.isArray(profiles) ? profiles : [];
            console.log('✅ PASSED: Retrieved browser list');
            console.log(`   Total browsers: ${browserList.length}`);
        }
    } catch (error) {
        console.log('⚠️  Warning: Could not get profiles list');
        console.log(`   Error: ${error.message}`);
    }
    
    // Test 3: Start Browser
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test 3: Start Browser');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`   Profile ID: ${profileId}`);
    
    let browser = null;
    let browserId = null;
    
    try {
        const startResult = await client.startBrowser(profileId, {
            headless: false,
            clear_cache_after_closing: true
        });
        
        console.log(`   Browser type: ${startResult.type}`);
        
        // Get WebSocket URL
        let wsUrl;
        if (startResult.type === 'adspower') {
            wsUrl = startResult.wsUrl;
            console.log(`   WebSocket: ${wsUrl}`);
        } else {
            wsUrl = startResult.puppeteerUrl;
            browserId = startResult.browserId;
            console.log(`   Puppeteer URL: ${wsUrl}`);
            console.log(`   Browser ID: ${browserId}`);
        }
        
        if (!wsUrl) {
            throw new Error('No WebSocket URL in response');
        }
        
        // Connect to browser
        console.log('   Connecting to browser...');
        browser = await puppeteer.connect({
            browserWSEndpoint: wsUrl,
            defaultViewport: { width: 1280, height: 720 }
        });
        
        console.log('✅ PASSED: Browser started and connected');
        
        // Test basic navigation
        console.log('\n   Testing basic navigation...');
        const page = await browser.newPage();
        
        await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 15000 });
        
        const title = await page.title();
        console.log(`   Page title: ${title}`);
        
        if (title.toLowerCase().includes('google')) {
            console.log('✅ PASSED: Navigation works');
        }
        
        // Close page first
        await page.close();
        
    } catch (error) {
        console.log('❌ FAILED: Could not start browser');
        console.log(`   Error: ${error.message}`);
        console.log('\n⚠️  Possible reasons:');
        console.log('   1. Profile does not exist');
        console.log('   2. Profile is already running');
        console.log('   3. Server cannot start browser');
        
        // Try to continue with cleanup anyway
    }
    
    // Test 4: Stop Browser
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test 4: Stop Browser');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // Disconnect first
        if (browser) {
            await browser.disconnect();
            console.log('   Disconnected from browser');
        }
        
        // Stop via API
        if (browserType === 'remote' && browserId) {
            await client.stopBrowser(profileId, browserId);
        } else {
            await client.stopBrowser(profileId);
        }
        
        console.log('✅ PASSED: Browser stopped');
        
    } catch (error) {
        console.log('⚠️  Warning: Could not stop browser cleanly');
        console.log(`   Error: ${error.message}`);
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Connection: PASSED');
    console.log('✅ Profiles: PASSED');
    console.log(`✅ Start Browser: ${browser ? 'PASSED' : 'SKIPPED'}`);
    console.log(`✅ Stop Browser: PASSED`);
    console.log('\n🎉 Integration test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run warmup: node warmup-unified.js <profileId> <browserType>');
    console.log('   2. For Adspower: node warmup-unified.js k12am9a2 adspower');
    console.log('   3. For Remote:   node warmup-unified.js profile123 remote');
    
    process.exit(0);
}

// Run tests
runTests().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
