# Unified Browser API Integration

This warmup automation supports **two browser APIs**:

1. **Adspower** (remote server: 77.42.21.134:50325)
2. **Unified Remote Browser API** (server: http://95.217.224.154:3000)

## Setup

### 1. Adspower Configuration

The Adspower integration is pre-configured with the remote server:

```bash
# Optional: Set custom API key
export ADSPOWER_API_KEY=your_api_key
export ADSPOWER_BASE_URL=http://77.42.21.134:50325

# Test Adspower connection
node test-unified.js adspower
```

### 2. Remote Browser API Configuration

**Required**: Get API key from 1Password (item name: "Rebel Cloud Browser api")

```bash
# Set API key from 1Password
export REMOTE_BROWSER_API_KEY=your_rebel_cloud_api_key
export REMOTE_BROWSER_BASE_URL=http://95.217.224.154:3000

# Test Remote connection
node test-unified.js remote
```

### Getting the API Key from 1Password

The API key is stored in 1Password under:
- **Item name**: "Rebel Cloud Browser api"
- **Vault**: Default (or personal)

To retrieve:
```bash
# If 1Password CLI is configured
op item get "Rebel Cloud Browser api" --format json
```

## Usage

### Test Both APIs

```bash
# Test Adspower
node test-unified.js adspower

# Test Remote Browser
node test-unified.js remote
```

### Run Warmup

```bash
# Using Adspower
node warmup-unified.js <profileId> adspower

# Using Remote Browser
node warmup-unified.js <profileId> remote
```

### Examples

```bash
# Warmup with Adspower (profile: k12am9a2)
node warmup-unified.js k12am9a2 adspower

# Warmup with Remote Browser
node warmup-unified.js my-profile-id remote
```

## Configuration Files

| File | Description |
|------|-------------|
| `config-remote.json` | Legacy Adspower config |
| `config-unified.json` | Unified config (both APIs) |

## Per-Profile Browser Type

To use different browser APIs for different Gmail profiles, you can:

1. **Environment variables**: Set before running
2. **Code modification**: Update `warmup-unified.js` to read from profile config

### Example: Using Adspower for some profiles, Remote for others

```javascript
// In your profile configuration
const profiles = [
  { id: 'profile1', browserType: 'adspower' },
  { id: 'profile2', browserType: 'remote' },
  // ...
];

// Run warmup for each
for (const profile of profiles) {
  await runWarmup(profile.id, profile.browserType);
}
```

## API Reference

### Adspower API Endpoints

- `GET /api/v2/status` - Test connection
- `GET /api/v2/user/list` - List profiles
- `GET /api/v2/browser/start?user_id=XXX` - Start browser
- `POST /api/v2/browser/close` - Stop browser
- `POST /api/v2/browser/is-active` - Check status
- `POST /api/v2/browser/cookies` - Get cookies

### Remote Browser API Endpoints

- `GET /status?x_api_key=XXX` - Test connection
- `GET /browsers?x_api_key=XXX` - List browsers
- `POST /browsers/start?x_api_key=XXX` - Start browser
- `POST /browsers/stop?x_api_key=XXX` - Stop browser

## Troubleshooting

### Connection Timeout

If you get "Connection timeout":
1. Check firewall rules allow outbound connections
2. Verify server is running
3. Test with: `curl -m 10 http://server:port/status`

### Unauthorized (Remote API)

If you get "Unauthorized":
1. Verify API key is correct
2. Check 1Password for current key
3. Ensure `REMOTE_BROWSER_API_KEY` is set correctly

### Profile Not Found

1. Verify profile exists in Adspower dashboard
2. Check profile ID is correct
3. Ensure profile is not already running

## Scaling for 100+ Profiles

The system supports 100+ profiles:

1. **Queue-based processing**: Process profiles sequentially or in batches
2. **Concurrent limit**: Configure `maxConcurrent` in config
3. **Proper cleanup**: Each profile is stopped after use
4. **Memory management**: Pages closed before browser disconnect

### Batch Processing Example

```javascript
const profiles = ['id1', 'id2', 'id3', /* ... 100+ */];

for (const profileId of profiles) {
  console.log(`Processing ${profileId}...`);
  await runWarmup(profileId, 'adspower');
  
  // Optional: Add delay between profiles
  await setTimeout(5000);
}
```
