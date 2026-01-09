import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  getOfferings, 
  purchasePackage, 
  restorePurchases 
} from '@/lib/purchases';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed: () => void;
}

const SubscriptionModal = ({ isOpen, onClose, onSubscribed }: SubscriptionModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && Capacitor.isNativePlatform()) {
      const fetchOfferings = async () => {
        const availablePackages = await getOfferings();
        setPackages(availablePackages);
      };
      fetchOfferings();
    }
  }, [isOpen]);

  const handleSubscribe = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Web fallback for testing
      localStorage.setItem('nuron-subscribed', 'true');
      onSubscribed();
      return;
    }
    
    setIsLoading(true);
    
    const packageId = selectedPlan === 'monthly' ? '$rc_monthly' : '$rc_annual';
    const selectedPackage = packages.find(p => p.identifier === packageId);
    
    if (selectedPackage) {
      const customerInfo = await purchasePackage(selectedPackage);
      if (customerInfo && customerInfo.activeSubscriptions.length > 0) {
        localStorage.setItem('nuron-subscribed', 'true');
        onSubscribed();
      }
    }
    
    setIsLoading(false);
  };

  const handleRestore = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert('Restore is only available on iOS');
      return;
    }
    
    setIsRestoring(true);
    
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo && customerInfo.activeSubscriptions.length > 0) {
        localStorage.setItem('nuron-subscribed', 'true');
        onSubscribed();
      } else {
        alert('No active subscriptions found');
      }
    } catch (error) {
      alert('Failed to restore purchases. Please try again.');
    }
    
    setIsRestoring(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div 
        className="relative w-[90%] max-w-[400px] rounded-3xl p-8"
        style={{ backgroundColor: '#2E2E2E', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header */}
        <h2 
          className="text-center text-[28px] font-medium mb-3"
          style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '2px' }}
        >
          SUBSCRIBE
        </h2>
        <p 
          className="text-center text-[16px] font-light leading-relaxed mb-6"
          style={{ color: '#8A8A8A', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
        >
          Your free trial has ended.<br />Subscribe to continue creating notes.
        </p>

        {/* Features */}
        <div className="mb-6">
          {[
            'Unlimited notes',
            'Record everything',
            'Add images & audio',
            'Export everywhere',
            'Cancel anytime'
          ].map((feature, index) => (
            <div 
              key={index}
              className="inline-flex items-center justify-center gap-2 mb-3 w-full"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E57373" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span 
                className="text-[16px]"
                style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Plan options */}
        <div className="flex gap-3 mb-6">
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className="flex-1 p-3 rounded-xl border-2 transition-all"
            style={{
              backgroundColor: selectedPlan === 'monthly' ? 'rgba(229,115,115,0.15)' : 'transparent',
              borderColor: selectedPlan === 'monthly' ? '#E57373' : '#555555'
            }}
          >
            <span 
              className="block text-[14px] mb-1"
              style={{ color: '#AAAAAA', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              Monthly
            </span>
            <span 
              className="block text-[22px] font-medium"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              $3.99
            </span>
            <span 
              className="block text-[11px]"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              per month
            </span>
          </button>
          
          {/* Yearly */}
          <button
            onClick={() => setSelectedPlan('yearly')}
            className="flex-1 p-3 rounded-xl border-2 transition-all relative"
            style={{
              backgroundColor: selectedPlan === 'yearly' ? 'rgba(229,115,115,0.15)' : 'transparent',
              borderColor: selectedPlan === 'yearly' ? '#E57373' : '#555555'
            }}
          >
            <div 
              className="absolute flex items-center justify-center"
              style={{ 
                top: '-12px', 
                right: '-12px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(229,115,115,0.7)', 
                color: '#FFFFFF', 
                fontFamily: 'Advent Pro', 
                fontSize: '9px',
                fontWeight: '500',
                letterSpacing: '0.5px',
                lineHeight: '1.2',
                textAlign: 'center'
              }}
            >
              SAVE<br />17%
            </div>
            <span 
              className="block text-[14px] mb-1"
              style={{ color: '#AAAAAA', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              Yearly
            </span>
            <span 
              className="block text-[22px] font-medium"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              $39.99
            </span>
            <span 
              className="block text-[11px]"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              per year
            </span>
          </button>
        </div>

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full py-4 rounded-full text-[16px] font-medium transition-all mb-3"
          style={{ 
            backgroundColor: '#E57373', 
            color: '#FFFFFF', 
            fontFamily: 'Advent Pro',
            letterSpacing: '1px',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Processing...' : `Subscribe for ${selectedPlan === 'monthly' ? '$3.99/month' : '$39.99/year'}`}
        </button>

        {/* Restore */}
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          className="w-full py-2 text-[14px]"
          style={{ color: '#E57373', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
        >
          {isRestoring ? 'Restoring...' : 'Restore Purchases'}
        </button>

        {/* Legal disclosure */}
        <p 
          className="text-[10px] leading-relaxed mt-4 text-center"
          style={{ color: '#666666', fontFamily: 'Outfit' }}
        >
          Payment will be charged to your Apple ID account at confirmation of purchase. 
          Subscription automatically renews unless canceled at least 24 hours before 
          the end of the current period. Manage subscriptions in your App Store account settings.
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <a 
            href="https://nuron.life/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px]"
            style={{ color: '#888888', fontFamily: 'Outfit', textDecoration: 'underline' }}
          >
            Terms
          </a>
          <a 
            href="https://nuron.life/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px]"
            style={{ color: '#888888', fontFamily: 'Outfit', textDecoration: 'underline' }}
          >
            Privacy
          </a>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
