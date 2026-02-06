# 📋 ADSPOWER CONTROL STRATEGY - Default Method

## Decision Document: Fastest, Lightest AdsPower Control

**Date:** 2026-02-06
**Decision:** AdsPower Local API (HTTP REST API)
**Reasoning:** Fastest, lightest, most efficient method

---

## 🎯 DEFAULT CONTROL METHOD

### **Primary: AdsPower Local API**

**Method:** Direct HTTP REST API calls to `http://127.0.0.1:50325`

**Why This Method:**
- ✅ Fastest - No browser overhead
- ✅ Lightest - Minimal resource usage
- ✅ Direct - Native AdsPower integration
- ✅ Efficient - Batch operations supported
- ✅ Reliable - Official API, maintained
- ✅ Scalable - Can manage 100+ profiles

**When to Use:**
- Profile management (create, delete, update)
- Opening/closing profiles
- Configuring proxies
- Reading profile information
- Batch operations
- Profile automation

---

## 🔧 API ENDPOINTS

### Base URL: `http://127.0.0.1:50325/api/v1`

### Profile Management:

**List All Profiles**
```bash
GET /user/list
curl http://127.0.0.1:50325/api/v1/user/list
```

**Open Profile**
```bash
POST /user/open
Body: {"user_id": "profile_id"}
curl -X POST http://127.0.0.1:50325/api/v1/user/open \
  -H "Content-Type: application/json" \
  -d '{"user_id": "profile_id"}'
```

**Close Profile**
```bash
POST /user/close
Body: {"user_id": "profile_id"}
curl -X POST http://127.0.0.1:50325/api/v1/user/close \
  -H "Content-Type: application/json" \
  -d '{"user_id": "profile_id"}'
```

**Create Profile**
```bash
POST /user/create
Body: {
  "group_id": "group_id",
  "name": "Profile Name",
  "fingerprint_config": {...},
  "proxy_config": {...}
}
```

**Delete Profile**
```bash
POST /user/delete
Body: {"user_id": "profile_id"}
```

**Update Profile**
```bash
POST /user/update
Body: {
  "user_id": "profile_id",
  "name": "New Name",
  "proxy_config": {...}
}
```

### Profile Information:

**Get Profile Details**
```bash
GET /user/detail?user_id=profile_id
```

**Check Profile Status**
```bash
GET /user/status?user_id=profile_id
```

---

## 🎮 FALLBACK CONTROL METHODS

### **Secondary: Clawdbot Browser Tool**

**When to Use:**
- Taking screenshots of profiles
- Interacting with web pages
- Filling forms, clicking buttons
- Extracting data from pages
- JavaScript execution in pages

**Method:** Use browser tool with profile's remote debugging port

**Integration:**
1. Open profile via AdsPower API
2. Get profile's debugging port
3. Connect via browser tool
4. Perform automation
5. Close profile via API

---

### **Tertiary: Direct Browser Automation**

**When to Use:**
- Complex multi-step workflows
- Advanced scraping operations
- Custom automation scripts
- When browser tool features insufficient

**Method:** Puppeteer/Playwright with profile connection

**Integration:**
1. Use AdsPower API to get profile info
2. Connect Puppeteer to profile's Chrome instance
3. Full browser automation
4. Close via API

---

## 📊 PERFORMANCE COMPARISON

| Method | Speed | Resources | Complexity | Scalability |
|--------|-------|-----------|------------|-------------|
| AdsPower API | ⚡ Fastest | 💚 Lightest | ✅ Simple | ✅ 100+ profiles |
| Browser Tool | ⚡ Fast | 💚 Light | ✅ Simple | ✅ 50+ profiles |
| Puppeteer | 🟡 Medium | 🟡 Medium | ⚠️ Moderate | ✅ 30+ profiles |
| Selenium | 🐢 Slow | 🔴 Heavy | ⚠️ Complex | ⚠️ 20+ profiles |

---

## 🚀 DEFAULT WORKFLOW

### **Standard Profile Operation:**

```
1. List profiles → API: GET /user/list
2. Open profile → API: POST /user/open
3. Get info → API: GET /user/detail
4. (Optional) Automate → Browser tool
5. Close profile → API: POST /user/close
```

### **Batch Profile Operation:**

```
1. List profiles → API: GET /user/list
2. Filter/select profiles → Logic
3. Batch open → API: POST /user/open (x10-20)
4. Batch automate → Browser tool (parallel)
5. Batch close → API: POST /user/close (x10-20)
```

