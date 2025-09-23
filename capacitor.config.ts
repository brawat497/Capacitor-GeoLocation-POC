import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geolocation.app',
  appName: 'Location Tracking',
  webDir: 'www',
  android: {
    useLegacyBridge: true
  }
};

export default config;
