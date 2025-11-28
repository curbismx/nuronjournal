import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import settingsIcon from "@/assets/settings-2.png";
import plusIcon from "@/assets/plusbig.png";
import threeDotsIcon from "@/assets/3dots.png";

interface SavedNote {
  id: string;
  title: string;
  contentBlocks: Array<
    | { type: 'text'; id: string; content: string }
    | { type: 'image'; id: string; url: string; width: number }
  >;
  createdAt: string;
  updatedAt: string;
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

  return (
    <div className="fixed inset-0 flex flex-col bg-journal-header overflow-hidden">
      {/* Fixed dark header */}
      <header className="flex-shrink-0 bg-journal-header pl-[30px] pt-[30px] pr-4 pb-[30px] h-[150px] z-30">
        <div className="flex items-center justify-between mb-auto -mt-[15px]">
          <button className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity">
            <img src={settingsIcon} alt="Settings" className="w-[30px] h-[30px]" />
          </button>
          
          <button 
            onClick={() => navigate('/note')}
            className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity"
          >
            <img src={plusIcon} alt="Create Note" className="w-[30px] h-[30px]" />
          </button>
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
          {savedNotes.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full px-8 py-20">
              <p className="text-[20px] font-outfit text-[hsl(0,0%,50%)] mb-8">No notes yet</p>
              <button 
                onClick={() => navigate('/note')}
                className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity"
              >
                <img src={plusIcon} alt="Create Note" className="w-[60px] h-[60px]" />
              </button>
            </div>
          ) : (
            // Notes list
            <div className="pt-6">
              {groupedNotes.map((group) => (
                <div key={group.date}>
                  {group.notes.map((note, index) => {
                    const noteDate = new Date(note.createdAt);
                    const dayNumber = noteDate.getDate();
                    const dayName = noteDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                    const preview = getNotePreview(note);

                    return (
                      <div 
                        key={note.id}
                        className="border-b border-[hsl(0,0%,85%)] last:border-b-0 cursor-pointer hover:bg-[hsl(0,0%,95%)] transition-colors"
                        onClick={() => navigate(`/note/${note.id}`)}
                      >
                        <div className="px-8 py-6">
                          {/* Only show date for first note of each day */}
                          {index === 0 && (
                            <div className="flex items-start gap-4 mb-3">
                              <div className="text-[48px] font-outfit font-bold leading-none text-[hsl(60,1%,66%)]">
                                {dayNumber}
                              </div>
                              <div className="flex flex-col">
                                <div className="text-[16px] font-outfit font-light tracking-wide text-[hsl(60,1%,66%)] mt-[2px]">
                                  {dayName}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Title */}
                          <h3 className="text-[20px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-1">
                            {note.title || 'Untitled'}
                          </h3>
                          
                          {/* Body preview - 2 lines max */}
                          <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] line-clamp-2">
                            {preview || 'No content'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
