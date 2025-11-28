import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import backIcon from '@/assets/back.png';
import threeDotsIcon from '@/assets/3dots.png';
import starIcon from '@/assets/star.png';
import addImageIcon from '@/assets/addimage.png';
import sharedIcon from '@/assets/shared.png';
import trashIcon from '@/assets/trash.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

const Note = () => {
  const navigate = useNavigate();
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('Note Title');
  const [weather, setWeather] = useState<{ temp: number; WeatherIcon: React.ComponentType<any> } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [images, setImages] = useState<Array<{id: string, url: string, position: number, width: number}>>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textContentRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const rewriteText = async () => {
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
        setNoteContent(data.rewrittenText);
      }
    } catch (error) {
      console.error('Rewrite error:', error);
    } finally {
      setIsRewriting(false);
    }
  };

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

  // Auto-generate title when user has written enough (only once)
  useEffect(() => {
    if (noteContent.trim().split(/\s+/).length >= 10 && !titleGenerated) {
      generateTitle(noteContent);
    }
  }, [noteContent, titleGenerated]);

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

  // Cleanup image URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const handleBack = () => {
    navigate('/');
  };

  const handleMenuAction = (action: string) => {
    console.log(`Menu action: ${action}`);
    if (action === 'rewrite') {
      rewriteText();
    } else if (action === 'image') {
      fileInputRef.current?.click();
    }
    setMenuOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const id = Date.now().toString();
    
    // Get cursor position, or use end of text
    const textarea = textContentRef.current;
    const position = textarea?.selectionStart ?? noteContent.length;
    
    // Insert a placeholder marker in the text where image will appear
    const before = noteContent.slice(0, position);
    const after = noteContent.slice(position);
    const imageMarker = `\n[IMAGE:${id}]\n`;
    
    setNoteContent(before + imageMarker + after);
    setImages(prev => [...prev, { id, url, position, width: 100 }]); // width as percentage
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const resizeImage = (id: string, width: number) => {
    setImages(prev => prev.map(img => img.id === id ? {...img, width} : img));
  };

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setImageViewerOpen(true);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    document.body.style.overflow = '';
  };

  const renderContentWithImages = () => {
    const parts = noteContent.split(/(\[IMAGE:\d+\])/g);
    const elements: JSX.Element[] = [];
    let textBuffer = '';
    
    parts.forEach((part, index) => {
      const imageMatch = part.match(/\[IMAGE:(\d+)\]/);
      
      if (imageMatch) {
        // Render text before image
        if (textBuffer) {
          elements.push(
            <div key={`text-${index}`} className="whitespace-pre-wrap">
              {textBuffer}
            </div>
          );
          textBuffer = '';
        }
        
        // Render image
        const imageId = imageMatch[1];
        const image = images.find(img => img.id === imageId);
        const imageIndex = images.findIndex(img => img.id === imageId);
        
        if (image) {
          elements.push(
            <div key={`image-${imageId}`} className="relative my-4 group">
              <img 
                src={image.url} 
                alt=""
                className="rounded-[5px] max-w-full cursor-pointer"
                style={{ width: `${image.width}%` }}
                onClick={() => openImageViewer(imageIndex)}
              />
              {/* Resize overlay - shows on tap/hover */}
              <div className="absolute inset-0 bg-black/20 rounded-[5px] opacity-0 group-active:opacity-100 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); resizeImage(image.id, 50); }} 
                    className="bg-white/90 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    Small
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); resizeImage(image.id, 75); }} 
                    className="bg-white/90 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    Medium
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); resizeImage(image.id, 100); }} 
                    className="bg-white/90 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    Full
                  </button>
                </div>
              </div>
            </div>
          );
        }
      } else {
        textBuffer += part;
      }
    });
    
    // Render remaining text
    if (textBuffer) {
      elements.push(
        <div key="text-final" className="whitespace-pre-wrap">
          {textBuffer}
        </div>
      );
    }
    
    return elements;
  };

  // Calculate stats
  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  const characterCount = noteContent.length;
  const paragraphCount = noteContent.trim() ? noteContent.split(/\n\n+/).filter(p => p.trim()).length : 0;

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
          // If clicking directly on the scroll container (not on inputs), blur active element
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'DIV') {
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
            onChange={(e) => setNoteTitle(e.target.value || 'Note Title')}
            className="text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] outline-none bg-transparent border-none w-full disabled:opacity-100 mb-4 focus:outline-none focus:ring-0 -mt-[10px]"
            placeholder="Note Title"
          />
        </div>

        {/* Body text */}
        <div className="px-8 -mt-[10px]">
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          
          <textarea
            ref={textContentRef}
            value={noteContent}
            onChange={(e) => {
              setNoteContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              
              // Scroll cursor into view after a brief delay
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 50);
            }}
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
            placeholder="Start writing..."
            className="w-full resize-none bg-transparent border-none outline-none text-[16px] font-outfit leading-relaxed text-[hsl(0,0%,25%)] placeholder:text-[hsl(0,0%,60%)] focus:outline-none focus:ring-0 overflow-hidden"
            style={{ minHeight: '100px' }}
          />
          
          {/* Render images inline */}
          {images.length > 0 && (
            <div className="mt-4">
              {renderContentWithImages()}
            </div>
          )}
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
              className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={starIcon} alt="" className="w-6 h-6" />
              <span className="text-gray-600 font-outfit">AI Rewrite</span>
            </button>
            <button 
              onClick={() => handleMenuAction('image')} 
              className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={addImageIcon} alt="" className="w-6 h-6" />
              <span className="text-gray-600 font-outfit">Add Image</span>
            </button>
            <button 
              onClick={() => handleMenuAction('share')} 
              className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={sharedIcon} alt="" className="w-6 h-6" />
              <span className="text-gray-600 font-outfit">Share Note</span>
            </button>
            <button 
              onClick={() => handleMenuAction('delete')} 
              className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={trashIcon} alt="" className="w-6 h-6" />
              <span className="text-red-500 font-outfit">Delete Note</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-200 my-3 mx-4" />
          
          {/* Section 2 - Stats */}
          <div className="flex flex-col px-6 gap-2">
            <div className="flex items-center gap-4 py-1">
              <span className="font-outfit font-bold text-gray-400 w-12">{wordCount}</span>
              <span className="font-outfit text-gray-300">Words</span>
            </div>
            <div className="flex items-center gap-4 py-1">
              <span className="font-outfit font-bold text-gray-400 w-12">{characterCount}</span>
              <span className="font-outfit text-gray-300">Characters</span>
            </div>
            <div className="flex items-center gap-4 py-1">
              <span className="font-outfit font-bold text-gray-400 w-12">{paragraphCount}</span>
              <span className="font-outfit text-gray-300">Paragraphs</span>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {imageViewerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center pt-[env(safe-area-inset-top)] animate-in fade-in zoom-in-95 duration-200"
          onClick={closeImageViewer}
        >
          {/* Close button */}
          <button 
            className="absolute top-12 right-4 text-white/80 text-lg font-light z-50"
            onClick={closeImageViewer}
          >
            Done
          </button>
          
          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {currentImageIndex + 1} of {images.length}
            </div>
          )}
          
          {/* Main image */}
          <img 
            src={images[currentImageIndex]?.url} 
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Swipe navigation for multiple images */}
          {images.length > 1 && (
            <>
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-4xl"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentImageIndex(i => Math.max(0, i - 1)); 
                }}
                style={{ visibility: currentImageIndex > 0 ? 'visible' : 'hidden' }}
              >
                ‹
              </button>
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-4xl"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentImageIndex(i => Math.min(images.length - 1, i + 1)); 
                }}
                style={{ visibility: currentImageIndex < images.length - 1 ? 'visible' : 'hidden' }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default Note;
