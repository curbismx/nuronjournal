import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import arrow from '@/assets/arrow.png';
import mic from '@/assets/mic.png';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    } else {
      // Mark onboarding as complete and go to main app
      localStorage.setItem('nuron-onboarding-complete', 'true');
      navigate('/');
    }
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
      
      {/* Page 3 placeholder */}
      {currentPage === 2 && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <p className="text-white">Page 3</p>
        </div>
      )}
      
      {/* Arrow button - 30px, centered at bottom */}
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
    </div>
  );
};

export default Onboarding;
