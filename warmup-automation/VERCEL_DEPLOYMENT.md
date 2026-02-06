# Vercel Deployment Guide

## 🚀 Deploy Dashboard to Vercel

This guide walks you through deploying the Gmail Warmup Dashboard to Vercel.

---

## 📋 Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **Vercel CLI** - Install globally:
   ```bash
   npm install -g vercel
   ```
3. **GitHub Repository** (optional) - For automatic deployments

---

## 🔧 Configuration Files Created

### 1. `vercel.json`
Configures how Vercel builds and routes your application.

### 2. `api/index.js`
Serverless API endpoint for all dashboard routes.

### 3. `public/index.html`
Static HTML dashboard served by Vercel.

### 4. `.vercelignore`
Files to exclude from deployment.

---

## 🚀 Deployment Steps

### Option 1: Deploy via CLI (Recommended)

```bash
cd /Users/northsea/clawd-dmitry/warmup-automation

# Login to Vercel (first time only)
vercel login

# Deploy to production
npm run deploy

# Or deploy to preview URL
npm run deploy:dev
```

### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your repository
3. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./warmup-automation`
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)
4. Click **Deploy**

### Option 3: Link GitHub Repository

1. Push code to GitHub
2. Import in Vercel
3. Automatic deployments on push

---

## 🌐 Accessing Your Dashboard

After deployment, Vercel will provide a URL like:
```
https://your-project-name.vercel.app
```

Your dashboard will be available at:
```
https://your-project-name.vercel.app/
```

API endpoints:
```
https://your-project-name.vercel.app/api/accounts
https://your-project-name.vercel.app/api/stats
etc.
```

---

## ⚙️ Environment Variables (Optional)

If you need to configure environment variables:

### Via CLI
```bash
vercel env add API_KEY
vercel env add PORT
```

### Via Vercel Dashboard
1. Go to your project
2. Settings → Environment Variables
3. Add variables

---

## 📊 Deployment Status

Check deployment status:
```bash
# View deployment logs
vercel logs

# List deployments
vercel list

# Inspect production
vercel inspect
```

---

## 🔄 Continuous Deployment

### Automatic Updates

If you've linked a GitHub repository:

1. Make changes to code
2. Commit and push to main branch
3. Vercel auto-deploys

### Manual Redeploy

```bash
# Force redeploy
vercel --force
```

---

## 🐛 Troubleshooting

### Build Errors

**Error:** Cannot find module
```bash
# Install dependencies locally
npm install
```

**Error:** Port already in use
```bash
# Vercel handles ports automatically
# Remove PORT from code if hardcoded
```

### Runtime Errors

**Error:** API not responding
- Check `api/index.js` exists
- Verify exports: `module.exports = app`

**Error:** File system access
- Vercel serverless functions are read-only
- Use `/tmp` for temporary files
- Or use external storage (Vercel Blob, AWS S3)

### Dashboard Not Loading

**Check:**
1. `public/index.html` exists
2. API base URL is correct in HTML
3. Browser console for errors

---

## 🔒 Security Considerations

### Current Limitations

The dashboard uses file-based storage (`users/*.json`), which has limitations on Vercel:

- **Read-only** in serverless functions
- **No persistence** across deployments
- **Not scalable** across multiple instances

### Recommended Solutions

1. **Vercel Postgres** - Database for persistent storage
2. **Vercel KV** - Key-value storage
3. **External API** - Run dashboard separately, use Vercel for frontend

---

## 📈 Monitoring

### Vercel Analytics

- Visit your project dashboard
- View analytics, logs, performance
- Monitor API response times

### Set Up Alerts

1. Go to project Settings
2. Notifications
3. Configure webhook/email alerts

---

## 🎯 Post-Deployment Checklist

- [ ] Dashboard loads at deployed URL
- [ ] Can view accounts
- [ ] Can add new accounts
- [ ] Can start warmup (if local AdsPower accessible)
- [ ] Stats are visible
- [ ] Logs are accessible
- [ ] No console errors

---

## 🚨 Important Notes

### File Storage

The current implementation uses local JSON files. On Vercel:

✅ **Works:** Reading files (`users/*.json`)
❌ **Doesn't work:** Writing files (serverless is read-only)

### Workarounds

1. **Run Dashboard Locally**
   - Keep dashboard on local server
   - Use Vercel only for static frontend
   - CORS needed for API access

2. **Use External Database**
   - Migrate to Vercel Postgres
   - Update API to use database
   - Better for production

3. **Hybrid Approach**
   - Deploy frontend to Vercel
   - Run API server locally
   - Connect via webhook

---

## 🎉 Next Steps

### For Full Vercel Deployment

1. **Add Database** (Vercel Postgres or Supabase)
2. **Update API** to use database instead of JSON files
3. **Environment Variables** for sensitive data
4. **Custom Domain** in Vercel settings
5. **Monitoring** and alerts

### For Development

1. **Keep local** for now ( AdsPower integration requires local)
2. **Use Vercel** for staging/demo
3. **Monitor** Vercel logs for issues

---

## 💡 Quick Reference

```bash
# Deploy
npm run deploy

# View logs
npm run logs

# Local development
npm run dev

# Remove deployment
vercel remove
```

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel CLI:** https://vercel.com/docs/cli
- **Deployment Issues:** Check Vercel dashboard logs

---

**Status:** ✅ Ready for deployment
**Recommended:** Deploy for demo/staging, keep API local for production
