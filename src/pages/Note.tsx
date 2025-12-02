import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from "@supabase/supabase-js";
import DatePicker from '@/components/DatePicker';

interface SavedNote {
  id: string;
  title: string;
  contentBlocks: ContentBlock[];
  createdAt: string;
  updatedAt: string;
  weather?: { temp: number; weatherCode: number };
  audioData?: string | null;
}
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import backIcon from '@/assets/00backbutton-3.png';
import threeDotsIcon from '@/assets/00threedots-3.png';
import starIcon from '@/assets/star.png';
import addImageIcon from '@/assets/addimage.png';
import sharedIcon from '@/assets/shared.png';
import trashIcon from '@/assets/trash.png';
import newPlusIcon from '@/assets/00plus-3.png';
import plusIconGreen from "@/assets/00plus_green.png";
import plusIconBlue from "@/assets/00plus_blue.png";
import plusIconPink from "@/assets/00plus_pink.png";
import recordIcon from '@/assets/01record.png';
import pauseIcon from '@/assets/01pause.png';
import playIcon from '@/assets/01play.png';
import stopIcon from '@/assets/01stop.png';
import noteRecordRed from '@/assets/01noterecord_red.png';
import noteRecordGreen from '@/assets/01noterecord_green.png';
import noteRecordBlue from '@/assets/01noterecord_blue.png';
import noteRecordPink from '@/assets/01noterecord_pink.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

type ContentBlock = 
  | { type: 'text'; id: string; content: string }
  | { type: 'image'; id: string; url: string; width: number };