---

## 🎯 BEST PRACTICES

### **For Speed:**
- Use AdsPower API for all profile management
- Batch API calls when possible
- Use parallel requests (10-20 concurrent)
- Cache profile lists locally
- Reuse open profiles when possible

### **For Resources:**
- Close profiles immediately after use
- Don't keep more than 25 profiles open simultaneously
- Use lightweight fingerprint configs
- Disable unnecessary browser features
- Monitor memory usage

### **For Stability:**
- Add error handling for API failures
- Implement retry logic (3 attempts)
- Use exponential backoff
- Monitor API response times
- Fallback to secondary methods if needed

---

## 🔧 EXECUTION RULES

### **Always Use AdsPower API For:**
- ✅ Opening profiles
- ✅ Closing profiles
- ✅ Listing profiles
- ✅ Creating profiles
- ✅ Deleting profiles
- ✅ Updating profiles
- ✅ Getting profile info

### **Use Browser Tool For:**
- ✅ Screenshots
- ✅ Page interaction
- ✅ Form filling
- ✅ Data extraction
- ✅ JavaScript execution

### **Never Use (Unless Necessary):**
- ❌ Selenium (too heavy)
- ❌ Manual control (too slow)
- ❌ Third-party tools (unreliable)

---

## 📝 COMMAND PATTERNS

### **Quick Profile Check:**
```bash
# List profiles
curl -s http://127.0.0.1:50325/api/v1/user/list | jq '.data[] | .user_id, .name'

# Check specific profile
curl -s "http://127.0.0.1:50325/api/v1/user/detail?user_id=PROFILE_ID"
```

### **Batch Operation:**
```bash
# Open 10 profiles at once
for i in {1..10}; do
  curl -X POST http://127.0.0.1:50325/api/v1/user/open \
    -H "Content-Type: application/json" \
    -d "{\"user_id\": \"profile_$i\"}" &
done
wait
```

---

## 🎯 OPTIMIZATION STRATEGY

### **Maximum Efficiency:**

1. **Profile Management** → AdsPower API only
2. **Web Automation** → Browser tool (10-15 concurrent)
3. **Data Extraction** → API + Browser tool hybrid
4. **Batch Operations** → Parallel API calls
5. **Resource Management** → Close profiles promptly

### **Recommended Limits:**
- **API calls:** 100+ per minute (rate limit permitting)
- **Open profiles:** 25-50 simultaneously
- **Browser automation:** 10-15 concurrent
- **Batch operations:** 15-20 profiles per batch

---

## 🔐 SECURITY NOTES

- API runs on localhost (127.0.0.1) - no external access
- No authentication required (local only)
- Profile data stored locally by AdsPower
- Proxy configuration per profile
- Isolated browser contexts

---

## 📋 IMPLEMENTATION PRIORITY

1. ✅ **AdsPower API** - Primary control method
2. ✅ **Browser Tool** - Secondary for page interaction
3. ✅ **Error Handling** - Retry logic and fallbacks
4. ✅ **Monitoring** - Resource usage tracking
5. ⚠️ **Puppeteer** - Tertiary for complex cases

---

## 🎯 SUCCESS METRICS

- ✅ Profile operations in <1 second
- ✅ Can manage 50+ profiles simultaneously
- ✅ Minimal CPU/RAM usage
- ✅ No profile leaks (all closed properly)
- ✅ Reliable error handling
- ✅ Fast batch operations

---

## 📞 INTEGRATION WITH OTHER TOOLS

### **With 2FA/SMS Services:**
- Open profile via API
- Navigate to verification page
- Trigger SMS service
- Enter code via browser tool
- Close profile

### **With Proxy Rotators:**
- Update proxy config via API
- Open profile
- Verify proxy connection
- Close profile
- Rotate to next

### **With CapSolver:**
- Open profile via API
- Navigate to captcha page
- Trigger CapSolver
- Wait for solution
- Submit via browser tool
- Close profile

---

## ✅ FINAL DECISION

**DEFAULT CONTROL METHOD:** AdsPower Local API (HTTP REST)
**FALLBACK:** Clawdbot Browser Tool
**LAST RESORT:** Puppeteer (rarely needed)

**This configuration provides:**
- ⚡ Fastest performance
- 💚 Lowest resource usage
- ✅ Best scalability
- 🔧 Most reliable
- 🎯 Optimal for 50+ profiles

---

**Document Version:** 1.0
**Last Updated:** 2026-02-06
**Status:** Active - Default Strategy
