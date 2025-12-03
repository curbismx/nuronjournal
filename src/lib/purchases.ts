import { Purchases, PurchasesPackage, CustomerInfo, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

export const initializePurchases = async () => {
  if (Capacitor.isNativePlatform() && REVENUECAT_API_KEY) {
    try {
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }
};

export const getOfferings = async (): Promise<PurchasesPackage[]> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not on native platform, skipping offerings fetch');
    return [];
  }
  
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current?.availablePackages) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return [];
  }
};

export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not on native platform, skipping purchase');
    return null;
  }
  
  try {
    const result = await Purchases.purchasePackage({ aPackage: packageToPurchase });
    return result.customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('User cancelled purchase');
    } else {
      console.error('Purchase error:', error);
    }
    return null;
  }
};

export const checkSubscriptionStatus = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    // For web testing, check localStorage
    return localStorage.getItem('nuron-subscribed') === 'true';
  }
  
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const activeSubscriptions = customerInfo.activeSubscriptions;
    return activeSubscriptions.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return null;
  }
};

export const isTrialExpired = (): boolean => {
  const subscribed = localStorage.getItem('nuron-subscribed') === 'true';
  if (subscribed) return false;
  
  const trialStart = localStorage.getItem('nuron-trial-start');
  if (!trialStart) return false;
  
  const trialStartDate = parseInt(trialStart, 10);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  return now - trialStartDate > sevenDaysMs;
};

export const getDaysRemaining = (): number => {
  const trialStart = localStorage.getItem('nuron-trial-start');
  if (!trialStart) return 7;
  
  const trialStartDate = parseInt(trialStart, 10);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const elapsed = now - trialStartDate;
  const remaining = Math.ceil((sevenDaysMs - elapsed) / (24 * 60 * 60 * 1000));
  
  return Math.max(0, remaining);
};
