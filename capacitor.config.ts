import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thinkbetai.app',
  appName: 'ThinkBetAI',
  webDir: 'dist',
  server: {
    url: 'https://thinkbetai.com',
    cleartext: false
  }
};

export default config;
