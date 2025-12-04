import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.curbism.nuronjournal',
  appName: 'Nuron',
  webDir: 'dist',
  server: {
    // Remove this block for production builds
    // url: 'https://f93aacfa-215e-4f8e-84b1-50c79bc2c78f.lovableproject.com?forceHideBadge=true',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
  },
};

export default config;