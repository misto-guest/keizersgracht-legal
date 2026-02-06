# Enhanced Gmail Warmup System

Complete automation system for warming up Gmail accounts using Google services to build trust and reputation.

## 🚀 Features

### Core Warmup Activities
- **Google Docs** - Create documents, add content, formatting, and comments
- **Google Sheets** - Create spreadsheets with data and formulas
- **Google Maps** - Search locations, get directions, save places
- **Google Photos** - Upload photos and create albums
- **Google Alerts** - Set up alerts for news and topics
- **YouTube** - Search, watch, like videos, subscribe to channels
- **Gmail Profile** - Update profile photo, name, birthday
- **VCC Integration** - Add virtual credit card (optional)

### Additional Features
- **Inter-Account Email Warmup** - Send 1-2 emails per day between accounts
- **2FA Setup** - Enable two-factor authentication (manual verification)
- **Account Status Tracking** - Track: new, needs_warmup, warming_up, warmed
- **Web Dashboard** - Visual interface for managing warmup process
- **Randomized Behavior** - Natural delays and activity patterns

## 📋 Prerequisites

1. **AdsPower Browser** - Running and configured with Gmail profiles
2. **Node.js** - v16 or higher
3. **NPM Dependencies** - Install with: `npm install`

## 🔧 Installation

```bash
cd warmup-automation
npm install
```

## 🎯 Quick Start

### 1. Initialize Account Configuration

```bash
node email-warmup.js init
```

This creates `users/accounts.json` with sample account data. Edit this file with your actual accounts:

```json
{
  "accounts": [
    {
      "email": "youraccount@gmail.com",
      "profileId": "k12am9a2",
      "name": "Your Name",
      "status": "new"
    }
  ]
}
```

### 2. Run Enhanced Warmup

```bash
node warmup-enhanced.js k12am9a2
```

This will:
- Launch the AdsPower profile
- Run 5 random Google service activities
- Take screenshots for verification
- Update account status

### 3. Start Dashboard Server

```bash
node dashboard-server.js
```

Visit `http://localhost:3000` to access the web dashboard.

## 📊 Account Statuses

The system tracks 4 account statuses:

| Status | Description |
|--------|-------------|
| **new** | Newly created account, hasn't been warmed up yet |
| **needs_warmup** | Ready for warmup but not yet started |
| **warming_up** | Warmup in progress |
| **warmed** | Successfully completed warmup process |

## 🔥 Usage Examples

### Run Warmup for Specific Profile

```bash
node warmup-enhanced.js k12am9a2
```

### With Profile Data Updates

```bash
node warmup-enhanced.js k12am9a2 --profile.name="John Doe" --profile.birthday="1990-01-01"
```

### With VCC (Virtual Credit Card)

```bash
node warmup-enhanced.js k12am9a2 --vcc.number="4111111111111111" --vcc.expiry="12/25"
```

### Run Daily Email Warmup

```bash
node email-warmup.js run
```

This sends 1-2 emails between your accounts per day with natural delays.

### Setup 2FA (Two-Factor Authentication)

```bash
node 2fa-setup.js k12am9a2 setup
```

This opens the 2FA settings page. You'll need to complete verification manually.

## 🌐 Dashboard API

The dashboard server provides REST API endpoints:

### Accounts

- `GET /api/accounts` - List all accounts with status
- `POST /api/accounts` - Add new account
- `PUT /api/accounts/:email/status` - Update account status

### Warmup

- `POST /api/warmup/start` - Start warmup for an account
- `GET /api/warmup/logs` - Get warmup activity logs

### Stats

- `GET /api/stats` - Dashboard statistics
- `GET /api/adspower/test` - Test AdsPower connection
- `GET /api/adspower/profiles` - List AdsPower profiles

## 📝 Configuration Files

### users/accounts.json
```json
{
  "accounts": [
    {
      "email": "account1@gmail.com",
      "profileId": "k12am9a2",
      "name": "Account One",
      "status": "new"
    }
  ]
}
```

### users/account-status.json
```json
{
  "statuses": {
    "account1@gmail.com": {
      "status": "warmed",
      "lastUpdated": "2026-02-03T20:00:00.000Z",
      "warmupCount": 3
    }
  }
}
```

### users/warmup-logs.json
```json
{
  "logs": [
    {
      "email": "account1@gmail.com",
      "activity": "enhanced_warmup",
      "result": {
        "success": true,
        "completed": 5
      },
      "timestamp": "2026-02-03T20:00:00.000Z"
    }
  ]
}
```

## 🔄 Workflow

### Recommended Warmup Schedule

