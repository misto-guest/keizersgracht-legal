/**
 * Vercel Serverless Function - Warmup Logs API
 */

// Sample logs data
let logsCache = {
  logs: [],
  lastUpdated: new Date().toISOString()
};

/**
 * GET /api/warmup/logs - Get warmup logs
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
    const { limit = 20 } = req.query;
    const recent = logsCache.logs.slice(-parseInt(limit)).reverse();

    return res.json({
      success: true,
      logs: recent,
      total: logsCache.logs.length
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
