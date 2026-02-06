# 🔐 Vercel Login Instructions & Credentials

## Project Information

**Project Name:** amour-melodie-records
**Project ID:** prj_DaAsOCBMJmcHvdglPwdXnGq1pWFg
**Organization ID:** team_pbMgt0e5umfNrCDKaNNRW1FE
**Organization:** bram-1592s-projects
**Production URL:** https://amour-melodie-records.vercel.app

---

## 🌐 How to Login to Vercel

### Option 1: Web Dashboard (Recommended)

1. **Go to:** https://vercel.com/login
2. **Login with:**
   - GitHub
   - GitLab
   - Bitbucket
   - Email (SAML SSO)

3. **Direct Project Link:**
   ```
   https://vercel.com/bram-1592s-projects/amour-melodie-records
   ```

4. **Access your project dashboard:**
   - View deployments
   - Manage environment variables
   - Configure domains
   - View analytics
   - Manage team members

---

### Option 2: CLI Deployment

If you want to deploy from your terminal:

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Navigate to project:**
   ```bash
   cd /Users/northsea/clawd-dmitry/amour-melodie-records
   ```

4. **Deploy to production:**
   ```bash
   vercel deploy --prod
   ```

---

## 📋 What Changed in This Update

### ✅ Removed (Hidden) Features:
1. **Podcast section** - Completely removed from homepage
2. **Releases navigation** - Hidden in navbar (desktop + mobile)
3. **"Latest Releases" CTA button** - Hidden in hero section

### 🔧 Files Modified:
- `/components/Platforms.tsx` - Removed podcast section
- `/components/Navbar.tsx` - Commented out Releases links
- `/components/Hero.tsx` - Commented out Latest Releases button

### ⏳ Future Re-activation:
When you have albums live, you can:
1. Uncomment the Releases links in `Navbar.tsx`
2. Uncomment the Latest Releases button in `Hero.tsx`
3. Add real Spotify URLs to platform links
4. Update releases page with real album artwork

---

## 🎯 Next Steps

1. **Login to Vercel** using the web dashboard
2. **Review changes** in the code (if needed)
3. **Deploy the updated site** using the web deploy button or CLI
4. **Add real Spotify URLs** when albums are live
5. **Uncomment Releases navigation** when ready to show albums

---

## 📧 Vercel Support

- Help Center: https://vercel.com/support
- Documentation: https://vercel.com/docs
- Status Page: https://vercel.com/status

---

## ⚠️ Important Notes

- The releases page (`/releases`) still exists but is hidden from navigation
- Direct access to `/releases` will still show the placeholder releases
- When you have real albums, you can either:
  - Update the existing releases data with real info
  - Delete the placeholder releases and add real ones
  - Or we can rebuild the releases page with your actual data

---

Generated: 2026-02-06
Project: Amour Melodie Records
