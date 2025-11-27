import { Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-journal-content flex flex-col">
      {/* Header */}
      <header className="bg-journal-header px-4 py-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          className="text-journal-header-foreground hover:bg-journal-header-foreground/10 p-2 h-auto w-auto [&_svg]:!w-[120px] [&_svg]:!h-[120px]"
        >
          <Settings />
        </Button>
        
        <div className="flex-1" />
      </header>

      {/* Month Selector */}
      <div className="bg-journal-header px-4 pb-8">
        <Button 
          variant="ghost" 
          className="text-journal-header-foreground hover:bg-journal-header-foreground/10 text-2xl font-light tracking-wider p-0 h-auto"
        >
          NOVEMBER 2025
          <ChevronDown className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Content Area */}
      <main className="flex-1 bg-journal-content">
        {/* Empty state - will be populated with journal entries */}
      </main>
    </div>
  );
};

export default Index;
