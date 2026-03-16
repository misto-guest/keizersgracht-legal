/**
 * AdsPower API Client for Remote Server
 * Server: 77.42.21.134:50325
 * API v2 endpoints
 */

const http = require('http');
const https = require('https');

class AdsPowerClient {
    constructor(apiKey = 'e2ec8f83a615248b26844ce7b4180780000f879a7a0e5329') {
        this.apiKey = apiKey;
        // Remote Adspower server
        this.baseUrl = 'http://77.42.21.134:50325';
        this.apiVersion = 'v2';
        this.cdpHost = '77.42.21.134';
        this.cdpPort = 8080;
    }

    /**
     * Make API request to AdsPower
     */
    async request(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}/api/${this.apiVersion}${endpoint}`;
            const urlObj = new URL(url);

            // Add API key to query parameters
            urlObj.searchParams.append('api_key', this.apiKey);

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(urlObj, options, (res) => {
                let body = '';

                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.code === 0 || response.code === 'Success') {
                            resolve(response.data || response);
                        } else {
                            reject(new Error(`API Error: ${response.msg || response.message || JSON.stringify(response)}`));
                        }
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${body}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Connection failed: ${error.message}`));
            });

            if (data && method === 'POST') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Test API connection
     */
    async testConnection() {
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
                                data: response
                            });
                        } else {
                            resolve({
                                success: false,
                                message: response.msg || 'Connection failed',
                                details: response
                            });
                        }
                    } catch (e) {
                        resolve({
                            success: false,
                            message: `Invalid JSON: ${body}`
                        });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    message: error.message,
                    hint: 'Make sure AdsPower API server is running and accessible'
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    message: 'Connection timeout',
                    hint: 'Server may be unreachable or behind firewall'
                });
            });

            req.end();
        });
    }

    /**
     * Get all profiles
     * @param {Object} options - { group_id, page, page_size, keywords }
     */
    async getProfiles(options = {}) {
        const params = new URLSearchParams();
        if (options.group_id) params.append('group_id', options.group_id);
        if (options.page) params.append('page', options.page);
        if (options.page_size) params.append('page_size', options.page_size);
        if (options.keywords) params.append('keywords', options.keywords);

        const endpoint = `/user/list?${params.toString()}`;
        return await this.request(endpoint);
    }

    /**
     * Get detailed profile information
     * @param {string} userId - Profile user ID
     */
    async getProfileInfo(userId) {
        const data = { user_id: userId };
        return await this.request('/user/info', 'POST', data);
    }

    /**
     * Check if a profile is active
     * @param {string} userId - Profile user ID
     */
    async isProfileActive(userId) {
        const data = { user_id: userId };
        const result = await this.request('/browser/is-active', 'POST', data);
        return result.is_active;
    }

    /**
     * Start a profile browser
     * Returns CDP URL and other connection details
     * @param {string} userId - Profile user ID
     * @param {Object} options - Launch options
     */
    async startProfile(userId, options = {}) {
        const params = new URLSearchParams();
        params.append('user_id', userId);

        // Add optional parameters
        if (options.headless !== undefined) params.append('headless', options.headless ? '1' : '0');
        if (options.open_tabs !== undefined) params.append('open_tabs', options.open_tabs ? '1' : '0');
        if (options.ip_tab !== undefined) params.append('ip_tab', options.ip_tab ? '1' : '0');
        if (options.clear_cache_after_closing !== undefined) params.append('clear_cache_after_closing', options.clear_cache_after_closing ? '1' : '0');

        const endpoint = `/browser/start?${params.toString()}`;
        return await this.request(endpoint, 'GET');
    }

    /**
     * Transform Adspower WebSocket URL to standard CDP URL
     * Adspower: ws://77.42.21.134:8080/port/{port}/devtools/browser/{guid}
     * Standard CDP format for Puppeteer: ws://77.42.21.134:8080/port/{port}/devtools/browser/{guid}
     * 
     * @param {string} wsUrl - The WebSocket URL from Adspower start API
     * @returns {string} - Transformed CDP URL
     */
    transformToCdpUrl(wsUrl) {
        if (!wsUrl) return null;
        
        // The Adspower API returns ws://host:port/port/{port}/devtools/browser/{guid}
        // We need to ensure it matches the expected format for Puppeteer
        // Actually, Adspower already returns a usable ws URL, just return it as-is
        return wsUrl;
    }

    /**
     * Get CDP URL for a started profile
     * @param {string} userId - Profile user ID
     */
    async getCdpUrl(userId) {
        const startResult = await this.startProfile(userId);
        
        if (startResult && startResult.ws) {
            return {
                cdpUrl: this.transformToCdpUrl(startResult.ws),
                httpUrl: startResult.http,
                debugUrl: startResult.debug,
                seleniumUrl: startResult.selenium,
                profileId: userId
            };
        }
        
        throw new Error('Failed to get CDP URL - no WebSocket URL in response');
    }

    /**
     * Stop a profile browser
     * IMPORTANT: Close all pages first before calling this to avoid memory leaks
     * @param {string} userId - Profile user ID
     */
    async stopProfile(userId) {
        const data = { user_id: userId };
        return await this.request('/browser/close', 'POST', data);
    }

    /**
     * Get profile cookies
     * @param {string} userId - Profile user ID
     */
    async getCookies(userId) {
        const data = { user_id: userId };
        return await this.request('/browser/cookies', 'POST', data);
    }

    /**
     * Delete a profile
     * @param {string} userId - Profile user ID
     */
    async deleteProfile(userId) {
        const data = { user_id: userId };
        return await this.request('/user/delete', 'POST', data);
    }

    /**
     * Create a new profile
     * @param {Object} profileData - Profile configuration
     */
    async createProfile(profileData) {
        return await this.request('/user/create', 'POST', profileData);
    }

    /**
     * Update a profile
     * @param {string} userId - Profile user ID
     * @param {Object} updates - Fields to update
     */
    async updateProfile(userId, updates) {
        const data = {
            user_id: userId,
            ...updates
        };
        return await this.request('/user/update', 'POST', data);
    }

    /**
     * Comprehensive profile data extraction
     * @param {string} userId - Profile user ID
     */
    async getFullProfileData(userId) {
        try {
            const [info, active, cookies] = await Promise.allSettled([
                this.getProfileInfo(userId),
                this.isProfileActive(userId),
                this.getCookies(userId)
            ]);

            return {
                success: true,
                profile_id: userId,
                basic_info: info.status === 'fulfilled' ? info.value : null,
                is_active: active.status === 'fulfilled' ? active.value : null,
                cookies: cookies.status === 'fulfilled' ? cookies.value : null,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                profile_id: userId
            };
        }
    }
}

module.exports = AdsPowerClient;
