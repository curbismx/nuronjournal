import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import arrow from '@/assets/arrow.png';

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
      className="min-h-screen flex flex-col items-center justify-between px-8"
      style={{ backgroundColor: '#2E2E2E' }}
    >
      {/* Top spacer */}
      <div className="flex-1" />
      
      {/* Page 1 content */}
      {currentPage === 0 && (
        <div className="flex flex-col items-center">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Nuron Journal" 
            className="w-[180px] h-auto mb-8"
          />
          
          {/* Tagline */}
          <p 
            className="text-center font-outfit font-light text-[24px] leading-relaxed"
            style={{ color: '#8A8A8A' }}
          >
            simple journal for<br />everyday life
          </p>
        </div>
      )}
      
      {/* Page 2 placeholder */}
      {currentPage === 1 && (
        <div className="flex flex-col items-center">
          <p className="text-white">Page 2</p>
        </div>
      )}
      
      {/* Page 3 placeholder */}
      {currentPage === 2 && (
        <div className="flex flex-col items-center">
          <p className="text-white">Page 3</p>
        </div>
      )}
      
      {/* Bottom spacer */}
      <div className="flex-1" />
      
      {/* Arrow button */}
      <button
        onClick={handleNext}
        className="mb-16"
      >
        <img 
          src={arrow} 
          alt="Next" 
          className="w-[50px] h-[50px]"
        />
      </button>
    </div>
  );
};

export default Onboarding;
