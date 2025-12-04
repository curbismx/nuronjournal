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
}
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import recordIconRed from "@/assets/01noterecord_red.png";
import recordIconGreen from "@/assets/01noterecord_green.png";
import recordIconBlue from "@/assets/01noterecord_blue.png";
import recordIconPink from "@/assets/01noterecord_pink.png";
import recorderIcon from '@/assets/00recorder.png';
import recorderIconGreen from '@/assets/00recorder_green.png';
import recorderIconBlue from '@/assets/00recorder_blue.png';
import recorderIconPink from '@/assets/00recorder_pink.png';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

type ContentBlock = 
  | { type: 'text'; id: string; content: string }
  | { type: 'image'; id: string; url: string; width: number };

const Note = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const noteIdRef = useRef<string>(id || crypto.randomUUID());
  const [user, setUser] = useState<User | null>(null);
  const [noteTitle, setNoteTitle] = useState(() => {
    if (id) {
      const cached = localStorage.getItem('nuron-notes-cache');
      if (cached) {
        try {
          const notes = JSON.parse(cached);
          const existingNote = notes.find((n: any) => n.id === id);
          if (existingNote?.title) {
            return existingNote.title;
          }
        } catch {}
      }
      const local = localStorage.getItem('nuron-notes');
      if (local) {
        try {
          const notes = JSON.parse(local);
          const existingNote = notes.find((n: any) => n.id === id);
          if (existingNote?.title) {
            return existingNote.title;
          }
        } catch {}
      }
    }
    return '';
  });
  const [noteDate, setNoteDate] = useState<Date>(new Date());
  const [weather, setWeather] = useState<{ temp: number; weatherCode: number; WeatherIcon: React.ComponentType<any> } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAudioDeleteConfirm, setShowAudioDeleteConfirm] = useState(false);
  const [audioToDelete, setAudioToDelete] = useState<number | null>(null);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() => {
    if (id) {
      // Try to load from cache immediately
      const cached = localStorage.getItem('nuron-notes-cache');
      if (cached) {
        try {
          const notes = JSON.parse(cached);
          const existingNote = notes.find((n: any) => n.id === id);
          if (existingNote?.contentBlocks) {
            return existingNote.contentBlocks;
          }
        } catch {}
      }
      // Also try local storage for non-logged-in users
      const local = localStorage.getItem('nuron-notes');
      if (local) {
        try {
          const notes = JSON.parse(local);
          const existingNote = notes.find((n: any) => n.id === id);
          if (existingNote?.contentBlocks) {
            return existingNote.contentBlocks;
          }
        } catch {}
      }
    }
    return [{ type: 'text', id: 'initial', content: '' }];
  });
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
    default: recordIconRed,
    green: recordIconGreen,
    blue: recordIconBlue,
    pink: recordIconPink
  };

  const themeRecorderIcons = {
    default: recorderIcon,
    green: recorderIconGreen,
    blue: recorderIconBlue,
    pink: recorderIconPink
  };

  // Recording state (speech-to-text + audio recording)
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  
  // Audio recording state - supports multiple recordings
  const [audioUrls, setAudioUrls] = useState<string[]>(() => {
    if (id) {
      const cached = localStorage.getItem('nuron-notes-cache');
      if (cached) {
        try {
          const notes = JSON.parse(cached);
          const existingNote = notes.find((n: any) => n.id === id);
          if (existingNote?.audio_data) {
            const parsed = JSON.parse(existingNote.audio_data);
            if (Array.isArray(parsed)) {
              return parsed;
            }
            return [existingNote.audio_data];
          }
        } catch {}
      }
    }
    return [];
  });
  const [audioDurations, setAudioDurations] = useState<string[]>([]);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const audioPlayerRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const audioUrlsRef = useRef<string[]>([]);
  
  // Initialize audioUrlsRef when audioUrls state is set
  useEffect(() => {
    audioUrlsRef.current = audioUrls;
  }, [audioUrls]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
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
    
    // Gather files to share
    const filesToShare: File[] = [];
    
    // Get images from content blocks
    const imageBlocks = contentBlocks.filter(b => b.type === 'image') as Array<{ type: 'image'; id: string; url: string; width: number }>;
    
    for (const imageBlock of imageBlocks) {
      try {
        const response = await fetch(imageBlock.url);
        const blob = await response.blob();
        const fileName = `image-${imageBlock.id}.jpg`;
        const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        filesToShare.push(file);
      } catch (error) {
        console.error('Failed to fetch image for sharing:', error);
      }
    }
    
    // Get audio files
    for (let i = 0; i < audioUrls.length; i++) {
      try {
        const response = await fetch(audioUrls[i]);
        const blob = await response.blob();
        const fileName = `recording-${i + 1}.mp4`;
        const file = new File([blob], fileName, { type: 'audio/mp4' });
        filesToShare.push(file);
      } catch (error) {
        console.error('Failed to fetch audio for sharing:', error);
      }
    }
    
    // Build share data
    const shareData: ShareData = {
      title: noteTitle,
      text: noteContent,
    };
    
    // Add files if supported
    if (filesToShare.length > 0) {
      shareData.files = filesToShare;
    }
    
    // Helper function for clipboard fallback
    const copyToClipboard = async () => {
      try {
        const textToCopy = `${noteTitle}\n\n${noteContent}`;
        await navigator.clipboard.writeText(textToCopy);
        setShowCopyConfirm(true);
      } catch (error) {
        console.error('Copy to clipboard failed:', error);
      }
    };
    
    // Check if Web Share API is available and can share this data
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // User cancelled - do nothing
        } else {
          // Share failed (e.g. iframe restriction) - fall back to clipboard
          await copyToClipboard();
        }
      }
    } else if (navigator.share) {
      // Try sharing without files
      try {
        await navigator.share({ title: noteTitle, text: noteContent });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      // No share API - use clipboard
      await copyToClipboard();
    }
  };


  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper function to convert base64 to blob URL
  const base64ToBlobUrl = (base64String: string): string => {
    // base64String format: "data:audio/mp4;base64,..."
    return base64String; // Can be used directly as src in audio element
  };

  const uploadAudioToSupabase = async (blob: Blob): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // User not logged in - convert to base64 and store in localStorage
        try {
          const base64String = await blobToBase64(blob);
          console.log('User not logged in, storing audio as base64 in localStorage');
          // Return base64 data URL (can be used directly in audio src)
          return base64String;
        } catch (error) {
          console.error('Failed to convert blob to base64:', error);
          // Fallback to blob URL (temporary)
          return URL.createObjectURL(blob);
        }
      }
      
      const contentType = blob.type || 'audio/mp4';
      const extension = contentType.includes('mp4') ? 'mp4' : 'webm';
      const fileNameWithExt = `${session.user.id}/${noteIdRef.current}-${Date.now()}.${extension}`;
      
      const { error } = await supabase.storage
        .from('audio-recordings')
        .upload(fileNameWithExt, blob, {
          contentType: contentType,
          upsert: true
        });
      
      if (error) {
        console.error('Upload error:', error);
        // Fallback to local blob URL if upload fails
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileNameWithExt);
      
      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      // Fallback to local blob URL if anything fails
      try {
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      } catch (e) {
        console.error('Failed to create blob URL:', e);
        return null;
      }
    }
  };

  const startRecording = async () => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Microphone access is not available in this browser.');
      setIsRecordingOpen(false);
      return;
    }

    // Start audio recording first (this will request permission)
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (error: any) {
      console.error('Audio recording error:', error);
      let errorMessage = 'Failed to access microphone. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No microphone found.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Microphone is already in use by another application.';
      } else {
        errorMessage += 'Please check your microphone settings.';
      }
      
      toast.error(errorMessage);
      setIsRecordingOpen(false);
      return;
    }
    
    // Set up MediaRecorder
    try {
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      console.log('Recording with mimeType:', mediaRecorder.mimeType);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording error occurred. Please try again.');
      };
      
      mediaRecorder.start(1000);
    } catch (error) {
      console.error('MediaRecorder setup error:', error);
      toast.error('Failed to start recording. Please try again.');
      // Clean up stream if MediaRecorder fails
      stream.getTracks().forEach(track => track.stop());
      setIsRecordingOpen(false);
      return;
    }
    
    // Set up speech recognition (optional - don't fail if not available)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
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
              return [...prev.slice(0, -1), { ...lastBlock, content: newContent }];
            }
            return prev;
          });
          
          // Auto-scroll to bottom while recording (only on final transcript to avoid jitter)
          if (finalTranscript) {
            setTimeout(() => {
              const textareas = document.querySelectorAll('.note-textarea');
              const lastTextarea = textareas[textareas.length - 1] as HTMLTextAreaElement;
              if (lastTextarea) {
                lastTextarea.style.height = 'auto';
                lastTextarea.style.height = Math.max(24, lastTextarea.scrollHeight) + 'px';
                lastTextarea.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }, 50);
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Don't show error for 'no-speech' as it's common
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            // Only log, don't interrupt recording
            console.warn('Speech recognition issue:', event.error);
          }
        };
        
        recognition.onend = () => {
          if (isRecordingRef.current) {
            try { 
              recognition.start(); 
            } catch (e) {
              console.warn('Speech recognition restart failed:', e);
            }
          }
        };
        
        recognition.start();
      } catch (error) {
        console.warn('Speech recognition not available:', error);
        // Continue with audio recording even if speech recognition fails
      }
    }
    
    // Only set recording state if we successfully got here
    setIsRecording(true);
    isRecordingRef.current = true;
    setIsPaused(false);
    
    // Start timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsPaused(true);
    isRecordingRef.current = false;
  };

  const resumeRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setIsPaused(false);
    isRecordingRef.current = true;
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Clean interim markers
    setContentBlocks(prev => {
      const lastBlock = prev[prev.length - 1];
      if (lastBlock && lastBlock.type === 'text') {
        const content = (lastBlock as { type: 'text'; id: string; content: string }).content;
        const cleanContent = content.replace(/\|\|.*$/, '').trimEnd();
        return [...prev.slice(0, -1), { ...lastBlock, content: cleanContent }];
      }
      return prev;
    });
    
    // Upload audio to Supabase
    if (mediaRecorderRef.current && audioChunksRef.current.length > 0) {
      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/mp4';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Created blob with type:', blob.type, 'size:', blob.size);
        const url = await uploadAudioToSupabase(blob);
        if (url) {
          setAudioUrls(prev => {
            const newUrls = [...prev, url];
            audioUrlsRef.current = newUrls;
            return newUrls;
          });
          setAudioDurations(prev => [...prev, '00:00']);
          // Save note after audio is added
          setTimeout(() => {
            saveNote();
          }, 100);
        }
      };
      
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsRecordingOpen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openRecorder = () => {
    setIsRecordingOpen(true);
    audioChunksRef.current = [];
    startRecording();
  };

  const handleRecorderTap = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const deleteAudio = async (index: number) => {
    const urlToDelete = audioUrls[index];
    
    // Delete from Supabase Storage if it's a Supabase URL
    if (urlToDelete.includes('supabase.co/storage')) {
      try {
        const urlParts = urlToDelete.split('/storage/v1/object/public/audio-recordings/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('audio-recordings').remove([filePath]);
        }
      } catch (error) {
        console.error('Error deleting audio from storage:', error);
      }
    } else if (urlToDelete.startsWith('blob:')) {
      // Revoke blob URL to free memory for local blob URLs (temporary fallback)
      URL.revokeObjectURL(urlToDelete);
    }
    // Base64 data URLs don't need cleanup - they're just strings
    
    // Stop playback if this audio is playing
    if (playingAudioIndex === index) {
      audioPlayerRefs.current[index]?.pause();
      setPlayingAudioIndex(null);
    }
    
    // Remove from arrays and update ref immediately
    const newUrls = audioUrls.filter((_, i) => i !== index);
    audioUrlsRef.current = newUrls;
    
    setAudioUrls(newUrls);
    setAudioDurations(prev => prev.filter((_, i) => i !== index));
    
    // Check if note should be deleted (no content, no images, no audio)
    const noteContent = getNoteContent();
    const hasImages = contentBlocks.filter(b => b.type === 'image').length > 0;
    const hasAudio = newUrls.length > 0;
    
    // If note is empty (no content, images, or audio), delete the entire note
    if (!noteContent.trim() && !hasImages && !hasAudio) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          deleteNote();
        }, 50);
      });
      return;
    }
    
    // Save note after audio is deleted (ref is already updated)
    // Use requestAnimationFrame to ensure state updates are processed
    requestAnimationFrame(() => {
      setTimeout(() => {
        saveNote();
      }, 50);
    });
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
              if (data.title) {
                setTitleGenerated(true);
              }
              setNoteDate(new Date(data.created_at));
              existingCreatedAt.current = data.created_at;
              if (data.audio_data) {
                // Support both old single URL format and new JSON array format
                try {
                  const parsed = JSON.parse(data.audio_data);
                  if (Array.isArray(parsed)) {
                    audioUrlsRef.current = parsed;
                    setAudioUrls(parsed);
                    setAudioDurations(parsed.map(() => '00:00'));
                  }
                } catch {
                  // Old format: single URL string
                  audioUrlsRef.current = [data.audio_data];
                  setAudioUrls([data.audio_data]);
                  setAudioDurations(['00:00']);
                }
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
            if (existingNote.title) {
              setTitleGenerated(true);
            }
            setNoteDate(new Date(existingNote.createdAt));
            existingCreatedAt.current = existingNote.createdAt;
            // Load audio_data from localStorage if available
            if ((existingNote as any).audio_data) {
              try {
                const parsed = JSON.parse((existingNote as any).audio_data);
                if (Array.isArray(parsed)) {
                  audioUrlsRef.current = parsed;
                  setAudioUrls(parsed);
                  setAudioDurations(parsed.map(() => '00:00'));
                } else {
                  audioUrlsRef.current = [(existingNote as any).audio_data];
                  setAudioUrls([(existingNote as any).audio_data]);
                  setAudioDurations(['00:00']);
                }
              } catch {
                audioUrlsRef.current = [(existingNote as any).audio_data];
                setAudioUrls([(existingNote as any).audio_data]);
                setAudioDurations(['00:00']);
              }
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
    if (noteContent.trim().split(/\s+/).length >= 10 && !titleGenerated && !titleManuallyEdited && !noteTitle) {
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
    const hasImages = contentBlocks.filter(b => b.type === 'image').length > 0;
    const hasAudio = audioUrlsRef.current.length > 0 || audioUrls.length > 0;
    
    // Save if there's content, images, or audio
    if (!noteContent.trim() && !hasImages && !hasAudio) {
      return;
    }

    // Use ref to get the most up-to-date audioUrls (in case async operations haven't updated state yet)
    // Ref is always kept in sync with state via useEffect, so use it as the source of truth
    const currentAudioUrls = audioUrlsRef.current;

    const noteData = {
      id: noteIdRef.current,
      title: noteTitle,
      contentBlocks,
      createdAt: existingCreatedAt.current || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weather: weather ? { temp: weather.temp, weatherCode: weather.weatherCode } : undefined,
      audio_data: currentAudioUrls.length > 0 ? JSON.stringify(currentAudioUrls) : undefined,
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
        audio_data: currentAudioUrls.length > 0 ? JSON.stringify(currentAudioUrls) : null
      });
      
      if (!error) {
        // UPDATE LOCAL CACHE so Index loads instantly
        const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
        const existingIndex = cached.findIndex((n: any) => n.id === noteData.id);
        const noteDataWithAudio = {
          ...noteData,
          audio_data: currentAudioUrls.length > 0 ? JSON.stringify(currentAudioUrls) : undefined
        };
        if (existingIndex >= 0) {
          cached[existingIndex] = noteDataWithAudio;
        } else {
          cached.unshift(noteDataWithAudio);
        }
        localStorage.setItem('nuron-notes-cache', JSON.stringify(cached));
      }
      
      if (error) console.error('Error saving to Supabase:', error);
    } else {
      // Not logged in - save to localStorage
      const notes = JSON.parse(localStorage.getItem('nuron-notes') || '[]');
      const existingIndex = notes.findIndex((n: any) => n.id === noteIdRef.current);
      const noteDataWithAudio = {
        ...noteData,
        audio_data: currentAudioUrls.length > 0 ? JSON.stringify(currentAudioUrls) : undefined
      };
      if (existingIndex >= 0) {
        notes[existingIndex] = noteDataWithAudio;
      } else {
        notes.unshift(noteDataWithAudio);
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
      <header 
        className="flex-shrink-0 z-30" 
        style={{ 
          backgroundColor: themeColors[theme],
          paddingTop: `calc(30px + env(safe-area-inset-top))`,
          paddingLeft: `calc(30px + env(safe-area-inset-left))`,
          paddingRight: `calc(16px + env(safe-area-inset-right))`,
          paddingBottom: '30px',
          minHeight: `calc(150px + env(safe-area-inset-top))`
        }}
      >
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
            className="absolute top-0"
            style={{
              right: `calc(30px + env(safe-area-inset-right))`
            }}
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
                      <path 
                        d="M20 6 L22 6 L22 8 L22 20 C22 21.1 21.1 22 20 22 L8 22 C6.9 22 6.5 20.5 7.5 19.5 L19.5 7.5 C20.5 6.5 20 6 20 6 Z" 
                        fillOpacity="0.8"
                      />
                    </svg>
                  </div>
                </div>
              );
            }
          })}
        </div>
        
        {/* Audio Recording Players */}
        {audioUrls.length > 0 && (
          <div className="px-8 mt-6" style={{ minHeight: '31px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, min-content)', 
              gap: '8px'
            }}>
              {audioUrls.map((url, index) => (
                <div
                  key={index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#E07B6B',
                    borderRadius: '50px',
                    padding: '0 8px 0 6px',
                    height: '31px',
                    minWidth: '90px',
                    position: 'relative'
                  }}
                >
                  {/* Play/Pause button */}
                  <div 
                    style={{
                      width: '21px',
                      height: '21px',
                      borderRadius: '50%',
                      border: '1.5px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const audioEl = audioPlayerRefs.current[index];
                      if (audioEl) {
                        if (playingAudioIndex === index) {
                          audioEl.pause();
                          setPlayingAudioIndex(null);
                        } else {
                          if (playingAudioIndex !== null && audioPlayerRefs.current[playingAudioIndex]) {
                            audioPlayerRefs.current[playingAudioIndex]?.pause();
                          }
                          audioEl.play();
                          setPlayingAudioIndex(index);
                        }
                      }
                    }}
                  >
                    {playingAudioIndex === index ? (
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <div style={{ width: '3px', height: '9px', backgroundColor: 'white', borderRadius: '1px' }} />
                        <div style={{ width: '3px', height: '9px', backgroundColor: 'white', borderRadius: '1px' }} />
                      </div>
                    ) : (
                      <div style={{
                        width: 0,
                        height: 0,
                        borderLeft: '7px solid white',
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        marginLeft: '2px'
                      }} />
                    )}
                  </div>
                  
                  {/* Duration timestamp */}
                  <span style={{
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Outfit',
                    fontWeight: '400',
                    minWidth: '38px'
                  }}>
                    {audioDurations[index] || '00:00'}
                  </span>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAudioToDelete(index);
                      setShowAudioDeleteConfirm(true);
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px'
                    }}
                  >
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600', lineHeight: 1 }}>×</span>
                  </button>
                  
                  {/* Hidden audio element */}
                  <audio 
                    ref={(el) => { audioPlayerRefs.current[index] = el; }}
                    src={url}
                    onEnded={() => setPlayingAudioIndex(null)}
                    onLoadedMetadata={(e) => {
                      const duration = (e.target as HTMLAudioElement).duration;
                      const mins = Math.floor(duration / 60);
                      const secs = Math.floor(duration % 60);
                      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                      setAudioDurations(prev => {
                        const newDurations = [...prev];
                        newDurations[index] = formatted;
                        return newDurations;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Spacer - enough space to scroll past floating button */}
        <div className="h-[150px] flex-shrink-0" />
        <div className="h-[1px]" />
        </div>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div 
          ref={menuRef}
          className="fixed z-50 bg-white rounded-2xl shadow-lg py-4 w-[220px] animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            right: `calc(20px + env(safe-area-inset-right))`,
            top: `calc(140px + env(safe-area-inset-top))`
          }}
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

      {/* Recording Button */}
      {!isRecordingOpen ? (
        <button
          onClick={openRecorder}
          className="fixed z-50"
          style={{
            bottom: `calc(30px + env(safe-area-inset-bottom))`,
            right: `calc(30px + env(safe-area-inset-right))`
          }}
        >
          <img src={themeRecordIcons[theme]} alt="Record" className="w-[51px] h-[51px]" />
        </button>
      ) : (
        <>
          {/* Backdrop to detect tap outside */}
          <div 
            className="fixed inset-0 z-40"
            onClick={stopRecording}
          />
          
          {/* Recording Icon - 120px */}
          <button
            onClick={handleRecorderTap}
            className="fixed z-50"
            style={{
              bottom: `calc(30px + env(safe-area-inset-bottom))`,
              right: `calc(30px + env(safe-area-inset-right))`,
              width: '120px',
              height: '120px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            <img 
              src={themeRecorderIcons[theme]}
              alt="Recording"
              style={{
                width: '120px',
                height: '120px',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
              }}
            />
            
            {/* White timer in center */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -55%)',
                color: 'white',
                fontSize: '24px',
                fontFamily: 'Outfit',
                fontWeight: '500'
              }}
            >
              {formatTime(recordingTime)}
            </div>
          </button>
        </>
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

      {/* Audio Delete Confirmation */}
      {showAudioDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-2">
              Delete Recording?
            </h3>
            <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] text-center mb-6">
              Are you sure you want to delete this sound file? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAudioDeleteConfirm(false);
                  setAudioToDelete(null);
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium text-[15px]"
              >
                cancel
              </button>
              <button
                onClick={() => {
                  if (audioToDelete !== null) {
                    deleteAudio(audioToDelete);
                  }
                  setShowAudioDeleteConfirm(false);
                  setAudioToDelete(null);
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[hsl(6,70%,65%)] text-white font-outfit font-medium text-[15px]"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Confirmation */}
      {showCopyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-2">
              Note Copied
            </h3>
            <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] text-center mb-6">
              Your note has been copied to the clipboard.
            </p>
            <button
              onClick={() => setShowCopyConfirm(false)}
              className="w-full py-3 px-4 rounded-xl text-white font-outfit font-medium"
              style={{ backgroundColor: themeColors[theme] }}
            >
              OK
            </button>
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
