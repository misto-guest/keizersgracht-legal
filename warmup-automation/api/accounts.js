/**
 * Vercel Serverless Function - Accounts API
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = './users';
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const STATUS_FILE = path.join(DATA_DIR, 'account-status.json');

// In-memory storage for Vercel (since file system is read-only)
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
 * GET /api/accounts - List all accounts
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return res.json({
        success: true,
        accounts: accountsCache.accounts,
        lastUpdated: accountsCache.lastUpdated
      });
    }

    if (req.method === 'POST') {
      const { email, profileId, name, status = 'new' } = req.body;

      if (!email || !profileId) {
        return res.status(400).json({
          success: false,
          error: 'email and profileId are required'
        });
      }

      // Check if account already exists
      if (accountsCache.accounts.find(a => a.email === email)) {
        return res.status(400).json({
          success: false,
          error: 'Account already exists'
        });
      }

      // Add account
      const newAccount = {
        email,
        profileId,
        name: name || email.split('@')[0],
        status,
        addedAt: new Date().toISOString(),
        vcc: {
          added: false,
          lastFour: null,
          type: null,
          addedAt: null
        }
      };

      accountsCache.accounts.push(newAccount);
      accountsCache.lastUpdated = new Date().toISOString();

      return res.json({
        success: true,
        account: newAccount
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
