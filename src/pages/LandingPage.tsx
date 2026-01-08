import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#2E2E2E] flex flex-col items-center justify-center px-8">
      <h1 className="text-white text-[48px] font-outfit font-light mb-4">Nuron</h1>
      <p className="text-white/60 text-[18px] font-outfit text-center mb-8 max-w-md">
        Your voice journal. Speak your thoughts, let AI transcribe and organise them.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/?login=true')}
          className="px-8 py-3 bg-white text-[#2E2E2E] rounded-full font-outfit font-medium text-[16px]"
        >
          Log In
        </button>
        <button
          onClick={() => navigate('/?signup=true')}
          className="px-8 py-3 bg-transparent border border-white text-white rounded-full font-outfit font-medium text-[16px]"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
