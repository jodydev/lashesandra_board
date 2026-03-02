import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lashesandra.board',
  appName: 'LashesAndra Board',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Live reload: imposta CAPACITOR_SERVER_URL prima di "npx cap sync"
    // es. export CAPACITOR_SERVER_URL=http://192.168.1.5:5173
    ...(process.env.CAPACITOR_SERVER_URL
      ? { url: process.env.CAPACITOR_SERVER_URL, cleartext: true }
      : {}),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#EDE8DC',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
