# Enhanced Warmup Quick Reference

## 🚀 Essential Commands

### Setup & Initialization
```bash
cd warmup-automation
node setup-enhanced.js          # Initialize everything
```

### Enhanced Warmup (Google Services)
```bash
node warmup-enhanced.js k12am9a2
node warmup-enhanced.js k12am9a2 --profile.name="John" --profile.birthday="1990-01-01"
node warmup-enhanced.js k12am9a2 --vcc.number="4111111111111111" --vcc.expiry="12/25"
```

### Dashboard & Management
```bash
node dashboard-server.js         # Start web dashboard
# Visit http://localhost:3000
```

### Email Warmup (Inter-Account)
```bash
node email-warmup.js init        # Create accounts file
node email-warmup.js run         # Send daily emails
```

### 2FA Setup
```bash
node 2fa-setup.js k12am9a2 setup   # Start 2FA (manual)
node 2fa-setup.js k12am9a2 verify  # Verify 2FA status
```

---

## 📊 Account Statuses

| Status | Description |
|--------|-------------|
| `new` | Newly created, no warmup |
| `needs_warmup` | Ready for warmup |
| `warming_up` | Warmup in progress |
| `warmed` | Successfully warmed |

---

## 🎯 Activities Included

- ✅ Google Docs (create, format, comment)
- ✅ Google Sheets (data, formulas)
- ✅ Google Maps (search, directions, save)
- ✅ Google Photos (upload, albums)
- ✅ Google Alerts (topic monitoring)
- ✅ YouTube (watch, like, subscribe)
- ✅ Gmail Profile (photo, name, birthday)
- ✅ VCC Integration (optional)

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `users/accounts.json` | Account configuration |
| `users/account-status.json` | Status tracking |
| `users/warmup-logs.json` | Activity logs |
| `logs/sent-emails.json` | Email history |
| `ENHANCED_WARMUP_GUIDE.md` | Full documentation |

---

## 🌐 Dashboard API

```
GET  /api/accounts              # List accounts
POST /api/accounts              # Add account
PUT  /api/accounts/:email/status # Update status
POST /api/warmup/start          # Start warmup
GET  /api/warmup/logs           # View logs
GET  /api/stats                 # Statistics
```

---

## 🔄 Recommended Schedule

**Week 1:**
- Day 1-3: 1 warmup/day
- Day 4-7: 2 warmups/day + 1 email

**Week 2:**
- Daily: 2 warmups + 2 emails

**Week 3+:**
- Daily: 1 warmup + 1-2 emails

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Failed to launch profile | Check AdsPower is running |
| Not signed in to Gmail | Login manually in AdsPower first |
| Dashboard not loading | Ensure Express is installed |
| Can't find compose button | Check Gmail language settings |

---

## 📞 Quick Test

```bash
# Test AdsPower connection
node check-adspower-api.js

# Run single warmup
node warmup-enhanced.js k12am9a2

# Check status
node dashboard-server.js
# http://localhost:3000
```

---

**Full Guide:** `ENHANCED_WARMUP_GUIDE.md`  
**Summary:** `IMPLEMENTATION_SUMMARY.md`
