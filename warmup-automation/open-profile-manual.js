/**
 * Just open the profile - no Puppeteer connection
 */
const http = require('http');

const API_KEY = '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';
const PROFILE_ID = 'k12am9a2';
const BASE_URL = 'http://local.adspower.net:50325';

function apiRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(`${BASE_URL}/api/v1${endpoint}`);
        urlObj.searchParams.append('api_key', API_KEY);

        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(urlObj, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.code === 0 || response.code === 'Success') {
                        resolve(response.data || response);
                    } else {
                        reject(new Error(`API Error: ${response.msg || response.message}`));
                    }
                } catch (e) {
                    reject(new Error(`Invalid JSON: ${body}`));
                }
            });
        });

        req.on('error', reject);

        if (data && method === 'POST') {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function openAndCheck() {
    console.log('🚀 Opening Profile 1 for manual inspection\n');
    console.log('Profile ID:', PROFILE_ID);
    console.log('');

    try {
        const result = await apiRequest(`/browser/start?user_id=${PROFILE_ID}`, 'GET');

        if (result.ws && result.ws.puppeteer) {
            console.log('✅ Profile 1 browser opened!\n');
            console.log('📍 INSTRUCTIONS:');
            console.log('─'.repeat(50));
            console.log('1. A browser window should now be visible');
            console.log('2. Navigate to: https://mail.google.com');
            console.log('3. Check what account is logged in');
            console.log('4. Look at the top right corner - it shows the account');
            console.log('\n   The account should match the AdsPower profile name:');
            console.log('   👤 patmcgee727@gmail.com\n');
            console.log('💡 Keep this terminal open to maintain the browser session.');
            console.log('   Press Ctrl+C when done.\n');

            // Keep process running
            await new Promise(() => {});
        } else {
            console.log('❌ Unexpected response:', result);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

openAndCheck();
