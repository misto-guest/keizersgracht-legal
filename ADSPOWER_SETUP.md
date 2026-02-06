# AdsPower Setup & Learnings

**Last Updated:** 2026-02-03
**Account:** rebel@ri.eu / contact@rebelinternet.eu
**API Key:** 746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329
**API URL:** http://127.0.0.1:50325

---

## Account Overview

- **Status:** Active
- **Expiration:** 2026-08-15
- **Total Profiles:** 200 (at capacity)
- **Team Members:** 5 (at capacity)
- **Role:** Manager
- **Software:** AdsPower Browser v7.12.29 | 2.8.2.8

---

## Profile Access

### API Access Limitations

The API returns **100 profiles per page**. With 200 total profiles:
- Page 1: Profiles 1-100 (newest first)
- Page 2: Profiles 101-200 (oldest profiles)

**Key Finding:** The `/user/info` endpoint does **NOT work** for individual profiles (returns "Not Found"). Only the `/user/list` endpoint works reliably.

### Profile Distribution (Page 1)

**Groups Observed:**
- Group 0 (Default): Majority of profiles
- Group 7473129: ~15 profiles
- Group 4585199: ~5 profiles
- Group 4079086: ~2 profiles

### First 5 Profiles (Newest)

| Rank | Profile ID | Group | Notes |
|------|------------|-------|-------|
| 1 | k12am9a2 | 0 | **Most recently created** - Successfully warmed up with patmcgee727@gmail.com |
| 2 | k101ewnc | 0 | |
| 3 | kyu4kag | 0 | |
| 4 | ky03ri3 | 0 | |
| 5 | kxictl6 | 7473129 | |

### Oldest Profile

| Rank | Profile ID | Group |
|------|------------|-------|
| 100 | jgfdt99 | 0 | Oldest accessible profile (Page 1) |

---

## Profile ID Patterns

**Observed Pattern:** Profiles appear to be sorted by creation date (newest first)

- **Newest profiles** (ranks 1-50): Start with `k` prefix
  - Examples: k12am9a2, k101ewnc, kyu4kag, ky03ri3, kxictl6

- **Middle profiles** (ranks 50-95): Mixed `k` and `j` prefixes
  - Transition from k to j occurs around rank 65-75

- **Oldest profiles** (ranks 96-100): Start with `j` prefix
  - Examples: jgv86bk, jgfeecg, jgfdt99

---

## Warmup Configuration

### Working Profile: k12am9a2

**Profile Details:**
- **Profile ID:** k12am9a2
- **Profile Number:** 287 (in AdsPower UI)
- **Email:** patmcgee727@gmail.com
- **IP:** 178.230.42.159 (Netherlands)
- **Type:** Mobile 8086
- **Remark:** NL | Mobile 8086

### Warmup Script

**Location:** `/Users/northsea/clawd-dmitry/warmup-automation/warmup-profile-1.js`

**Features:**
- ✅ Launches profile via AdsPower API
- ✅ Connects Puppeteer with 5-second delay (for browser loading)
- ✅ Automatic cookie consent acceptance (multiple selectors including Dutch)
- ✅ Visits 4 sites: Gmail, Google, nu.nl, tweakers.net
- ✅ Takes screenshots after each activity
- ✅ Keeps browser open for manual inspection

**Screenshots Location:** `/Users/northsea/clawd-dmitry/screenshots/profile-1-warmup/`

### Cookie Consent Handling

The script attempts multiple cookie consent selectors:
- English: "Accept", "Accept all", "Accept cookies"
- Dutch: "Akkoord", "Accepteer", "Ik ga akkoord"
- ARIA labels, button attributes, and common class names

---

## Scripts Available

| Script | Purpose | Location |
|--------|---------|----------|
| `warmup-profile-1.js` | Main warmup with cookie acceptance | warmup-automation/ |
| `check-gmail.js` | Check logged-in Gmail account | warmup-automation/ |
| `check-profiles.js` | List all accessible profiles | warmup-automation/ |
| `find-oldest-profile.js` | Find oldest profile | warmup-automation/ |
| `open-profile-manual.js` | Open profile without Puppeteer | warmup-automation/ |
| `adspower-client.js` | API client wrapper | warmup-automation/ |

---

## API Endpoints

### Working Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/user/list` | GET | List profiles (paginated) |
| `/api/v1/browser/start?user_id={id}` | GET | Launch profile browser |
| `/api/v1/browser/close` | POST | Close profile browser |
| `/status` | GET | Test API connection |

### Non-Working Endpoints

| Endpoint | Issue |
|----------|-------|
| `/api/v1/user/info` (POST) | Returns "Not Found" for all profiles |
| `/api/v1/user/group` | Returns "Not Found" |

---

## Technical Learnings

### Puppeteer Connection Issues

**Problem:** Initial connection attempts to AdsPower browsers timed out or failed.

**Solution:**
1. Added 5-second delay after profile launch before Puppeteer connection
2. Used correct WebSocket URL from API response: `result.ws.puppeteer`
3. Set `defaultViewport: null` to use browser's default viewport

### Deprecated waitForTimeout

**Problem:** `page.waitForTimeout()` was removed in Puppeteer v23+

**Solution:** Created helper function:
```javascript
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

### Profile ID Confusion

**Issue:** UI showed profiles (`j5klfkv`, `j5klp3m`) that weren't accessible via API.

**Resolution:** Confirmed that:
- API only returns 100 profiles (likely newest)
- Some profiles in UI may be in different groups or have restricted access
- Profile `k12am9a2` (most recent) is the correct one to use for warmup

---

## Commands Reference

```bash
# Run warmup on Profile 1 (k12am9a2)
cd /Users/northsea/clawd-dmitry/warmup-automation
node warmup-profile-1.js

# List all accessible profiles
node check-profiles.js

# Find oldest profile
node find-oldest-profile.js

# Open profile manually (no Puppeteer)
node open-profile-manual.js
```

---

## Next Steps

- [ ] Implement pagination to access profiles 101-200
- [ ] Create batch warmup script for multiple profiles
- [ ] Set up automated scheduling via cron jobs
- [ ] Test warmup on profiles in different groups
- [ ] Document group IDs and their purposes

---

## Troubleshooting

**Profile won't launch:**
- Ensure AdsPower application is running
- Check API is enabled in Settings → API & MCP
- Verify profile ID is correct

**Puppeteer connection fails:**
- Increase delay after profile launch (currently 5 seconds)
- Check if browser window is visible in AdsPower UI
- Verify WebSocket URL is returned in API response

**Cookie consent not accepted:**
- Site may use custom cookie banner
- Add new selectors to cookie consent handler
- Manually inspect the site's cookie banner HTML

---

## Contact & Support

**AdsPower Documentation:** https://adspower-ltd.notion.site/AdsPower-API-Documentation-For-beginner-6c8ca7b0fc2942b9b2ac3e0b3bc9c399

**Account Email:** contact@rebelinternet.eu
