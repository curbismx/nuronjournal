import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface SavedNote {
  id: string;
  title: string;
  contentBlocks: ContentBlock[];
  createdAt: string;
  updatedAt: string;
  weather?: { temp: number; weatherCode: number };
}
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import backIcon from '@/assets/back.png';
import threeDotsIcon from '@/assets/3dots.png';
import starIcon from '@/assets/star.png';
import addImageIcon from '@/assets/addimage.png';
import sharedIcon from '@/assets/shared.png';
import trashIcon from '@/assets/trash.png';
import newPlusIcon from '@/assets/new_plus.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

type ContentBlock = 
  | { type: 'text'; id: string; content: string }
  | { type: 'image'; id: string; url: string; width: number };

const Note = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const noteIdRef = useRef<string>(id || Date.now().toString());
  const [noteTitle, setNoteTitle] = useState('');
  const [weather, setWeather] = useState<{ temp: number; weatherCode: number; WeatherIcon: React.ComponentType<any> } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { type: 'text', id: 'initial', content: '' }
  ]);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  const resizingIdRef = useRef<string | null>(null);

  const generateTitle = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-title', {
        body: { text },
      });

      if (error) {
        console.error('Title generation error:', error);
        return;
      }

      if (data.title) {
        setNoteTitle(data.title);
        setTitleGenerated(true);
      }
    } catch (error) {
      console.error('Title generation error:', error);
    }
  };

  // Get combined note content from all text blocks
  const getNoteContent = () => {
    return contentBlocks
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; id: string; content: string }).content)
      .join('\n\n');
  };

  const rewriteText = async () => {
    const noteContent = getNoteContent();
    if (!noteContent || noteContent.trim().length === 0) {
      return;
    }

    setIsRewriting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rewrite-text', {
        body: { text: noteContent },
      });

      if (error) throw error;

      if (data.rewrittenText) {
        // Replace all text blocks with the rewritten content
        setContentBlocks([{ type: 'text', id: Date.now().toString(), content: data.rewrittenText }]);
        
        // Resize textarea after content updates
        setTimeout(() => {
          const textareas = document.querySelectorAll('.note-textarea');
          textareas.forEach((textarea) => {
            const el = textarea as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = Math.max(24, el.scrollHeight) + 'px';
          });
        }, 50);
      }
    } catch (error) {
      console.error('Rewrite error:', error);
    } finally {
      setIsRewriting(false);
    }
  };

  const shareNote = async () => {
    const noteContent = getNoteContent();
    const shareData = {
      title: noteTitle,
      text: noteContent,
    };

    // Check if Web Share API is available
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        console.log('Share completed via Web Share API');
      } catch (error) {
        // User cancelled or share failed - silently handle
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback: Silently copy to clipboard
      console.log('Web Share API not available, using clipboard fallback');
      try {
        const textToCopy = `${noteTitle}\n\n${noteContent}`;
        await navigator.clipboard.writeText(textToCopy);
        console.log('Note copied to clipboard successfully');
      } catch (error) {
        console.error('Copy to clipboard failed:', error);
      }
    }
  };

  // Load existing note on mount
  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem('nuron-notes');
      if (stored) {
        const notes: SavedNote[] = JSON.parse(stored);
        const existingNote = notes.find(n => n.id === id);
        if (existingNote) {
          setNoteTitle(existingNote.title);
          setContentBlocks(existingNote.contentBlocks);
          setTitleGenerated(true);
        }
      }
    }
  }, [id]);

  // Auto-resize textareas when a note is loaded (triggered by id change)
  useEffect(() => {
    const timer = setTimeout(() => {
      const textareas = document.querySelectorAll('.note-textarea');
      textareas.forEach((textarea) => {
        const el = textarea as HTMLTextAreaElement;
        el.style.height = 'auto';
        el.style.height = Math.max(24, el.scrollHeight) + 'px';
      });
    }, 50);
    
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    // Fetch weather data
    const fetchWeather = async () => {
      try {
        // Get user's location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Fetch weather from Open-Meteo (free, no API key)
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`
            );
            const data = await response.json();
            
            // Map weather codes to Lucide icons
            const weatherCode = data.current.weather_code;
            let WeatherIcon = Sun; // default sunny
            
            if (weatherCode >= 61 && weatherCode <= 67) WeatherIcon = CloudRain; // rain
            else if (weatherCode >= 71 && weatherCode <= 77) WeatherIcon = CloudSnow; // snow
            else if (weatherCode >= 80 && weatherCode <= 82) WeatherIcon = CloudRain; // showers
            else if (weatherCode >= 51 && weatherCode <= 57) WeatherIcon = CloudDrizzle; // drizzle
            else if (weatherCode >= 2 && weatherCode <= 3) WeatherIcon = Cloud; // partly cloudy
            else if (weatherCode === 45 || weatherCode === 48) WeatherIcon = CloudFog; // fog
            else if (weatherCode >= 95) WeatherIcon = CloudLightning; // thunderstorm
            
            setWeather({
              temp: Math.round(data.current.temperature_2m),
              weatherCode,
              WeatherIcon
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
          }
        );
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    };
    
    fetchWeather();
  }, []);

  // Keep ref in sync
  useEffect(() => {
    resizingIdRef.current = resizingId;
  }, [resizingId]);

  // Auto-generate title when user has written enough (only once)
  useEffect(() => {
    const noteContent = getNoteContent();
    if (noteContent.trim().split(/\s+/).length >= 10 && !titleGenerated) {
      generateTitle(noteContent);
    }
  }, [contentBlocks, titleGenerated]);

  // Click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Save note function
  const saveNote = () => {
    const noteContent = getNoteContent();
    // Only save if there's actual content
    if (!noteContent.trim() && contentBlocks.filter(b => b.type === 'image').length === 0) {
      return;
    }

    const notes: SavedNote[] = JSON.parse(localStorage.getItem('nuron-notes') || '[]');
    const noteData: SavedNote = {
      id: noteIdRef.current,
      title: noteTitle,
      contentBlocks,
      createdAt: id && notes.find(n => n.id === id)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weather: weather ? { temp: weather.temp, weatherCode: weather.weatherCode } : undefined,
    };
    
    const existingIndex = notes.findIndex(n => n.id === noteIdRef.current);
    if (existingIndex >= 0) {
      notes[existingIndex] = noteData;
    } else {
      notes.unshift(noteData);
    }
    
    localStorage.setItem('nuron-notes', JSON.stringify(notes));
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      saveNote();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [noteTitle, contentBlocks]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (imageViewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [imageViewerOpen]);

  const handleBack = () => {
    saveNote();
    navigate('/');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const imageId = Date.now().toString();
    const newTextId = (Date.now() + 1).toString();
    
    setContentBlocks(prev => [
      ...prev,
      { type: 'image', id: imageId, url, width: 100 },
      { type: 'text', id: newTextId, content: '' }
    ]);
    
    e.target.value = '';
  };

  const startResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setResizingId(id);
    resizeStartX.current = e.clientX;
    const block = contentBlocks.find(b => b.type === 'image' && b.id === id) as { type: 'image'; id: string; url: string; width: number } | undefined;
    resizeStartWidth.current = block?.width ?? 100;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingIdRef.current) return;
    
    const deltaX = e.clientX - resizeStartX.current;
    const containerWidth = scrollContainerRef.current?.clientWidth ?? 300;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newWidth = Math.min(100, Math.max(30, resizeStartWidth.current + deltaPercent));
    
    setContentBlocks(prev => prev.map(block => 
      block.type === 'image' && block.id === resizingIdRef.current 
        ? { ...block, width: newWidth } 
        : block
    ));
  };

  const handleMouseUp = () => {
    setResizingId(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const startResizeTouch = (e: React.TouchEvent, id: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    setResizingId(id);
    resizeStartX.current = touch.clientX;
    const block = contentBlocks.find(b => b.type === 'image' && b.id === id) as { type: 'image'; id: string; url: string; width: number } | undefined;
    resizeStartWidth.current = block?.width ?? 100;
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!resizingIdRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - resizeStartX.current;
    const containerWidth = scrollContainerRef.current?.clientWidth ?? 300;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newWidth = Math.min(100, Math.max(30, resizeStartWidth.current + deltaPercent));
    
    setContentBlocks(prev => prev.map(block => 
      block.type === 'image' && block.id === resizingIdRef.current 
        ? { ...block, width: newWidth } 
        : block
    ));
  };

  const handleTouchEnd = () => {
    setResizingId(null);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  const handleMenuAction = (action: string) => {
    console.log(`Menu action: ${action}`);
    if (action === 'rewrite') {
      rewriteText();
    } else if (action === 'image') {
      fileInputRef.current?.click();
    } else if (action === 'share') {
      shareNote();
    }
    setMenuOpen(false);
  };

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setImageViewerOpen(true);
  };

  const handleViewerTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleViewerTouchEnd = (e: React.TouchEvent) => {
    const images = contentBlocks.filter(b => b.type === 'image') as Array<{ type: 'image'; id: string; url: string; width: number }>;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && currentImageIndex > 0) {
        // Swiped right - go to previous
        setCurrentImageIndex(i => i - 1);
      } else if (deltaX < 0 && currentImageIndex < images.length - 1) {
        // Swiped left - go to next
        setCurrentImageIndex(i => i + 1);
      }
    }
  };

  // Calculate stats
  const noteContent = getNoteContent();
  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  const characterCount = noteContent.length;
  const paragraphCount = noteContent.trim() ? noteContent.split(/\n\n+/).filter(p => p.trim()).length : 0;
  
  // Get images for viewer
  const images = contentBlocks.filter(b => b.type === 'image') as Array<{ type: 'image'; id: string; url: string; width: number }>;

  const today = new Date();
  const dayNumber = today.getDate();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="fixed inset-0 flex flex-col bg-journal-header overflow-hidden">
      {/* Fixed dark header */}
      <header className="flex-shrink-0 bg-journal-header pl-[30px] pt-[30px] pr-4 pb-[30px] h-[150px] z-30">
        <div className="flex items-center justify-between mb-auto -mt-[15px]">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-journal-header-foreground hover:bg-journal-header-foreground/10 p-0 h-auto w-auto"
          >
            <img src={backIcon} alt="Back" className="w-[30px] h-[30px]" />
          </Button>
          <div className="flex-1" />
        </div>
        <div className="relative mt-[41px]">
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px]">
            {monthYear}
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
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-scroll bg-journal-content rounded-t-[30px] overscroll-y-auto z-40 -mt-[25px] transition-shadow duration-300 ${isRewriting ? 'ai-rewriting' : ''}`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          minHeight: 0
        }}
        onClick={(e) => {
          // Only close menu and blur if clicking directly on the scroll container itself
          // Not on any child elements (which would interfere with text selection)
          if (e.target === e.currentTarget) {
            setMenuOpen(false);
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }
        }}
      >
        <div style={{ minHeight: 'calc(100% + 1px)' }}>
          {/* Date and weather */}
          <div className="px-8 pt-[12px] pb-2">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-[72px] font-outfit font-bold leading-none text-[hsl(60,1%,66%)]">{dayNumber}</div>
            <div className="flex flex-col">
              <div className="text-[20px] font-outfit font-light tracking-wide text-[hsl(60,1%,66%)] mt-[2px]">{dayName}</div>
              {weather && (
                <div className="flex items-center gap-1.5 mt-1">
                  <weather.WeatherIcon size={20} className="text-[hsl(60,1%,66%)]" />
                  <span className="text-[16px] font-outfit font-light text-[hsl(60,1%,66%)]">{weather.temp}°C</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note Title"
            className="text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] outline-none bg-transparent border-none w-full mb-4 focus:outline-none focus:ring-0 -mt-[10px] placeholder:text-[hsl(60,1%,66%)]"
          />
        </div>

        {/* Content blocks - text and images */}
        <div className="px-8 -mt-[10px]">
          {contentBlocks.map((block, index) => {
            if (block.type === 'text') {
              return (
                <textarea
                  key={block.id}
                  value={block.content}
                  onChange={(e) => {
                    const newBlocks = [...contentBlocks];
                    newBlocks[index] = { ...block, content: e.target.value };
                    setContentBlocks(newBlocks);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.max(24, e.target.scrollHeight) + 'px';
                  }}
                  placeholder={index === 0 ? "Start writing..." : ""}
                  className="note-textarea w-full resize-none bg-transparent border-none outline-none text-[16px] font-outfit leading-relaxed text-[hsl(0,0%,25%)] placeholder:text-[hsl(0,0%,60%)] focus:outline-none focus:ring-0 overflow-hidden"
                  style={{ minHeight: '24px' }}
                />
              );
            } else {
              return (
                <div 
                  key={block.id} 
                  className="relative my-4 inline-block"
                  style={{ width: `${block.width}%` }}
                >
                  <img 
                    src={block.url} 
                    alt=""
                    className="rounded-[10px] w-full h-auto block cursor-pointer"
                    onClick={() => {
                      const imageIndex = contentBlocks
                        .filter(b => b.type === 'image')
                        .findIndex(b => b.id === block.id);
                      openImageViewer(imageIndex);
                    }}
                  />
                  
                  {/* Resize handle */}
                  <div
                    className="absolute bottom-2 right-2 w-6 h-6 cursor-se-resize touch-none"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startResize(e, block.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startResizeTouch(e, block.id);
                    }}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-full h-full text-white drop-shadow-md"
                      fill="currentColor"
                    >
                      <path d="M22 22H6L22 6V22Z" fillOpacity="0.8"/>
                      <path d="M22 22H6L22 6V22Z" stroke="rgba(0,0,0,0.2)" strokeWidth="1" fill="none"/>
                    </svg>
                  </div>
                </div>
              );
            }
          })}
        </div>
        
        {/* Spacer */}
        <div className="h-[40px] flex-shrink-0" />
        <div className="h-[1px]" />
        </div>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div 
          ref={menuRef}
          className="fixed right-[20px] top-[140px] z-50 bg-white rounded-2xl shadow-lg py-4 w-[220px] animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* Section 1 - Actions */}
          <div className="flex flex-col">
            <button 
              onClick={() => handleMenuAction('rewrite')} 
              className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={starIcon} alt="" className="w-6 h-6" />
              <span className="text-gray-600 font-outfit">AI Rewrite</span>
            </button>
            <button 
              onClick={() => handleMenuAction('image')} 
              className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={addImageIcon} alt="" className="w-6 h-6" />
              <span className="text-gray-600 font-outfit">Add Image</span>
            </button>
            <button 
              onClick={() => handleMenuAction('share')} 
              className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={sharedIcon} alt="" className="w-6 h-6" />
              <span className="text-gray-600 font-outfit">Share Note</span>
            </button>
            <button 
              onClick={() => handleMenuAction('delete')} 
              className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={trashIcon} alt="" className="w-6 h-6" />
              <span className="text-red-500 font-outfit">Delete Note</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-200 my-3 mx-4" />
          
          {/* Section 2 - Stats */}
          <div className="flex flex-col px-6 gap-2">
            <div className="flex items-center gap-2 py-1">
              <span className="font-outfit font-bold text-gray-400 w-12">{wordCount}</span>
              <span className="font-outfit text-gray-300">Words</span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <span className="font-outfit font-bold text-gray-400 w-12">{characterCount}</span>
              <span className="font-outfit text-gray-300">Characters</span>
            </div>
            <div className="flex items-center gap-2 py-1">
              <span className="font-outfit font-bold text-gray-400 w-12">{paragraphCount}</span>
              <span className="font-outfit text-gray-300">Paragraphs</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Fullscreen image viewer */}
      {imageViewerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black animate-in fade-in duration-200"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          onTouchStart={handleViewerTouchStart}
          onTouchEnd={handleViewerTouchEnd}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setImageViewerOpen(false);
            }
          }}
        >
          {/* Header bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4 z-10">
            {/* Image counter */}
            <div className="text-white/70 text-sm font-outfit">
              {images.length > 1 ? `${currentImageIndex + 1} of ${images.length}` : ''}
            </div>
            
            {/* Done button */}
            <button 
              className="text-white text-[17px] font-outfit font-medium"
              onClick={() => setImageViewerOpen(false)}
            >
              Done
            </button>
          </div>
          
          {/* Main image */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img 
              src={images[currentImageIndex]?.url} 
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Navigation arrows for desktop/fallback */}
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/60 text-3xl"
                  onClick={() => setCurrentImageIndex(i => i - 1)}
                >
                  ‹
                </button>
              )}
              {currentImageIndex < images.length - 1 && (
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/60 text-3xl"
                  onClick={() => setCurrentImageIndex(i => i + 1)}
                >
                  ›
                </button>
              )}
            </>
          )}
          
          {/* Dot indicators for multiple images */}
          {images.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
              {images.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating add button */}
      <img 
        src={newPlusIcon} 
        alt="Add Note"
        onClick={async () => {
          await saveNote();
          // Reset state for new note
          noteIdRef.current = Date.now().toString();
          setNoteTitle('');
          setContentBlocks([{ type: 'text', id: 'initial', content: '' }]);
          setTitleGenerated(false);
          setMenuOpen(false);
          // Navigate to new note route
          navigate('/note', { state: { newNote: Date.now() } });
        }}
        className="fixed bottom-[30px] right-[30px] z-50 cursor-pointer w-[51px] h-[51px]"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
        }}
      />

    </div>
  );
};

export default Note;
