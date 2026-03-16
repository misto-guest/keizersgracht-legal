/**
 * Unified Browser API Client
 * Supports both:
 * 1. Adspower (remote server 77.42.21.134:50325)
 * 2. Unified Remote Browser API (http://95.217.224.154:3000)
 * 
 * Usage:
 *   const browserClient = new UnifiedBrowserClient({ type: 'adspower' });
 *   const browserClient = new UnifiedBrowserClient({ type: 'remote', apiKey: 'xxx' });
 */

const http = require('http');
const https = require('https');

class UnifiedBrowserClient {
    constructor(options = {}) {
        this.type = options.type || 'adspower'; // 'adspower' or 'remote'
        
        if (this.type === 'adspower') {
            // Adspower configuration
            this.apiKey = options.apiKey || process.env.ADSPOWER_API_KEY || 'e2ec8f83a615248b26844ce7b4180780000f879a7a0e5329';
            this.baseUrl = options.baseUrl || process.env.ADSPOWER_BASE_URL || 'http://77.42.21.134:50325';
            this.apiVersion = 'v2';
            this.cdpHost = options.cdpHost || '77.42.21.134';
            this.cdpPort = options.cdpPort || 8080;
        } else {
            // Unified Remote Browser API configuration
            this.apiKey = options.apiKey || process.env.REMOTE_BROWSER_API_KEY;
            this.baseUrl = options.baseUrl || process.env.REMOTE_BROWSER_BASE_URL || 'http://95.217.224.154:3000';
        }
        
        this.profileId = options.profileId || null;
    }

