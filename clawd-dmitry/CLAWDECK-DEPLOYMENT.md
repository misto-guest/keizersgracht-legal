# ClawDeck Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended for beginners)
```bash
# 1. Fork the repo
# https://github.com/clawdeckio/clawdeck/fork

# 2. Clone to your machine
git clone https://github.com/YOUR_USERNAME/clawdeck.git
cd clawdeck

# 3. Install dependencies
bundle install

# 4. Deploy to Vercel
npm i -g vercel
vercel

# 5. Your URL will be: https://your-clawdeck.vercel.app
```

### Option 2: Railway (Easy Rails hosting)
```bash
# 1. Fork the repo on GitHub

# 2. Go to railway.app
# 3. Click "Deploy from GitHub repo"
# 4. Select your clawdeck fork
# 5. Railway will:
#    - Provision PostgreSQL
#    - Set up Redis
#    - Deploy Rails app
#    - Give you a URL like: https://your-clawdeck.up.railway.app
```

### Option 3: Self-Host on Your Own Server (Docker)
```bash
# 1. Clone the repo
git clone https://github.com/clawdeckio/clawdeck.git
cd clawdeck

# 2. Build Docker image
docker build -t clawdeck .

# 3. Run with PostgreSQL
docker-compose up

# 4. Access at: http://localhost:3000
# Or configure reverse proxy for your domain
```

## Environment Variables Needed

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/clawdeck

# Redis (for background jobs & real-time)
REDIS_URL=redis://host:6379

# Rails Secret
SECRET_KEY_BASE=your_secret_key_here

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Domain (optional)
RAILS_HOST=https://your-clawdeck.yourdomain.com
```

## Custom Domain Setup

### With Vercel
```bash
# 1. Go to vercel.com dashboard
# 2. Select your project
# 3. Settings → Domains
# 4. Add your domain: clawdeck.yourdomain.com
# 5. Configure DNS (Vercel will give you instructions)
```

### With Railway
```bash
# 1. Go to railway.app
# 2. Select your project
# 3. Settings → Domains
# 4. Add custom domain
# 5. Configure DNS
```

## API Configuration for Agents

### Generate API Token
1. Log into ClawDeck
2. Go to Settings → API Tokens
3. Create new token
4. Copy token - you'll need this for agent configuration

### Agent Integration
```javascript
// Example: Configure Dmitry to use ClawDeck
const CLAWDECK_CONFIG = {
  apiUrl: 'https://your-clawdeck.vercel.app/api/v1',
  apiKey: 'your_api_token_here',
  agentName: 'Dmitry',
  agentEmoji: '🎯',
  pollInterval: 30000, // Check for tasks every 30 seconds
};

// Agent would poll for assigned tasks
async function getAssignedTasks() {
  const response = await fetch(`${CLAWDECK_CONFIG.apiUrl}/tasks?assigned=true`, {
    headers: {
      'Authorization': `Bearer ${CLAWDECK_CONFIG.apiKey}`,
      'X-Agent-Name': CLAWDECK_CONFIG.agentName,
      'X-Agent-Emoji': CLAWDECK_CONFIG.agentEmoji,
    },
  });
  return response.json();
}

// Update task status
async function updateTask(taskId, status, note) {
  await fetch(`${CLAWDECK_CONFIG.apiUrl}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CLAWDECK_CONFIG.apiKey}`,
      'X-Agent-Name': CLAWDECK_CONFIG.agentName,
      'X-Agent-Emoji': CLAWDECK_CONFIG.agentEmoji,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: status,
      activity_note: note,
    }),
  });
}
```

## Security Considerations

### 1. API Token Management
- Store tokens in environment variables
- Rotate tokens regularly
- Use different tokens for different agents
- Never commit tokens to git

### 2. Access Control
- Create separate user accounts for each agent
- Use read-only tokens where possible
- Implement IP whitelisting if self-hosting

### 3. Rate Limiting
- Configure rate limits on API endpoints
- Implement exponential backoff for agent polling
- Use webhooks instead of polling where possible

## Monitoring & Maintenance

### Health Checks
```bash
# Check if ClawDeck is running
curl https://your-clawdeck.vercel.app/health

# Check API status
curl https://your-clawdeck.vercel.app/api/v1/status
```

### Logs
```bash
# On Vercel: Dashboard → Logs
# On Railway: Dashboard → Logs
# Self-hosted: logs/development.log
```

### Backups
```bash
# PostgreSQL backups
pg_dump clawdeck_production > backup.sql

# Or configure automatic backups on your hosting platform
```

## Cost Estimate

### Vercel (Hobby Plan)
- Free: 100GB bandwidth/month
- Pro: $20/month (unlimited bandwidth)

### Railway
- Starter: $5/month (512MB RAM)
- Professional: $20/month (2GB RAM)

### Self-Hosted
- VPS: $5-10/month (DigitalOcean, Linode)
- Database: Managed PostgreSQL from $15/month
- **Total**: ~$20-25/month for full control

## Troubleshooting

### Common Issues

**Issue**: Agents can't connect to API
- **Solution**: Check CORS settings, verify API token

**Issue**: Real-time updates not working
- **Solution**: Verify Redis connection, check Action Cable configuration

**Issue**: Database connection errors
- **Solution**: Check DATABASE_URL, verify PostgreSQL is running

## Recommended Setup for You

### Quick Start (5 minutes)
1. Use hosted https://clawdeck.io
2. Create free account
3. Start using immediately
4. Upgrade to self-hosted later if needed

### Production Setup (30 minutes)
1. Deploy to Railway or Vercel
2. Configure custom domain
3. Set up API tokens for agents
4. Integrate Dmitry via API
5. Start assigning tasks!

---

**Next Steps**: Would you like me to help you deploy ClawDeck and integrate it with Dmitry?
