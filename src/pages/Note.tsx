import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from "@supabase/supabase-js";
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import DatePicker from '@/components/DatePicker';

interface SavedNote {
  id: string;
  title: string;
  contentBlocks: ContentBlock[];
  createdAt: string;
  updatedAt: string;
  weather?: { temp: number; weatherCode: number };
}

interface NoteData {
  id: string;
  title?: string;
  contentBlocks?: ContentBlock[];
  createdAt?: string;
  updatedAt?: string;
  weather?: { temp: number; weatherCode: number };
  folder_id?: string;
  is_published?: boolean;
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
import moveIcon from '@/assets/move.png';
import folderIcon from '@/assets/folder_icon.png';
import folderArrow from '@/assets/folder_arrow.png';

import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning } from 'lucide-react';

type ContentBlock =
  | { type: 'text'; id: string; content: string }
  | { type: 'image'; id: string; url: string; width: number };

// Helper function to render text with clickable links
const renderTextWithLinks = (text: string, isEmbedded: boolean) => {
  if (!text) return null;

  // Regex to match URLs and email addresses (case insensitive)
  const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const linkText = match[0];
    let href = linkText;

    // Handle different link types
    if (match[3]) {
      // Email
      href = `mailto:${linkText}`;
    } else if (linkText.toLowerCase().startsWith('www.')) {
      href = `https://${linkText}`;
    } else if (!linkText.toLowerCase().startsWith('http://') && !linkText.toLowerCase().startsWith('https://')) {
      href = `https://${linkText}`;
    }

    // Safety check - only allow http/https/mailto protocols
    try {
      const url = new URL(href);
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
        parts.push(linkText);
        lastIndex = match.index + linkText.length;
        continue;
      }
    } catch {
      parts.push(linkText);
      lastIndex = match.index + linkText.length;
      continue;
    }

    // Always render clickable links
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation();
          window.open(href, '_blank');
        }}
        className="pointer-events-auto relative z-20"
        style={{ color: '#E56157', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {linkText}
      </a>
    );

    lastIndex = match.index + linkText.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const Note = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEmbedded = new URLSearchParams(window.location.search).get('desktop') === 'true';
  const initialFolderId = new URLSearchParams(window.location.search).get('folder_id');
  const placeholderId = new URLSearchParams(window.location.search).get('placeholder');
  const initialCreatedAt = new URLSearchParams(window.location.search).get('created');
  const noteIdRef = useRef<string>(
    (id && !id.startsWith('new-')) ? id : crypto.randomUUID()
  );
  const [user, setUser] = useState<User | null>(null);

  // Embedded persistent mode state
  const [embeddedMode] = useState(() => {
    return new URLSearchParams(window.location.search).get('embedded') === 'true';
  });
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(id || null);
  const [currentPlaceholderId, setCurrentPlaceholderId] = useState<string | null>(placeholderId);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const isTransitioningRef = useRef(false);
  const [noteTitle, setNoteTitle] = useState(() => {
    const lookupId = id || placeholderId;  // Use placeholderId if id is undefined
    if (lookupId) {
      const cached = localStorage.getItem('nuron-notes-cache');
      if (cached) {
        try {
          const notes = JSON.parse(cached);
          const existingNote = notes.find((n: NoteData) => n.id === lookupId);
          if (existingNote?.title) {
            return existingNote.title;
          }
        } catch { /* JSON parse failed, using default */ }
      }
      const local = localStorage.getItem('nuron-notes');
      if (local) {
        try {
          const notes = JSON.parse(local);
          const existingNote = notes.find((n: NoteData) => n.id === lookupId);
          if (existingNote?.title) {
            return existingNote.title;
          }
        } catch { /* JSON parse failed, using default */ }
      }
    }
    return '';
  });
  const [noteDate, setNoteDate] = useState<Date>(() => {
    const urlCreated = new URLSearchParams(window.location.search).get('created');
    if (urlCreated) {
      const parsed = new Date(decodeURIComponent(urlCreated));
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  });
  const [weather, setWeather] = useState<{ temp: number; weatherCode: number; WeatherIcon: React.ComponentType<any> } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAudioDeleteConfirm, setShowAudioDeleteConfirm] = useState(false);
  const [audioToDelete, setAudioToDelete] = useState<number | null>(null);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() => {
    const lookupId = id || placeholderId;  // Use placeholderId if id is undefined
    if (lookupId) {
      // Try to load from cache immediately
      const cached = localStorage.getItem('nuron-notes-cache');
      if (cached) {
        try {
          const notes = JSON.parse(cached);
          const existingNote = notes.find((n: NoteData) => n.id === lookupId);
          if (existingNote?.contentBlocks) {
            return existingNote.contentBlocks;
          }
        } catch { /* JSON parse failed, using default */ }
      }
      // Also try local storage for non-logged-in users
      const local = localStorage.getItem('nuron-notes');
      if (local) {
        try {
          const notes = JSON.parse(local);
          const existingNote = notes.find((n: NoteData) => n.id === lookupId);
          if (existingNote?.contentBlocks) {
            return existingNote.contentBlocks;
          }
        } catch { /* JSON parse failed, using default */ }
      }
    }
    return [{ type: 'text', id: 'initial', content: '' }];
  });
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showMoveNote, setShowMoveNote] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string; sort_order: number }[]>([]);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string | null>(null);

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionDots, setTranscriptionDots] = useState(0);
  const transcriptionDotsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showTranscriptionNearlyThere, setShowTranscriptionNearlyThere] = useState(false);
  const recordingPlaceholderIdRef = useRef<string | null>(null);
  const [recordingDots, setRecordingDots] = useState(0);
  const recordingDotsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingMessageIndex, setRecordingMessageIndex] = useState(0);
  const recordingMessageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const recordingMessages = [
    'listening',
    'teaching monkeys to type',
    'feeding them bananas',
    'calibrating the universe',
    'adding slow-motion clapping sounds',
    'automatically deleting all "uhms" and "ahs"',
    'currently translating everything into whale song',
    'making sure the flux capacitor is properly fluxing',
    'nearly there'
  ];

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
        } catch { }
      }
    }
    return [];
  });
  const [audioDurations, setAudioDurations] = useState<string[]>([]);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const audioPlayerRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const audioUrlsRef = useRef<string[]>([]);
  const contentBlocksRef = useRef<ContentBlock[]>([]);
  const isSavingRef = useRef(false);

  // Initialize audioUrlsRef when audioUrls state is set
  useEffect(() => {
    audioUrlsRef.current = audioUrls;
  }, [audioUrls]);

  // Initialize contentBlocksRef when contentBlocks state is set
  useEffect(() => {
    contentBlocksRef.current = contentBlocks;
  }, [contentBlocks]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0-100

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTextBlockRef = useRef<{ id: string; cursorPosition: number } | null>(null);
  const isDeletedRef = useRef(false);
  const existingCreatedAt = useRef<string | null>(
    (() => {
      const urlCreated = new URLSearchParams(window.location.search).get('created');
      if (urlCreated) {
        return decodeURIComponent(urlCreated);
      }
      return null;
    })()
  );

  // Set body background color for desktop embed
  useEffect(() => {
    if (isEmbedded) {
      document.body.style.backgroundColor = '#F9F9F6';
    }
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [isEmbedded]);

  // Handle app going to background (native + web)
  useEffect(() => {
    // Dynamic import to avoid issues if appStateEvent not yet available
    import('../App').then(({ appStateEvent }) => {
      const handleAppStateChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ isActive: boolean }>;
        if (!customEvent.detail.isActive) {
          // App going to background - stop recording if active
          if (isRecordingRef.current) {
            // Stop recording gracefully
            setIsRecording(false);
            isRecordingRef.current = false;
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }
            // Stop speech recognition
            if (Capacitor.isNativePlatform()) {
              SpeechRecognition.stop();
            } else if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
            // Stop media recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            // Stop audio stream
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
          }
          // Save current note
          saveNote();
        }
      };

      appStateEvent.addEventListener('stateChange', handleAppStateChange);

      return () => {
        appStateEvent.removeEventListener('stateChange', handleAppStateChange);
      };
    });
  }, []);

  // Handle audio playback interruption (e.g., phone call, switching apps)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playingAudioIndex !== null) {
        // Pause audio when tab/app becomes hidden
        audioPlayerRefs.current[playingAudioIndex]?.pause();
        setPlayingAudioIndex(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [playingAudioIndex]);

  // Smooth fade-in for embedded view
  useEffect(() => {
    if (isEmbedded) {
      // Small delay to ensure all initial state is set before revealing
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsReady(true);
    }
  }, [isEmbedded]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes to reset recording help on new login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        sessionStorage.removeItem('nuron-seen-record-help');
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load note from Supabase if not found in cache
  useEffect(() => {
    const loadNoteFromSupabase = async () => {
      if (!id) return;

      // Check if already loaded from cache
      if (contentBlocks.length > 0 && contentBlocks[0].type !== 'text') return;
      if (contentBlocks.length === 1 && contentBlocks[0].type === 'text' && (contentBlocks[0] as any).content !== '') return;
      if (noteTitle) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to load note:', error);
        // Try to load from cache as fallback
        const cached = localStorage.getItem('nuron-notes-cache');
        if (cached) {
          try {
            const cachedNotes = JSON.parse(cached);
            const cachedNote = cachedNotes.find((n: any) => n.id === id);
            if (cachedNote) {
              setNoteTitle(cachedNote.title || '');
              setNoteDate(new Date(cachedNote.createdAt));
              existingCreatedAt.current = cachedNote.createdAt;
              if (cachedNote.contentBlocks) {
                setContentBlocks(cachedNote.contentBlocks);
              }
              toast.info('Loaded from cache. Connection issue detected.');
              return;
            }
          } catch (e) {
            console.error('Failed to parse cache:', e);
          }
        }
        toast.error('Failed to load note');
        return;
      }

      if (data) {
        setNoteTitle(data.title || '');
        setNoteDate(new Date(data.created_at));
        existingCreatedAt.current = data.created_at;

        if (data.content_blocks && Array.isArray(data.content_blocks)) {
          setContentBlocks(data.content_blocks as ContentBlock[]);
        }

        if (data.weather) {
          // Weather will be set separately
        }
      }
    };

    loadNoteFromSupabase();
  }, [id]);

  useEffect(() => {
    const loadFolders = async () => {
      if (!showMoveNote) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('folders')
          .select('id, name, sort_order')
          .eq('user_id', session.user.id)
          .order('sort_order', { ascending: true });
        if (data) setFolders(data);
      }
    };
    loadFolders();
  }, [showMoveNote]);

  // Listen for menu actions from parent window (desktop view)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'menu-action') {
        handleMenuAction(event.data.action);
      }
      if (event.data?.type === 'force-save') {
        saveNote();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Save when iframe is about to be unloaded (user switching notes on desktop)
  useEffect(() => {
    if (!isEmbedded) return;

    const handleBeforeUnload = () => {
      saveNote();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [isEmbedded]);

  // Listen for load-note messages from parent (embedded mode)
  // Map to track placeholder -> real ID to prevent duplicate note creation
  const placeholderToIdMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!embeddedMode) return;

    const handleLoadNote = (event: MessageEvent) => {
      if (event.data?.type !== 'load-note') return;

      const { noteId, placeholderId: newPlaceholderId, folderId, createdAt, cachedTitle, cachedContentBlocks } = event.data;

      // Set transitioning flag FIRST - prevents all effects from firing
      isTransitioningRef.current = true;

      // Update all state synchronously
      setCurrentNoteId(noteId);
      setCurrentPlaceholderId(newPlaceholderId);
      setCurrentFolderId(folderId);

      // CRITICAL FIX: For new notes, reuse the same UUID if we've already generated one for this placeholder
      // This prevents duplicate notes when load-note is called multiple times
      if (noteId) {
        // Existing note - use the provided ID
        noteIdRef.current = noteId;
      } else if (newPlaceholderId) {
        // New note with placeholder - check if we already have an ID for this placeholder
        const existingId = placeholderToIdMapRef.current.get(newPlaceholderId);
        if (existingId) {
          noteIdRef.current = existingId;
        } else {
          // First time seeing this placeholder - generate and remember the ID
          const newId = crypto.randomUUID();
          placeholderToIdMapRef.current.set(newPlaceholderId, newId);
          noteIdRef.current = newId;
        }
      } else {
        // Fallback - should rarely happen
        noteIdRef.current = crypto.randomUUID();
      }

      // Set content from cache - this is instant, no flicker
      setNoteTitle(cachedTitle || '');
      setContentBlocks(cachedContentBlocks || [{ type: 'text', id: 'initial', content: '' }]);

      // Set title flags based on whether note has title
      const hasExistingTitle = cachedTitle && cachedTitle.trim();
      setTitleGenerated(!!hasExistingTitle);
      setTitleManuallyEdited(!!hasExistingTitle);

      // Set date
      if (createdAt) {
        const parsed = new Date(createdAt);
        if (!isNaN(parsed.getTime())) {
          setNoteDate(parsed);
          existingCreatedAt.current = createdAt;
        }
      } else {
        setNoteDate(new Date());
        existingCreatedAt.current = null;
      }

      isDeletedRef.current = false;

      // Clear transitioning flag after React processes all updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isTransitioningRef.current = false;
        });
      });

      // For existing notes, fetch fresh data from Supabase in background
      if (noteId && !noteId.startsWith('new-')) {
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && !isTransitioningRef.current) {
            const { data } = await supabase
              .from('notes')
              .select('*')
              .eq('id', noteId)
              .single();

            if (data) {
              if (data.title && data.title !== cachedTitle) {
                setNoteTitle(data.title);
                setTitleGenerated(true);
                setTitleManuallyEdited(true);
              }
              if (data.content_blocks && JSON.stringify(data.content_blocks) !== JSON.stringify(cachedContentBlocks)) {
                setContentBlocks(data.content_blocks as ContentBlock[]);
              }
            }
          }
        }, 100);
      }
    };

    window.addEventListener('message', handleLoadNote);
    return () => window.removeEventListener('message', handleLoadNote);
  }, [embeddedMode]);

  const handleMoveNote = async (folderId: string) => {
    setSelectedMoveFolder(folderId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !noteIdRef.current) return;

    const { error } = await supabase
      .from('notes')
      .update({ folder_id: folderId })
      .eq('id', noteIdRef.current);

    if (error) {
      console.error('Failed to move note:', error);
      setSelectedMoveFolder(null);
      return;
    }

    localStorage.setItem('nuron-current-folder-id', folderId);

    // Brief blink then close
    setTimeout(() => {
      setSelectedMoveFolder(null);
      setShowMoveNote(false);
      setMenuOpen(false);
    }, 400);
  };

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
  // Exclude recording/transcription placeholder messages
  const getNoteContent = () => {
    return contentBlocks
      .filter(b => {
        if (b.type === 'text') {
          const tb = b as { type: 'text'; id: string; content: string };
          // Filter out recording messages, paused, and transcription placeholders
          const isRecordingMessage = recordingMessages.some(msg => tb.content === msg + '...');
          return !isRecordingMessage &&
            tb.content !== 'paused...' &&
            tb.content !== 'listening and transcribing' &&
            tb.content !== 'nearly there...';
        }
        return false;
      })
      .map(b => (b as { type: 'text'; id: string; content: string }).content)
      .join('\n\n');
  };

  const rewriteText = async () => {
    const noteContent = getNoteContent();
    if (!noteContent || noteContent.trim().length === 0) {
      return;
    }

    setIsRewriting(true);

    // Notify parent window that rewrite is starting (for desktop glow effect)
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'rewrite-start' }, '*');
    }

    try {
      const { data, error } = await supabase.functions.invoke('rewrite-text', {
        body: { text: noteContent },
      });

      if (error) throw error;

      if (data.rewrittenText) {
        // Replace all text blocks with the rewritten content, but preserve image blocks
        setContentBlocks(prev => {
          // Keep all image blocks
          const imageBlocks = prev.filter(b => b.type === 'image');
          // Replace all text blocks with the rewritten content as a single text block
          const rewrittenTextBlock = { type: 'text' as const, id: crypto.randomUUID(), content: data.rewrittenText };
          // Combine: rewritten text first, then images (or you could preserve order - this is simpler)
          return [rewrittenTextBlock, ...imageBlocks];
        });

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

      // Notify parent window that rewrite has ended
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'rewrite-end' }, '*');
      }
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
    const isNativePlatform = Capacitor.isNativePlatform();

    // On native iOS, record audio first, then transcribe from audio file
    if (isNativePlatform) {
      console.log('Using native iOS audio recording with post-transcription');

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Microphone access is not available.');
        setIsRecordingOpen(false);
        return;
      }

      // Start audio recording
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Set up AnalyserNode for audio level detection
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextClass();

          // Resume audio context if suspended (required on iOS)
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256; // Good balance
          analyser.smoothingTimeConstant = 0.5; // Balanced: smooth but responsive
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          console.log('AnalyserNode set up successfully, audioContext state:', audioContext.state);

          // Start monitoring audio level
          const monitorAudioLevel = () => {
            if (!analyserRef.current) {
              return;
            }

            try {
              const dataArray = new Uint8Array(analyser.fftSize);
              analyser.getByteFrequencyData(dataArray);

              // Calculate average and max volume
              let sum = 0;
              let maxValue = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
                if (dataArray[i] > maxValue) {
                  maxValue = dataArray[i];
                }
              }
              const average = sum / dataArray.length;
              // Use a combination of max and average for smoother, more accurate feedback
              const combinedLevel = (maxValue * 0.6 + average * 0.4) / 255;
              const normalizedLevel = Math.min(100, combinedLevel * 100 * 2.5);

              // Smooth interpolation for better visual feedback
              setAudioLevel(prev => {
                // Smooth interpolation: 80% new value, 20% previous (faster but still smooth)
                const newLevel = prev * 0.2 + normalizedLevel * 0.8;
                return newLevel;
              });

              // Continue monitoring (will stop when animationFrameRef is cancelled)
              animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
            } catch (err) {
              console.error('Error monitoring audio level:', err);
              // Try to continue anyway if analyser still exists
              if (analyserRef.current) {
                animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
              }
            }
          };

          // Start monitoring after a small delay to ensure everything is ready
          setTimeout(() => {
            monitorAudioLevel();
          }, 50);
        } catch (audioContextError) {
          console.error('Failed to set up AnalyserNode:', audioContextError);
          // Continue without audio level monitoring
        }
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
        console.log('Native recording with mimeType:', mediaRecorder.mimeType);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Create blob from audio chunks
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
            console.log('Native: Created blob with type:', blob.type, 'size:', blob.size);

            // Upload audio to Supabase and get URL
            const audioUrl = await uploadAudioToSupabase(blob);

            if (audioUrl) {
              // Add audio URL to audioUrls state
              setAudioUrls(prev => {
                const newUrls = [...prev, audioUrl];
                audioUrlsRef.current = newUrls;
                return newUrls;
              });
              setAudioDurations(prev => [...prev, '00:00']);

              // Replace "listening..." placeholder with "listening and transcribing..."
              setIsTranscribing(true);
              setTranscriptionDots(0);

              // Stop recording dots animation
              if (recordingDotsIntervalRef.current) {
                clearInterval(recordingDotsIntervalRef.current);
                recordingDotsIntervalRef.current = null;
              }

              // Stop message cycling animation
              if (recordingMessageIntervalRef.current) {
                clearInterval(recordingMessageIntervalRef.current);
                recordingMessageIntervalRef.current = null;
              }

              const transcriptionPlaceholderId = crypto.randomUUID();
              setContentBlocks(prev => {
                // Remove all recording placeholders (all recording messages and paused...)
                const withoutRecordingPlaceholders = prev.filter(b => {
                  if (b.type === 'text') {
                    const tb = b as { type: 'text'; id: string; content: string };
                    const isRecordingMessage = recordingMessages.some(msg => tb.content === msg + '...');
                    return !isRecordingMessage && tb.content !== 'paused...';
                  }
                  return true;
                });

                const lastBlock = withoutRecordingPlaceholders[withoutRecordingPlaceholders.length - 1];
                if (lastBlock && lastBlock.type === 'text') {
                  const currentContent = (lastBlock as { type: 'text'; id: string; content: string }).content;
                  const newContent = currentContent ? currentContent + ' ' : '';
                  return [...withoutRecordingPlaceholders.slice(0, -1), { ...lastBlock, content: newContent }, { type: 'text', id: transcriptionPlaceholderId, content: 'listening and transcribing' }];
                }
                return [...withoutRecordingPlaceholders, { type: 'text', id: transcriptionPlaceholderId, content: 'listening and transcribing' }];
              });
              recordingPlaceholderIdRef.current = null;

              // Start dots animation
              transcriptionDotsIntervalRef.current = setInterval(() => {
                setTranscriptionDots(prev => (prev + 1) % 4); // 0, 1, 2, 3 -> ., .., ..., (empty)
              }, 500);

              // Show "nearly there" if transcription takes too long (after 5 seconds)
              setShowTranscriptionNearlyThere(false);
              transcriptionTimeoutRef.current = setTimeout(() => {
                setShowTranscriptionNearlyThere(true);
                // Update placeholder to show "nearly there"
                setContentBlocks(prev => prev.map(b =>
                  b.id === transcriptionPlaceholderId
                    ? { ...b, content: 'nearly there...' }
                    : b
                ));
              }, 5000);

              // Transcribe audio file to text
              try {
                // Convert blob to base64 for transcription
                const base64String = await blobToBase64(blob);
                // Remove data URL prefix (e.g., "data:audio/mp4;base64,")
                const base64Audio = base64String.split(',')[1] || base64String;

                const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                  body: { audio: base64Audio },
                });

                if (error) {
                  console.error('Transcription error:', error);
                  toast.error('Transcription failed. Your audio was saved - you can listen to it anytime.');
                  // Remove placeholder on error
                  setIsTranscribing(false);
                  setShowTranscriptionNearlyThere(false);
                  if (transcriptionDotsIntervalRef.current) {
                    clearInterval(transcriptionDotsIntervalRef.current);
                    transcriptionDotsIntervalRef.current = null;
                  }
                  if (transcriptionTimeoutRef.current) {
                    clearTimeout(transcriptionTimeoutRef.current);
                    transcriptionTimeoutRef.current = null;
                  }
                  setContentBlocks(prev => prev.filter(b => b.id !== transcriptionPlaceholderId));
                } else if (data?.text) {
                  // Remove placeholder and add transcribed text
                  setIsTranscribing(false);
                  setShowTranscriptionNearlyThere(false);
                  if (transcriptionDotsIntervalRef.current) {
                    clearInterval(transcriptionDotsIntervalRef.current);
                    transcriptionDotsIntervalRef.current = null;
                  }
                  if (transcriptionTimeoutRef.current) {
                    clearTimeout(transcriptionTimeoutRef.current);
                    transcriptionTimeoutRef.current = null;
                  }
                  setContentBlocks(prev => {
                    // Remove placeholder
                    const withoutPlaceholder = prev.filter(b => b.id !== transcriptionPlaceholderId);
                    // Add transcribed text
                    const lastBlock = withoutPlaceholder[withoutPlaceholder.length - 1];
                    if (lastBlock && lastBlock.type === 'text') {
                      const currentContent = (lastBlock as { type: 'text'; id: string; content: string }).content;
                      const newContent = currentContent ? currentContent + ' ' + data.text : data.text;
                      return [...withoutPlaceholder.slice(0, -1), { ...lastBlock, content: newContent }];
                    }
                    return [...withoutPlaceholder, { type: 'text', id: crypto.randomUUID(), content: data.text }];
                  });

                  // Resize textarea after content updates
                  setTimeout(() => {
                    const textareas = document.querySelectorAll('.note-textarea');
                    textareas.forEach((textarea) => {
                      const el = textarea as HTMLTextAreaElement;
                      el.style.height = 'auto';
                      el.style.height = Math.max(24, el.scrollHeight) + 'px';
                    });
                  }, 50);
                } else {
                  // No text returned, remove placeholder
                  setIsTranscribing(false);
                  setShowTranscriptionNearlyThere(false);
                  if (transcriptionDotsIntervalRef.current) {
                    clearInterval(transcriptionDotsIntervalRef.current);
                    transcriptionDotsIntervalRef.current = null;
                  }
                  if (transcriptionTimeoutRef.current) {
                    clearTimeout(transcriptionTimeoutRef.current);
                    transcriptionTimeoutRef.current = null;
                  }
                  setContentBlocks(prev => prev.filter(b => b.id !== transcriptionPlaceholderId));
                }
              } catch (transcribeError) {
                console.error('Failed to transcribe audio:', transcribeError);
                // Remove placeholder on error
                setIsTranscribing(false);
                setShowTranscriptionNearlyThere(false);
                if (transcriptionDotsIntervalRef.current) {
                  clearInterval(transcriptionDotsIntervalRef.current);
                  transcriptionDotsIntervalRef.current = null;
                }
                if (transcriptionTimeoutRef.current) {
                  clearTimeout(transcriptionTimeoutRef.current);
                  transcriptionTimeoutRef.current = null;
                }
                setContentBlocks(prev => prev.filter(b => b.id !== transcriptionPlaceholderId));
              }

              // Save note after audio is added
              setTimeout(() => {
                saveNote();
              }, 100);
            }

            // Clear audio chunks for next recording
            audioChunksRef.current = [];
          }
        };

        mediaRecorder.onerror = (event: any) => {
          console.error('MediaRecorder error:', event);
        };

        mediaRecorder.start(1000);
      } catch (error) {
        console.error('MediaRecorder setup error:', error);
        toast.error('Failed to start audio recording. Please try again.');
        setIsRecordingOpen(false);
        return;
      }

      // Set up recording state
      setIsRecording(true);
      isRecordingRef.current = true;
      setIsPaused(false);

      // Add recording placeholder text
      recordingPlaceholderIdRef.current = crypto.randomUUID();
      setRecordingMessageIndex(0);
      const firstMessage = recordingMessages[0] + '...';
      setContentBlocks(prev => {
        const lastBlock = prev[prev.length - 1];
        if (lastBlock && lastBlock.type === 'text') {
          const currentContent = (lastBlock as { type: 'text'; id: string; content: string }).content;
          const newContent = currentContent ? currentContent + ' ' : '';
          return [...prev.slice(0, -1), { ...lastBlock, content: newContent }, { type: 'text', id: recordingPlaceholderIdRef.current!, content: firstMessage }];
        }
        return [...prev, { type: 'text', id: recordingPlaceholderIdRef.current!, content: firstMessage }];
      });

      // Start message cycling animation for recording (5 seconds per message)
      // Messages go in order, stop at the last message ("nearly there")
      recordingMessageIntervalRef.current = setInterval(() => {
        setRecordingMessageIndex(prev => {
          const nextIndex = prev + 1;

          // Stop at the last message
          if (nextIndex >= recordingMessages.length) {
            // Clear interval and stay on last message
            if (recordingMessageIntervalRef.current) {
              clearInterval(recordingMessageIntervalRef.current);
              recordingMessageIntervalRef.current = null;
            }
            return recordingMessages.length - 1;
          }

          // Update the placeholder content in contentBlocks
          if (recordingPlaceholderIdRef.current) {
            const message = recordingMessages[nextIndex] + '...';
            setContentBlocks(prevBlocks => prevBlocks.map(b =>
              b.id === recordingPlaceholderIdRef.current
                ? { ...b, content: message }
                : b
            ));
          }

          return nextIndex;
        });
      }, 5000);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      return;
    }

    // Web platform - use Web Speech Recognition API
    console.log('Using Web Speech Recognition API');

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

      // Set up AnalyserNode for audio level detection
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Good balance
        analyser.smoothingTimeConstant = 0.5; // Balanced: smooth but responsive
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        console.log('AnalyserNode set up successfully (web)');

        // Start monitoring audio level
        const monitorAudioLevel = () => {
          if (!analyserRef.current) {
            return;
          }

          try {
            const dataArray = new Uint8Array(analyser.fftSize);
            analyser.getByteFrequencyData(dataArray);

            // Calculate average and max volume
            let sum = 0;
            let maxValue = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
              if (dataArray[i] > maxValue) {
                maxValue = dataArray[i];
              }
            }
            const average = sum / dataArray.length;
            // Use a combination of max and average for smoother, more accurate feedback
            const combinedLevel = (maxValue * 0.6 + average * 0.4) / 255;
            const normalizedLevel = Math.min(100, combinedLevel * 100 * 2.5);

            // Smooth interpolation for better visual feedback
            setAudioLevel(prev => {
              // Smooth interpolation: 80% new value, 20% previous (faster but still smooth)
              const newLevel = prev * 0.2 + normalizedLevel * 0.8;
              return newLevel;
            });

            // Continue monitoring (will stop when animationFrameRef is cancelled)
            animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
          } catch (err) {
            console.error('Error monitoring audio level:', err);
            // Try to continue anyway if analyser still exists
            if (analyserRef.current) {
              animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
            }
          }
        };

        // Start monitoring after a small delay
        setTimeout(() => {
          monitorAudioLevel();
        }, 50);
      } catch (audioContextError) {
        console.error('Failed to set up AnalyserNode:', audioContextError);
        // Continue without audio level monitoring
      }
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

    // Set up MediaRecorder (for web, we don't need audio recording, just speech recognition)
    // But keep it for compatibility
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

      mediaRecorder.onstop = async () => {
        // Create blob from audio chunks
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });

          // Upload audio to Supabase and get URL
          const audioUrl = await uploadAudioToSupabase(blob);

          if (audioUrl) {
            // Add audio URL to audioUrls state
            setAudioUrls(prev => {
              const newUrls = [...prev, audioUrl];
              audioUrlsRef.current = newUrls;
              return newUrls;
            });
            setAudioDurations(prev => [...prev, '00:00']);
          }

          // Clear audio chunks for next recording
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.start(1000);
    } catch (error) {
      console.error('MediaRecorder setup error:', error);
      // Continue without MediaRecorder - speech recognition is the main feature
    }

    // Use Web Speech Recognition API
    const WebSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (WebSpeechRecognition) {
      try {
        const recognition = new WebSpeechRecognition();
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

          // Auto-scroll to bottom while recording
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
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
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
        console.log('Web Speech Recognition started');
      } catch (error) {
        console.error('Web Speech Recognition failed to start:', error);
        toast.error('Speech recognition not available in this browser.');
        setIsRecordingOpen(false);
        return;
      }
    } else {
      toast.error('Speech recognition not supported in this browser.');
      setIsRecordingOpen(false);
      return;
    }

    // Only set recording state if we successfully got here
    setIsRecording(true);
    isRecordingRef.current = true;
    setIsPaused(false);

    // Add recording placeholder text
    recordingPlaceholderIdRef.current = crypto.randomUUID();
    setRecordingMessageIndex(0);
    const firstMessage = recordingMessages[0] + '...';
    setContentBlocks(prev => {
      const lastBlock = prev[prev.length - 1];
      if (lastBlock && lastBlock.type === 'text') {
        const currentContent = (lastBlock as { type: 'text'; id: string; content: string }).content;
        const newContent = currentContent ? currentContent + ' ' : '';
        return [...prev.slice(0, -1), { ...lastBlock, content: newContent }, { type: 'text', id: recordingPlaceholderIdRef.current!, content: firstMessage }];
      }
      return [...prev, { type: 'text', id: recordingPlaceholderIdRef.current!, content: firstMessage }];
    });

    // Start message cycling animation for recording (5 seconds per message)
    // Messages go in order, stop at the last message ("nearly there")
    recordingMessageIntervalRef.current = setInterval(() => {
      setRecordingMessageIndex(prev => {
        const nextIndex = prev + 1;

        // Stop at the last message
        if (nextIndex >= recordingMessages.length) {
          // Clear interval and stay on last message
          if (recordingMessageIntervalRef.current) {
            clearInterval(recordingMessageIntervalRef.current);
            recordingMessageIntervalRef.current = null;
          }
          return recordingMessages.length - 1;
        }

        // Update the placeholder content in contentBlocks
        if (recordingPlaceholderIdRef.current) {
          const message = recordingMessages[nextIndex] + '...';
          setContentBlocks(prevBlocks => prevBlocks.map(b =>
            b.id === recordingPlaceholderIdRef.current
              ? { ...b, content: message }
              : b
          ));
        }

        return nextIndex;
      });
    }, 5000);

    // Start timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const pauseRecording = async () => {
    const isNativePlatform = Capacitor.isNativePlatform();

    // First, convert any interim text to final text (keep the text, just remove ||)
    setContentBlocks(prev => {
      const lastBlock = prev[prev.length - 1];
      if (lastBlock && lastBlock.type === 'text') {
        const content = (lastBlock as { type: 'text'; id: string; content: string }).content;
        // Replace || with space and trim - this keeps the interim text as final
        const cleanContent = content.replace(/\|\|/g, ' ').trim();
        return [...prev.slice(0, -1), { ...lastBlock, content: cleanContent }];
      }
      return prev;
    });

    if (isNativePlatform) {
      // On native iOS, only pause MediaRecorder (no Speech Recognition)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    // Pause audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);

    // Stop message cycling and update placeholder to "paused..."
    if (recordingMessageIntervalRef.current) {
      clearInterval(recordingMessageIntervalRef.current);
      recordingMessageIntervalRef.current = null;
    }
    if (recordingPlaceholderIdRef.current) {
      setContentBlocks(prev => prev.map(b =>
        b.id === recordingPlaceholderIdRef.current
          ? { ...b, content: 'paused...' }
          : b
      ));
    }

    setIsPaused(true);
    isRecordingRef.current = false;
  };

  const resumeRecording = async () => {
    const isNativePlatform = Capacitor.isNativePlatform();

    // Set recording state first
    setIsPaused(false);
    isRecordingRef.current = true;

    // Update placeholder to first message and restart message cycling
    if (recordingPlaceholderIdRef.current) {
      setRecordingMessageIndex(0);
      const firstMessage = recordingMessages[0] + '...';
      setContentBlocks(prev => prev.map(b =>
        b.id === recordingPlaceholderIdRef.current
          ? { ...b, content: firstMessage }
          : b
      ));

      // Restart message cycling
      // Messages go in order, stop at the last message ("nearly there")
      if (recordingMessageIntervalRef.current) {
        clearInterval(recordingMessageIntervalRef.current);
      }
      recordingMessageIntervalRef.current = setInterval(() => {
        setRecordingMessageIndex(prev => {
          const nextIndex = prev + 1;

          // Stop at the last message
          if (nextIndex >= recordingMessages.length) {
            // Clear interval and stay on last message
            if (recordingMessageIntervalRef.current) {
              clearInterval(recordingMessageIntervalRef.current);
              recordingMessageIntervalRef.current = null;
            }
            return recordingMessages.length - 1;
          }

          // Update the placeholder content in contentBlocks
          if (recordingPlaceholderIdRef.current) {
            const message = recordingMessages[nextIndex] + '...';
            setContentBlocks(prevBlocks => prevBlocks.map(b =>
              b.id === recordingPlaceholderIdRef.current
                ? { ...b, content: message }
                : b
            ));
          }

          return nextIndex;
        });
      }, 5000);
    }

    if (isNativePlatform) {
      // On native iOS, only resume MediaRecorder (no Speech Recognition)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
    }

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // Resume audio level monitoring
    if (streamRef.current && analyserRef.current) {
      const monitorAudioLevel = () => {
        if (!analyserRef.current) {
          return;
        }

        try {
          const dataArray = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average and max volume
          let sum = 0;
          let maxValue = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
            if (dataArray[i] > maxValue) {
              maxValue = dataArray[i];
            }
          }
          const average = sum / dataArray.length;
          // Use a combination of max and average for smoother, more accurate feedback
          const combinedLevel = (maxValue * 0.6 + average * 0.4) / 255;
          const normalizedLevel = Math.min(100, combinedLevel * 100 * 2.5);

          // Smooth interpolation for better visual feedback
          setAudioLevel(prev => {
            // Smooth interpolation: 80% new value, 20% previous (faster but still smooth)
            const newLevel = prev * 0.2 + normalizedLevel * 0.8;
            return newLevel;
          });

          // Continue monitoring (will stop when animationFrameRef is cancelled)
          animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
        } catch (err) {
          console.error('Error monitoring audio level:', err);
          // Try to continue anyway if analyser still exists
          if (analyserRef.current) {
            animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
          }
        }
      };

      // Start monitoring after a small delay
      setTimeout(() => {
        monitorAudioLevel();
      }, 50);
    }
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;

    // Stop audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);

    const isNativePlatform = Capacitor.isNativePlatform();

    if (isNativePlatform) {
      // On native iOS, only stop MediaRecorder (onstop handler will process the audio and transcribe)
      // Placeholder will be replaced with "listening and transcribing..." in onstop handler
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } else {
      // Stop web speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Stop media recorder (onstop handler will process the audio)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Remove "listening..." placeholder on web (real-time transcription already happened)
      if (recordingPlaceholderIdRef.current) {
        setContentBlocks(prev => prev.filter(b => b.id !== recordingPlaceholderIdRef.current));
        recordingPlaceholderIdRef.current = null;
      }

      // Stop recording dots animation
      if (recordingDotsIntervalRef.current) {
        clearInterval(recordingDotsIntervalRef.current);
        recordingDotsIntervalRef.current = null;
      }
    }

    // Stop message cycling animation
    if (recordingMessageIntervalRef.current) {
      clearInterval(recordingMessageIntervalRef.current);
      recordingMessageIntervalRef.current = null;
    }

    // Convert interim markers to final text (keep the text, just remove ||)
    setContentBlocks(prev => {
      const lastBlock = prev[prev.length - 1];
      if (lastBlock && lastBlock.type === 'text') {
        const content = (lastBlock as { type: 'text'; id: string; content: string }).content;
        // Replace || with space and trim - this keeps the interim text as final
        const cleanContent = content.replace(/\|\|/g, ' ').trim();
        return [...prev.slice(0, -1), { ...lastBlock, content: cleanContent }];
      }
      return prev;
    });

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsRecordingOpen(false);

    // Save the note with transcribed text
    setTimeout(() => {
      saveNote();
    }, 100);
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
      // If recording is active
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

  // Cleanup ALL recording resources on unmount
  useEffect(() => {
    return () => {
      // Clear all intervals
      if (transcriptionDotsIntervalRef.current) {
        clearInterval(transcriptionDotsIntervalRef.current);
        transcriptionDotsIntervalRef.current = null;
      }
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
        transcriptionTimeoutRef.current = null;
      }
      if (recordingDotsIntervalRef.current) {
        clearInterval(recordingDotsIntervalRef.current);
        recordingDotsIntervalRef.current = null;
      }
      if (recordingMessageIntervalRef.current) {
        clearInterval(recordingMessageIntervalRef.current);
        recordingMessageIntervalRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop microphone stream (CRITICAL - prevents mic staying active)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Revoke any blob URLs in audioUrls to free memory
      audioUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

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
      if (!showWeatherSetting) {
        setWeather(null);
        return;
      }

      try {
        let latitude: number;
        let longitude: number;

        // Get location - use Capacitor API on native platforms
        if (Capacitor.isNativePlatform()) {
          try {
            // First check permissions
            const permissionStatus = await Geolocation.checkPermissions();

            if (permissionStatus.location !== 'granted') {
              // Request permission
              const requestResult = await Geolocation.requestPermissions();
              if (requestResult.location !== 'granted') {
                console.log('Location permission not granted. Please enable it in Settings > Nuron > Location');
                return;
              }
            }

            // Get position with options
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes cache
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
          } catch (error: any) {
            console.error('Geolocation error (native):', error);
            // Check specific error codes
            if (error.code === 'OS-PLUG-GLOC-0002' || error.message?.includes('locationUnavailable')) {
              console.log('Location unavailable. Please check that Location Services are enabled on your device.');
            } else if (error.message?.includes('permission') || error.message?.includes('denied')) {
              console.log('Location permission denied. Please enable it in Settings > Nuron > Location');
            }
            return;
          }
        } else {
          // Web platform
          await new Promise<void>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                resolve();
              },
              (error) => {
                console.error('Geolocation error (web):', error);
                reject(error);
              }
            );
          });
        }

        const today = new Date();
        const isToday = noteDate.getDate() === today.getDate() &&
          noteDate.getMonth() === today.getMonth() &&
          noteDate.getFullYear() === today.getFullYear();

        let temp: number;
        let weatherCode: number;

        // Weather fetch with 5 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          if (isToday) {
            // Today: fetch current weather
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            const data = await response.json();
            temp = Math.round(data.current.temperature_2m);
            weatherCode = data.current.weather_code;
          } else {
            // Past day: fetch daily high and dominant weather for that date
            const dateStr = noteDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,weather_code&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            const data = await response.json();
            temp = Math.round(data.daily.temperature_2m_max[0]);
            weatherCode = data.daily.weather_code[0];
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.log('Weather fetch timed out');
            return;
          }
          throw fetchError;
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
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    };

    fetchWeather();
  }, [noteDate, showWeatherSetting]);

  // Auto-generate title when user has written enough (only once)
  useEffect(() => {
    if (isTransitioningRef.current) return; // Don't auto-generate during note switch
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
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {

      // Use refs to get the most up-to-date state (fixes stale closure issue)
      const currentContentBlocks = contentBlocksRef.current;
      const currentAudioUrls = audioUrlsRef.current;

      // Get note content from the current content blocks
      const noteContent = currentContentBlocks
        .filter(b => {
          if (b.type === 'text') {
            const tb = b as { type: 'text'; id: string; content: string };
            const isRecordingMessage = recordingMessages.some(msg => tb.content === msg + '...');
            return !isRecordingMessage &&
              tb.content !== 'paused...' &&
              tb.content !== 'listening and transcribing' &&
              tb.content !== 'nearly there...';
          }
          return false;
        })
        .map(b => (b as { type: 'text'; id: string; content: string }).content)
        .join('\n\n');

      console.log('saveNote called, content:', noteContent);
      console.log('contentBlocks:', currentContentBlocks);

      const hasImages = currentContentBlocks.filter(b => b.type === 'image').length > 0;
      const hasAudio = currentAudioUrls.length > 0 || audioUrls.length > 0;

      // Save if there's title, content, images, or audio
      if (!noteTitle.trim() && !noteContent.trim() && !hasImages && !hasAudio) {
        console.log('No content to save, returning early');
        return;
      }

      console.log('Proceeding to save...');

      const noteData = {
        id: noteIdRef.current,
        title: noteTitle,
        contentBlocks: currentContentBlocks,
        createdAt: existingCreatedAt.current || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        weather: weather ? { temp: weather.temp, weatherCode: weather.weatherCode } : undefined,
        audio_data: currentAudioUrls.length > 0 ? JSON.stringify(currentAudioUrls) : undefined,
      };

      // Always backup to localStorage first (in case save fails)
      const backupKey = `nuron-note-backup-${noteData.id}`;
      localStorage.setItem(backupKey, JSON.stringify(noteData));

      // ALWAYS check auth directly - don't use React state
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'logged in as ' + session.user.email : 'NOT logged in');

      if (session?.user) {
        // Logged in - save to Supabase
        // Check if this is a new note (placeholder) or existing note
        const isNewNote = (currentPlaceholderId || placeholderId) && (currentPlaceholderId || placeholderId)?.startsWith('new-');

        // Build the upsert object
        const upsertData: any = {
          id: noteData.id,
          user_id: session.user.id,
          title: noteData.title,
          content_blocks: noteData.contentBlocks,
          created_at: noteData.createdAt,
          updated_at: noteData.updatedAt,
          weather: noteData.weather,
          audio_data: currentAudioUrls.length > 0 ? JSON.stringify(currentAudioUrls) : null
        };

        // ONLY set folder_id for NEW notes - existing notes keep their folder
        // This prevents notes from moving folders due to stale localStorage values
        if (isNewNote) {
          // In embedded mode, ONLY use folder_id from postMessage - localStorage can be stale
          const folderId = isEmbedded
            ? (currentFolderId || initialFolderId)
            : (currentFolderId || initialFolderId || localStorage.getItem('nuron-current-folder-id'));
          upsertData.folder_id = folderId && folderId !== 'local-notes' ? folderId : null;
          upsertData.is_published = false;
        }

        // Retry logic for save operation (3 attempts with exponential backoff)
        let saveError = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { error } = await supabase.from('notes').upsert(upsertData);
          if (!error) {
            saveError = null;
            console.log('Supabase upsert result: SUCCESS (attempt ' + attempt + ')');
            break;
          }
          saveError = error;
          console.log(`Save attempt ${attempt} failed: ${error.message}, retrying...`);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }

        if (!saveError) {
          // Remove backup after successful save
          localStorage.removeItem(backupKey);
          localStorage.setItem('nuron-has-created-note', 'true');
          // Only update local cache in NON-embedded mode
          // In embedded mode, Index.tsx manages the cache via postMessage
          // This prevents duplicate cache entries from both files writing simultaneously
          if (!isEmbedded) {
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
        } else {
          console.error('Error saving to Supabase after retries:', saveError);
          toast.error('Failed to save note. Please check your connection.');
        }
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
        // Save to localStorage when not logged in (even in embedded mode, as fallback)
        localStorage.setItem('nuron-notes', JSON.stringify(notes));
        console.log('Saved to localStorage (not logged in)');
      }

      // Safety backup - ONLY for mobile/standalone mode
      // In embedded mode, Index.tsx is the single source of truth for cache
      // Writing here in embedded mode causes duplicate entries
      if (!isEmbedded) {
        const allCached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
        const noteExistsInCache = allCached.some((n: any) => n.id === noteData.id);
        if (!noteExistsInCache) {
          allCached.unshift({
            ...noteData,
            folder_id: currentFolderId || initialFolderId || localStorage.getItem('nuron-current-folder-id') || null
          });
          localStorage.setItem('nuron-notes-cache', JSON.stringify(allCached));
        }
      }

      // Notify parent window (for desktop view)
      if (window.parent !== window) {
        // In embedded mode, use ONLY postMessage data for folder_id - no localStorage fallback
        // localStorage can be stale if user switched folders quickly
        const noteFolderId = isEmbedded
          ? (currentFolderId || initialFolderId || null)
          : (currentFolderId || initialFolderId || localStorage.getItem('nuron-current-folder-id') || null);

        window.parent.postMessage({
          type: 'note-saved',
          noteId: noteData.id,
          placeholderId: (currentPlaceholderId || placeholderId),
          noteData: {
            id: noteData.id,
            title: noteTitle,
            contentBlocks: contentBlocks,
            createdAt: existingCreatedAt.current || noteDate.toISOString(),
            updatedAt: new Date().toISOString(),
            weather: weather,
            folder_id: noteFolderId
          }
        }, '*');
      }
    } finally {
      isSavingRef.current = false;
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

  // Auto-save note when content changes (for desktop view)
  useEffect(() => {
    if (isEmbedded && !isTransitioningRef.current) {
      const hasContent = noteTitle.trim() ||
        contentBlocks.some(b =>
          (b.type === 'text' && (b as { type: 'text'; id: string; content: string }).content.trim()) ||
          b.type === 'image'
        ) ||
        audioUrls.length > 0;

      if (hasContent) {
        const timer = setTimeout(() => {
          if (!isTransitioningRef.current) {
            saveNote();
          }
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [noteTitle, contentBlocks, audioUrls, isEmbedded]);

  // Real-time updates to parent (desktop view) - debounced to 500ms
  useEffect(() => {
    if (!isEmbedded) return;
    if (isTransitioningRef.current) return; // Don't send updates during note switch

    const sendUpdate = () => {
      if (isTransitioningRef.current) return; // Double-check before sending
      window.parent.postMessage({
        type: 'note-content-update',
        noteId: noteIdRef.current,
        placeholderId: currentPlaceholderId || placeholderId,
        title: noteTitle,
        contentBlocks: contentBlocks,
        createdAt: existingCreatedAt.current || noteDate.toISOString()
      }, '*');
    };

    const timer = setTimeout(sendUpdate, 500);

    return () => clearTimeout(timer);
  }, [noteTitle, contentBlocks, isEmbedded, currentPlaceholderId, placeholderId, noteDate]);

  const handleBack = async () => {
    console.log('handleBack called');
    await saveNote();
    console.log('saveNote completed');
    // Only navigate in standalone mobile mode, not in embedded desktop iframe
    if (!isEmbedded) {
      navigate('/');
    }
  };

  const handleDateSelect = async (newDate: Date) => {
    setNoteDate(newDate);
    existingCreatedAt.current = newDate.toISOString();

    // Immediately notify parent of the date change (don't wait for save)
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'note-content-update',
        noteId: noteIdRef.current,
        placeholderId: currentPlaceholderId || placeholderId,
        title: noteTitle,
        contentBlocks: contentBlocksRef.current,
        createdAt: newDate.toISOString()
      }, '*');
    }

    // Also save to Supabase after a short delay
    setTimeout(async () => {
      await saveNote();
    }, 100);
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
        toast.error('Failed to upload image. Please try again.');
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
    } else if (action === 'move') {
      setShowMoveNote(true);
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
      // Clean up audio files from storage
      const currentAudioUrls = audioUrlsRef.current;
      for (const audioUrl of currentAudioUrls) {
        if (audioUrl.includes('supabase.co/storage')) {
          try {
            const urlParts = audioUrl.split('/storage/v1/object/public/audio-recordings/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              await supabase.storage.from('audio-recordings').remove([filePath]);
            }
          } catch (error) {
            console.error('Error deleting audio from storage:', error);
          }
        }
      }

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
      const { error } = await supabase.from('notes').delete().eq('id', noteIdRef.current);

      if (error) {
        console.error('Failed to delete note:', error);
        toast.error('Failed to delete note. Please try again.');
        isDeletedRef.current = false; // Reset flag so user can retry
        return;
      }

      // Only update cache in non-embedded mode - Index.tsx manages cache in embedded mode
      if (!isEmbedded) {
        const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
        const filtered = cached.filter((n: any) => n.id !== noteIdRef.current);
        localStorage.setItem('nuron-notes-cache', JSON.stringify(filtered));
      }
    } else {
      // NOT LOGGED IN: Delete from localStorage only
      const notes = JSON.parse(localStorage.getItem('nuron-notes') || '[]');
      const filtered = notes.filter((n: any) => n.id !== noteIdRef.current);
      // Don't write to localStorage in embedded mode
      if (!isEmbedded) {
        localStorage.setItem('nuron-notes', JSON.stringify(filtered));
      }
    }

    // Notify parent window that note was deleted
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'note-deleted',
        noteId: noteIdRef.current
      }, '*');
    }

    // Only navigate in standalone mobile mode, not in embedded desktop iframe
    // In embedded mode, Index.tsx handles the UI change via the postMessage above
    if (!isEmbedded) {
      navigate('/');
    }
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
    <div
      className={`${isEmbedded ? "h-full flex flex-col overflow-hidden" : "fixed inset-0 flex flex-col overflow-hidden"} ${isEmbedded ? 'transition-opacity duration-200 ease-out' : ''}`}
      style={{
        backgroundColor: isEmbedded ? '#F9F9F6' : themeColors[theme],
        opacity: isEmbedded ? (isReady ? 1 : 0) : 1
      }}
    >
      {/* Fixed dark header - hidden when embedded in desktop */}
      {!isEmbedded && (
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
            {!showMoveNote && (
              <Button
                variant="ghost"
                onClick={handleBack}
                aria-label="Go back"
                className="text-journal-header-foreground hover:bg-journal-header-foreground/10 p-0 h-auto w-auto"
              >
                <img src={backIcon} alt="Back" className="w-[30px] h-[30px]" />
              </Button>
            )}
            <div className="flex-1" />
          </div>
          <div className="relative mt-[41px]">
            <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px]">
              {showMoveNote ? 'FOLDERS' : monthYear}
            </h1>
            {showMoveNote && (
              <p className="text-red-500 text-[16px] font-outfit font-light mt-[10px]">
                Please choose which folder to move the note to
              </p>
            )}
            {!showMoveNote && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Open note menu"
                className="absolute top-0"
                style={{
                  right: `calc(30px + env(safe-area-inset-right))`
                }}
              >
                <img src={threeDotsIcon} alt="Menu" className="h-[24px] w-auto" />
              </button>
            )}
          </div>
        </header>
      )}

      {/* Move Note Folders Panel - EXACT same as Index.tsx */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-200 overflow-y-auto ${showMoveNote ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          backgroundColor: themeColors[theme],
          top: `calc(150px + env(safe-area-inset-top))`,
          paddingLeft: `calc(30px + env(safe-area-inset-left))`,
          paddingRight: `calc(32px + env(safe-area-inset-right))`,
          paddingTop: '0px'
        }}
      >
        {/* Folders list */}
        <div className="space-y-4 pt-[0px]">
          {folders.map((folder) => {
            const currentFolderId = localStorage.getItem('nuron-current-folder-id');
            const isSelected = selectedMoveFolder === folder.id;
            return (
              <div
                key={folder.id}
                onClick={() => handleMoveNote(folder.id)}
                className={`flex items-center gap-3 py-2 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-white/30 mx-[-32px] px-[32px]' :
                  folder.id === currentFolderId ? 'bg-white/10 mx-[-32px] px-[32px]' : 'px-0'
                  }`}
              >
                <img src={folderIcon} alt="Folder" className={`w-[20px] h-[20px] mr-4 ${folder.id === currentFolderId ? 'opacity-30' : 'opacity-70'}`} />
                <span className={`flex-1 text-left text-[24px] font-outfit font-light ${folder.id === currentFolderId ? 'text-white/30' : 'text-white'}`}>
                  {folder.name}
                </span>
                <div className="p-2 m-0 mr-[20px] border-0 bg-transparent">
                  <img src={folderArrow} alt="Select" className={`h-[16px] w-auto ${folder.id === currentFolderId ? 'opacity-30' : 'opacity-70'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-scroll ${isEmbedded ? '' : 'bg-journal-content rounded-t-[30px] -mt-[25px]'} overscroll-y-auto z-40 transition-all duration-300 ${isRewriting ? 'ai-rewriting' : ''} ${showMoveNote ? 'translate-y-[100%]' : ''}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          minHeight: 0,
          backgroundColor: isEmbedded ? '#F9F9F6' : undefined
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
              <div
                className="text-[72px] font-bold leading-none text-[hsl(60,1%,66%)]"
                style={{ fontFamily: 'Roboto Mono, monospace', letterSpacing: '-0.05em' }}
              >{dayNumber}</div>
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
              className="text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] outline-none bg-transparent border-none w-full mb-4 focus:outline-none focus:ring-0 rounded -mt-[10px] placeholder:text-[hsl(60,1%,66%)]"
            />
          </div>

          {/* Content blocks - text and images */}
          <div className="px-8 -mt-[10px]">
            {/* Recording/Transcription status indicator */}
            {(() => {
              const recordingPlaceholder = contentBlocks.find(b => {
                if (b.type === 'text') {
                  const tb = b as { type: 'text'; id: string; content: string };
                  // Check if it's any of our recording messages or paused
                  return recordingMessages.some(msg => tb.content === msg + '...') || tb.content === 'paused...';
                }
                return false;
              });
              const transcriptionPlaceholder = contentBlocks.find(b => {
                if (b.type === 'text') {
                  const tb = b as { type: 'text'; id: string; content: string };
                  return tb.content === 'listening and transcribing' || tb.content === 'nearly there...';
                }
                return false;
              });

              if (recordingPlaceholder && recordingPlaceholder.type === 'text') {
                const recordingPlaceholderText = recordingPlaceholder as { type: 'text'; id: string; content: string };
                // Display the message directly (it already includes "...")
                return (
                  <div
                    key="recording-status"
                    className="text-[16px] font-outfit italic text-[rgba(0,0,0,0.5)] mb-2"
                  >
                    {recordingPlaceholderText.content}
                  </div>
                );
              }

              if (transcriptionPlaceholder && transcriptionPlaceholder.type === 'text') {
                const transcriptionPlaceholderText = transcriptionPlaceholder as { type: 'text'; id: string; content: string };
                // If it's "nearly there...", show it directly, otherwise show "listening and transcribing" with dots
                if (transcriptionPlaceholderText.content === 'nearly there...') {
                  return (
                    <div
                      key="transcription-status"
                      className="text-[16px] font-outfit italic text-[rgba(0,0,0,0.5)] mb-2"
                    >
                      nearly there...
                    </div>
                  );
                } else {
                  const transcriptionDotsStr = '.'.repeat(transcriptionDots);
                  return (
                    <div
                      key="transcription-status"
                      className="text-[16px] font-outfit italic text-[rgba(0,0,0,0.5)] mb-2"
                    >
                      listening and transcribing{transcriptionDotsStr}
                    </div>
                  );
                }
              }

              return null;
            })()}

            {contentBlocks
              .filter(block => {
                // Filter out placeholder blocks from contentBlocks
                if (block.type === 'text') {
                  const tb = block as { type: 'text'; id: string; content: string };
                  // Check if it's any of our recording messages, paused, or transcribing
                  const isRecordingMessage = recordingMessages.some(msg => tb.content === msg + '...');
                  return !isRecordingMessage &&
                    tb.content !== 'paused...' &&
                    tb.content !== 'listening and transcribing' &&
                    tb.content !== 'nearly there...';
                }
                return true;
              })
              .map((block, index) => {
                if (block.type === 'text') {
                  const textBlock = block as { type: 'text'; id: string; content: string };
                  // Check if note has ANY content (images, text, or recording placeholders)
                  // If so, don't show "Start writing..." placeholder
                  const hasAnyContent = contentBlocks.some(b => {
                    if (b.type === 'image') return true; // Has an image
                    if (b.type === 'text') {
                      const tb = b as { type: 'text'; id: string; content: string };
                      // Has actual text content
                      if (tb.content && tb.content.trim()) return true;
                      // Has recording/transcription placeholder
                      const isRecordingMessage = recordingMessages.some(msg => tb.content === msg + '...');
                      if (tb.content === 'listening and transcribing' ||
                        tb.content === 'nearly there...' ||
                        isRecordingMessage ||
                        tb.content === 'paused...') return true;
                    }
                    return false;
                  });

                  return (
                    <div key={block.id} className="relative">
                      <textarea
                        rows={1}
                        value={textBlock.content}
                        onChange={(e) => {
                          const newBlocks = [...contentBlocks];
                          const originalIndex = contentBlocks.findIndex(b => b.id === block.id);
                          if (originalIndex !== -1) {
                            newBlocks[originalIndex] = { ...textBlock, content: e.target.value };
                            setContentBlocks(newBlocks);
                          }
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
                            if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
                              if (index > 0) {
                                const prevBlock = contentBlocks[index - 1];
                                if (prevBlock.type === 'image') {
                                  e.preventDefault();
                                  setContentBlocks(prev => prev.filter(b => b.id !== prevBlock.id));
                                } else if (prevBlock.type === 'text') {
                                  e.preventDefault();
                                  const prevTextBlock = prevBlock as { type: 'text'; id: string; content: string };
                                  const prevContent = prevTextBlock.content;
                                  const currentContent = textBlock.content;
                                  const mergedContent = prevContent + currentContent;
                                  const cursorPosition = prevContent.length;

                                  setContentBlocks(prev => prev
                                    .filter(b => b.id !== block.id)
                                    .map(b => b.id === prevBlock.id ? { ...b, content: mergedContent } : b)
                                  );

                                  setTimeout(() => {
                                    const textareas = document.querySelectorAll('.note-textarea');
                                    const prevTextarea = textareas[index - 1] as HTMLTextAreaElement;
                                    if (prevTextarea) {
                                      prevTextarea.focus();
                                      prevTextarea.selectionStart = cursorPosition;
                                      prevTextarea.selectionEnd = cursorPosition;
                                      prevTextarea.style.height = 'auto';
                                      prevTextarea.style.height = Math.max(24, prevTextarea.scrollHeight) + 'px';
                                    }
                                  }, 10);
                                }
                              }
                            }
                          }
                        }}
                        placeholder={hasAnyContent ? "" : (index === 0 ? "Start writing..." : "")}
                        className={`note-textarea w-full resize-none bg-transparent border-none outline-none text-[16px] font-outfit leading-relaxed text-[hsl(0,0%,25%)] placeholder:text-[hsl(0,0%,60%)] focus:outline-none focus:ring-0 overflow-hidden caret-[hsl(0,0%,25%)]`}
                        style={{
                          minHeight: '24px',
                          color: 'transparent',
                          caretColor: 'hsl(0,0%,25%)',
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none text-[16px] font-outfit leading-relaxed text-[hsl(0,0%,25%)] whitespace-pre-wrap break-words"
                        style={{ minHeight: '24px' }}
                      >
                        {renderTextWithLinks(textBlock.content, isEmbedded)}
                        {!textBlock.content && !hasAnyContent && index === 0 && (
                          <span className="text-[hsl(0,0%,60%)]">Start writing...</span>
                        )}
                      </div>
                    </div>
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
                      aria-label="Delete audio recording"
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
            right: isEmbedded ? '20px' : `calc(20px + env(safe-area-inset-right))`,
            top: isEmbedded ? '50px' : `calc(140px + env(safe-area-inset-top))`
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
              onClick={() => {
                setMenuOpen(false);
                setShowMoveNote(true);
              }}
              className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <img src={moveIcon} alt="" className="w-6 h-6" />
              <span className="text-gray-600 font-outfit">Move Note</span>
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
                  className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recording Button */}
      {!showMoveNote && (
        <>
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

              {/* Horizontal Recording Bar */}
              <div
                className="fixed z-50 flex items-center gap-3 px-5 py-4 rounded-full shadow-2xl"
                style={{
                  bottom: `calc(30px + env(safe-area-inset-bottom))`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#E57373',
                  minWidth: '336px',
                  maxWidth: '90vw'
                }}
              >
                {/* REC Button */}
                <button
                  onClick={stopRecording}
                  className="flex flex-col items-center justify-center"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    minWidth: '43px'
                  }}
                >
                  <div
                    style={{
                      width: '28.8px',
                      height: '28.8px',
                      borderRadius: '50%',
                      border: '2.4px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '2.4px'
                    }}
                  >
                    <div
                      style={{
                        width: '9.6px',
                        height: '9.6px',
                        borderRadius: '50%',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: 'white',
                      fontSize: '9.6px',
                      fontFamily: 'Outfit',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}
                  >
                    REC
                  </span>
                </button>

                {/* PAUSE Button */}
                <button
                  onClick={handleRecorderTap}
                  className="flex flex-col items-center justify-center"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    minWidth: '36px'
                  }}
                >
                  <div
                    style={{
                      width: '28.8px',
                      height: '28.8px',
                      borderRadius: '50%',
                      border: '2.4px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2.4px',
                      marginBottom: '2.4px'
                    }}
                  >
                    <div
                      style={{
                        width: '3.6px',
                        height: '12px',
                        backgroundColor: 'white',
                        borderRadius: '1px'
                      }}
                    />
                    <div
                      style={{
                        width: '3.6px',
                        height: '12px',
                        backgroundColor: 'white',
                        borderRadius: '1px'
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: 'white',
                      fontSize: '8px',
                      fontFamily: 'Outfit',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}
                  >
                    PAUSE
                  </span>
                </button>

                {/* DONE Button */}
                <button
                  onClick={stopRecording}
                  className="flex flex-col items-center justify-center"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    minWidth: '36px'
                  }}
                >
                  <div
                    style={{
                      width: '28.8px',
                      height: '28.8px',
                      borderRadius: '50%',
                      border: '2.4px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '2.4px'
                    }}
                  >
                    <svg
                      width="14.4"
                      height="14.4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 8 10 16 6 12" />
                    </svg>
                  </div>
                  <span
                    style={{
                      color: 'white',
                      fontSize: '8px',
                      fontFamily: 'Outfit',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}
                  >
                    DONE
                  </span>
                </button>

                {/* Waveform Visualization */}
                <div
                  className="flex-1 flex items-center justify-center gap-1"
                  style={{
                    height: '28.8px',
                    minWidth: '72px'
                  }}
                >
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '2.4px',
                        height: `${7.2 + (isPaused ? 0 : Math.random() * 14.4 + audioLevel * 0.12)}px`,
                        backgroundColor: 'white',
                        borderRadius: '1px',
                        transition: 'height 0.1s ease-out'
                      }}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div
                  style={{
                    color: 'white',
                    fontSize: '15.6px',
                    fontFamily: 'Outfit',
                    fontWeight: '600',
                    minWidth: '50px',
                    textAlign: 'right'
                  }}
                >
                  {formatTime(recordingTime)}
                </div>
              </div>
            </>
          )}
        </>
      )}


      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 shadow-xl relative" style={{ width: '300px', maxWidth: '90%' }}>
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