1. **Day 1-3**: Run warmup once per day (3-5 activities each)
2. **Day 4-7**: Run warmup twice per day with email warmup
3. **Day 8+**: Maintain with occasional warmup + daily emails

### Sample Daily Routine

```bash
# Morning: Run enhanced warmup
node warmup-enhanced.js k12am9a2

# Afternoon: Send inter-account emails
node email-warmup.js run

# Evening: Check dashboard
node dashboard-server.js
# Visit http://localhost:3000
```

## 🎨 Activity Details

### Google Docs
- Creates new document
- Types sample content (project notes, TODOs)
- Applies formatting (bold, lists)
- Adds comments

### Google Sheets
- Creates spreadsheet
- Enters data (product list, quantities)
- Uses formulas (SUM, multiplication)
- Demonstrates spreadsheet usage

### Google Maps
- Searches for locations
- Gets directions between places
- Saves places to favorites
- Natural map exploration

### Google Photos
- Opens photos interface
- Attempts album creation
- Natural photo browsing

### Google Alerts
- Creates alerts for topics
- Mixes tech, business, general news
- Demonstrates information interest

### YouTube
- Searches for varied content
- Watches videos for random duration
- Likes videos
- Subscribes to channels
- Natural viewing patterns

### Gmail Profile
- Updates profile photo (if provided)
- Changes display name (if provided)
- Updates birthday (if provided)
- Fills out account details

### Email Warmup
- Sends 1-2 emails between accounts per day
- Uses natural templates
- Random send times (4+ hours apart)
- Logs all sent emails
- Respects rate limits

## 🔒 Security Features

### 2FA Setup
- Opens Google Account security page
- Guides through 2FA enablement
- Supports SMS, Authenticator apps, Google Prompt
- Requires manual completion (security measure)
- Generates QR code screenshots

### VCC Integration
- Navigate to payments settings
- Add payment method (optional)
- Requires manual verification
- Stores no card data locally

## 📈 Best Practices

### Warmup Gradually
- Don't run all activities in one day
- Mix activity types
- Randomize timing
- Take breaks between sessions

### Natural Behavior
- Vary search terms
- Don't watch entire videos every time
- Mix short and long sessions
- Use different activities each time

### Account Longevity
- Continue occasional warmup even after "warmed" status
- Regular inter-account emails
- Occasional Google service usage
- Maintain login patterns

## 🐛 Troubleshooting

### "Failed to launch profile"
- Ensure AdsPower is running
- Check profile ID is correct
- Verify API key in config

### "Not signed in to Gmail"
- Profile needs to be logged in first
- Open profile manually in AdsPower
- Complete Google login
- Retry warmup

### "Could not find compose button"
- Gmail might have different language
- Adjust selectors for your locale
- Check if Gmail is fully loaded

### Dashboard not loading
- Ensure Express is installed: `npm install express`
- Check port 3000 is not in use
- Verify no firewall blocking

## 📂 File Structure

```
warmup-automation/
├── warmup-enhanced.js       # Main warmup script
├── email-warmup.js           # Inter-account email system
├── 2fa-setup.js              # 2FA configuration
├── dashboard-server.js       # Web dashboard
├── adspower-client.js        # AdsPower API client
├── users/
│   ├── accounts.json         # Account configuration
│   ├── account-status.json   # Status tracking
│   └── warmup-logs.json      # Activity logs
├── screenshots/
│   ├── enhanced-warmup/      # Warmup screenshots
│   └── 2fa-setup/            # 2FA screenshots
└── logs/
    └── sent-emails.json      # Email tracking
```

## 🔮 Advanced Features

### Custom Activity Selection

Edit `CONFIG.activitiesPerSession` in `warmup-enhanced.js`:

```javascript
const CONFIG = {
    activitiesPerSession: 8, // Increase to 8 activities
    minDelayBetweenActions: 5000,  // 5 seconds minimum
    maxDelayBetweenActions: 15000, // 15 seconds maximum
};
```

### Custom Email Templates

Add your templates to `email-warmup.js`:

```javascript
const emailTemplates = [
    {
        subject: 'Your custom subject',
        body: 'Hi {name},\n\nYour custom email body.\n\nBest!'
    }
];
```

### Webhooks & Notifications

Extend `dashboard-server.js` to send notifications when warmup completes.

## 📞 Support

For issues and updates:
- Check logs in `screenshots/` directories
- Review `users/warmup-logs.json`
- Test with AdsPower connection: `node check-adspower-api.js`

## 📄 License

This is a custom warmup automation tool. Use responsibly and in accordance with Google's Terms of Service.

---

**⚠️ Disclaimer**: This tool is for educational purposes and legitimate account warming only. Misuse may violate Google's policies. Always follow best practices and respect platform guidelines.
