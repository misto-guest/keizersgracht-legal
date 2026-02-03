# ⚡ Quick Start Guide

## Setup in 3 Steps

### 1. Install Dependencies
```bash
cd warmup-automation
npm install
```

### 2. Create Default Users
```bash
npm run create-admin
```
Creates: Admin, Test User, Performance

### 3. Start Server
```bash
npm run server
```
Open: http://localhost:3000/admin

## 🎯 Common Tasks

### Create a New User
1. Click "➕ Create User" button
2. Fill in name and description
3. Choose behavioral preset (Conservative/Moderate/Aggressive)
4. Set schedule if desired
5. Click "Save User"

### Run Warmup Now
1. Find user in list
2. Click "▶️ Run Now" button
3. Watch status change to "Running"

### Schedule Daily Run
1. Edit user (✏️ Edit button)
2. Enable "Enable Scheduling"
3. Enter cron: `0 9 * * *` (daily at 9 AM)
4. Save user

### View Logs
1. Click "👁️ View Details" on user
2. See recent runs with timestamps and status

## 🚀 Production Deployment

### Environment Variables
```bash
PORT=3000
TZ=America/New_York  # Set your timezone
```

### Run with PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server/index.js --name warmup-automation
pm2 save
pm2 startup
```

### Check Logs
```bash
pm2 logs warmup-automation
```

### Stop/Restart
```bash
pm2 stop warmup-automation
pm2 restart warmup-automation
```

## 🔧 API Usage

### Create User via API
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My User",
    "description": "Test user",
    "enabled": true,
    "config": {...},
    "schedule": {"enabled": false}
  }'
```

### Trigger Run via API
```bash
curl -X POST http://localhost:3000/api/users/{userId}/run
```

### Get User Logs
```bash
curl http://localhost:3000/api/users/{userId}/logs?limit=50
```

## 📊 System Stats

View real-time stats:
```bash
curl http://localhost:3000/api/info
```

## 🐛 Quick Fixes

### Port Already in Use
```bash
# Use different port
PORT=3001 npm run server
```

### Reset Everything
```bash
rm -rf users/*.json
rm -rf logs/*.jsonl
npm run create-admin
```

### Check Chrome Installation
```bash
npx puppeteer browsers install chrome
```

## 💡 Tips

1. **Start with Moderate preset** - Good balance
2. **Use headless mode** - Better performance
3. **Stagger schedules** - Don't run all users at same time
4. **Monitor logs** - Check for errors regularly
5. **Keep Chrome updated** - `npx puppeteer browsers install chrome`

## 📱 Mobile Access

Server is mobile-friendly! Access from your phone:
1. Ensure phone and computer are on same network
2. Find your computer's IP: `ifconfig` (Mac) or `ipconfig` (Windows)
3. Open: `http://YOUR_IP:3000/admin`

## 🎉 Done!

You're ready to automate. Visit the admin panel and start creating users!

Need help? Check the full [README.md](README.md) for detailed documentation.
