import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import settingsIcon from "@/assets/settings.png";
import expandIcon from "@/assets/expand.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      <div className="bg-journal-header pl-[30px] pr-[30px] pb-[30px] h-[100px] flex items-end justify-between">
        <Button 
          variant="ghost" 
          className="text-journal-header-foreground hover:bg-journal-header-foreground/10 text-[36px] font-outfit font-light tracking-wider p-0 h-auto"
        >
          NOVEMBER 2025
        </Button>
        <img src={expandIcon} alt="Expand" className="w-[30px] h-[30px]" />
      </div>

      {/* Content Card */}
      <main className="flex-1 bg-journal-content rounded-t-[30px] -mt-0">
        {/* Empty state - will be populated with journal entries */}
      </main>
    </div>
  );
};

export default Index;
