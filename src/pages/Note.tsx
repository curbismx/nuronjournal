import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import backIcon from '@/assets/back.png';
import imageButton2 from '@/assets/image-2.png';
import rewriteButton2 from '@/assets/rewrite-2.png';
import shareButton2 from '@/assets/share-2.png';
import threeDotsIcon from '@/assets/3dots.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

const Note = () => {
  const navigate = useNavigate();
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('Note Title');
  const [weather, setWeather] = useState<{ temp: number; WeatherIcon: React.ComponentType<any> } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textContentRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Auto-generate title when user has written enough
  useEffect(() => {
    if (noteContent.trim().split(/\s+/).length >= 10 && noteTitle === 'Note Title') {
      generateTitle(noteContent);
    }
  }, [noteContent, noteTitle]);

  useEffect(() => {
    // Detect keyboard on iOS/Android
    const handleResize = () => {
      // If visual viewport is smaller than window, keyboard is likely open
      if (window.visualViewport) {
        const keyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;
        setKeyboardVisible(keyboardOpen);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    
    // Also listen for focus events as backup
    const handleFocus = () => setKeyboardVisible(true);
    const handleBlur = () => {
      setTimeout(() => setKeyboardVisible(false), 100);
    };
    
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  const handleBack = () => {
    navigate('/');
  };

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
        <div className="flex items-center justify-between mt-[41px]">
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none">
            {monthYear}
          </h1>
          <img src={threeDotsIcon} alt="Menu" className="w-[24px] h-[24px] mr-[30px]" />
        </div>
      </header>

      {/* Scrollable content area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll bg-journal-content rounded-t-[30px] overscroll-y-auto z-40 -mt-[25px]"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          minHeight: 0
        }}
        onClick={(e) => {
          // If clicking directly on the scroll container (not on inputs), blur active element
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'DIV') {
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
        </div>
        
        {/* Spacer to prevent content from being hidden behind bottom controls */}
        <div className={keyboardVisible ? "h-[60px] flex-shrink-0" : "h-[120px] flex-shrink-0"} />
        <div className="h-[1px]" />
        </div>
      </div>

      {/* Fixed bottom controls */}
      <div 
        className="fixed left-[30px] right-[30px] z-40 flex justify-between items-center gap-[10px] transition-all duration-300"
        style={{ bottom: keyboardVisible ? '10px' : '30px' }}
      >
        <button className="flex flex-col items-center gap-2">
          <img src={imageButton2} alt="Image" className="h-auto" />
        </button>
        <button 
          onClick={rewriteText}
          disabled={isRewriting}
          className="flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <img src={rewriteButton2} alt="Rewrite" className="h-auto" />
        </button>
        <button className="flex flex-col items-center gap-2">
          <img src={shareButton2} alt="Share" className="h-auto" />
        </button>
      </div>
    </div>
  );
};

export default Note;
