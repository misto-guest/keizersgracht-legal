# 🚀 DEPLOYMENT GUIDE - Amour Melodie Records

## Current Status: ⚠️ Changes Not Deployed Yet

**Live Site URL:** https://amour-melodie-records.vercel.app
**Status:** OLD VERSION (still has podcast section and releases links)

**Updated Code:** Ready locally
**Changes Made:**
- ✅ Removed podcast section
- ✅ Hidden releases navigation
- ✅ Hidden "Latest Releases" button

---

## 🎯 DEPLOYMENT INSTRUCTIONS

### Option 1: Vercel Dashboard (EASIEST - Recommended)

**Step 1: Login to Vercel**
```
https://vercel.com/login
```

Login with your GitHub, GitLab, or email account.

**Step 2: Go to Project**
```
https://vercel.com/bram-1592s-projects/amour-melodie-records
```

**Step 3: Deploy Updates**
Method A - If connected to Git:
- Click "Deployments" tab
- Click "Redeploy" on latest deployment
- Or push to your Git repo (auto-deploy)

Method B - Manual upload:
- Click "Deployments"
- Click "Deploy New"
- Drag and drop your project folder

**Step 4: Verify Deployment**
- Wait for "Ready" status (green checkmark)
- Click the production URL
- Your site is now live with updates!

---

### Option 2: GitHub Integration (Best for Future)

**Connect your GitHub repository:**
1. In Vercel dashboard, click "Add New Project"
2. Select "Import Git Repository"
3. Choose your `amour-melodie-records` repo
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

**Auto-deploy enabled:**
- Every push to `main` branch auto-deploys
- Pull requests get preview URLs
- Zero manual deployment needed

---

### Option 3: Vercel CLI (Command Line)

If you want to deploy from terminal:

```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login
vercel login
# Follow browser authentication

# Navigate to project
cd /Users/northsea/clawd-dmitry/amour-melodie-records

# Deploy to production
vercel deploy --prod

# Output will show:
# > Production: https://amour-melodie-records.vercel.app
```

---

## 📍 Where to Find Your URL

### After Deployment, Your URL Is:
```
https://amour-melodie-records.vercel.app
```

### Alternative Deployment URLs (Previews):
Each deployment gets a unique URL:
```
https://amour-melodie-records-xxxxx.vercel.app
```

The **production URL** always remains the same:
```
https://amour-melodie-records.vercel.app
```

---

## 🔍 How to Check if Deployment Worked

### What Changed:
**BEFORE (Current Live Site):**
- ❌ "Listen Our Podcast On" section visible
- ❌ "Releases" link in navbar
- ❌ "Latest Releases" button on homepage

**AFTER (After Deployment):**
- ✅ NO podcast section
- ✅ NO "Releases" link in navbar
- ✅ NO "Latest Releases" button
- ✅ Only streaming platforms shown (Spotify, Apple Music, etc.)

---

## 📋 Deployment Checklist

Use this checklist to verify deployment:

- [ ] Podcast section removed from homepage
- [ ] "Releases" link gone from desktop navbar
- [ ] "Releases" link gone from mobile menu
- [ ] "Latest Releases" button gone from hero
- [ ] Streaming platforms still visible (Spotify, Apple Music, YouTube Music, SoundCloud, Bandcamp, Tidal)
- [ ] Site loads without errors
- [ ] All navigation links work
- [ ] Mobile responsive still works
- [ ] Footer links functional

---

## 🎯 Quick Test After Deployment

Visit these URLs to verify:

1. **Homepage:** https://amour-melodie-records.vercel.app
   - Check: No podcast section
   - Check: No "Latest Releases" button

2. **About Section:** https://amour-melodie-records.vercel.app/#about
   - Should scroll to about

3. **Artists Section:** https://amour-melodie-records.vercel.app/#artists
   - Should show 5 artist cards

4. **Contact Page:** https://amour-melodie-records.vercel.app/contact
   - Should load contact form

5. **Demo Page:** https://amour-melodie-records.vercel.app/demo
   - Should load demo submission form

---

## 💡 Pro Tips

### Custom Domain:
You can add a custom domain in Vercel:
- Go to: Settings > Domains
- Add: `amourmelodierecords.net`
- Vercel auto-configures SSL/HTTPS

### Environment Variables:
For future backend integration:
- Go to: Settings > Environment Variables
- Add: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- Use in code: `process.env.SPOTIFY_CLIENT_ID`

### Analytics:
- Built-in Vercel Analytics (free tier available)
- Go to: Analytics tab
- See page views, visitors, top pages

---

## 🆘 Troubleshooting

**Deployment failed?**
- Check build logs in Vercel dashboard
- Ensure `package.json` has correct scripts
- Verify Node.js version (should be v18+)

**Site not updating?**
- Clear browser cache (Cmd+Shift+R)
- Check if correct branch deployed
- Verify build succeeded in dashboard

**Broken links?**
- Check navigation components
- Verify file paths in code
- Test in incognito mode

---

## 📞 Need Help?

**Vercel Documentation:** https://vercel.com/docs
**Vercel Status:** https://vercel.com/status
**Vercel Support:** https://vercel.com/support

---

## ✅ Next Steps After Deployment

1. **Test the site** - Use the checklist above
2. **Share the URL** - https://amour-melodie-records.vercel.app
3. **Add real Spotify URLs** - When albums are live
4. **Re-enable Releases** - Uncomment navigation when ready

---

Generated: 2026-02-06
Project: Amour Melodie Records
Status: Ready for Deployment
