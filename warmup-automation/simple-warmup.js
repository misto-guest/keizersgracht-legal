/**
 * Simple warmup script - just opens profile 1 and waits
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
            headers: {
                'Content-Type': 'application/json'
            }
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

async function openProfile() {
    console.log('🚀 Opening AdsPower Profile 1\n');
    console.log('Profile ID:', PROFILE_ID);
    console.log('');

    try {
        // Open profile using the correct endpoint
        const result = await apiRequest(`/browser/start?user_id=${PROFILE_ID}`, 'GET');

        if (result.ws && result.ws.puppeteer) {
            console.log('✅ Profile opened successfully!\n');
            console.log('Browser window should now be visible in AdsPower.');
            console.log('You can manually navigate to sites and accept cookies.\n');
            console.log('Press Ctrl+C to keep profile open, or close the browser window to exit.\n');

            // Keep the process running
            await new Promise(() => {}); // Never resolves
        } else {
            console.log('❌ Unexpected response:', result);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('\nMake sure:');
        console.log('  1. AdsPower is running');
        console.log('  2. API is enabled in AdsPower Settings');
        console.log(`  3. Profile ID ${PROFILE_ID} exists`);
    }
}

openProfile();
