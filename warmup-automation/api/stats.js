/**
 * Vercel Serverless Function - Stats API
 */

let accountsCache = {
  accounts: [],
  lastUpdated: null
};

// Initialize with sample data
try {
  const sampleData = {
    accounts: [
      {
        email: 'patmcgee727@gmail.com',
        profileId: 'k12am9a2',
        name: 'Pat McGee',
        status: 'new',
        addedAt: new Date().toISOString(),
        vcc: {
          added: false,
          lastFour: null,
          type: null,
          addedAt: null
        }
      }
    ],
    lastUpdated: new Date().toISOString()
  };
  accountsCache = sampleData;
} catch (error) {
  console.error('Error initializing accounts:', error);
}

/**
 * GET /api/stats - Dashboard statistics
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Count by status
    const statusCounts = {
      new: 0,
      needs_warmup: 0,
      warming_up: 0,
      warmed: 0
    };

    accountsCache.accounts.forEach(acc => {
      const status = acc.status || 'new';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });

    // Calculate VCC stats
    const vccStats = {
      total: accountsCache.accounts.length,
      withVCC: accountsCache.accounts.filter(a => a.vcc?.added).length,
      withoutVCC: accountsCache.accounts.filter(a => !a.vcc?.added).length
    };

    return res.json({
      success: true,
      stats: {
        totalAccounts: accountsCache.accounts.length,
        statusCounts,
        vccStats,
        recentActivity: 0,
        lastUpdated: accountsCache.lastUpdated
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
