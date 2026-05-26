# CutList Scanner PWA

AI-powered handwritten cutlist scanner → Excel exporter for CutRite software.

---

## Files
- `index.html` — The full app (single file)
- `manifest.json` — PWA manifest
- `sw.js` — Service worker (offline support)

---

## HOW TO DEPLOY (Free on Vercel)

### Step 1 — Create GitHub Account
Go to https://github.com and sign up (free)

### Step 2 — Create New Repository
- Click "New repository"
- Name it: `cutlist-scanner`
- Set to Public
- Click "Create repository"

### Step 3 — Upload Files
- Click "uploading an existing file"
- Upload all 3 files: index.html, manifest.json, sw.js
- Click "Commit changes"

### Step 4 — Deploy on Vercel
- Go to https://vercel.com
- Sign up with your GitHub account (free)
- Click "Add New Project"
- Import your `cutlist-scanner` repository
- Click "Deploy"
- Done! You get a URL like: https://cutlist-scanner.vercel.app

### Step 5 — Set API Key
- Open your app URL
- Login as admin (username: admin, password: admin123)
- Go to Admin Panel
- Paste your Claude API key (get it from https://console.anthropic.com)
- Save

---

## DEFAULT LOGIN
- **Username:** admin
- **Password:** admin123
⚠️ Change this password after first login by removing and re-adding the admin user.

---

## HOW TO USE
1. Login with your username & password
2. Tap "Camera" to take photo of cutlist form
3. Tap "SCAN WITH AI"
4. Review extracted data (edit if needed)
5. Tap "DOWNLOAD EXCEL"
6. Transfer Excel file to PC for CutRite

---

## EXCEL OUTPUT COLUMNS
1. Component (row number)
2. Material (board colour)
3. Length
4. Width
5. qty
6. Invoice Number (empty — fill manually)
7. JOB NO (empty — fill manually)
8. Grain (empty — fill manually)
9. edge l
10. edge w
11. holes

---

## INSTALL AS APP ON ANDROID
1. Open Chrome on Android
2. Go to your app URL
3. Tap the 3-dot menu (⋮)
4. Tap "Add to Home screen"
5. Tap "Install"
6. App icon appears on home screen!

---

## ADMIN FEATURES
- Add/remove users (max 8)
- Enable/disable user accounts
- Set Claude API key
- View scan counts per user

---

## COST ESTIMATE
- Hosting: FREE (Vercel)
- ~100 pages/day = ~$10-15/month (Claude API)
