# Pen Corner — Website, Admin Backend & Android App

## 1. Launch as a Website (with Backend Server)
```bash
npm install
ADMIN_USER=admin ADMIN_PIN=1234 npm start
```
Open `http://localhost:3000` (or deploy to Render, Railway, or any Node.js host).
- **Admin Login**: Click **Admin Login** in the top bar (default: `admin` / `1234`).
- **Item-wise & Bulk Edits**: Edit names, MRPs, wholesale prices, and stock inline, or select multiple items to apply bulk stock, discount %, MRP adjustment, category move, or delete.

## 2. Build as an Android App (.APK)
### Option A: Native Android APK via Capacitor
1. Install Android Studio on your PC.
2. Run:
   ```bash
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate your installable `.apk`.

### Option B: Instant Install via Chrome (PWA)
Once hosted on an HTTPS domain, open the website in Chrome on Android and tap **Add to Home screen** / **Install App**.
