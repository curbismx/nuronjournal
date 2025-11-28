import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import settingsIcon from "@/assets/settings.png";
import expandIcon from "@/assets/expand.png";
import plusBig from "@/assets/plusbig.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <header className="bg-journal-header pl-[30px] pt-[50px] pr-4 pb-6 flex items-center justify-between h-[100px]">
        <Button 
          variant="ghost" 
          className="text-journal-header-foreground hover:bg-journal-header-foreground/10 p-0 h-auto w-auto"
        >
          <img src={settingsIcon} alt="Settings" className="w-[30px] h-[30px]" />
        </Button>
        
        <div className="flex-1" />
      </header>

      {/* Month Selector */}
      <div className="bg-journal-header pl-[30px] pr-[30px] pb-[30px] h-[100px] flex items-end justify-between gap-4">
        <h1 className="text-journal-header-foreground text-[36px] font-outfit font-light tracking-wider leading-none">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
        </h1>
        <img src={expandIcon} alt="Expand" className="h-[30px] w-auto mb-[3px]" />
      </div>

      {/* Content Card */}
      <main className="flex-1 bg-journal-content rounded-t-[30px] -mt-0 flex flex-col items-center justify-center px-8">
        <div className="flex flex-col items-center gap-8">
          <button 
            onClick={() => navigate('/note')}
            className="hover:scale-105 transition-transform flex flex-col items-center gap-4"
          >
            <img src={plusBig} alt="Create New Note" className="w-[80px] h-[80px]" />
            <p className="text-[20px] font-outfit font-light text-[hsl(0,0%,40%)]">Create New Note</p>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Index;
