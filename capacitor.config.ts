import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingspath.chess',
  appName: "King's Path",
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
