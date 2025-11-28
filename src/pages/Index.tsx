import { useNavigate } from "react-router-dom";
import settingsIcon from "@/assets/settings-2.png";
import recordButton from "@/assets/rbigecordbutton.png";
import textImage from "@/assets/text.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-journal-header flex flex-col">
      {/* Settings Button */}
      <div className="pl-[30px] pt-[30px]">
        <button className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity">
          <img src={settingsIcon} alt="Settings" className="w-[30px] h-[30px]" />
        </button>
      </div>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Text and Record Button Container */}
        <div className="relative">
          {/* Handwritten Text Image */}
          <img 
            src={textImage} 
            alt="Instructions" 
            className="w-full max-w-[320px]"
          />
          
          {/* Red Record Button - Overlaid on text */}
          <button 
            onClick={() => navigate('/note')}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-transform"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
            }}
          >
            <img 
              src={recordButton} 
              alt="Record" 
              className="w-[100px] h-[100px]"
            />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Index;