const Note = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const noteIdRef = useRef<string>(id || crypto.randomUUID());
  const [user, setUser] = useState<User | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDate, setNoteDate] = useState<Date>(new Date());
  const [weather, setWeather] = useState<{ temp: number; weatherCode: number; WeatherIcon: React.ComponentType<any> } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { type: 'text', id: 'initial', content: '' }
  ]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showWeatherSetting, setShowWeatherSetting] = useState(() => {
    const stored = localStorage.getItem('nuron-show-weather');
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [theme] = useState<'default' | 'green' | 'blue' | 'pink'>(() => {
    const stored = localStorage.getItem('nuron-theme');
    return (stored as 'default' | 'green' | 'blue' | 'pink') || 'default';
  });

  const themeColors = {
    default: '#2E2E2E',
    green: '#8DBA55',
    blue: '#6BA8D8',
    pink: '#E88BAD'
  };

  const themePlusIcons = {
    default: newPlusIcon,
    green: plusIconGreen,
    blue: plusIconBlue,
    pink: plusIconPink
  };

  const themeRecordIcons = {
    default: noteRecordRed,
    green: noteRecordGreen,
    blue: noteRecordBlue,
    pink: noteRecordPink
  };

  // Recording state
  const [isRecordingModuleOpen, setIsRecordingModuleOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTextBlockRef = useRef<{ id: string; cursorPosition: number } | null>(null);
  const isDeletedRef = useRef(false);
  const existingCreatedAt = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

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
        setContentBlocks([{ type: 'text', id: crypto.randomUUID(), content: data.rewrittenText }]);
        
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

  // Recording helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    // Start speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-GB';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setContentBlocks(prev => {
          const lastBlock = prev[prev.length - 1];
          if (lastBlock && lastBlock.type === 'text') {
            const currentContent = (lastBlock as { type: 'text'; id: string; content: string }).content;
            const baseContent = currentContent.replace(/\|\|.*$/, '').trimEnd();
            
            let newContent = baseContent;
            if (finalTranscript) {
              newContent = baseContent ? baseContent + ' ' + finalTranscript : finalTranscript;
            }
            if (interimTranscript) {
              newContent = newContent + '||' + interimTranscript;
            }
            
            return [
              ...prev.slice(0, -1),
              { ...lastBlock, content: newContent }
            ];
          }
          return prev;
        });
      };
      
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      };
      
      recognition.start();
    }
    
    // Audio recording - simplified, no MIME type detection needed for data URLs
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.start(1000);
    } catch (error) {
      console.error('Recording error:', error);
    }
    
    setIsRecording(true);
    isRecordingRef.current = true;
    setIsPaused(false);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    isRecordingRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    
    // Clean up interim markers
    setContentBlocks(prev => {
      const lastBlock = prev[prev.length - 1];
      if (lastBlock && lastBlock.type === 'text') {
        const content = (lastBlock as { type: 'text'; id: string; content: string }).content;
        const cleanContent = content.replace(/\|\|.*$/, '').trimEnd();
        return [
          ...prev.slice(0, -1),
          { ...lastBlock, content: cleanContent }
        ];
      }
      return prev;
    });
    
    setIsPaused(true);
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    isRecordingRef.current = true;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('Resume recognition failed:', e);
      }
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    
    setIsPaused(false);
    setIsRecording(true);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Stop timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    // Clean up interim markers
    setContentBlocks(prev => {
      const lastBlock = prev[prev.length - 1];
      if (lastBlock && lastBlock.type === 'text') {
        const content = (lastBlock as { type: 'text'; id: string; content: string }).content;
        const cleanContent = content.replace(/\|\|.*$/, '').trimEnd();
        return [
          ...prev.slice(0, -1),
          { ...lastBlock, content: cleanContent }
        ];
      }
      return prev;
    });
    
    // Create audio data URL (works on iOS Safari)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current);
          const dataUrl = await blobToDataUrl(blob);
          setAudioDataUrl(dataUrl);
        }
      };
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  const playRecording = () => {
    if (!audioDataUrl) return;
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    const audio = new Audio(audioDataUrl);
    audioElementRef.current = audio;
    
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    setIsPlaying(true);
    audio.play().catch(() => setIsPlaying(false));
  };

  const pausePlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsPlaying(false);
  };

  const openRecordingModule = () => {
    setIsRecordingModuleOpen(true);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  // Load existing note on mount
  useEffect(() => {
    if (id) {
      noteIdRef.current = id;  // Ensure ref matches the loaded note ID
      
      // Try loading from Supabase first if logged in
      if (user) {
        supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              setNoteTitle(data.title || '');
              setContentBlocks(data.content_blocks as ContentBlock[]);
              setTitleGenerated(true);
              setNoteDate(new Date(data.created_at));
              existingCreatedAt.current = data.created_at;
              
              // Load saved audio - use data URL directly
              if (data.audio_data) {
                setAudioDataUrl(data.audio_data);
              }
            }
          });
      } else {
        // Fall back to localStorage
        const stored = localStorage.getItem('nuron-notes');
        if (stored) {
          const notes: SavedNote[] = JSON.parse(stored);
          const existingNote = notes.find(n => n.id === id);
          if (existingNote) {
            setNoteTitle(existingNote.title);
            setContentBlocks(existingNote.contentBlocks);
            setTitleGenerated(true);
            setNoteDate(new Date(existingNote.createdAt));
            existingCreatedAt.current = existingNote.createdAt;
            
            // Load saved audio - use data URL directly
            if (existingNote.audioData) {
              setAudioDataUrl(existingNote.audioData);
            }
          }
        }
      }
    }
  }, [id, user]);

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
  }, [id, contentBlocks]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            const today = new Date();
            const isToday = noteDate.getDate() === today.getDate() &&
                           noteDate.getMonth() === today.getMonth() &&
                           noteDate.getFullYear() === today.getFullYear();
            
            let temp: number;
            let weatherCode: number;
            
            if (isToday) {
              // Today: fetch current weather
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`
              );
              const data = await response.json();
              temp = Math.round(data.current.temperature_2m);
              weatherCode = data.current.weather_code;
            } else {
              // Past day: fetch daily high and dominant weather for that date
              const dateStr = noteDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,weather_code&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
              );
              const data = await response.json();
              temp = Math.round(data.daily.temperature_2m_max[0]);
              weatherCode = data.daily.weather_code[0];
            }
            
            let WeatherIcon = Sun;
            if (weatherCode >= 61 && weatherCode <= 67) WeatherIcon = CloudRain;
            else if (weatherCode >= 71 && weatherCode <= 77) WeatherIcon = CloudSnow;
            else if (weatherCode >= 80 && weatherCode <= 82) WeatherIcon = CloudRain;
            else if (weatherCode >= 51 && weatherCode <= 57) WeatherIcon = CloudDrizzle;
            else if (weatherCode >= 2 && weatherCode <= 3) WeatherIcon = Cloud;
            else if (weatherCode === 45 || weatherCode === 48) WeatherIcon = CloudFog;
            else if (weatherCode >= 95) WeatherIcon = CloudLightning;
            
            setWeather({
              temp,
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
  }, [noteDate]);

  // Auto-generate title when user has written enough (only once)
  useEffect(() => {
    const noteContent = getNoteContent();
    if (noteContent.trim().split(/\s+/).length >= 10 && !titleGenerated && !titleManuallyEdited) {
      generateTitle(noteContent);
    }
  }, [contentBlocks, titleGenerated, titleManuallyEdited]);


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
  const saveNote = async () => {
    if (isDeletedRef.current) return;
    
    const noteContent = getNoteContent();
    if (!noteContent.trim() && contentBlocks.filter(b => b.type === 'image').length === 0) {
      return;
    }

    // Audio is already a data URL, use it directly
    const audioBase64 = audioDataUrl;

    const noteData = {
      id: noteIdRef.current,
      title: noteTitle,
      contentBlocks,
      createdAt: existingCreatedAt.current || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weather: weather ? { temp: weather.temp, weatherCode: weather.weatherCode } : undefined,
      audioData: audioBase64,
    };

    // ALWAYS check auth directly - don't use React state
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Logged in - save to Supabase
      const { error } = await supabase.from('notes').upsert({
        id: noteData.id,
        user_id: session.user.id,
        title: noteData.title,
        content_blocks: noteData.contentBlocks,
        created_at: noteData.createdAt,
        updated_at: noteData.updatedAt,
        weather: noteData.weather,
        audio_data: noteData.audioData
      });
      
      if (!error) {
        // UPDATE LOCAL CACHE so Index loads instantly
        const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
        const existingIndex = cached.findIndex((n: any) => n.id === noteData.id);
        if (existingIndex >= 0) {
          cached[existingIndex] = noteData;
        } else {
          cached.unshift(noteData);
        }
        localStorage.setItem('nuron-notes-cache', JSON.stringify(cached));
      }
      
      if (error) console.error('Error saving to Supabase:', error);
    } else {
      // Not logged in - save to localStorage
      const notes = JSON.parse(localStorage.getItem('nuron-notes') || '[]');
      const existingIndex = notes.findIndex((n: any) => n.id === noteIdRef.current);
      if (existingIndex >= 0) {
        notes[existingIndex] = noteData;
      } else {
        notes.unshift(noteData);
      }
      localStorage.setItem('nuron-notes', JSON.stringify(notes));
    }
  };

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

  const handleBack = async () => {
    await saveNote();
    navigate('/');
  };

  const handleDateSelect = (newDate: Date) => {
    setNoteDate(newDate);
    existingCreatedAt.current = newDate.toISOString();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const imageId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop();
    const fileName = `${imageId}.${fileExt}`;
    const newTextId = crypto.randomUUID();
    
    let url: string;
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('note-images')
        .upload(`${session.user.id}/${fileName}`, file);
      
      if (error) {
        console.error('Error uploading image:', error);
        return;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(`${session.user.id}/${fileName}`);
      
      url = publicUrl;
    } else {
      // Not logged in - use local blob URL (won't sync)
      url = URL.createObjectURL(file);
    }
    
    // Check if we have a cursor position
    if (activeTextBlockRef.current) {
      const { id: blockId, cursorPosition } = activeTextBlockRef.current;
      const blockIndex = contentBlocks.findIndex(b => b.id === blockId);
      
      if (blockIndex !== -1) {
        const block = contentBlocks[blockIndex];
        if (block.type === 'text') {
          // Split the text at cursor position
          const textBefore = block.content.slice(0, cursorPosition);
          const textAfter = block.content.slice(cursorPosition);
          
          // Create new blocks array with image inserted at cursor
          const newBlocks = [
            ...contentBlocks.slice(0, blockIndex),
            { type: 'text' as const, id: block.id, content: textBefore },
            { type: 'image' as const, id: imageId, url, width: 100 },
            { type: 'text' as const, id: newTextId, content: textAfter },
            ...contentBlocks.slice(blockIndex + 1)
          ];
          
          setContentBlocks(newBlocks);
          e.target.value = '';
          activeTextBlockRef.current = null;
          
          // Resize all textareas after adding image
          setTimeout(() => {
            const textareas = document.querySelectorAll('.note-textarea');
            textareas.forEach((textarea) => {
              const el = textarea as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = Math.max(24, el.scrollHeight) + 'px';
            });
          }, 50);
          return;
        }
      }
    }
    
    // Fallback: add to end if no cursor position
    setContentBlocks(prev => [
      ...prev,
      { type: 'image', id: imageId, url, width: 100 },
      { type: 'text', id: newTextId, content: '' }
    ]);
    
    e.target.value = '';
    
    // Resize all textareas after adding image
    setTimeout(() => {
      const textareas = document.querySelectorAll('.note-textarea');
      textareas.forEach((textarea) => {
        const el = textarea as HTMLTextAreaElement;
        el.style.height = 'auto';
        el.style.height = Math.max(24, el.scrollHeight) + 'px';
      });
    }, 50);
  };

  const startResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const block = contentBlocks.find(b => b.type === 'image' && b.id === id) as { type: 'image'; id: string; url: string; width: number } | undefined;
    const startWidth = block?.width ?? 100;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = scrollContainerRef.current?.clientWidth ?? 300;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(100, Math.max(30, startWidth + deltaPercent));
      
      setContentBlocks(prev => prev.map(b => 
        b.type === 'image' && b.id === id ? { ...b, width: newWidth } : b
      ));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startResizeTouch = (e: React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const block = contentBlocks.find(b => b.type === 'image' && b.id === id) as { type: 'image'; id: string; url: string; width: number } | undefined;
    const startWidth = block?.width ?? 100;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      const deltaX = moveTouch.clientX - startX;
      const containerWidth = scrollContainerRef.current?.clientWidth ?? 300;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(100, Math.max(30, startWidth + deltaPercent));
      
      setContentBlocks(prev => prev.map(b => 
        b.type === 'image' && b.id === id ? { ...b, width: newWidth } : b
      ));
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMenuAction = (action: string) => {
    console.log(`Menu action: ${action}`);
    if (action === 'rewrite') {
      rewriteText();
    } else if (action === 'image') {
      fileInputRef.current?.click();
    } else if (action === 'share') {
      shareNote();
    } else if (action === 'delete') {
      setShowDeleteConfirm(true);
    }
    setMenuOpen(false);
  };

  const deleteNote = async () => {
    isDeletedRef.current = true;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Clean up images from storage
      const imageBlocks = contentBlocks.filter(b => b.type === 'image') as Array<{ type: 'image'; id: string; url: string; width: number }>;
      
      for (const imageBlock of imageBlocks) {
        // Check if URL is from Supabase Storage
        if (imageBlock.url.includes('supabase.co/storage')) {
          try {
            // Extract file path from URL
            const urlParts = imageBlock.url.split('/storage/v1/object/public/note-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              await supabase.storage.from('note-images').remove([filePath]);
            }
          } catch (error) {
            console.error('Error deleting image from storage:', error);
          }
        }
      }
      
      // LOGGED IN: Delete from Supabase
      await supabase.from('notes').delete().eq('id', noteIdRef.current);
      // Also update cache for instant UI update
      const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
      const filtered = cached.filter((n: any) => n.id !== noteIdRef.current);
      localStorage.setItem('nuron-notes-cache', JSON.stringify(filtered));
    } else {
      // NOT LOGGED IN: Delete from localStorage only
      const notes = JSON.parse(localStorage.getItem('nuron-notes') || '[]');
      const filtered = notes.filter((n: any) => n.id !== noteIdRef.current);
      localStorage.setItem('nuron-notes', JSON.stringify(filtered));
    }
    
    navigate('/');
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

  const dayNumber = noteDate.getDate().toString().padStart(2, '0');
  const dayName = noteDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthYear = noteDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: themeColors[theme] }}>
      {/* Fixed dark header */}
      <header className="flex-shrink-0 pl-[30px] pt-[30px] pr-4 pb-[30px] h-[150px] z-30" style={{ backgroundColor: themeColors[theme] }}>
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
          <div 
            className="flex items-start gap-4 mb-4 cursor-pointer"
            onClick={() => setDatePickerOpen(true)}
          >
            <div className="text-[72px] font-outfit font-bold leading-none text-[hsl(60,1%,66%)]">{dayNumber}</div>
            <div className="flex flex-col">
              <div className="text-[20px] font-outfit font-light tracking-wide text-[hsl(60,1%,66%)] mt-[2px]">{dayName}</div>
              {weather && showWeatherSetting && (
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
            onChange={(e) => {
              setNoteTitle(e.target.value);
              setTitleManuallyEdited(true);
            }}
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
                  rows={1}
                  value={block.content}
                  onChange={(e) => {
                    const newBlocks = [...contentBlocks];
                    newBlocks[index] = { ...block, content: e.target.value };
                    setContentBlocks(newBlocks);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.max(24, e.target.scrollHeight) + 'px';
                  }}
                  onFocus={(e) => {
                    activeTextBlockRef.current = { id: block.id, cursorPosition: e.target.selectionStart };
                  }}
                  onSelect={(e) => {
                    activeTextBlockRef.current = { id: block.id, cursorPosition: (e.target as HTMLTextAreaElement).selectionStart };
                  }}
                  onBlur={() => {
                    // Keep the last position, don't clear it
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      const textarea = e.target as HTMLTextAreaElement;
                      // Check if cursor is at the very start with no selection
                      if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
                        // Find the block before this one
                        if (index > 0) {
                          const prevBlock = contentBlocks[index - 1];
                          if (prevBlock.type === 'image') {
                            e.preventDefault();
                            // Remove the image
                            setContentBlocks(prev => prev.filter(b => b.id !== prevBlock.id));
                          } else if (prevBlock.type === 'text') {
                            e.preventDefault();
                            // Merge with previous text block
                            const prevContent = prevBlock.content;
                            const currentContent = block.content;
                            const mergedContent = prevContent + currentContent;
                            const cursorPosition = prevContent.length;
                            
                            // Remove current block and update previous block with merged content
                            setContentBlocks(prev => prev
                              .filter(b => b.id !== block.id)
                              .map(b => b.id === prevBlock.id ? { ...b, content: mergedContent } : b)
                            );
                            
                            // Focus the previous textarea and set cursor position after React updates
                            setTimeout(() => {
                              const textareas = document.querySelectorAll('.note-textarea');
                              const prevTextarea = textareas[index - 1] as HTMLTextAreaElement;
                              if (prevTextarea) {
                                prevTextarea.focus();
                                prevTextarea.selectionStart = cursorPosition;
                                prevTextarea.selectionEnd = cursorPosition;
                                // Resize the merged textarea
                                prevTextarea.style.height = 'auto';
                                prevTextarea.style.height = Math.max(24, prevTextarea.scrollHeight) + 'px';
                              }
                            }, 10);
                          }
                        }
                      }
                    }
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
                    className="absolute bottom-2 right-2 w-6 h-6 cursor-se-resize"
                    style={{ touchAction: 'manipulation' }}
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

      {/* Floating record button */}
      {!isRecordingModuleOpen && (
        <img 
          src={themeRecordIcons[theme]} 
          alt="Record"
          onClick={openRecordingModule}
          className="fixed bottom-[30px] right-[30px] z-50 cursor-pointer w-[51px] h-[51px]"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
          }}
        />
      )}

      {/* Recording Module */}
      {isRecordingModuleOpen && (
        <div 
          className="fixed z-50 rounded-[20px]"
          style={{ 
            bottom: '30px',
            left: '30px',
            right: '30px',
            padding: '16px 20px',
            backgroundColor: '#E57373',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Close X button */}
          <button
            onClick={() => setIsRecordingModuleOpen(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '18px',
              fontWeight: '300',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* REC/PAUSE Button */}
              <button
                onClick={() => {
                  if (isRecording) {
                    pauseRecording();
                  } else if (isPaused) {
                    resumeRecording();
                  } else {
                    startRecording();
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <img 
                  src={isRecording ? pauseIcon : recordIcon} 
                  alt={isRecording ? "Pause" : "Record"} 
                  style={{ width: '44px', height: '44px' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontFamily: 'Outfit', letterSpacing: '0.5px' }}>
                  {isRecording ? 'PAUSE' : 'REC'}
                </span>
              </button>
              
              {/* PLAY/PAUSE Button */}
              <button
                onClick={() => {
                  if (isPlaying) {
                    pausePlayback();
                  } else {
                    playRecording();
                  }
                }}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '4px', 
                  background: 'none', 
                  border: 'none', 
                  cursor: audioDataUrl ? 'pointer' : 'default',
                  opacity: audioDataUrl ? 1 : 0.4
                }}
              >
                <img 
                  src={isPlaying ? pauseIcon : playIcon} 
                  alt={isPlaying ? "Pause" : "Play"} 
                  style={{ width: '44px', height: '44px' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontFamily: 'Outfit', letterSpacing: '0.5px' }}>
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </span>
              </button>
              
              {/* STOP Button */}
              <button
                onClick={stopRecording}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <img 
                  src={stopIcon} 
                  alt="Stop" 
                  style={{ width: '44px', height: '44px' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontFamily: 'Outfit', letterSpacing: '0.5px' }}>STOP</span>
              </button>
            </div>
            
            {/* Visual Feedback */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '50px', flex: 1 }}>
              {isRecording ? (
                <>
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar1 0.4s ease-in-out infinite' }} />
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar2 0.4s ease-in-out infinite' }} />
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar3 0.4s ease-in-out infinite' }} />
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar4 0.4s ease-in-out infinite' }} />
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar5 0.4s ease-in-out infinite' }} />
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar1 0.4s ease-in-out infinite', animationDelay: '0.1s' }} />
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar2 0.4s ease-in-out infinite', animationDelay: '0.1s' }} />
                  <div style={{ width: '6px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '3px', animation: 'soundBar3 0.4s ease-in-out infinite', animationDelay: '0.1s' }} />
                </>
              ) : isPaused ? (
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontFamily: 'Outfit' }}>PAUSED</span>
              ) : null}
            </div>
            
            {/* Timer */}
            <div style={{ color: 'white', fontSize: '20px', fontFamily: 'Outfit', fontWeight: '300' }}>
              {formatTime(recordingTime)}
            </div>
          </div>
        </div>
      )}


      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-6 w-[80%] shadow-xl relative">
            {/* X close button */}
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-[hsl(0,0%,60%)] text-xl font-light"
            >
              ×
            </button>
            
            <p className="text-[18px] font-outfit font-medium text-[hsl(0,0%,30%)] text-center mt-4 mb-8 leading-relaxed">
              Are you sure you want to delete<br />the current note?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 px-4 rounded-full bg-[hsl(0,0%,25%)] text-white font-outfit font-medium text-[15px]"
              >
                cancel
              </button>
              <button
                onClick={() => {
                  deleteNote();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[hsl(6,70%,65%)] text-white font-outfit font-medium text-[15px]"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      )}

      <DatePicker
        value={noteDate}
        onChange={handleDateSelect}
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
      />

    </div>
  );
};

export default Note;