    /**
     * Make HTTP request to browser API
     */
    async request(endpoint, method = 'GET', data = null, useApiKey = true) {
        return new Promise((resolve, reject) => {
            let url;
            
            if (this.type === 'adspower') {
                url = `${this.baseUrl}/api/${this.apiVersion}${endpoint}`;
            } else {
                url = `${this.baseUrl}${endpoint}`;
            }
            
            const urlObj = new URL(url);
            
            // Add API key to query parameters
            if (useApiKey && this.apiKey) {
                if (this.type === 'adspower') {
                    urlObj.searchParams.append('api_key', this.apiKey);
                } else {
                    urlObj.searchParams.append('x_api_key', this.apiKey);
                }
            }

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            };

            const client = url.startsWith('https') ? https : http;
            
            const req = client.request(urlObj, options, (res) => {
                let body = '';

                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        
                        if (this.type === 'adspower') {
                            if (response.code === 0 || response.code === 'Success') {
                                resolve(response.data || response);
                            } else {
                                reject(new Error(`AdsPower API Error: ${response.msg || response.message || JSON.stringify(response)}`));
                            }
                        } else {
                            // Unified Remote Browser API response format
                            if (response.success || response.error === null) {
                                resolve(response.data || response);
                            } else {
                                reject(new Error(`Remote Browser API Error: ${response.error || JSON.stringify(response)}`));
                            }
                        }
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${body}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Connection failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Connection timeout'));
            });

            if (data && (method === 'POST' || method === 'PUT')) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Test API connection
     */
    async testConnection() {
        console.log(`🔍 Testing ${this.type === 'adspower' ? 'AdsPower' : 'Remote Browser'} API connection...`);
        
        try {
            if (this.type === 'adspower') {
                return await this.testAdspowerConnection();
            } else {
                return await this.testRemoteConnection();
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
                type: this.type
            };
        }
    }

    /**
     * Test Adspower connection
     */
    async testAdspowerConnection() {
        return new Promise((resolve) => {
            const options = {
                hostname: new URL(this.baseUrl).hostname,
                port: new URL(this.baseUrl).port || 80,
                path: '/api/v2/status',
                method: 'GET',
                timeout: 10000
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.code === 0) {
                            resolve({
                                success: true,
                                message: 'Connected to AdsPower API',
                                data: response,
                                type: 'adspower'
                            });
                        } else {
                            resolve({
                                success: false,
                                message: response.msg || 'Connection failed',
                                details: response,
                                type: 'adspower'
                            });
                        }
                    } catch (e) {
                        resolve({
                            success: false,
                            message: `Invalid JSON: ${body}`,
                            type: 'adspower'
                        });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    message: error.message,
                    hint: 'Make sure AdsPower API server is running and accessible',
                    type: 'adspower'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    message: 'Connection timeout',
                    hint: 'Server may be unreachable or behind firewall',
                    type: 'adspower'
                });
            });

            req.end();
        });
    }

    /**
     * Test Unified Remote Browser API connection
     */
    async testRemoteConnection() {
        const endpoint = `/status?x_api_key=${this.apiKey}`;
        
        try {
            const data = await this.request(endpoint, 'GET', null, false);
            return {
                success: true,
                message: 'Connected to Remote Browser API',
                data: data,
                type: 'remote'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                hint: 'Check API key and server URL',
                type: 'remote'
            };
        }
    }

    /**
     * Get available profiles
     */
    async getProfiles(options = {}) {
        if (this.type === 'adspower') {
            const params = new URLSearchParams();
            if (options.group_id) params.append('group_id', options.group_id);
            if (options.page) params.append('page', options.page);
            if (options.page_size) params.append('page_size', options.page_size);
            if (options.keywords) params.append('keywords', options.keywords);

            const endpoint = `/user/list?${params.toString()}`;
            return await this.request(endpoint);
        } else {
            // Remote Browser API - list browsers
            const endpoint = `/browsers?x_api_key=${this.apiKey}`;
            return await this.request(endpoint, 'GET', null, false);
        }
    }

    /**
     * Start browser for a profile
     * Returns browser connection details
     */
    async startBrowser(profileId, options = {}) {
        this.profileId = profileId;
        
        if (this.type === 'adspower') {
            return await this.startAdspowerBrowser(profileId, options);
        } else {
            return await this.startRemoteBrowser(profileId, options);
        }
    }

    /**
     * Start Adspower browser
     */
    async startAdspowerBrowser(userId, options = {}) {
        const params = new URLSearchParams();
        params.append('user_id', userId);

        // Optional parameters
        if (options.headless !== undefined) params.append('headless', options.headless ? '1' : '0');
        if (options.open_tabs !== undefined) params.append('open_tabs', options.open_tabs ? '1' : '0');
        if (options.ip_tab !== undefined) params.append('ip_tab', options.ip_tab ? '1' : '0');
        if (options.clear_cache_after_closing !== undefined) params.append('clear_cache_after_closing', options.clear_cache_after_closing ? '1' : '0');

        const endpoint = `/browser/start?${params.toString()}`;
        const result = await this.request(endpoint, 'GET');
        
        return {
            wsUrl: result.ws,
            httpUrl: result.http,
            debugUrl: result.debug,
            seleniumUrl: result.selenium,
            profileId: userId,
            type: 'adspower'
        };
    }

    /**
     * Start Remote Browser API browser
     * Returns puppeteerUrl directly
     */
    async startRemoteBrowser(profileId, options = {}) {
        const data = {
            provider: options.provider || 'puppeteer',
            headless: options.headless !== undefined ? options.headless : false,
            profileId: profileId
        };
        
        const endpoint = `/browsers/start?x_api_key=${this.apiKey}`;
        const result = await this.request(endpoint, 'POST', data, false);
        
        return {
            puppeteerUrl: result.puppeteerUrl,
            browserId: result.browserId,
            profileId: profileId,
            type: 'remote'
        };
    }

    /**
     * Stop browser for a profile
     * IMPORTANT: Close all pages first before calling this
     */
    async stopBrowser(profileId, browserId = null) {
        if (this.type === 'adspower') {
            return await this.stopAdspowerBrowser(profileId);
        } else {
            return await this.stopRemoteBrowser(browserId);
        }
    }

    /**
     * Stop Adspower browser
     */
    async stopAdspowerBrowser(userId) {
        const data = { user_id: userId };
        return await this.request('/browser/close', 'POST', data);
    }

    /**
     * Stop Remote Browser API browser
     */
    async stopRemoteBrowser(browserId) {
        const data = {
            provider: 'puppeteer',
            browserId: browserId
        };
        
        const endpoint = `/browsers/stop?x_api_key=${this.apiKey}`;
        return await this.request(endpoint, 'POST', data, false);
    }

    /**
     * Check if profile/browser is active
     */
    async isActive(profileId) {
        if (this.type === 'adspower') {
            const data = { user_id: profileId };
            const result = await this.request('/browser/is-active', 'POST', data);
            return result.is_active;
        } else {
            // Remote API - check browser status
            const endpoint = `/browsers/${profileId}?x_api_key=${this.apiKey}`;
            const result = await this.request(endpoint, 'GET', null, false);
            return result.status === 'Running';
        }
    }

    /**
     * Get profile cookies
     */
    async getCookies(profileId) {
        if (this.type === 'adspower') {
            const data = { user_id: profileId };
            return await this.request('/browser/cookies', 'POST', data);
        } else {
            throw new Error('Get cookies not implemented for Remote Browser API');
        }
    }

    /**
     * Get configuration as object
     */
    getConfig() {
        return {
            type: this.type,
            baseUrl: this.baseUrl,
            apiKey: this.apiKey ? this.apiKey.substring(0, 8) + '...' : null,
            profileId: this.profileId
        };
    }
}

module.exports = UnifiedBrowserClient;
