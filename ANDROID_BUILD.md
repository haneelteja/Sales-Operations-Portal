# Android Build Guide — Aamodha Operations Portal

This document covers everything needed to build, test, and distribute the
Aamodha Operations Portal as a native Android app using **Capacitor**.

---

## Architecture Overview

```
React 18 + Vite  →  npm run build  →  dist/
                                          ↓
                               npx cap sync android
                                          ↓
                          android/app/src/main/assets/public/
                                          ↓
                    Capacitor WebView (native Android shell)
                                          ↓
                          APK / AAB via Gradle / Android Studio
```

Capacitor wraps the compiled web app in a full native Android shell.
All existing React code, Supabase queries, and UI components work unchanged.

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 LTS | https://nodejs.org |
| Android Studio | Ladybug 2024.2+ | https://developer.android.com/studio |
| Android SDK | API 24 – 35 | via Android Studio SDK Manager |
| Java (JDK) | 17 | bundled with Android Studio |
| Gradle | 8.x | bundled with Android Studio |

### Install Android Studio

1. Download from https://developer.android.com/studio
2. During setup, check:
   - **Android SDK**
   - **Android SDK Platform** (API 35 — Android 15)
   - **Android Virtual Device** (for emulator)
3. After install open **SDK Manager → SDK Platforms** and install:
   - Android 15 (API 35)
   - Android 13 (API 33)
   - Android 10 (API 29)  ← minimum well-tested baseline
4. Open **SDK Manager → SDK Tools** and check:
   - Android SDK Build-Tools 35
   - Android Emulator
   - Android SDK Platform-Tools

### Set environment variables (add to `~/.bashrc` or `~/.zshrc`)

```bash
export ANDROID_HOME=$HOME/Android/Sdk          # macOS/Linux
# Windows: C:\Users\<you>\AppData\Local\Android\Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 2. One-time setup (first clone)

```bash
# 1 — Install dependencies
npm install

# 2 — Generate PWA icons (requires sharp; skip for SVG placeholders)
#     Place your master logo at public/icons/icon-source.svg first
npm install --save-dev sharp
node scripts/generate-icons.mjs

# 3 — Build the web app
npm run build

# 4 — Add the Android platform (creates the android/ directory)
npm run android:init
# Equivalent: npx cap add android
```

This creates `android/` — a complete Android Studio project. Commit it to git.

---

## 3. Day-to-day development workflow

### Option A — Live reload on a connected device / emulator

```bash
npm run android:run:live
# Opens the app on the connected device with hot-reload from the Vite dev server
```

Capacitor tunnels traffic from the device to your local Vite server on port 8080.
Changes to React code appear instantly without re-building.

### Option B — Full build sync

```bash
npm run android:sync       # builds + syncs web assets into android/
npm run android:open       # opens Android Studio
# Then press ▶ Run in Android Studio
```

---

## 4. Building an APK

### Debug APK (for local testing — no signing required)

```bash
npm run android:build:debug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install directly on a device:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (for distribution outside Play Store)

#### Step 1 — Create a signing keystore (one-time)

```bash
keytool -genkey -v \
  -keystore aamodha-release.keystore \
  -alias aamodha \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Store this file **securely outside the git repo** — losing it means you can
never update the app on the Play Store.

#### Step 2 — Configure signing in `android/app/build.gradle`

```groovy
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "../aamodha-release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "your_store_password"
            keyAlias System.getenv("KEY_ALIAS") ?: "aamodha"
            keyPassword System.getenv("KEY_PASSWORD") ?: "your_key_password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Use environment variables in CI/CD — never hardcode passwords.

#### Step 3 — Build

```bash
npm run android:build:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Android App Bundle (for Google Play Store — preferred)

```bash
npm run android:build:bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

The `.aab` format lets Google optimise the download for each device.

---

## 5. App configuration

### Application ID

Defined in `capacitor.config.ts`:
```ts
appId: 'com.aamodha.operationsportal'
```

This must also match `android/app/build.gradle`:
```groovy
defaultConfig {
    applicationId "com.aamodha.operationsportal"
    minSdk 24          // Android 7.0 — covers ~95% of active devices
    targetSdk 35       // Android 15
    versionCode 1      // increment on every Play Store upload
    versionName "1.0.0"
}
```

### Permissions in `android/app/src/main/AndroidManifest.xml`

Capacitor auto-generates this file. Add any extra permissions your features need:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Required: internet for Supabase API calls -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Optional: show connection status to the user -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Optional: file downloads (invoice PDFs, Excel exports) -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />

    <!-- Android 13+: granular media permissions replace READ_EXTERNAL_STORAGE -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application ...>
        <!-- Required for HTTP traffic in dev (remove in production) -->
        <!-- android:usesCleartextTraffic="true" -->

        <!-- Capacitor WebView activity -->
        <activity
            android:name="com.getcapacitor.BridgeActivity"
            android:exported="true"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 6. Icons and Splash Screen

### Icons (PNG required for Play Store)

1. Design your icon (1024 × 1024 px recommended source)
2. Save as `public/icons/icon-source.svg` (or PNG)
3. Install sharp and run the icon generator:
   ```bash
   npm install --save-dev sharp
   node scripts/generate-icons.mjs
   ```
