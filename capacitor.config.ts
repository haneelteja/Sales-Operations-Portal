import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Must match the applicationId in android/app/build.gradle
  appId: 'com.aamodha.operationsportal',
  appName: 'Aamodha',

  // Vite outputs to dist/ — Capacitor copies this into the Android/iOS WebView
  webDir: 'dist',

  server: {
    // During development with `npx cap run android --livereload` Capacitor
    // forwards requests to the Vite dev server running on port 8080.
    // Comment this out before building a production APK.
    // url: 'http://10.0.2.2:8080',  // 10.0.2.2 = host machine from Android emulator
    // cleartext: true,              // only needed when url is http (not https)
    androidScheme: 'https',
  },

  android: {
    // Minimum SDK version — Android 7.0 (API 24) covers ~95 % of active devices
    minWebViewVersion: 60,
    // Allow mixed content only in dev; production uses HTTPS exclusively
    allowMixedContent: false,
    // Capture console.* output from the WebView in Android logcat
    loggingBehavior: 'debug',
    // Override the back-button behaviour: true = app handles it in JS
    // false = OS back button closes the app when at root
    webContentsDebuggingEnabled: true, // set false for Play Store release
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Dark',           // white icons on dark bar
      backgroundColor: '#1e40af',
    },
    // @capacitor/preferences replaces AsyncStorage / localStorage
    // for reliable persistence on Android across app updates
    Preferences: {
      group: 'AamodhaPrefs',
    },
  },
};

export default config;
