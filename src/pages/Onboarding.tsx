import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import logo from '@/assets/logo.png';
import arrow from '@/assets/arrow.png';
import mic from '@/assets/mic.png';
import { getOfferings, purchasePackage, restorePurchases } from '@/lib/purchases';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedUses, setSelectedUses] = useState<string[]>([]);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const toggleUse = (use: string) => {
    setSelectedUses(prev => 
      prev.includes(use) 
        ? prev.filter(u => u !== use)
        : [...prev, use]
    );
  };

  const handleNext = () => {
    if (currentPage < 3) {
      setCurrentPage(currentPage + 1);
    }
    // Page 4 (subscription) has its own subscribe/skip buttons
  };

  // Fetch offerings when reaching subscription page
  useEffect(() => {
    if (currentPage === 3 && Capacitor.isNativePlatform()) {
      const fetchOfferings = async () => {
        const availablePackages = await getOfferings();
        setPackages(availablePackages);
      };
      fetchOfferings();
    }
  }, [currentPage]);

  const handleSubscribe = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Web fallback - just complete onboarding
      localStorage.setItem('nuron-onboarding-complete', 'true');
      navigate('/');
      return;
    }
    
    setIsLoading(true);
    
    // Find the correct package based on selected plan
    const packageId = selectedPlan === 'monthly' ? '$rc_monthly' : '$rc_annual';
    const selectedPackage = packages.find(p => p.identifier === packageId);
    
    if (selectedPackage) {
      const customerInfo = await purchasePackage(selectedPackage);
      if (customerInfo && customerInfo.activeSubscriptions.length > 0) {
        localStorage.setItem('nuron-onboarding-complete', 'true');
        localStorage.setItem('nuron-subscribed', 'true');
        navigate('/');
      }
    } else {
      // Fallback if packages not loaded
      console.log('Package not found, completing onboarding anyway');
      localStorage.setItem('nuron-onboarding-complete', 'true');
      navigate('/');
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
        localStorage.setItem('nuron-onboarding-complete', 'true');
        localStorage.setItem('nuron-subscribed', 'true');
        navigate('/');
      } else {
        alert('No active subscriptions found');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore purchases. Please try again.');
    }
    
    setIsRestoring(false);
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{ backgroundColor: '#2E2E2E' }}
    >
      {/* Page 1 content */}
      {currentPage === 0 && (
        <>
          {/* Logo - 239px wide, 180px from top */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{ top: '180px' }}
          >
            <img 
              src={logo} 
              alt="Nuron Journal" 
              style={{ width: '239px', height: 'auto' }}
            />
          </div>
          
          {/* Tagline - 600px from top */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{ top: '600px' }}
          >
            <p 
              className="text-center font-light text-[24px] leading-relaxed"
              style={{ color: '#8A8A8A', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              never forget anything<br />ever again
            </p>
          </div>
        </>
      )}
      
      {/* Page 2 content */}
      {currentPage === 1 && (
        <>
          {/* Text - 180px from top */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8"
            style={{ top: '180px', width: '100%', maxWidth: '400px' }}
          >
            <p 
              className="text-center font-medium text-[26px] leading-snug mb-8"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              Turn your speech into well written text using our amazing AI
            </p>
            <p 
              className="text-center font-light text-[26px] leading-snug"
              style={{ color: '#8A8A8A', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              No more forgetting those great ideas, just jot it down in an instant and view later in a journal format
            </p>
          </div>
          
          {/* Microphone icon - centered vertically lower */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{ top: '580px' }}
          >
            <img 
              src={mic} 
              alt="Microphone" 
              style={{ 
                width: '60px', 
                height: 'auto',
                filter: 'brightness(0) saturate(100%) invert(56%) sepia(57%) saturate(594%) hue-rotate(314deg) brightness(97%) contrast(84%)'
              }}
            />
          </div>
        </>
      )}
      
      {/* Page 3 content - What do you want to do */}
      {currentPage === 2 && (
        <>
          {/* Header */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ top: '180px' }}
          >
            <h1 
              className="text-center text-[26px] font-medium leading-relaxed"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              What do you want to do<br />with Nuron?
            </h1>
          </div>
          
          {/* Options */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ top: '320px', maxWidth: '360px' }}
          >
            {[
              'Messages and emails',
              'Notes',
              'Thoughts and ideas',
              'Journaling',
              'Social media posts'
            ].map((option, index) => (
              <button
                key={index}
                onClick={() => toggleUse(option)}
                className="w-full mb-4 p-4 rounded-2xl border-2 transition-all flex items-center justify-between"
                style={{
                  backgroundColor: selectedUses.includes(option) ? 'rgba(229,115,115,0.15)' : 'transparent',
                  borderColor: selectedUses.includes(option) ? '#E57373' : '#555555'
                }}
              >
                <span 
                  className="text-[18px]"
                  style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
                >
                  {option}
                </span>
                
                {/* Checkbox */}
                <div 
                  className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: selectedUses.includes(option) ? '#E57373' : '#555555',
                    backgroundColor: selectedUses.includes(option) ? '#E57373' : 'transparent'
                  }}
                >
                  {selectedUses.includes(option) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* Page 4 content - Subscription */}
      {currentPage === 3 && (
        <>
          {/* Header */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ top: '80px' }}
          >
            <h1 
              className="text-center text-[36px] font-medium mb-6"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '3px' }}
            >
              SUBSCRIPTION
            </h1>
            <p 
              className="text-center text-[22px] font-light leading-relaxed"
              style={{ color: '#8A8A8A', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              Join the thousands of creatives<br />in our community for less than<br />the price of a coffee
            </p>
          </div>
          
          {/* Features list - centered with inline ticks */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-full text-center"
            style={{ top: '300px' }}
          >
            {[
              'Record everything',
              'Journal your life',
              'Export everywhere',
              'Add images & audio',
              'Cancel anytime',
              "And lot's more...",
              '7 days free trial'
            ].map((feature, index) => (
              <div 
                key={index}
                className="inline-flex items-center justify-center gap-2 mb-4 w-full"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E57373" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span 
                  className="text-[18px]"
                  style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>
          
          {/* Plan options - centered between features and button */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-8 w-full flex gap-4"
            style={{ top: 'calc(50% + 180px)', maxWidth: '360px' }}
          >
            {/* Monthly option */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className="flex-1 p-4 rounded-2xl border-2 transition-all"
              style={{
                backgroundColor: selectedPlan === 'monthly' ? 'rgba(229,115,115,0.15)' : 'transparent',
                borderColor: selectedPlan === 'monthly' ? '#E57373' : '#555555'
              }}
            >
              <span 
                className="block text-[16px] mb-1"
                style={{ color: '#AAAAAA', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
              >
                Monthly
              </span>
              <span 
                className="block text-[28px] font-medium"
                style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
              >
                $3.99
              </span>
              <span 
                className="block text-[12px]"
                style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
              >
                per month
              </span>
            </button>
            
            {/* Yearly option */}
            <button
              onClick={() => setSelectedPlan('yearly')}
              className="flex-1 p-4 rounded-2xl border-2 transition-all relative"
              style={{
                backgroundColor: selectedPlan === 'yearly' ? 'rgba(229,115,115,0.15)' : 'transparent',
                borderColor: selectedPlan === 'yearly' ? '#E57373' : '#555555'
              }}
            >
              {/* Save badge - circle at top right */}
              <div 
                className="absolute flex items-center justify-center"
                style={{ 
                  top: '-14px', 
                  right: '-14px',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(229,115,115,0.7)', 
                  color: '#FFFFFF', 
                  fontFamily: 'Advent Pro', 
                  fontSize: '10px',
                  fontWeight: '500',
                  letterSpacing: '0.5px',
                  lineHeight: '1.2',
                  textAlign: 'center'
                }}
              >
                SAVE<br />17%
              </div>
              <span 
                className="block text-[16px] mb-1"
                style={{ color: '#AAAAAA', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
              >
                Yearly
              </span>
              <span 
                className="block text-[28px] font-medium"
                style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
              >
                $39.99
              </span>
              <span 
                className="block text-[12px]"
                style={{ color: '#FFFFFF', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
              >
                per year
              </span>
            </button>
          </div>
          
          {/* Subscribe button */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ bottom: '80px', maxWidth: '360px' }}
          >
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-4 rounded-full text-[18px] font-medium transition-all disabled:opacity-70"
              style={{ 
                backgroundColor: '#E57373', 
                color: '#FFFFFF', 
                fontFamily: 'Advent Pro',
                letterSpacing: '1px'
              }}
            >
              {isLoading ? 'Processing...' : `Subscribe for ${selectedPlan === 'monthly' ? '$3.99/month' : '$39.99/year'}`}
            </button>
            
            {/* Restore Purchases */}
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full mt-4 py-3 text-[14px]"
              style={{ color: '#E57373', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </button>

            {/* Skip for now */}
            <button
              onClick={() => {
                localStorage.setItem('nuron-onboarding-complete', 'true');
                localStorage.setItem('nuron-trial-start', Date.now().toString());
                navigate('/');
              }}
              className="w-full mt-2 py-3 text-[16px]"
              style={{ color: '#888888', fontFamily: 'Advent Pro', letterSpacing: '1px' }}
            >
              Skip for now
            </button>
          </div>
        </>
      )}
      
      {/* Arrow button - 30px, centered at bottom (hidden on page 4) */}
      {currentPage < 3 && (
        <button
          onClick={handleNext}
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ bottom: '80px' }}
        >
          <img 
            src={arrow} 
            alt="Next" 
            style={{ width: '30px', height: '30px' }}
          />
        </button>
      )}
    </div>
  );
};

export default Onboarding;
