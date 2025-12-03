# Nuron Journal - iOS Developer Setup Guide

This guide provides step-by-step instructions for setting up the iOS app, configuring RevenueCat for in-app purchases, and submitting to the App Store.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Capacitor Configuration](#capacitor-configuration)
4. [RevenueCat Setup](#revenuecat-setup)
5. [iOS Project Configuration](#ios-project-configuration)
6. [In-App Purchase Setup](#in-app-purchase-setup)
7. [App Store Connect Setup](#app-store-connect-setup)
8. [Testing](#testing)
9. [Submission Checklist](#submission-checklist)

---

## Prerequisites

### Required Accounts
- [ ] Apple Developer Program membership ($99/year) - https://developer.apple.com/programs/
- [ ] RevenueCat account (free tier available) - https://www.revenuecat.com/
- [ ] GitHub account (for code access)

### Required Software
- [ ] macOS (latest version recommended)
- [ ] Xcode 15+ (download from Mac App Store)
- [ ] Node.js 18+ and npm
- [ ] CocoaPods (`sudo gem install cocoapods`)

### Hardware
- [ ] Mac computer (required for iOS development)
- [ ] iPhone or iPad for testing (recommended)

---

## Project Setup

### 1. Clone the Repository

```bash
git clone <REPOSITORY_URL>
cd nuronjournal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the project root:

```env
VITE_SUPABASE_PROJECT_ID="zboorbavgxqhehxphibb"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpib29yYmF2Z3hxaGVoeHBoaWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjA5MTksImV4cCI6MjA4MDIzNjkxOX0.OhTYnRk16L7cNSsDN_WV959cbmmr7Aj5_rSLosFyVTY"
VITE_SUPABASE_URL="https://zboorbavgxqhehxphibb.supabase.co"
VITE_REVENUECAT_API_KEY="your_revenuecat_api_key_here"
```

---

## Capacitor Configuration

### 1. Initialize Capacitor

```bash
npx cap init nuronjournal app.lovable.nuronjournal
```

### 2. Update capacitor.config.ts

The file should look like this:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.nuronjournal',
  appName: 'Nuron Journal',
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
```

### 3. Build the Web App

```bash
npm run build
```

### 4. Add iOS Platform

```bash
npx cap add ios
```

### 5. Sync Changes

```bash
npx cap sync ios
```

---

## RevenueCat Setup

### 1. Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Sign up for an account
3. Create a new project called "Nuron Journal"

### 2. Configure iOS App in RevenueCat

1. In RevenueCat dashboard, go to **Project Settings** → **Apps**
2. Click **+ New App**
3. Select **App Store**
4. Enter your **App Bundle ID**: `app.lovable.nuronjournal`
5. Add your **App Store Connect Shared Secret** (get from App Store Connect → App → App Information → App-Specific Shared Secret)

### 3. Get API Keys

1. Go to **Project Settings** → **API Keys**
2. Copy the **Public SDK Key** for iOS
3. Add it to your `.env` file as `VITE_REVENUECAT_API_KEY`

### 4. Create Products in RevenueCat

Create two products with these **identifiers** (must match the code):

| Product | Identifier | Type |
|---------|------------|------|
| Monthly | `$rc_monthly` | Auto-Renewable Subscription |
| Annual | `$rc_annual` | Auto-Renewable Subscription |

### 5. Create Offering

1. Go to **Products** → **Offerings**
2. Create an offering called "default"
3. Add both packages:
   - Monthly package with `$rc_monthly` product
   - Annual package with `$rc_annual` product

---

## iOS Project Configuration

### 1. Open in Xcode

```bash
npx cap open ios
```

### 2. Configure Signing

1. Select the project in the navigator
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer account)
4. Ensure **Bundle Identifier** is: `app.lovable.nuronjournal`

### 3. Add Required Capabilities

In Xcode, go to **Signing & Capabilities** → **+ Capability**:

- [ ] **In-App Purchase** (required for subscriptions)
- [ ] **Push Notifications** (if using notifications)
- [ ] **Background Modes** → Audio (if recording in background)

### 4. Configure Info.plist

Add these keys to `ios/App/App/Info.plist`:

```xml
<!-- Microphone Permission -->
<key>NSMicrophoneUsageDescription</key>
<string>Nuron Journal needs microphone access to record voice notes.</string>

<!-- Photo Library Permission (if adding images) -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Nuron Journal needs photo library access to add images to your notes.</string>

<!-- Camera Permission (if needed) -->
<key>NSCameraUsageDescription</key>
<string>Nuron Journal needs camera access to take photos for your notes.</string>
```

### 5. Set Deployment Target

1. Select project → **General**
2. Set **Minimum Deployments** → iOS 14.0 or higher

### 6. Configure App Icons

1. In Xcode, go to **Assets.xcassets** → **AppIcon**
2. Add icons in all required sizes:
   - 20pt (2x, 3x)
   - 29pt (2x, 3x)
   - 40pt (2x, 3x)
   - 60pt (2x, 3x)
   - 1024pt (1x) - App Store

**Icon Requirements:**
- Format: PNG (no alpha/transparency for App Store icon)
- Color space: sRGB or P3

### 7. Configure Launch Screen

Edit `ios/App/App/Base.lproj/LaunchScreen.storyboard` or replace with your custom launch screen.

---

## In-App Purchase Setup

### 1. App Store Connect - Create App

1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: Nuron Journal
   - Primary Language: English (U.S.)
   - Bundle ID: app.lovable.nuronjournal
   - SKU: nuronjournal-001

### 2. Create Subscription Group

1. In your app, go to **Subscriptions** (left sidebar)
2. Click **+** to create a subscription group
3. Name: "Nuron Journal Premium"
4. Reference Name: premium

### 3. Create Subscription Products

#### Monthly Subscription
1. Click **+** under your subscription group
2. Reference Name: `Monthly Premium`
3. Product ID: `app.lovable.nuronjournal.monthly`
4. Subscription Duration: 1 Month
5. Set price (e.g., $4.99/month)
6. Add localization (display name, description)

#### Annual Subscription
1. Click **+** under your subscription group
2. Reference Name: `Annual Premium`
3. Product ID: `app.lovable.nuronjournal.annual`
4. Subscription Duration: 1 Year
5. Set price (e.g., $39.99/year)
6. Add localization (display name, description)

### 4. Link Products in RevenueCat

1. Go to RevenueCat → **Products**
2. Click **+ New Product**
3. For each subscription:
   - App Store Product ID: (from App Store Connect)
   - Identifier: `$rc_monthly` or `$rc_annual`

---

## App Store Connect Setup

### 1. App Information

Fill in all required fields:
- [ ] Name
- [ ] Subtitle
- [ ] Category (Productivity or Lifestyle)
- [ ] Content Rights
- [ ] Age Rating

### 2. Pricing and Availability

- [ ] Set base price or free with in-app purchases
- [ ] Select availability countries

### 3. App Privacy

Complete the privacy questionnaire:
- [ ] Data collection practices
- [ ] Privacy policy URL (required)
- [ ] Data types collected

### 4. Prepare Screenshots

Required sizes:
- [ ] 6.7" (iPhone 15 Pro Max): 1290 x 2796 px
- [ ] 6.5" (iPhone 14 Plus): 1284 x 2778 px
- [ ] 5.5" (iPhone 8 Plus): 1242 x 2208 px
- [ ] 12.9" iPad Pro: 2048 x 2732 px (if supporting iPad)

### 5. App Description

Prepare:
- [ ] Description (up to 4000 characters)
- [ ] Keywords (up to 100 characters, comma-separated)
- [ ] Support URL
- [ ] Marketing URL (optional)

### 6. Review Information

- [ ] Contact information
- [ ] Demo account (if login required)
- [ ] Notes for reviewer

---

## Testing

### 1. Test on Simulator

```bash
npm run build
npx cap sync ios
npx cap run ios
```

### 2. Test on Physical Device

1. Connect iPhone via USB
2. In Xcode, select your device
3. Click **Run** (⌘R)

### 3. Test In-App Purchases

#### Create Sandbox Tester
1. App Store Connect → **Users and Access** → **Sandbox Testers**
2. Create a new sandbox tester account

#### Test Purchases
1. On test device, sign out of App Store
2. Open app and trigger purchase
3. Sign in with sandbox tester account
4. Complete purchase (no real charges)

### 4. TestFlight Beta Testing

1. Archive app in Xcode: **Product** → **Archive**
2. Upload to App Store Connect
3. Add internal/external testers
4. Distribute via TestFlight

---

## Submission Checklist

### Before Submission

- [ ] All features working correctly
- [ ] In-app purchases tested with sandbox account
- [ ] No placeholder content
- [ ] No crashes or major bugs
- [ ] Privacy policy URL active
- [ ] Terms of service URL active
- [ ] All required screenshots uploaded
- [ ] App description complete
- [ ] Age rating questionnaire completed
- [ ] Export compliance answered

### Build Settings

1. In Xcode, set build configuration to **Release**
2. Increment version number and build number
3. Archive: **Product** → **Archive**
4. Validate app before uploading

### Submit for Review

1. Upload build via Xcode Organizer
2. In App Store Connect, select the build
3. Answer export compliance questions
4. Submit for review

### Post-Submission

- Review typically takes 24-48 hours
- Respond promptly to any reviewer questions
- If rejected, address issues and resubmit

---

## Troubleshooting

### Common Issues

#### "No signing certificate"
- Ensure Apple Developer account is added to Xcode
- Download certificates from developer.apple.com

#### "Provisioning profile doesn't match"
- Let Xcode manage signing automatically
- Or create profiles manually in developer portal

#### Purchases not working
- Verify product IDs match exactly
- Check RevenueCat API key is correct
- Ensure In-App Purchase capability is added
- Test with sandbox account only

#### Build fails
```bash
cd ios/App
pod install --repo-update
```

---

## Support

For issues with:
- **Capacitor**: https://capacitorjs.com/docs
- **RevenueCat**: https://docs.revenuecat.com/
- **App Store**: https://developer.apple.com/support/

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | TBD | Initial release |

