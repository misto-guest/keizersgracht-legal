# ClawDeck Deployment Guide

## Current Status

✅ **ClawDeck is RUNNING** (since 2026-02-06 10:49)
- **Process ID:** 68922
- **Local URL:** http://127.0.0.1:3000
- **Network URL:** http://192.168.1.159:3000

## Access Options

### 1. Local Network Access ✅ (Available Now)

**From your Mac mini:**
```
http://localhost:3000
or
http://127.0.0.1:3000
```

**From other devices on your local network:**
```
http://192.168.1.159:3000
```

This works for any device connected to your home WiFi.

### 2. Public Access Options

#### Option A: ngrok (Quickest, but requires signup)

**Requires:** Free ngrok account
**URL:** https://dashboard.ngrok.com/signup

After signup:
```bash
ngrok config add-authtoken YOUR_TOKEN
ngrok http 3000
```

**Pros:** Free, easy HTTPS URL
**Cons:** URL changes on restart, requires account

#### Option B: Cloudflare Tunnel (Free, permanent)

**Install:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Setup:**
```bash
cloudflared tunnel login
cloudflared tunnel create clawdeck
cloudflared tunnel route dns clawdeck your-domain.com
cloudflared tunnel run clawdeck
```

**Pros:** Free, permanent URL, HTTPS included
**Cons:** Requires domain name or Cloudflare subdomain

#### Option C: Port Forwarding (Permanent, DIY)

1. **Set up nginx reverse proxy:**
```bash
brew install nginx
```

2. **Configure nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Forward port 80 on your router** to your Mac mini (192.168.1.159)

4. **Get a free domain** from DuckDNS or similar

**Pros:** Full control, permanent URL
**Cons:** Requires router config, domain setup

#### Option D: SSH Tunnel (Secure, temporary)

From remote machine:
```bash
ssh -L 3000:localhost:3000 user@192.168.1.159
```

Then access: http://localhost:3000 on remote machine

**Pros:** Secure, no signup needed
**Cons:** Requires SSH access, not permanent

## Quick Start: Local Network Access

1. **On your Mac mini:** Open http://localhost:3000
2. **On your phone/tablet (same WiFi):** Open http://192.168.1.159:3000
3. **Sign up** with email/password
4. **Create your first board** and start adding tasks!

## Server Management

### Check if server is running:
```bash
ps aux | grep "rails server"
```

### Stop the server:
```bash
kill 68922
```

### Restart the server:
```bash
cd /Users/northsea/clawdeck
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
nohup bundle exec rails server -p 3000 > /tmp/clawdeck.log 2>&1 &
```

### View logs:
```bash
tail -f /tmp/clawdeck.log
```

## Firewall Settings (macOS)

If you can't access from other devices:

```bash
# Allow port 3000 through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /opt/homebrew/opt/ruby@3.3/bin/ruby
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /opt/homebrew/opt/ruby@3.3/bin/ruby
```

Or go to:
**System Settings → Network → Firewall** → Allow Ruby

## Make Server Auto-Start on Boot

Create a LaunchAgent:

```bash
nano ~/Library/LaunchAgents/com.clawdeck.server.plist
```

Contents:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clawdeck.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/opt/ruby@3.3/bin/ruby</string>
        <string>/Users/northsea/clawdeck/bin/rails</string>
        <string>server</string>
        <string>-p</string>
        <string>3000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/northsea/clawdeck</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/clawdeck.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/clawdeck.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.clawdeck.server.plist
```

## Recommendation

**For immediate use:** Use local network access (http://192.168.1.159:3000)

**For public access:** Set up Cloudflare Tunnel (free, permanent URL)

**For production:** Configure nginx + SSL + domain name

---

**Status:** ✅ Live on local network
**Public Deployment:** Choose one of the options above
