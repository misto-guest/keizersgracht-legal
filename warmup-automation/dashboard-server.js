#!/usr/bin/env node
/**
 * Enhanced Dashboard Server
 * Tracks account statuses: new, needs_warmup, warming_up, warmed
 * Provides web interface for managing warmup process
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const AdsPowerClient = require('./adspower-client');
const { runEnhancedWarmup } = require('./warmup-enhanced');

const app = express();
const PORT = 3000;

// Configuration
const DATA_DIR = './users';
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const WARMUP_LOGS = path.join(DATA_DIR, 'warmup-logs.json');
const STATUS_FILE = path.join(DATA_DIR, 'account-status.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Load account data
 */
function loadAccounts() {
    try {
        const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { accounts: [], lastUpdated: null };
    }
}

/**
 * Save account data
 */
function saveAccounts(data) {
    ensureDataDir();
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Load account status
 */
function loadStatus() {
    try {
        const data = fs.readFileSync(STATUS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { statuses: {}, lastUpdated: null };
    }
}

/**
 * Save account status
 */
function saveStatus(data) {
    ensureDataDir();
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Update account status
 */
function updateAccountStatus(email, status, metadata = {}) {
    const statusData = loadStatus();
    
    statusData.statuses[email] = {
        status,
        lastUpdated: new Date().toISOString(),
        ...metadata
    };
    
    saveStatus(statusData);
}

/**
 * Load warmup logs
 */
function loadWarmupLogs() {
    try {
        const data = fs.readFileSync(WARMUP_LOGS, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { logs: [] };
    }
}

/**
 * Add warmup log entry
 */
function addWarmupLog(email, activity, result) {
    const logs = loadWarmupLogs();
    
    logs.logs.push({
        email,
        activity,
        result,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 logs
    if (logs.logs.length > 1000) {
        logs.logs = logs.logs.slice(-1000);
    }
    
    fs.writeFileSync(WARMUP_LOGS, JSON.stringify(logs, null, 2));
}

// API Routes

/**
 * GET /api/accounts - List all accounts with status
 */
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = loadAccounts();
        const statusData = loadStatus();
        
        // Merge accounts with status
        const enriched = accounts.accounts.map(acc => ({
            ...acc,
            status: statusData.statuses[acc.email]?.status || 'new',
            lastWarmup: statusData.statuses[acc.email]?.lastUpdated || null,
            warmupCount: statusData.statuses[acc.email]?.warmupCount || 0
        }));
        
        res.json({
            success: true,
            accounts: enriched,
            lastUpdated: accounts.lastUpdated
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/accounts - Add new account
 */
app.post('/api/accounts', async (req, res) => {
    try {
        const { email, profileId, name, status = 'new' } = req.body;
        
        if (!email || !profileId) {
            return res.status(400).json({ 
                success: false, 
                error: 'email and profileId are required' 
            });
        }
        
        const accounts = loadAccounts();
        
        // Check if account already exists
        if (accounts.accounts.find(a => a.email === email)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Account already exists' 
            });
        }
        
        // Add account
        accounts.accounts.push({
            email,
            profileId,
            name: name || email.split('@')[0],
            status,
            addedAt: new Date().toISOString()
        });
        
        saveAccounts(accounts);
        
        // Initialize status
        updateAccountStatus(email, status);
        
        res.json({ success: true, account: { email, profileId, name, status } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/accounts/:email/status - Update account status
 */
app.put('/api/accounts/:email/status', async (req, res) => {
    try {
        const { email } = req.params;
        const { status } = req.body;
        
        if (!['new', 'needs_warmup', 'warming_up', 'warmed'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid status. Must be: new, needs_warmup, warming_up, warmed' 
            });
        }
        
        updateAccountStatus(email, status);
        
        res.json({ success: true, email, status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/warmup/start - Start warmup for account
 */
app.post('/api/warmup/start', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                error: 'email is required' 
            });
        }
        
        const accounts = loadAccounts();
        const account = accounts.accounts.find(a => a.email === email);
        
        if (!account) {
            return res.status(404).json({ 
                success: false, 
                error: 'Account not found' 
            });
        }
        
        // Update status to warming_up
        updateAccountStatus(email, 'warming_up');
        
        // Start warmup in background
        const statusData = loadStatus();
        const currentCount = statusData.statuses[email]?.warmupCount || 0;
        
        runEnhancedWarmup(account.profileId, {
            profileData: req.body.profileData || {},
            cardData: req.body.cardData || null
        })
            .then(result => {
                if (result.success) {
                    // Update to warmed after successful warmup
                    updateAccountStatus(email, 'warmed', {
                        warmupCount: currentCount + 1,
                        lastActivities: result.completed
                    });
                    
                    addWarmupLog(email, 'enhanced_warmup', {
                        success: true,
                        completed: result.completed,
                        total: result.total
                    });
                } else {
                    // Revert to needs_warmup on failure
                    updateAccountStatus(email, 'needs_warmup');
                    
                    addWarmupLog(email, 'enhanced_warmup', {
                        success: false,
                        error: result.error
                    });
                }
            })
            .catch(error => {
                console.error('Warmup error:', error);
                updateAccountStatus(email, 'needs_warmup');
                addWarmupLog(email, 'enhanced_warmup', {
                    success: false,
                    error: error.message
                });
            });
        
        res.json({ 
            success: true, 
            message: 'Warmup started',
            email,
            profileId: account.profileId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/warmup/logs - Get warmup logs
 */
app.get('/api/warmup/logs', async (req, res) => {
    try {
        const logs = loadWarmupLogs();
        const { email, limit = 50 } = req.query;
        
        let filtered = logs.logs;
        
        if (email) {
            filtered = filtered.filter(log => log.email === email);
        }
        
        // Return most recent logs
        const recent = filtered.slice(-parseInt(limit)).reverse();
        
        res.json({
            success: true,
            logs: recent,
            total: logs.logs.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/stats - Dashboard statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const accounts = loadAccounts();
        const statusData = loadStatus();
        const logs = loadWarmupLogs();
        
        // Count by status
        const statusCounts = {
            new: 0,
            needs_warmup: 0,
            warming_up: 0,
            warmed: 0
        };
        
        accounts.accounts.forEach(acc => {
            const status = statusData.statuses[acc.email]?.status || 'new';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            }
        });
        
        // Recent activity (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentActivity = logs.logs.filter(log => 
            new Date(log.timestamp) > yesterday
        );
        
        res.json({
            success: true,
            stats: {
                totalAccounts: accounts.accounts.length,
                statusCounts,
                recentActivity: recentActivity.length,
                lastUpdated: statusData.lastUpdated
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/adspower/test - Test AdsPower connection
 */
app.get('/api/adspower/test', async (req, res) => {
    try {
        const client = new AdsPowerClient();
        const result = await client.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/adspower/profiles - List AdsPower profiles
 */
app.get('/api/adspower/profiles', async (req, res) => {
    try {
        const client = new AdsPowerClient();
        const profiles = await client.getProfiles({ page_size: 100 });
        res.json({ success: true, profiles });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET / - Serve dashboard HTML
 */
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gmail Warmup Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-card h3 { color: #666; font-size: 14px; margin-bottom: 10px; }
        .stat-card .value { font-size: 32px; font-weight: bold; color: #333; }
        .stat-card.new .value { color: #2196F3; }
        .stat-card.needs_warmup .value { color: #FF9800; }
        .stat-card.warming_up .value { color: #9C27B0; }
        .stat-card.warmed .value { color: #4CAF50; }
        .accounts-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .accounts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .btn-primary { background: #2196F3; color: white; }
        .btn-primary:hover { background: #1976D2; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f9f9f9; font-weight: 600; color: #666; }
        .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .status-new { background: #E3F2FD; color: #1976D2; }
        .status-needs_warmup { background: #FFF3E0; color: #F57C00; }
        .status-warming_up { background: #F3E5F5; color: #7B1FA2; }
        .status-warmed { background: #E8F5E9; color: #388E3C; }
        .actions { display: flex; gap: 10px; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .btn-warmup { background: #4CAF50; color: white; }
        .btn-warmup:hover { background: #388E3C; }
        .btn-warmup:disabled { background: #ccc; cursor: not-allowed; }
        .loading { opacity: 0.6; pointer-events: none; }
        #logs { margin-top: 30px; background: white; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 Gmail Warmup Dashboard</h1>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Total Accounts</h3>
                <div class="value" id="total-accounts">-</div>
            </div>
            <div class="stat-card new">
                <h3>New</h3>
                <div class="value" id="new-count">-</div>
            </div>
            <div class="stat-card needs_warmup">
                <h3>Needs Warmup</h3>
                <div class="value" id="needs-warmup-count">-</div>
            </div>
            <div class="stat-card warming_up">
                <h3>Warming Up</h3>
                <div class="value" id="warming-count">-</div>
            </div>
            <div class="stat-card warmed">
                <h3>Warmed</h3>
                <div class="value" id="warmed-count">-</div>
            </div>
        </div>
        
        <div class="accounts-section">
            <div class="accounts-header">
                <h2>Accounts</h2>
                <button class="btn btn-primary" onclick="addAccount()">+ Add Account</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Profile ID</th>
                        <th>Status</th>
                        <th>Warmups</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="accounts-table">
                    <tr><td colspan="6" style="text-align: center;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
        
        <div id="logs">
            <h2>Recent Activity</h2>
            <pre id="logs-content" style="background: #f9f9f9; padding: 15px; border-radius: 4px; overflow: auto; max-height: 300px;">Loading...</pre>
        </div>
    </div>
    
    <script>
        // Load stats
        async function loadStats() {
            const res = await fetch('/api/stats');
            const data = await res.json();
            
            if (data.success) {
                document.getElementById('total-accounts').textContent = data.stats.totalAccounts;
                document.getElementById('new-count').textContent = data.stats.statusCounts.new;
                document.getElementById('needs-warmup-count').textContent = data.stats.statusCounts.needs_warmup;
                document.getElementById('warming-count').textContent = data.stats.statusCounts.warming_up;
                document.getElementById('warmed-count').textContent = data.stats.statusCounts.warmed;
            }
        }
        
        // Load accounts
        async function loadAccounts() {
            const res = await fetch('/api/accounts');
            const data = await res.json();
            
            if (data.success) {
                const tbody = document.getElementById('accounts-table');
                
                if (data.accounts.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No accounts yet. Click "Add Account" to get started.</td></tr>';
                    return;
                }
                
                tbody.innerHTML = data.accounts.map(acc => \`
                    <tr>
                        <td>\${acc.email}</td>
                        <td>\${acc.name || '-'}</td>
                        <td>\${acc.profileId}</td>
                        <td><span class="status-badge status-\${acc.status}">\${acc.status.replace('_', ' ')}</span></td>
                        <td>\${acc.warmupCount || 0}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-sm btn-warmup" 
                                    onclick="startWarmup('\${acc.email}')"
                                    \${acc.status === 'warming_up' ? 'disabled' : ''}>
                                    Start Warmup
                                </button>
                            </div>
                        </td>
                    </tr>
                \`).join('');
            }
        }
        
        // Load logs
        async function loadLogs() {
            const res = await fetch('/api/warmup/logs?limit=20');
            const data = await res.json();
            
            if (data.success) {
                const logsContent = document.getElementById('logs-content');
                logsContent.textContent = JSON.stringify(data.logs, null, 2);
            }
        }
        
        // Start warmup
        async function startWarmup(email) {
            if (!confirm(\`Start warmup for \${email}?\\n\\nThis will:\\n1. Update status to "warming_up"\\n2. Run enhanced warmup activities\\n3. Update status to "warmed" when done\`)) {
                return;
            }
            
            const res = await fetch('/api/warmup/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await res.json();
            
            if (data.success) {
                alert(\`Warmup started for \${email}!\\n\\nThe process runs in the background. Refresh the page to see status updates.\`);
                loadAccounts();
                loadStats();
            } else {
                alert(\`Error: \${data.error}\`);
            }
        }
        
        // Add account (simple prompt for now)
        function addAccount() {
            const email = prompt('Enter Gmail address:');
            const profileId = prompt('Enter AdsPower Profile ID:');
            const name = prompt('Enter name (optional):');
            
            if (email && profileId) {
                fetch('/api/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, profileId, name })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Account added!');
                        loadAccounts();
                        loadStats();
                    } else {
                        alert('Error: ' + data.error);
                    }
                });
            }
        }
        
        // Initial load
        loadStats();
        loadAccounts();
        loadLogs();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            loadStats();
            loadAccounts();
            loadLogs();
        }, 30000);
    </script>
</body>
</html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Gmail Warmup Dashboard Server                      ║
╠══════════════════════════════════════════════════════════════╣
║  URL:        http://localhost:${PORT}                          ║
║  Data dir:   ${DATA_DIR}                      ║
║  Accounts:   ${ACCOUNTS_FILE}                   ║
║  Status:     ${STATUS_FILE}                   ║
╚══════════════════════════════════════════════════════════════╝

🚀 Server running...
📊 Dashboard: http://localhost:${PORT}
📚 API: http://localhost:${PORT}/api/
    `);
});

module.exports = app;