4. Copy generated PNGs into Android's `mipmap` directories:
   - `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48 × 48)
   - `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72 × 72)
   - `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96 × 96)
   - `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144 × 144)
   - `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192 × 192)

   Or use **Android Studio → Resource Manager → + → Image Asset** to
   generate all sizes automatically from a single source file.

### Splash Screen

Place a `splash.png` (2732 × 2732 px) in:
```
android/app/src/main/res/drawable/splash.png
android/app/src/main/res/drawable-land-hdpi/splash.png
android/app/src/main/res/drawable-land-mdpi/splash.png
android/app/src/main/res/drawable-land-xhdpi/splash.png
android/app/src/main/res/drawable-land-xxhdpi/splash.png
android/app/src/main/res/drawable-land-xxxhdpi/splash.png
android/app/src/main/res/drawable-port-hdpi/splash.png
android/app/src/main/res/drawable-port-mdpi/splash.png
android/app/src/main/res/drawable-port-xhdpi/splash.png
android/app/src/main/res/drawable-port-xxhdpi/splash.png
android/app/src/main/res/drawable-port-xxxhdpi/splash.png
```

SplashScreen settings are in `capacitor.config.ts` under `plugins.SplashScreen`.

---

## 7. Environment variables in Capacitor builds

Vite `VITE_*` variables are baked into the JS bundle at build time.
Create a `.env.production` file before running `npm run build`:

```env
VITE_SUPABASE_URL=https://qkvmdrtfhpcvwvqjuyuu.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
VITE_APP_URL=https://sales-operations-portal.vercel.app
```

These are embedded into the compiled JavaScript — do **not** put secrets here.
Service-role keys must stay in Supabase Edge Function secrets only.

---

## 8. Testing on devices and emulators

### Create an AVD (Android Virtual Device)

1. Android Studio → **Device Manager** → **Create Device**
2. Choose: Pixel 7 (or similar modern phone)
3. System image: Android 13 (API 33) or Android 15 (API 35)
4. Launch the emulator before running `npm run android:run`

### Test on a physical device

1. Enable **Developer Options** on the device (tap Build Number 7×)
2. Enable **USB Debugging**
3. Plug in via USB
4. Run `adb devices` to confirm it's detected
5. Run `npm run android:run` — Capacitor auto-detects the device

### Recommended test matrix

| Device tier | API | Test focus |
|-------------|-----|-----------|
| Pixel 7 (emulator) | 33 | Primary target — full feature test |
| Pixel 4a (emulator) | 29 | Older Android — ensure no regressions |
| Samsung Galaxy S-series | 34 | One UI overlay quirks |
| Budget device (≤ 3 GB RAM) | 29 | Performance / memory pressure |

---

## 9. Google Play Store distribution

### Prepare the store listing

1. Create a Google Play Console account (one-time $25 USD fee)
2. **Create app** → select "App", set language and app name
3. Fill in:
   - Short description (80 chars)
   - Full description (4000 chars)
   - App category: **Business**
   - Screenshots: phone (min 2), 7" tablet (optional)
   - Feature graphic: 1024 × 500 px
   - Icon: 512 × 512 px PNG (already in `public/icons/icon-512x512.png`)

### Upload the bundle

1. Build: `npm run android:build:bundle`
2. Play Console → **Release** → **Internal testing** → **Create new release**
3. Upload `android/app/build/outputs/bundle/release/app-release.aab`
4. Fill release notes, save and roll out

### Version management

Every Play Store upload needs a unique `versionCode` (integer, always increasing):

```groovy
// android/app/build.gradle
defaultConfig {
    versionCode 2        // increment by 1 each release
    versionName "1.1.0"  // human-readable semver
}
```

---

## 10. Alternative: Direct APK distribution (no Play Store)

For internal distribution (employees only):

1. Build: `npm run android:build:release`
2. Share `app-release.apk` via Google Drive, email, or a private download link
3. Recipients must enable **Install from unknown sources** in Android Settings
4. Upload to a new version of the shared link on each update

This is suitable for an internal business portal where Play Store review
overhead is not warranted.

---

## 11. Offline behaviour (PWA service worker)

The vite-plugin-pwa generates a Workbox service worker that:

- **Pre-caches** the full app shell (HTML, CSS, JS) — app loads instantly offline
- **Network-first** for Supabase API calls — always fresh data when online,
  falls back to cached response when offline
- **Cache-first** for static assets (fonts, images) — fast loads

To test offline:
1. Open the app in Chrome on Android
2. DevTools → Network → Offline
3. Reload — the app should still load from cache

Data mutations (sales entry, order creation) while offline will fail with
a network error. Consider adding an offline queue via `@capacitor/preferences`
if offline write support is required.

---

## 12. CI/CD pipeline (GitHub Actions example)

Create `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build web app
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
        run: npm run build

      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Set up Android SDK
        uses: android-actions/setup-android@v3

      - name: Sync Capacitor
        run: npx cap sync android

      - name: Build release AAB
        env:
          KEYSTORE_PATH: ${{ secrets.KEYSTORE_PATH }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > aamodha-release.keystore
          cd android && ./gradlew bundleRelease

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-release.aab
          path: android/app/build/outputs/bundle/release/app-release.aab
```

Add these repository secrets in GitHub → Settings → Secrets:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
- `KEYSTORE_BASE64` (base64-encoded keystore: `base64 aamodha-release.keystore`)
- `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`

---

## Quick reference

| Task | Command |
|------|---------|
| Generate icons | `node scripts/generate-icons.mjs` |
| First-time Android setup | `npm run android:init` |
| Sync web build → Android | `npm run android:sync` |
| Open in Android Studio | `npm run android:open` |
| Run on device/emulator | `npm run android:run` |
| Live-reload dev session | `npm run android:run:live` |
| Build debug APK | `npm run android:build:debug` |
| Build release APK | `npm run android:build:release` |
| Build Play Store AAB | `npm run android:build:bundle` |
