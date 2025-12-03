import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import arrow from '@/assets/arrow.png';
import mic from '@/assets/mic.png';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    }
    // Page 3 has its own subscribe/skip buttons
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
              className="text-center font-outfit font-light text-[24px] leading-relaxed"
              style={{ color: '#8A8A8A' }}
            >
              simple journal for<br />everyday life
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
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro' }}
            >
              Turn your speech into well written text using our amazing AI
            </p>
            <p 
              className="text-center font-light text-[26px] leading-snug"
              style={{ color: '#8A8A8A', fontFamily: 'Advent Pro' }}
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
              style={{ width: '60px', height: 'auto' }}
            />
          </div>
        </>
      )}
      
      {/* Page 3 content - Subscription */}
      {currentPage === 2 && (
        <>
          {/* Header */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ top: '100px' }}
          >
            <h1 
              className="text-center text-[32px] font-medium tracking-wider mb-4"
              style={{ color: '#FFFFFF', fontFamily: 'Advent Pro' }}
            >
              SUBSCRIPTION
            </h1>
            <p 
              className="text-center text-[18px] font-light leading-relaxed"
              style={{ color: '#8A8A8A', fontFamily: 'Advent Pro' }}
            >
              Join the thousands of creatives in our community for less than the price of a coffee
            </p>
          </div>
          
          {/* Plan options */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ top: '280px', maxWidth: '340px' }}
          >
            {/* Monthly option */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className="w-full mb-4 p-4 rounded-2xl border-2 transition-all"
              style={{
                backgroundColor: selectedPlan === 'monthly' ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: selectedPlan === 'monthly' ? '#FFFFFF' : '#555555'
              }}
            >
              <div className="flex justify-between items-center">
                <span 
                  className="text-[18px]"
                  style={{ color: '#FFFFFF', fontFamily: 'Advent Pro' }}
                >
                  Monthly
                </span>
                <span 
                  className="text-[24px] font-medium"
                  style={{ color: '#FFFFFF', fontFamily: 'Advent Pro' }}
                >
                  $3.99
                </span>
              </div>
              <p 
                className="text-left text-[14px] mt-1"
                style={{ color: '#8A8A8A', fontFamily: 'Advent Pro' }}
              >
                per month
              </p>
            </button>
            
            {/* Yearly option */}
            <button
              onClick={() => setSelectedPlan('yearly')}
              className="w-full p-4 rounded-2xl border-2 transition-all relative"
              style={{
                backgroundColor: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: selectedPlan === 'yearly' ? '#FFFFFF' : '#555555'
              }}
            >
              {/* Best value badge */}
              <div 
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-[12px]"
                style={{ backgroundColor: '#E57373', color: '#FFFFFF', fontFamily: 'Advent Pro' }}
              >
                BEST VALUE
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="text-[18px]"
                  style={{ color: '#FFFFFF', fontFamily: 'Advent Pro' }}
                >
                  Yearly
                </span>
                <span 
                  className="text-[24px] font-medium"
                  style={{ color: '#FFFFFF', fontFamily: 'Advent Pro' }}
                >
                  $39.99
                </span>
              </div>
              <p 
                className="text-left text-[14px] mt-1"
                style={{ color: '#8A8A8A', fontFamily: 'Advent Pro' }}
              >
                per year (save 17%)
              </p>
            </button>
          </div>
          
          {/* Features list */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ top: '500px', maxWidth: '340px' }}
          >
            <div className="flex flex-wrap justify-center gap-2">
              {['7 days free', 'Record everything', 'Journal your life', 'Export everywhere', 'Add images', 'Cancel anytime', "Lot's more..."].map((feature, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-[14px]"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    color: '#AAAAAA', 
                    fontFamily: 'Advent Pro' 
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
          
          {/* Subscribe button */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 px-8 w-full"
            style={{ bottom: '120px', maxWidth: '340px' }}
          >
            <button
              onClick={() => {
                localStorage.setItem('nuron-onboarding-complete', 'true');
                navigate('/');
              }}
              className="w-full py-4 rounded-full text-[18px] font-medium transition-all"
              style={{ 
                backgroundColor: '#E57373', 
                color: '#FFFFFF', 
                fontFamily: 'Advent Pro' 
              }}
            >
              Subscribe for {selectedPlan === 'monthly' ? '$3.99/month' : '$39.99/year'}
            </button>
            
            {/* Skip for now */}
            <button
              onClick={() => {
                localStorage.setItem('nuron-onboarding-complete', 'true');
                navigate('/');
              }}
              className="w-full mt-4 py-2 text-[14px]"
              style={{ color: '#666666', fontFamily: 'Advent Pro' }}
            >
              Skip for now
            </button>
          </div>
        </>
      )}
      
      {/* Arrow button - 30px, centered at bottom (hidden on page 3) */}
      {currentPage < 2 && (
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
