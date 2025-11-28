import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import settingsIcon from "@/assets/settings-2.png";
import recordButton from "@/assets/rbigecordbutton.png";
import textImage from "@/assets/text.png";
import plusIcon from "@/assets/plusbig.png";
import threeDotsIcon from "@/assets/3dots.png";
import floatingAddButton from "@/assets/bigredbuttonnoshadow.png";
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

interface SavedNote {
  id: string;
  title: string;
  contentBlocks: Array<
    | { type: 'text'; id: string; content: string }
    | { type: 'image'; id: string; url: string; width: number }
  >;
  createdAt: string;
  updatedAt: string;
  weather?: { temp: number; weatherCode: number };
}

interface GroupedNotes {
  date: string;
  notes: SavedNote[];
}

const Index = () => {
  const navigate = useNavigate();
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load notes on mount
  useEffect(() => {
    const stored = localStorage.getItem('nuron-notes');
    if (stored) {
      setSavedNotes(JSON.parse(stored));
    }
  }, []);

  // Group notes by date
  const groupedNotes: GroupedNotes[] = savedNotes.reduce((groups: GroupedNotes[], note) => {
    const dateKey = new Date(note.createdAt).toLocaleDateString('en-US');
    const existingGroup = groups.find(g => g.date === dateKey);
    
    if (existingGroup) {
      existingGroup.notes.push(note);
    } else {
      groups.push({
        date: dateKey,
        notes: [note]
      });
    }
    
    return groups;
  }, []);

  // Get month/year for header (most recent note or current month)
  const headerMonthYear = savedNotes.length > 0
    ? new Date(savedNotes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  // Get combined text content from contentBlocks
  const getNotePreview = (note: SavedNote): string => {
    return note.contentBlocks
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; id: string; content: string }).content)
      .join('\n\n');
  };

  // Map weather code to icon
  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode >= 61 && weatherCode <= 67) return CloudRain;
    if (weatherCode >= 71 && weatherCode <= 77) return CloudSnow;
    if (weatherCode >= 80 && weatherCode <= 82) return CloudRain;
    if (weatherCode >= 51 && weatherCode <= 57) return CloudDrizzle;
    if (weatherCode >= 2 && weatherCode <= 3) return Cloud;
    if (weatherCode === 45 || weatherCode === 48) return CloudFog;
    if (weatherCode >= 95) return CloudLightning;
    return Sun;
  };

  // Show original start page if no notes
  if (savedNotes.length === 0) {
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
              className="w-full max-w-[320px] mt-[60px]"
            />
            
            {/* Red Record Button - Overlaid on text */}
            <button 
              onClick={() => navigate('/note')}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-[15px] hover:scale-105 transition-transform"
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
  }

  // Show timeline when notes exist
  return (
    <div className="fixed inset-0 flex flex-col bg-journal-header overflow-hidden">
      {/* Fixed dark header */}
      <header className="flex-shrink-0 bg-journal-header pl-[30px] pt-[30px] pr-4 pb-[30px] h-[150px] z-30">
        <div className="flex items-center justify-between mb-auto -mt-[15px]">
          <button className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity">
            <img src={settingsIcon} alt="Settings" className="w-[30px] h-[30px]" />
          </button>
          <div className="flex-1" />
        </div>
        <div className="relative mt-[41px]">
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px]">
            {headerMonthYear}
          </h1>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="absolute right-[30px] top-0"
          >
            <img src={threeDotsIcon} alt="Menu" className="h-[24px] w-auto" />
          </button>
        </div>
      </header>

      {/* Scrollable content area */}
      <div 
        className="flex-1 overflow-y-scroll bg-journal-content rounded-t-[30px] overscroll-y-auto z-40 -mt-[25px]"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          minHeight: 0
        }}
      >
        <div style={{ minHeight: 'calc(100% + 1px)' }}>
          {/* Notes list */}
          <div className="pt-[12px]">
            {groupedNotes.map((group) => (
              <div key={group.date}>
                {group.notes.map((note, index) => {
                  const noteDate = new Date(note.createdAt);
                  const dayNumber = noteDate.getDate();
                  const dayName = noteDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                  const preview = getNotePreview(note);
                  const WeatherIcon = note.weather ? getWeatherIcon(note.weather.weatherCode) : null;

                  return (
                    <div 
                      key={note.id}
                      className="border-b border-[hsl(0,0%,85%)] last:border-b-0 cursor-pointer hover:bg-[hsl(0,0%,95%)] transition-colors"
                      onClick={() => navigate(`/note/${note.id}`)}
                    >
                      <div className={index === 0 ? "px-8 pt-[12px] pb-2" : "px-8 py-6"}>
                        {/* Only show date for first note of each day */}
                        {index === 0 && (
                          <div className="flex items-start gap-4 mb-4">
                            <div className="text-[72px] font-outfit font-bold leading-none text-[hsl(60,1%,66%)]">
                              {dayNumber}
                            </div>
                            <div className="flex flex-col">
                              <div className="text-[20px] font-outfit font-light tracking-wide text-[hsl(60,1%,66%)] mt-[2px]">
                                {dayName}
                              </div>
                              {WeatherIcon && note.weather && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <WeatherIcon size={20} className="text-[hsl(60,1%,66%)]" />
                                  <span className="text-[16px] font-outfit font-light text-[hsl(60,1%,66%)]">{note.weather.temp}°C</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Title */}
                        <h3 className={`text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-4 ${index === 0 ? '-mt-[10px]' : ''}`}>
                          {note.title || 'Untitled'}
                        </h3>
                        
                        {/* Body preview - 2 lines max */}
                        <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] line-clamp-2 -mt-[10px]">
                          {preview || 'No content'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating add button */}
      <img 
        src={recordButton} 
        alt="Add Note"
        onClick={() => navigate('/note')}
        className="fixed bottom-[30px] right-[30px] z-50 cursor-pointer w-[51px] h-[51px]"
      />
    </div>
  );
};

export default Index;
