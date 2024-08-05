import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.impulseit.order_manager',
  appName: 'Order Manager',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
