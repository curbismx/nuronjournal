import React from 'react';
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import settingsIcon from "@/assets/00settings-4.png";
import newPlusIcon from "@/assets/00plus-3.png";
import plusIconRed from "@/assets/00plus_red.png";
import plusIconGreen from "@/assets/00plus_green.png";
import plusIconBlue from "@/assets/00plus_blue.png";
import plusIconPink from "@/assets/00plus_pink.png";
import themeIconDark from "@/assets/dark_theme.png";
import themeIconGreen from "@/assets/green_theme.png";
import themeIconBlue from "@/assets/blue_theme.png";
import themeIconPink from "@/assets/pink_theme.png";
import textImage from "@/assets/text.png";
import text2Image from "@/assets/text2.png";
import text3Image from "@/assets/text3.png";
import plusIcon from "@/assets/plusbig.png";

import condenseIcon from "@/assets/00condense-3.png";
import listViewIcon from "@/assets/00listview.png";
import floatingAddButton from "@/assets/bigredbuttonnoshadow.png";

import backIcon from "@/assets/back.png";
import accountArrow from "@/assets/00settingsarrow-2.png";
import searchIcon from "@/assets/00search-3.png";
import searchArrow from "@/assets/00searcharrow.png";
import threeDotsIcon from "@/assets/00threedots-3.png";
import threeDotsDesktopIcon from "@/assets/3_dots_desktop.png";
import starIcon from '@/assets/star.png';
import addImageIcon from '@/assets/addimage.png';
import moveIcon from '@/assets/move.png';
import sharedIcon from '@/assets/shared.png';
import trashIcon from '@/assets/trash.png';
import hamburgerIcon from "@/assets/hamburger.png";
import folderIcon from "@/assets/folder_icon.png";
import folderArrow from "@/assets/folder_arrow.png";
import folderSettingsIcon from "@/assets/folder_settings.png";
import folderPlusIcon from "@/assets/folder_plus.png";
import greySearchIcon from "@/assets/grey_search.png";
import greyListViewIcon from "@/assets/grey_listview.png";
import greyExpandViewIcon from "@/assets/grey_expandview.png";
import desktopPlusIcon from "@/assets/desktop_plus.png";
import desktopDarkTheme from "@/assets/desktop_dark_theme.png";
import desktopGreenTheme from "@/assets/desktop_green_theme.png";
import desktopBlueTheme from "@/assets/desktop_blue_theme.png";
import desktopPinkTheme from "@/assets/desktop_pink_theme.png";
import darkThemeIcon from "@/assets/dark_theme.png";
import greenThemeIcon from "@/assets/green_theme.png";
import blueThemeIcon from "@/assets/blue_theme.png";
import pinkThemeIcon from "@/assets/pink_theme.png";
import publishIcon from '@/assets/publish.png';
import unpublishIcon from '@/assets/unpublish.png';
import sortUpIcon from "@/assets/up.png";
import sortDownIcon from "@/assets/down.png";

const desktopThemeIcons = {
  default: desktopDarkTheme,
  green: desktopGreenTheme,
  blue: desktopBlueTheme,
  pink: desktopPinkTheme
};

const mobileThemeIcons = {
  default: darkThemeIcon,
  green: greenThemeIcon,
  blue: blueThemeIcon,
  pink: pinkThemeIcon
};
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Capacitor } from '@capacitor/core';
import { restorePurchases, isTrialExpired } from '@/lib/purchases';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useDesktop } from '@/hooks/use-desktop';


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
  folder_id?: string;
  is_published?: boolean;
}

interface GroupedNotes {
  date: string;
  notes: SavedNote[];
}

interface Folder {
  id: string;
  user_id: string;
  name: string;
  default_view: 'collapsed' | 'compact';
  notes_sort_order?: 'asc' | 'desc';
  created_at: string;
  updated_at: string;
  sort_order?: number;
  is_blog?: boolean;
  blog_slug?: string;
  blog_name?: string;
  blog_subheading?: string;
  blog_header_image?: string;
  blog_password?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useDesktop();


  const [desktopSelectedNoteId, setDesktopSelectedNoteId] = useState<string | null>(null);
  const [desktopShowSettings, setDesktopShowSettings] = useState(false);
  const [draggedNote, setDraggedNote] = useState<SavedNote | null>(null);
  const [folderDropFlash, setFolderDropFlash] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [desktopShowAccountDetails, setDesktopShowAccountDetails] = useState(false);
  const [desktopShowChangePassword, setDesktopShowChangePassword] = useState(false);
  const [desktopShowSignUp, setDesktopShowSignUp] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [desktopShowFolderOptions, setDesktopShowFolderOptions] = useState(false);
  const [desktopEditingFolder, setDesktopEditingFolder] = useState<Folder | null>(null);
  const [desktopShowWelcomePopup, setDesktopShowWelcomePopup] = useState(false);
  const [desktopShowMoveNote, setDesktopShowMoveNote] = useState(false);
  const [useMobileColorScheme, setUseMobileColorScheme] = useState(() => {
    const stored = localStorage.getItem('nuron-use-mobile-color-scheme');
    return stored !== null ? JSON.parse(stored) : true; // Default to ON (use theme colors)
  });
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const placeholderPositionRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<string | null>(null);
  // Track which note we've already sent load-note for to prevent duplicate sends
  const lastSentNoteIdRef = useRef<string | null>(null);

  // Check for login query param and open welcome popup
  useEffect(() => {
    if (searchParams.get('login') === 'true' || searchParams.get('signup') === 'true') {
      setDesktopShowWelcomePopup(true);
      setWelcomeIsSignUp(searchParams.get('signup') === 'true');
      // Clear the query params using history API to avoid React Router re-render
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  useEffect(() => {
    // Skip onboarding on desktop
    if (isDesktop) return;

    const onboardingComplete = localStorage.getItem('nuron-onboarding-complete');
    if (!onboardingComplete) {
      navigate('/onboarding');
    }
  }, [navigate, isDesktop]);


  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  
  // CRITICAL: Keep a ref of savedNotes for click handlers to avoid stale closure issues
  const savedNotesRef = useRef<SavedNote[]>([]);
  useEffect(() => {
    savedNotesRef.current = savedNotes;
  }, [savedNotes]);

  // Listen for postMessage from iframe when note is saved
  // Cleanup if user clicks away from new note without saving
  // Cleanup if user clicks away from new note - but wait for save first
  useEffect(() => {
    if (isCreatingNewNote && (!desktopSelectedNoteId || !desktopSelectedNoteId.startsWith('new-'))) {
      setIsCreatingNewNote(false);

      // Only remove EMPTY placeholders - keep ones with content (save is pending)
      setSavedNotes(prev => prev.filter(n => {
        if (!n.id.startsWith('new-')) return true; // Keep real notes

        // Check if placeholder has any content
        const hasTitle = n.title && n.title.trim();
        const hasContent = n.contentBlocks?.some(b =>
          b.type === 'image' ||
          (b.type === 'text' && (b as { type: 'text'; id: string; content: string }).content?.trim())
        );

        // Keep if has content (save is pending), remove if empty
        return hasTitle || hasContent;
      }));
    }
  }, [desktopSelectedNoteId, isCreatingNewNote]);

  // Listen for postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Real-time content updates
      if (e.data?.type === 'note-content-update') {
        const { noteId, placeholderId, title, contentBlocks, createdAt } = e.data;
        setSavedNotes(prev => prev.map(n =>
          (n.id === placeholderId || n.id === noteId)
            ? {
              ...n,
              // Use || not ?? - empty string should fall back to existing title
              title: title || n.title,
              contentBlocks: contentBlocks || n.contentBlocks,
              createdAt: createdAt || n.createdAt
            }
            : n
        ));

        // Also save to localStorage cache so content persists when iframe reloads
        if (placeholderId || noteId) {
          const targetId = noteId || placeholderId;
          const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
          const existingIndex = cached.findIndex((n: any) => n.id === placeholderId || n.id === noteId);

          if (existingIndex >= 0) {
            // UPDATE existing - preserve existing values if new ones are empty
            cached[existingIndex] = {
              ...cached[existingIndex],
              id: targetId,
              title: title || cached[existingIndex].title || '',
              contentBlocks: contentBlocks || cached[existingIndex].contentBlocks || [],
              createdAt: createdAt || cached[existingIndex].createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          } else {
            // INSERT new
            cached.unshift({
              id: targetId,
              title: title || '',
              contentBlocks: contentBlocks || [],
              createdAt: createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          localStorage.setItem('nuron-notes-cache', JSON.stringify(cached));
        }
      }

      // Note saved - swap ID using placeholderId from message
      if (e.data?.type === 'note-saved') {
        const { noteId, noteData, placeholderId } = e.data;
        // Use placeholderId from message (more reliable than current selection)
        const targetId = placeholderId || desktopSelectedNoteId;
        setSavedNotes(prev => prev.map(n =>
          n.id === targetId
            ? {
              ...n,
              id: noteId,
              // Use || not ?? - empty string should fall back to existing title
              title: noteData?.title || n.title,
              contentBlocks: noteData?.contentBlocks || n.contentBlocks,
              createdAt: noteData?.createdAt || n.createdAt,
              updatedAt: noteData?.updatedAt || n.updatedAt,
              weather: noteData?.weather ?? n.weather,
              folder_id: noteData?.folder_id || n.folder_id,
              is_published: n.is_published || false
            }
            : n
        ));
        if (targetId === desktopSelectedNoteId && desktopSelectedNoteId?.startsWith('new-')) {
          setDesktopSelectedNoteId(noteId);
        }
        setIsCreatingNewNote(false);

        // Update cache - Index.tsx is the single cache manager
        // Replace placeholder ID with real ID in cache
        const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
        const existingIndex = cached.findIndex((n: any) => n.id === targetId || n.id === noteId);

        if (existingIndex >= 0) {
          // UPDATE existing - preserve existing values if new ones are empty
          cached[existingIndex] = {
            ...cached[existingIndex],
            id: noteId,
            title: noteData?.title || cached[existingIndex].title || '',
            contentBlocks: noteData?.contentBlocks || cached[existingIndex].contentBlocks || [],
            createdAt: noteData?.createdAt || cached[existingIndex].createdAt || new Date().toISOString(),
            updatedAt: noteData?.updatedAt || new Date().toISOString(),
            weather: noteData?.weather ?? cached[existingIndex].weather,
            folder_id: noteData?.folder_id || cached[existingIndex].folder_id
          };
        } else {
          // INSERT new
          cached.unshift({
            id: noteId,
            title: noteData?.title || '',
            contentBlocks: noteData?.contentBlocks || [],
            createdAt: noteData?.createdAt || new Date().toISOString(),
            updatedAt: noteData?.updatedAt || new Date().toISOString(),
            weather: noteData?.weather,
            folder_id: noteData?.folder_id
          });
        }
        localStorage.setItem('nuron-notes-cache', JSON.stringify(cached));
      }

      // Note updated - in place (including date changes)
      if (e.data?.type === 'note-updated') {
        const { noteData } = e.data;
        if (noteData) {
          setSavedNotes(prev => prev.map(n =>
            n.id === noteData.id
              ? {
                ...n,
                // Use || not ?? - empty string should fall back to existing title
                title: noteData.title || n.title,
                contentBlocks: noteData.contentBlocks || n.contentBlocks,
                createdAt: noteData.createdAt || n.createdAt,
                updatedAt: noteData.updatedAt || n.updatedAt,
                weather: noteData.weather ?? n.weather,
                is_published: n.is_published
              }
              : n
          ));
        }
      }

      // Note deleted
      if (e.data?.type === 'note-deleted') {
        setSavedNotes(prev => prev.filter(n => n.id !== e.data.noteId));
        if (desktopSelectedNoteId === e.data.noteId) setDesktopSelectedNoteId(null);

        // Clear the sent ref so note selection works correctly for future notes
        if (lastSentNoteIdRef.current === e.data.noteId) {
          lastSentNoteIdRef.current = null;
        }

        // Update cache to remove the deleted note
        const cached = JSON.parse(localStorage.getItem('nuron-notes-cache') || '[]');
        const filtered = cached.filter((n: any) => n.id !== e.data.noteId);
        localStorage.setItem('nuron-notes-cache', JSON.stringify(filtered));
      }

      if (e.data?.type === 'rewrite-start') setDesktopRewriteGlow(true);
      if (e.data?.type === 'rewrite-end') setDesktopRewriteGlow(false);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [desktopSelectedNoteId]);

  useEffect(() => {
    localStorage.setItem('nuron-use-mobile-color-scheme', JSON.stringify(useMobileColorScheme));
  }, [useMobileColorScheme]);
  const [viewMode, setViewMode] = useState<'collapsed' | 'compact'>('collapsed');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = newest first, asc = oldest first
  const [userChangedView, setUserChangedView] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; username?: string } | null>(null);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Welcome popup form states
  const [welcomeEmail, setWelcomeEmail] = useState('');
  const [welcomePassword, setWelcomePassword] = useState('');
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeIsSignUp, setWelcomeIsSignUp] = useState(true);
  const [welcomeLoading, setWelcomeLoading] = useState(false);
  const [welcomeError, setWelcomeError] = useState('');
  const [welcomeShowPassword, setWelcomeShowPassword] = useState(false);

  // Auto-close welcome popup when user logs in
  useEffect(() => {
    if (user && desktopShowWelcomePopup) {
      setDesktopShowWelcomePopup(false);
      localStorage.setItem('nuron-desktop-visited', 'true');
    }
  }, [user, desktopShowWelcomePopup]);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showWeatherOnNotes, setShowWeatherOnNotes] = useState(() => {
    const stored = localStorage.getItem('nuron-show-weather');
    return stored !== null ? JSON.parse(stored) : true; // Default to ON
  });
  const [autoRecordNewNote, setAutoRecordNewNote] = useState(() => {
    const stored = localStorage.getItem('nuron-auto-record-new-note');
    return stored !== null ? JSON.parse(stored) : false; // Default OFF
  });
  const [theme, setTheme] = useState<'default' | 'green' | 'blue' | 'pink'>(() => {
    const stored = localStorage.getItem('nuron-theme');
    return (stored as 'default' | 'green' | 'blue' | 'pink') || 'default';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query for performance with large note collections
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-save when app goes to background (force-save iframe on desktop)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Force save any pending note changes in iframe
        const iframe = document.querySelector('iframe');
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'force-save' }, '*');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showRateAppDialog, setShowRateAppDialog] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [desktopRewriteGlow, setDesktopRewriteGlow] = useState(false);

  // Network status for offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect logged-out desktop users with no notes to landing page
  // But NOT if welcome popup is showing (user came from login button)
  useEffect(() => {
    if (isDesktop && !isInitializing && !user && savedNotes.length === 0 && !desktopShowWelcomePopup) {
      navigate('/welcome', { replace: true });
    }
  }, [isDesktop, isInitializing, user, savedNotes.length, navigate, desktopShowWelcomePopup]);

  // Folder state
  const [showFolders, setShowFolders] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(() => {
    const savedFolderId = localStorage.getItem('nuron-current-folder-id');
    // Just store the ID for now, the full folder object will be set when folders load
    return savedFolderId ? { id: savedFolderId } as Folder : null;
  });
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDefaultView, setNewFolderDefaultView] = useState<'collapsed' | 'compact'>('collapsed');
  const [newFolderSortOrder, setNewFolderSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [desktopShowDeleteFolderConfirm, setDesktopShowDeleteFolderConfirm] = useState(false);
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [dropLineIndex, setDropLineIndex] = useState<number | null>(null);

  // Blog settings states
  const [newFolderIsBlog, setNewFolderIsBlog] = useState(false);
  const [newFolderBlogSlug, setNewFolderBlogSlug] = useState('');
  const [newFolderBlogName, setNewFolderBlogName] = useState('');
  const [newFolderBlogPassword, setNewFolderBlogPassword] = useState('');
  const [newFolderBlogSubheading, setNewFolderBlogSubheading] = useState('');
  const [newFolderBlogHeaderImage, setNewFolderBlogHeaderImage] = useState('');
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const [blogSlugAvailable, setBlogSlugAvailable] = useState<boolean | null>(null);
  const [checkingBlogSlug, setCheckingBlogSlug] = useState(false);

  // Send selected note to iframe when it changes (persistent iframe approach)
  useEffect(() => {
    if (!desktopSelectedNoteId) return;

    // CRITICAL: Only send load-note ONCE per note selection
    if (lastSentNoteIdRef.current === desktopSelectedNoteId) return;

    const isNewNote = desktopSelectedNoteId.startsWith('new-');
    const selectedNote = savedNotes.find(n => n.id === desktopSelectedNoteId);

    // For existing notes, wait until we have the note data in savedNotes
    // This handles the case where user clicks a note right after switching folders
    // before loadNotes has completed. We'll retry when savedNotes updates.
    if (!isNewNote && !selectedNote) {
      return; // Don't set lastSentNoteIdRef - we'll retry when savedNotes has the data
    }

    // Now we have the data (or it's a new note), mark as sent
    lastSentNoteIdRef.current = desktopSelectedNoteId;

    const sendNoteToIframe = () => {
      const iframe = document.getElementById('note-editor-iframe') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'load-note',
          noteId: isNewNote ? null : desktopSelectedNoteId,
          placeholderId: isNewNote ? desktopSelectedNoteId : null,
          folderId: selectedNote?.folder_id || currentFolder?.id || null,
          createdAt: selectedNote?.createdAt || new Date().toISOString(),
          cachedTitle: selectedNote?.title || '',
          cachedContentBlocks: selectedNote?.contentBlocks || [{ type: 'text', id: 'initial', content: '' }]
        }, '*');
      }
    };

    // Small delay to ensure iframe is ready
    const timer = setTimeout(sendNoteToIframe, 50);

    return () => clearTimeout(timer);
  }, [desktopSelectedNoteId, currentFolder?.id, savedNotes]); // savedNotes back - safe now with Note.tsx fixes

  const themeColors = {
    default: '#2E2E2E',
    green: '#8DBA55',
    blue: '#6BA8D8',
    pink: '#E88BAD'
  };

  const themePlusIcons = {
    default: plusIconRed,
    green: plusIconGreen,
    blue: plusIconBlue,
    pink: plusIconPink
  };

  const themeSettingsIcons = {
    default: themeIconDark,
    green: themeIconGreen,
    blue: themeIconBlue,
    pink: themeIconPink
  };

  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [localNotesToMerge, setLocalNotesToMerge] = useState<SavedNote[]>([]);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [authFormError, setAuthFormError] = useState("");
  const [passwordFormError, setPasswordFormError] = useState("");
  const [visibleMonthYear, setVisibleMonthYear] = useState<string>(
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  );
  const dateGroupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Save weather setting to localStorage
  useEffect(() => {
    localStorage.setItem('nuron-show-weather', JSON.stringify(showWeatherOnNotes));
  }, [showWeatherOnNotes]);

  useEffect(() => {
    localStorage.setItem('nuron-auto-record-new-note', JSON.stringify(autoRecordNewNote));
  }, [autoRecordNewNote]);

  useEffect(() => {
    localStorage.setItem('nuron-theme', theme);
  }, [theme]);

  // Check if trial has expired
  useEffect(() => {
    if (isTrialExpired()) {
      setShowSubscriptionModal(true);
    }
  }, []);

  // Track app usage and show rate app dialog
  useEffect(() => {
    // Only track after onboarding is complete
    const onboardingComplete = localStorage.getItem('nuron-onboarding-complete');
    if (!onboardingComplete) return;

    // Check if user has already rated
    const hasRated = localStorage.getItem('nuron-has-rated') === 'true';
    if (hasRated) return;

    // Get current usage count
    const usageCountStr = localStorage.getItem('nuron-app-usage-count');
    const usageCount = usageCountStr ? parseInt(usageCountStr, 10) : 0;
    const lastPromptCountStr = localStorage.getItem('nuron-last-rate-prompt');
    const lastPromptCount = lastPromptCountStr ? parseInt(lastPromptCountStr, 10) : 0;

    // Increment usage count
    const newUsageCount = usageCount + 1;
    localStorage.setItem('nuron-app-usage-count', newUsageCount.toString());

    // Show dialog after 3 uses, then every 10 uses if dismissed
    if (newUsageCount === 3 || (newUsageCount > 3 && (newUsageCount - lastPromptCount) >= 10)) {
      setShowRateAppDialog(true);
      localStorage.setItem('nuron-last-rate-prompt', newUsageCount.toString());
    }
  }, []); // Run once on mount

  // Load folders when user is authenticated
  useEffect(() => {
    const loadFolders = async () => {
      // Wait for auth to be determined before loading folders
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // Not logged in - use local folder
        const localFolder: Folder = {
          id: 'local-notes',
          user_id: 'local',
          name: 'Notes',
          default_view: 'collapsed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setFolders([localFolder]);
        if (!currentFolder || currentFolder.id === 'local-notes') {
          setCurrentFolder(localFolder);
        }
        setIsInitializing(false);
        return;
      }

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Failed to load folders:', error);
        toast.error('Failed to load folders. Please check your connection.');
        setIsInitializing(false);
        return;
      }

      if (data) {
        if (data.length === 0) {
          // Only create default folder if user has NO folders at all
          const { data: newFolder, error: createError } = await supabase
            .from('folders')
            .insert({ user_id: session.user.id, name: 'Notes', default_view: 'collapsed' })
            .select()
            .single();

          if (newFolder && !createError) {
            const typedFolder: Folder = {
              ...newFolder,
              default_view: (newFolder.default_view || 'collapsed') as 'collapsed' | 'compact',
              notes_sort_order: (newFolder.notes_sort_order || 'desc') as 'asc' | 'desc'
            };
            setFolders([typedFolder]);
            setCurrentFolder(typedFolder);
            setViewMode(typedFolder.default_view);
            localStorage.setItem('nuron-current-folder-id', typedFolder.id);
          }
        } else {
          const typedFolders = data.map(f => ({
            ...f,
            default_view: (f.default_view || 'collapsed') as 'collapsed' | 'compact',
            notes_sort_order: (f.notes_sort_order || 'desc') as 'asc' | 'desc'
          }));
          setFolders(typedFolders);

          // Fix any folders with null sort_order
          const foldersNeedingOrder = typedFolders.filter(f => f.sort_order === null || f.sort_order === undefined);
          if (foldersNeedingOrder.length > 0) {
            let maxOrder = Math.max(...typedFolders.filter(f => f.sort_order !== null && f.sort_order !== undefined).map(f => f.sort_order || 0), -1);
            for (const folder of foldersNeedingOrder) {
              maxOrder++;
              await supabase
                .from('folders')
                .update({ sort_order: maxOrder })
                .eq('id', folder.id);
            }
          }

          // ALWAYS check localStorage first to restore the previously selected folder
          const savedFolderId = localStorage.getItem('nuron-current-folder-id');
          const savedFolder = savedFolderId ? typedFolders.find(f => f.id === savedFolderId) : null;

          if (savedFolder) {
            setCurrentFolder(savedFolder);
            if (!userChangedView) {
              setViewMode(savedFolder.default_view);
            }
          } else {
            // No saved folder or it was deleted - default to Notes or first folder
            const defaultFolder = typedFolders.find(f => f.name === 'Notes') || typedFolders[0];
            setCurrentFolder(defaultFolder);
            if (!userChangedView) {
              setViewMode(defaultFolder.default_view);
            }
            localStorage.setItem('nuron-current-folder-id', defaultFolder.id);
          }
        }
      }
      setIsInitializing(false);
    };

    loadFolders();
  }, [user]);

  // Migrate existing notes without folder_id to the default folder
  useEffect(() => {
    const migrateNotes = async () => {
      if (!user || !currentFolder || currentFolder.id === 'local-notes' || isCreatingNewNote) return;

      // Update any notes without a folder_id to use the current folder
      const { data: updatedNotes } = await supabase
        .from('notes')
        .update({ folder_id: currentFolder.id })
        .eq('user_id', user.id)
        .is('folder_id', null)
        .select();

      // If notes were migrated, reload all notes
      if (updatedNotes && updatedNotes.length > 0) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('folder_id', currentFolder.id)
          .order('created_at', { ascending: false });

        if (data) {
          const notes = data.map(note => ({
            id: note.id,
            title: note.title || 'Untitled',
            contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
            createdAt: note.created_at,
            updatedAt: note.updated_at,
            weather: note.weather as SavedNote['weather'],
            folder_id: note.folder_id,
            is_published: note.is_published || false
          }));
          setSavedNotes(notes);
          localStorage.setItem('nuron-notes-cache', JSON.stringify(notes));
        }
      }
    };

    migrateNotes();
  }, [user, currentFolder]);

  // Store current folder id for Note.tsx
  useEffect(() => {
    // Don't save folder during initialization - wait for proper folder to load
    if (isInitializing) return;
    if (currentFolder && currentFolder.id !== 'local-notes') {
      localStorage.setItem('nuron-current-folder-id', currentFolder.id);
      // Clear the notes cache so old folder's notes don't show
      localStorage.removeItem('nuron-notes-cache');
    }
  }, [currentFolder, isInitializing]);

  // Folder CRUD functions
  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: newFolderName.trim(),
        default_view: newFolderDefaultView,
        sort_order: folders.length  // Put new folder at the end
      })
      .select()
      .single();

    if (data && !error) {
      const typedFolder: Folder = {
        ...data,
        default_view: (data.default_view || 'collapsed') as 'collapsed' | 'compact',
        notes_sort_order: (data.notes_sort_order || 'desc') as 'asc' | 'desc'
      };
      setFolders(prev => [...prev, typedFolder]);
      setShowFolderPopup(false);
      setNewFolderName("");
      setNewFolderDefaultView('collapsed');
    }
  };

  const updateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    const { error } = await supabase
      .from('folders')
      .update({
        name: newFolderName.trim(),
        default_view: newFolderDefaultView,
        notes_sort_order: newFolderSortOrder,
        is_blog: newFolderIsBlog,
        blog_slug: newFolderIsBlog ? newFolderBlogSlug.toLowerCase() : null,
        blog_name: newFolderIsBlog ? newFolderBlogName : null,
        blog_subheading: newFolderIsBlog ? newFolderBlogSubheading : null,
        blog_header_image: newFolderIsBlog ? newFolderBlogHeaderImage : null,
        blog_password: newFolderIsBlog && newFolderBlogPassword ? newFolderBlogPassword : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingFolder.id);

    if (!error) {
      const updatedFolder = {
        ...editingFolder,
        name: newFolderName.trim(),
        default_view: newFolderDefaultView,
        notes_sort_order: newFolderSortOrder,
        is_blog: newFolderIsBlog,
        blog_slug: newFolderIsBlog ? newFolderBlogSlug.toLowerCase() : null,
        blog_name: newFolderIsBlog ? newFolderBlogName : null,
        blog_subheading: newFolderIsBlog ? newFolderBlogSubheading : null,
        blog_header_image: newFolderIsBlog ? newFolderBlogHeaderImage : null,
        blog_password: newFolderIsBlog && newFolderBlogPassword ? newFolderBlogPassword : null
      };
      setFolders(prev => prev.map(f =>
        f.id === editingFolder.id ? updatedFolder : f
      ));
      if (currentFolder?.id === editingFolder.id) {
        setCurrentFolder(updatedFolder);
        setSortOrder(newFolderSortOrder);
      }
      setShowFolderPopup(false);
      setEditingFolder(null);
      setNewFolderName("");
      setNewFolderDefaultView('collapsed');
      setNewFolderSortOrder('desc');
      setNewFolderIsBlog(false);
      setNewFolderBlogSlug('');
      setNewFolderBlogName('');
      setNewFolderBlogSubheading('');
      setNewFolderBlogHeaderImage('');
      setNewFolderBlogPassword('');
    } else {
      toast.error('Failed to update folder');
    }
  };

  const deleteFolder = async () => {
    if (!folderToDelete) return;

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderToDelete.id);

    if (!error) {
      setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
      if (currentFolder?.id === folderToDelete.id) {
        const remaining = folders.filter(f => f.id !== folderToDelete.id);
        setCurrentFolder(remaining[0] || null);
      }
      setShowDeleteFolderConfirm(false);
      setFolderToDelete(null);
      setShowFolderPopup(false);
      setEditingFolder(null);
    }
  };

  const openEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderDefaultView(folder.default_view);
    setNewFolderSortOrder(folder.notes_sort_order || 'desc');
    setNewFolderIsBlog(folder.is_blog || false);
    setNewFolderBlogSlug(folder.blog_slug || '');
    setNewFolderBlogName(folder.blog_name || '');
    setNewFolderBlogSubheading(folder.blog_subheading || '');
    setNewFolderBlogHeaderImage(folder.blog_header_image || '');
    setNewFolderBlogPassword(folder.blog_password || '');
    setBlogSlugAvailable(null);
    setShowFolderPopup(true);
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    setNewFolderName("");
    setNewFolderDefaultView('collapsed');
    setNewFolderSortOrder('desc');
    setNewFolderIsBlog(false);
    setNewFolderBlogSlug('');
    setNewFolderBlogName('');
    setNewFolderBlogSubheading('');
    setNewFolderBlogHeaderImage('');
    setNewFolderBlogPassword('');
    setBlogSlugAvailable(null);
    setShowFolderPopup(true);
  };

  const selectFolder = (folder: Folder) => {
    // CRITICAL: Reset creating state FIRST
    setIsCreatingNewNote(false);
    setSavedNotes(prev => prev.filter(n => !n.id.startsWith('new-')));

    // Brief fade out before switching
    const contentEl = document.querySelector('.notes-list-container');
    if (contentEl) {
      contentEl.classList.add('opacity-0');
      setTimeout(() => {
        setCurrentFolder(folder);
        localStorage.setItem('nuron-current-folder-id', folder.id);
        setViewMode(folder.default_view || 'collapsed');
        setUserChangedView(false);
        setShowFolders(false);
        setTimeout(() => {
          contentEl.classList.remove('opacity-0');
        }, 50);
      }, 150);
    } else {
      setCurrentFolder(folder);
      localStorage.setItem('nuron-current-folder-id', folder.id);
      setViewMode(folder.default_view || 'collapsed');
      setUserChangedView(false);
      setShowFolders(false);
    }
  };

  // Helper function to save new notes directly (fixes iframe destruction race condition)
  const saveNewNoteDirectly = async (note: SavedNote) => {
    // Only save new notes with content
    if (!note.id.startsWith('new-')) return null;

    const hasTitle = note.title && note.title.trim();
    const hasContent = note.contentBlocks?.some(b =>
      b.type === 'image' ||
      (b.type === 'text' && (b as { type: 'text'; id: string; content: string }).content?.trim())
    );

    if (!hasTitle && !hasContent) return null; // Nothing to save

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const realId = crypto.randomUUID();
    const currentFolderId = currentFolder?.id;

    const { error } = await supabase.from('notes').upsert({
      id: realId,
      user_id: session.user.id,
      title: note.title || '',
      content_blocks: note.contentBlocks,
      created_at: note.createdAt,
      updated_at: new Date().toISOString(),
      folder_id: currentFolderId && currentFolderId !== 'local-notes' ? currentFolderId : null,
      is_published: false
    });

    if (error) {
      console.error('Error saving note:', error);
      return null;
    }

    return realId; // Return the new UUID
  };

  const updateFolderOrder = async (folderId: string, newIndex: number) => {
    if (!user) return;

    const newFolders = [...folders];
    const oldIndex = newFolders.findIndex(f => f.id === folderId);
    if (oldIndex === -1) return;

    const [movedFolder] = newFolders.splice(oldIndex, 1);
    newFolders.splice(newIndex, 0, movedFolder);

    // Update local state immediately
    setFolders(newFolders);

    // Update sort_order in database for all folders
    for (let i = 0; i < newFolders.length; i++) {
      await supabase
        .from('folders')
        .update({ sort_order: i })
        .eq('id', newFolders[i].id);
    }
  };

  // Check authentication status and set up auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      // Only reload notes on actual sign in/out events, not on initial load
      if (event === 'SIGNED_IN') {
        setTimeout(() => {
          loadUserProfile(session!.user.id);
          setShowFolders(false);

          // Check for local notes to merge
          const localNotes = localStorage.getItem('nuron-notes');
          if (localNotes) {
            const parsed = JSON.parse(localNotes);
            if (parsed.length > 0) {
              setLocalNotesToMerge(parsed);
              setShowMergeDialog(true);
            }
          }

        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        localStorage.removeItem('nuron-notes-cache');  // Clear cache on sign out
        // Load from localStorage when logged out
        const stored = localStorage.getItem('nuron-notes');
        setSavedNotes(stored ? JSON.parse(stored) : []);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadNotes = async () => {
      if (!currentFolder) return;

      // Load from localStorage for local notes (not logged in)
      if (currentFolder.id === 'local-notes') {
        const stored = localStorage.getItem('nuron-notes');
        setSavedNotes(stored ? JSON.parse(stored) : []);
        console.log('Loaded notes from localStorage:', stored ? JSON.parse(stored).length : 0);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const NOTES_PER_PAGE = 100;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('folder_id', currentFolder.id)
        .order('created_at', { ascending: false })
        .limit(NOTES_PER_PAGE);

      if (error) {
        console.error('Failed to load notes:', error);
        toast.error('Failed to load notes. Please check your connection.');
        return;
      }

      if (data) {
        const notes = data.map(note => ({
          id: note.id,
          title: note.title || 'Untitled',
          contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          weather: note.weather as SavedNote['weather'],
          folder_id: note.folder_id,
          is_published: note.is_published || false
        }));

        // Preserve only placeholders for the CURRENT folder
        setSavedNotes(prev => {
          const placeholders = prev.filter(n => n.id.startsWith('new-') && n.folder_id === currentFolder.id);
          const combined = placeholders.length > 0 ? [...placeholders, ...notes] : notes;
          // Deduplicate by id - keep first occurrence
          const seen = new Set<string>();
          return combined.filter(note => {
            if (seen.has(note.id)) return false;
            seen.add(note.id);
            return true;
          });
        });
      }
    };

    loadNotes();
  }, [currentFolder?.id]);

  const loadUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, email, username')
      .eq('id', userId)
      .single();

    if (data) {
      setUserProfile(data);
      setUsername(data.username || '');
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // Reserved words that cannot be used as usernames
    const reserved = ['index', 'home', 'contact', 'prices', 'features', 'blog', 'admin', 'api', 'app', 'www'];
    if (reserved.includes(usernameToCheck.toLowerCase())) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', usernameToCheck.toLowerCase())
      .neq('id', user?.id || '')
      .maybeSingle();

    setCheckingUsername(false);
    setUsernameAvailable(!data);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthFormError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      // SUCCESS: Just proceed - the auth state change will handle navigation
      setShowSignUp(false);
      setName("");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      setAuthFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthFormError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // SUCCESS: Just proceed - no alert needed
      setShowSignUp(false);
      setIsSignInMode(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      // Use generic message to prevent email enumeration
      setAuthFormError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setShowAccountDetails(false);
    setShowSettings(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setShowDeleteConfirmDialog(false);
    setLoading(true);

    try {
      // Delete images from storage
      const { data: imageFiles } = await supabase.storage.from('note-images').list(user.id);
      if (imageFiles && imageFiles.length > 0) {
        await supabase.storage.from('note-images').remove(imageFiles.map(f => `${user.id}/${f.name}`));
      }

      // Delete audio from storage
      const { data: audioFiles } = await supabase.storage.from('audio-recordings').list(user.id);
      if (audioFiles && audioFiles.length > 0) {
        await supabase.storage.from('audio-recordings').remove(audioFiles.map(f => `${user.id}/${f.name}`));
      }

      // Delete database records
      await supabase.from("notes").delete().eq("user_id", user.id);
      await supabase.from("folders").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      // Clear local storage
      localStorage.removeItem('nuron-notes');
      localStorage.removeItem('nuron-notes-cache');
      localStorage.removeItem('nuron-current-folder-id');

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      setLoading(false);
      return;
    }

    setUser(null);
    setUserProfile(null);
    setShowAccountDetails(false);
    setShowSettings(false);
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFormError("");

    if (newPassword !== confirmNewPassword) {
      setPasswordFormError("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordFormError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // SUCCESS: Just close the form - that's the feedback
      setShowChangePassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      setPasswordFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthFormError("Please enter your email address");
      return;
    }

    setLoading(true);
    setAuthFormError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?login=true`,
      });

      if (error) throw error;
      setResetEmailSent(true);
    } catch (error: any) {
      // Use generic message to not reveal if email exists
      setResetEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeForgotPassword = async () => {
    if (!welcomeEmail) {
      setWelcomeError("Please enter your email address");
      return;
    }

    setWelcomeLoading(true);
    setWelcomeError('');

    try {
      await supabase.auth.resetPasswordForEmail(welcomeEmail, {
        redirectTo: `${window.location.origin}/?login=true`,
      });
      setResetEmailSent(true);
    } catch (error: any) {
      setResetEmailSent(true); // Show success message regardless
    } finally {
      setWelcomeLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert('Restore is only available on iOS');
      return;
    }

    setIsRestoring(true);

    try {
      const customerInfo = await restorePurchases();
      if (customerInfo && customerInfo.activeSubscriptions.length > 0) {
        localStorage.setItem('nuron-subscribed', 'true');
        alert('Purchases restored successfully!');
      } else {
        alert('No active subscriptions found');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore purchases. Please try again.');
    }

    setIsRestoring(false);
  };

  const handleRateApp = () => {
    // Mark as rated
    localStorage.setItem('nuron-has-rated', 'true');
    setShowRateAppDialog(false);

    // Open App Store rating page
    if (Capacitor.isNativePlatform()) {
      // iOS App Store URL format: itms-apps://itunes.apple.com/app/id{APP_ID}?action=write-review
      // Get your App Store ID from App Store Connect after app submission
      // It's a numeric ID (e.g., 1234567890) found in your app's App Store URL
      const appStoreId = '6756124553'; // TODO: Replace with actual App Store ID from App Store Connect
      if (appStoreId !== '6756124553') {
        const appStoreUrl = `itms-apps://itunes.apple.com/app/id${appStoreId}?action=write-review`;
        window.open(appStoreUrl, '_blank');
      } else {
        // Fallback if App Store ID not set yet
        console.log('App Store ID not configured. Please set it in Index.tsx');
        toast.error('App Store ID not configured');
      }
    } else {
      // Web fallback - could open a feedback form or just close
      console.log('Rate app on web');
    }
  };

  const handleDismissRateApp = () => {
    // Don't mark as rated, just dismiss
    // It will show again after 10 more uses
    setShowRateAppDialog(false);
  };

  const loadNotesFromSupabase = async (userId: string) => {
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (currentFolder && currentFolder.id !== 'local-notes') {
      query = query.eq('folder_id', currentFolder.id);
    }

    const { data } = await query;

    if (data) {
      setSavedNotes(data.map(note => ({
        id: note.id,
        title: note.title || 'Untitled',
        contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        weather: note.weather as SavedNote['weather'],
        folder_id: note.folder_id,
        is_published: note.is_published || false
      })));
    }
  };

  const mergeAndSyncNotes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Upload ALL local notes to Supabase (upsert handles duplicates)
      for (const note of localNotesToMerge) {
        await supabase.from('notes').upsert({
          id: note.id,
          user_id: user.id,
          title: note.title,
          content_blocks: note.contentBlocks,
          created_at: note.createdAt,
          updated_at: note.updatedAt,
          weather: note.weather,
          folder_id: currentFolder?.id !== 'local-notes' ? currentFolder?.id : null
        });
      }

      // Clear localStorage
      localStorage.removeItem('nuron-notes');

      // Reload everything from Supabase
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (currentFolder && currentFolder.id !== 'local-notes') {
        query = query.eq('folder_id', currentFolder.id);
      }

      const { data } = await query;

      if (data) {
        setSavedNotes(data.map(note => ({
          id: note.id,
          title: note.title || 'Untitled',
          contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          weather: note.weather as SavedNote['weather'],
          folder_id: note.folder_id,
          is_published: note.is_published || false
        })));
      }

      setLocalNotesToMerge([]);
    } catch (error: any) {
      console.error('Error syncing notes:', error);
      toast.error('Could not sync notes. Please try again.');
    } finally {
      setLoading(false);
      setShowMergeDialog(false);
    }
  };


  // Sort notes based on sortOrder
  const sortedNotes = React.useMemo(() => {
    // First deduplicate by id
    const seen = new Set<string>();
    const deduped = savedNotes.filter(note => {
      if (seen.has(note.id)) return false;
      seen.add(note.id);
      return true;
    });

    const sorted = [...deduped];
    if (sortOrder === 'asc') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [savedNotes, sortOrder]);

  // Group notes by date - memoized for performance
  const groupedNotes: GroupedNotes[] = React.useMemo(() => {
    const groups = sortedNotes.reduce((acc: GroupedNotes[], note) => {
      const dateKey = new Date(note.createdAt).toLocaleDateString('en-US');
      const existingGroup = acc.find(g => g.date === dateKey);

      if (existingGroup) {
        existingGroup.notes.push(note);
      } else {
        acc.push({
          date: dateKey,
          notes: [note]
        });
      }

      return acc;
    }, []);

    // Sort notes within each group to ensure new notes are first in their day
    groups.forEach(group => {
      group.notes.sort((a, b) => {
        const aIsNew = a.id.startsWith('new-');
        const bIsNew = b.id.startsWith('new-');
        if (aIsNew && !bIsNew) return -1;
        if (bIsNew && !aIsNew) return 1;
        // Otherwise maintain the sortOrder within the day
        if (sortOrder === 'asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
    });

    return groups;
  }, [sortedNotes, sortOrder]);

  // Filter notes based on search - memoized with debounced query
  const filteredNotes = React.useMemo(() => {
    if (debouncedSearchQuery.trim() === '') {
      return sortedNotes;
    }
    const query = debouncedSearchQuery.toLowerCase();
    return sortedNotes.filter(note => {
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.contentBlocks
        .filter(b => b.type === 'text')
        .some(b => (b as { type: 'text'; id: string; content: string }).content.toLowerCase().includes(query));
      return titleMatch || contentMatch;
    });
  }, [sortedNotes, debouncedSearchQuery]);

  const filteredGroupedNotes: GroupedNotes[] = React.useMemo(() => {
    return filteredNotes.reduce((groups: GroupedNotes[], note) => {
      const dateKey = new Date(note.createdAt).toLocaleDateString('en-US');
      const existingGroup = groups.find(g => g.date === dateKey);
      if (existingGroup) {
        existingGroup.notes.push(note);
      } else {
        groups.push({ date: dateKey, notes: [note] });
      }
      return groups;
    }, []);
  }, [filteredNotes]);

  // Update visibleMonthYear when notes change
  useEffect(() => {
    if (savedNotes.length > 0) {
      setVisibleMonthYear(new Date(savedNotes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase());
    }
  }, [savedNotes, viewMode]);

  // Intersection Observer for dynamic month/year header
  useEffect(() => {
    if (groupedNotes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const topEntry = visibleEntries[0];
          const monthYear = topEntry.target.getAttribute('data-month-year');
          if (monthYear) setVisibleMonthYear(monthYear);
        }
      },
      { root: scrollContainerRef.current, rootMargin: '-100px 0px -80% 0px', threshold: 0 }
    );
    const timer = setTimeout(() => {
      dateGroupRefs.current.forEach((element) => observer.observe(element));
    }, 100);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [groupedNotes]);

  // Get month/year for header (most recent note or current month)
  const headerMonthYear = savedNotes.length > 0
    ? new Date(savedNotes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  // Get combined text content from contentBlocks
  const getNotePreview = (note: SavedNote): string[] => {
    const textBlocks = note.contentBlocks?.filter(b => b.type === 'text') || [];
    const allText = textBlocks.map(b => (b as { type: 'text'; id: string; content: string }).content || '').join('\n');
    const lines = allText.split('\n');
    // Return first 2 lines, ensure at least empty array
    return lines.slice(0, 2);
  };


  // Redirect logged-out users with no notes to landing page (mobile WEB only, not native apps)
  // TEMPORARILY DISABLED FOR TESTING - Re-enable before production
  // if (savedNotes.length === 0 && !user && !isInitializing && !isDesktop && !Capacitor.isNativePlatform()) {
  //   return <Navigate to="/welcome" replace />;
  // }

  // DESKTOP LAYOUT - 3 columns side by side
  if (isDesktop) {

    return (

      <div className="fixed inset-0 flex flex-col bg-[#F9F9F6]">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="bg-yellow-600 text-white text-center py-2 text-sm font-outfit shrink-0">
            You're offline. Changes may not be saved.
          </div>
        )}

        {/* Hidden drag image for note dragging */}
        <div
          id="note-drag-image"
          style={{
            position: 'fixed',
            top: '-100px',
            left: '-100px',
            width: '44px',
            height: '44px',
            backgroundColor: themeColors[theme],
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>

        {/* Main 3-column layout */}
        <div className="flex flex-1 min-h-0">

          {/* Column 1: Folders - 20% width, dark background */}

          <div
            className="flex flex-col"
            style={{ width: '20%', backgroundColor: themeColors[theme] }}
          >
            {/* Header area - 50px to match Column 2 */}
            <div className="h-[50px] flex items-center justify-end pl-[20px] pr-[23px]">
              {user && (
                <button
                  onClick={async () => {
                    if (!user) return;

                    // Create new folder with sort_order 0 (top of list)
                    const { data, error } = await supabase
                      .from('folders')
                      .insert({
                        user_id: user.id,
                        name: 'Untitled',
                        default_view: 'collapsed',
                        sort_order: 0
                      })
                      .select()
                      .single();

                    if (data && !error) {
                      // Update sort_order for all other folders (push them down)
                      for (let i = 0; i < folders.length; i++) {
                        await supabase
                          .from('folders')
                          .update({ sort_order: i + 1 })
                          .eq('id', folders[i].id);
                      }

                      const newFolder: Folder = {
                        ...data,
                        default_view: (data.default_view || 'collapsed') as 'collapsed' | 'compact',
                        notes_sort_order: (data.notes_sort_order || 'desc') as 'asc' | 'desc'
                      };

                      // Add new folder to top of list
                      setFolders([newFolder, ...folders]);

                      // Open folder options panel to edit the name
                      // CRITICAL: Reset ALL folder settings to defaults - prevents blog settings from previous folder persisting!
                      setDesktopEditingFolder(newFolder);
                      setNewFolderName('Untitled');
                      setNewFolderDefaultView('collapsed');
                      setNewFolderSortOrder('desc');
                      setNewFolderIsBlog(false);
                      setNewFolderBlogSlug('');
                      setNewFolderBlogName('');
                      setNewFolderBlogSubheading('');
                      setNewFolderBlogHeaderImage('');
                      setNewFolderBlogPassword('');
                      setBlogSlugAvailable(null);
                      setDesktopShowFolderOptions(true);
                    }
                  }}
                  className="p-0 m-0 border-0 bg-transparent"
                  aria-label="Create new folder"
                >
                  <img src={folderPlusIcon} alt="Add" style={{ width: '18px', height: '18px' }} className="opacity-70" />
                </button>
              )}
            </div>

            {/* Folders list - below the header */}
            <div className="flex-1 px-[20px] pt-[30px] overflow-y-auto relative">
              <div className="relative">
                {folders.map((folder, folderIndex) => {
                  const isDragging = draggedFolder?.id === folder.id;
                  const showLineBefore = dropLineIndex === folderIndex && !isDragging;
                  const showLineAfter = dropLineIndex === folderIndex + 1 && folderIndex === folders.length - 1 && !isDragging;

                  return (
                    <div
                      key={folder.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedFolder(folder);
                        e.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => {
                          (e.target as HTMLElement).style.opacity = '0.3';
                        }, 0);
                      }}
                      onDragEnd={(e) => {
                        (e.target as HTMLElement).style.opacity = '';
                        setDraggedFolder(null);
                        setDropLineIndex(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Handle note drops (keep existing behavior)
                        if (draggedNote && draggedNote.folder_id !== folder.id) {
                          setDragOverFolder(folder.id);
                        }

                        // Handle folder reordering with line position
                        if (!draggedFolder || draggedFolder.id === folder.id) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const midpoint = rect.top + rect.height / 2;

                        if (e.clientY < midpoint) {
                          if (dropLineIndex !== folderIndex) {
                            setDropLineIndex(folderIndex);
                          }
                        } else {
                          if (dropLineIndex !== folderIndex + 1) {
                            setDropLineIndex(folderIndex + 1);
                          }
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Handle note drops (existing logic)
                        if (draggedNote && draggedNote.folder_id !== folder.id) {
                          const { error } = await supabase
                            .from('notes')
                            .update({ folder_id: folder.id })
                            .eq('id', draggedNote.id);

                          if (!error) {
                            setFolderDropFlash(folder.id);
                            setTimeout(() => setFolderDropFlash(null), 500);
                            setSavedNotes(prev => prev.filter(n => n.id !== draggedNote.id));
                            if (desktopSelectedNoteId === draggedNote.id) {
                              setDesktopSelectedNoteId(null);
                            }
                          } else {
                            toast.error('Failed to move note');
                          }
                          setDraggedNote(null);
                        }

                        // Handle folder reordering
                        if (!draggedFolder || dropLineIndex === null) {
                          setDraggedFolder(null);
                          setDropLineIndex(null);
                          return;
                        }

                        const oldIndex = folders.findIndex(f => f.id === draggedFolder.id);
                        let newIndex = dropLineIndex;

                        // Don't do anything if dropping in same position
                        if (newIndex === oldIndex || newIndex === oldIndex + 1) {
                          setDraggedFolder(null);
                          setDropLineIndex(null);
                          return;
                        }

                        // Adjust index if moving down
                        if (oldIndex < newIndex) {
                          newIndex--;
                        }

                        // Reorder locally first for instant feedback
                        const newFolders = [...folders];
                        const [movedFolder] = newFolders.splice(oldIndex, 1);
                        newFolders.splice(newIndex, 0, movedFolder);
                        setFolders(newFolders);

                        // Update database
                        for (let i = 0; i < newFolders.length; i++) {
                          await supabase
                            .from('folders')
                            .update({ sort_order: i })
                            .eq('id', newFolders[i].id);
                        }

                        setDraggedFolder(null);
                        setDropLineIndex(null);
                      }}
                      className={`relative flex items-center justify-between w-full py-2 transition-all duration-200 ${currentFolder?.id === folder.id ? 'opacity-100' : 'opacity-50 hover:opacity-70'
                        } ${draggedFolder?.id === folder.id ? 'opacity-30' : ''
                        }`}
                      style={{ cursor: 'grab' }}
                    >
                      {/* Full-width highlight overlay for note drop */}
                      {dragOverFolder === folder.id && (
                        <div
                          className="absolute inset-y-0 bg-white/20 rounded-[8px] pointer-events-none"
                          style={{ left: '-20px', right: '-20px' }}
                        />
                      )}

                      {/* Flash overlay */}
                      {folderDropFlash === folder.id && (
                        <div
                          className="absolute inset-y-0 bg-white/40 rounded-[8px] pointer-events-none"
                          style={{ left: '-20px', right: '-20px' }}
                        />
                      )}

                      {/* Drop line for folder reordering */}
                      {dropLineIndex === folderIndex && draggedFolder && draggedFolder.id !== folder.id && (
                        <div
                          className="absolute left-[-20px] right-[-20px] h-[2px] bg-white rounded-full"
                          style={{ top: '-4px' }}
                        />
                      )}

                      <button
                        onClick={async () => {
                          // Save any new note before switching folders
                          if (desktopSelectedNoteId?.startsWith('new-')) {
                            // CRITICAL: Request iframe to send its latest content IMMEDIATELY
                            const iframe = document.getElementById('note-editor-iframe') as HTMLIFrameElement;
                            if (iframe?.contentWindow) {
                              iframe.contentWindow.postMessage({ type: 'request-content-sync' }, '*');
                              // Small delay to allow sync message to be processed
                              await new Promise(resolve => setTimeout(resolve, 50));
                            }
                            
                            // Use savedNotesRef to get the LATEST notes (avoids stale closure)
                            const newNote = savedNotesRef.current.find(n => n.id === desktopSelectedNoteId);
                            if (newNote) {
                              const realId = await saveNewNoteDirectly(newNote);
                              if (realId) {
                                setSavedNotes(prev => prev.map(n =>
                                  n.id === desktopSelectedNoteId ? { ...n, id: realId } : n
                                ));
                              }
                            }
                          }

                          // CRITICAL: Reset creating state FIRST to allow loadNotes to run
                          setIsCreatingNewNote(false);
                          setSavedNotes(prev => prev.filter(n => !n.id.startsWith('new-')));

                          setCurrentFolder(folder);
                          localStorage.setItem('nuron-current-folder-id', folder.id);
                          setDesktopSelectedNoteId(null);
                          // Clear the sent ref so first note click in new folder works
                          lastSentNoteIdRef.current = null;
                          setViewMode(folder.default_view || 'collapsed');
                          setSortOrder(folder.notes_sort_order || 'desc');
                          setUserChangedView(false);
                        }}
                        className="flex items-center gap-3 flex-1 text-left relative z-10"
                      >
                        <img src={folderIcon} alt="" className="w-[18px] h-[18px]" />
                        <span className="text-white text-[18px] font-outfit font-light">{folder.name}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (desktopShowFolderOptions && desktopEditingFolder?.id === folder.id) {
                            setDesktopShowFolderOptions(false);
                            setDesktopEditingFolder(null);
                          } else {
                            setDesktopEditingFolder(folder);
                            setNewFolderName(folder.name);
                            setNewFolderDefaultView(folder.default_view || 'collapsed');
                            setNewFolderSortOrder(folder.notes_sort_order || 'desc');
                            setNewFolderIsBlog(folder.is_blog || false);
                            setNewFolderBlogSlug(folder.blog_slug || '');
                            setNewFolderBlogName(folder.blog_name || '');
                            setNewFolderBlogPassword(folder.blog_password || '');
                            setNewFolderBlogSubheading(folder.blog_subheading || '');
                            setNewFolderBlogHeaderImage(folder.blog_header_image || '');
                            setBlogSlugAvailable(null);
                            setDesktopShowFolderOptions(true);
                          }
                        }}
                        className="mr-[10px] p-0 m-0 border-0 bg-transparent relative z-10"
                      >
                        <img
                          src={threeDotsIcon}
                          alt="Options"
                          style={{ width: '4px', height: '18px' }}
                          className="opacity-70"
                        />
                      </button>
                    </div>
                  );
                })}

                {/* Drop line at very end of list */}
                {dropLineIndex === folders.length && draggedFolder && (
                  <div className="h-[2px] bg-white rounded-full mt-1" />
                )}
              </div>
            </div>

            {/* Settings at bottom */}
            <button onClick={() => setDesktopShowSettings(!desktopShowSettings)} className="px-[20px] pb-[40px] flex items-center gap-2 opacity-60 hover:opacity-80" aria-label="Open settings">

              <img src={settingsIcon} alt="" className="w-[20px] h-[20px]" />

              <span className="text-white text-[16px] font-outfit">Settings</span>

            </button>

          </div>

          {/* Column 2: Notes list OR Settings */}
          <div
            className="relative overflow-hidden"
            style={{ width: '30%', cursor: draggedNote ? 'grabbing' : 'default' }}
          >
            {/* Notes list - slides right when settings or folder options shown */}
            <div
              className={`absolute inset-0 flex flex-col transition-transform duration-300 ${desktopShowSettings || desktopShowFolderOptions ? 'translate-x-full' : 'translate-x-0'} ${useMobileColorScheme ? 'bg-journal-content' : ''}`}
              style={{ backgroundColor: useMobileColorScheme ? undefined : '#F9F9F6' }}
            >
              {/* 50px header with icons */}
              <div
                className={`h-[50px] flex-shrink-0 flex items-center relative ${useMobileColorScheme ? 'bg-journal-content' : ''}`}
                style={{ backgroundColor: useMobileColorScheme ? undefined : '#F9F9F6' }}
              >
                {isSearching ? (
                  <div
                    className="flex items-center bg-white border border-[hsl(0,0%,80%)]"
                    style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      right: '5px',
                      bottom: '5px',
                      borderRadius: '8px',
                      padding: '0 12px'
                    }}
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search"
                      autoFocus
                      className="flex-1 bg-transparent outline-none text-[16px] font-outfit text-[hsl(0,0%,30%)] placeholder:text-[hsl(0,0%,60%)] focus:ring-2 focus:ring-[hsl(0,0%,70%)]/50 focus:ring-offset-0 rounded"
                    />
                    <button
                      onClick={() => {
                        setIsSearching(false);
                        setSearchQuery("");
                      }}
                      className="w-[18px] h-[18px] bg-[hsl(0,0%,85%)] rounded-full flex items-center justify-center ml-2"
                    >
                      <span className="text-[12px] text-white font-medium leading-none">×</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-end gap-[25px] pr-[17px]">
                    <button
                      onClick={() => setIsSearching(true)}
                      className="p-0 m-0 border-0 bg-transparent"
                      aria-label="Search notes"
                    >
                      <img
                        src={greySearchIcon}
                        alt="Search"
                        style={{ width: '18px', height: '18px' }}
                      />
                    </button>
                    {/* New note */}
                    <button
                      onClick={async () => {
                        // If already on a new note, save it first
                        if (desktopSelectedNoteId?.startsWith('new-')) {
                          // CRITICAL: Request iframe to send its latest content IMMEDIATELY
                          // This ensures we have the latest title/content before saving
                          const iframe = document.getElementById('note-editor-iframe') as HTMLIFrameElement;
                          if (iframe?.contentWindow) {
                            iframe.contentWindow.postMessage({ type: 'request-content-sync' }, '*');
                            // Small delay to allow sync message to be processed
                            await new Promise(resolve => setTimeout(resolve, 50));
                          }
                          
                          // Use savedNotesRef to get the LATEST notes (avoids stale closure)
                          const newNote = savedNotesRef.current.find(n => n.id === desktopSelectedNoteId);
                          if (newNote) {
                            const realId = await saveNewNoteDirectly(newNote);
                            if (realId) {
                              setSavedNotes(prev => prev.map(n =>
                                n.id === desktopSelectedNoteId ? { ...n, id: realId } : n
                              ));
                            } else {
                              setSavedNotes(prev => prev.filter(n => n.id !== desktopSelectedNoteId));
                            }
                          }
                          setIsCreatingNewNote(false);
                        }

                        const newId = 'new-' + Date.now();
                        const now = new Date();

                        setIsCreatingNewNote(true);
                        setDesktopSelectedNoteId(newId);

                        // Add to TOP of list - simple, no sorting
                        setSavedNotes(prev => [{
                          id: newId,
                          title: '',
                          contentBlocks: [{ type: 'text' as const, id: 'initial', content: '' }],
                          createdAt: now.toISOString(),
                          updatedAt: now.toISOString(),
                          weather: null,
                          folder_id: currentFolder?.id || null,
                          is_published: false
                        }, ...prev]);
                      }}
                      className="p-0 m-0 border-0 bg-transparent"
                    >
                      <img
                        src={desktopPlusIcon}
                        alt="New Note"
                        style={{ width: '18px', height: '18px' }}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable notes list */}
              <div
                className="flex-1 overflow-y-auto overscroll-y-auto"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehaviorY: 'auto',
                  overflowAnchor: 'none'
                }}
              >
                <div style={{ minHeight: 'calc(100% + 1px)' }}>
                  {/* Top divider line - only in list view (compact) */}
                  {viewMode === 'compact' && (
                    <div className="border-b border-[hsl(0,0%,85%)]" />
                  )}
                  {(isSearching ? filteredGroupedNotes : groupedNotes).flatMap((group, groupIndex, allGroups) => {
                    const groupMonthYear = new Date(group.notes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
                    const prevGroup = groupIndex > 0 ? allGroups[groupIndex - 1] : null;
                    const prevMonthYear = prevGroup ? new Date(prevGroup.notes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : null;
                    const showMonthHeader = viewMode !== 'compact' && (groupIndex === 0 || groupMonthYear !== prevMonthYear);

                    const elements: React.ReactNode[] = [];

                    // Add month header as separate element (direct child of scroll container)
                    if (showMonthHeader) {
                      elements.push(
                        <div
                          key={`month-${groupMonthYear}-${groupIndex}`}
                          className={`sticky top-0 z-10 px-[22px] ${useMobileColorScheme ? 'bg-[#CACAC2]' : 'bg-[#E8E8E5]'}`}
                          style={{ height: '22px', display: 'flex', alignItems: 'center' }}
                        >
                          <span className={`text-[18px] font-outfit font-light tracking-wider leading-none ${useMobileColorScheme ? 'text-white' : 'text-[hsl(60,1%,50%)]'}`}>
                            {groupMonthYear}
                          </span>
                        </div>
                      );
                    }

                    // Add notes
                    group.notes.forEach((note, index) => {
                      const noteDate = new Date(note.createdAt);
                      const dayNumber = noteDate.getDate().toString().padStart(2, '0');
                      const dayName = noteDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                      const preview = getNotePreview(note);
                      const firstImage = note.contentBlocks.find(b => b.type === 'image') as { type: 'image'; id: string; url: string; width: number } | undefined;

                      elements.push(
                        <div
                          key={note.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedNote(note);
                            e.dataTransfer.effectAllowed = 'move';

                            const dragImage = document.getElementById('note-drag-image');
                            if (dragImage) {
                              e.dataTransfer.setDragImage(dragImage, 22, 22);
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedNote(null);
                            setDragOverFolder(null);
                          }}
                          className={`border-b border-[hsl(0,0%,85%)] cursor-pointer transition-all duration-300 ease-out ${desktopSelectedNoteId === note.id ? (useMobileColorScheme ? 'bg-white/50' : 'bg-[#F2F3EC]') : (useMobileColorScheme ? 'hover:bg-white/30' : 'hover:bg-[#F0F0ED]')} ${draggedNote?.id === note.id ? 'opacity-30' : ''} relative`}
                          onClick={async () => {
                            // If switching away from a new note, save it directly before switching
                            if (desktopSelectedNoteId?.startsWith('new-') && desktopSelectedNoteId !== note.id) {
                              // CRITICAL: Request iframe to send its latest content IMMEDIATELY
                              const iframe = document.getElementById('note-editor-iframe') as HTMLIFrameElement;
                              if (iframe?.contentWindow) {
                                iframe.contentWindow.postMessage({ type: 'request-content-sync' }, '*');
                                // Small delay to allow sync message to be processed
                                await new Promise(resolve => setTimeout(resolve, 50));
                              }
                              
                              // Use savedNotesRef to get the LATEST notes (avoids stale closure)
                              const newNote = savedNotesRef.current.find(n => n.id === desktopSelectedNoteId);
                              if (newNote) {
                                const realId = await saveNewNoteDirectly(newNote);
                                if (realId) {
                                  // Swap the placeholder ID to real ID in savedNotes
                                  setSavedNotes(prev => prev.map(n =>
                                    n.id === desktopSelectedNoteId ? { ...n, id: realId } : n
                                  ));
                                } else {
                                  // No content to save, remove the placeholder
                                  setSavedNotes(prev => prev.filter(n => n.id !== desktopSelectedNoteId));
                                }
                              }
                              setIsCreatingNewNote(false);
                            }
                            setDesktopSelectedNoteId(note.id);
                          }}
                        >
                          {/* Day letter - absolute positioned from note box edge */}
                          {index === 0 && viewMode !== 'compact' && (
                            <span
                              className="absolute text-[12px] font-outfit font-bold text-[hsl(60,1%,66%)]"
                              style={{ top: '12px', left: '12px' }}
                            >
                              {dayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className={viewMode === 'compact' ? "px-[22px] pt-[17px] pb-4" : "px-[22px] py-[12px]"}>

                            {/* Title and Body Container */}
                            <div className="min-w-0">
                              {viewMode === 'compact' ? (
                                /* COMPACT VIEW */
                                <div className="flex items-center gap-[12px]">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-[20px] font-outfit font-semibold text-[hsl(0,0%,25%)] break-words overflow-wrap-anywhere">
                                      {note.title || 'Untitled'}
                                    </h3>
                                    <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] truncate break-words overflow-wrap-anywhere">
                                      {Array.isArray(preview) ? (preview[0] || '-') : (preview || '-')}
                                    </p>
                                  </div>
                                  {firstImage && (
                                    <img
                                      src={firstImage.url}
                                      alt=""
                                      loading="lazy"
                                      className="w-[50px] h-[50px] rounded-[8px] object-cover flex-shrink-0"
                                    />
                                  )}
                                </div>
                              ) : (
                                /* COLLAPSED VIEW (Date View) */
                                <div className="flex items-center min-h-[70px]">
                                  {/* Date area - big number only, vertically centered */}
                                  <div className="w-[70px] flex-shrink-0 flex items-center justify-center ml-[-10px] mr-[10px]">
                                    {index === 0 ? (
                                      <span
                                        className="text-[48px] font-bold leading-none text-[hsl(60,1%,66%)]"
                                        style={{ fontFamily: 'Roboto Mono, monospace', letterSpacing: '-0.05em' }}
                                      >
                                        {dayNumber}
                                      </span>
                                    ) : null}
                                  </div>

                                  {/* Content + Image area */}
                                  <div className="flex-1 min-w-0 flex items-start gap-[15px]">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-[20px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-[6px] break-words overflow-wrap-anywhere leading-tight">
                                        {note.title || 'Untitled'}
                                      </h3>
                                      <div className="text-[14px] font-outfit text-[hsl(0,0%,50%)] leading-snug min-h-[40px]">
                                        <div className="truncate">
                                          {(Array.isArray(preview) ? preview[0] : preview) || '\u00A0'}
                                        </div>
                                        <div className="truncate">
                                          {(Array.isArray(preview) && preview[1]) || '\u00A0'}
                                        </div>
                                      </div>
                                    </div>
                                    {firstImage && (
                                      <img
                                        src={firstImage.url}
                                        alt=""
                                        loading="lazy"
                                        className="w-[70px] h-[70px] rounded-[10px] object-cover flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Published indicator - green dot bottom right */}
                          {note.is_published && currentFolder?.is_blog && (
                            <div
                              className="absolute bottom-[8px] right-[12px] w-[8px] h-[8px] bg-green-500 rounded-full"
                              title="Published to blog"
                            />
                          )}
                        </div>
                      );
                    });

                    return elements;
                  })}
                </div>
              </div>

            </div>

            {/* Settings panel - slides in from left */}
            <div
              className={`absolute inset-0 flex flex-col overflow-hidden transition-transform duration-300 ${desktopShowSettings ? 'translate-x-0' : '-translate-x-full'}`}
              style={{ backgroundColor: themeColors[theme] }}
            >
              {/* Invisible 50px header for settings too */}
              <div className="h-[50px] flex-shrink-0" style={{ backgroundColor: themeColors[theme] }} />

              {/* Scrollable settings content */}
              <div className="flex-1 overflow-y-auto px-8">
                <button
                  onClick={() => {
                    if (desktopShowChangePassword) {
                      setDesktopShowChangePassword(false);
                    } else if (desktopShowAccountDetails) {
                      setDesktopShowAccountDetails(false);
                    } else {
                      setDesktopShowSettings(false);
                    }
                  }}
                  className="mb-6"
                >
                  <img src={backIcon} alt="Back" className="w-[24px] h-[24px]" />
                </button>

                <h1 className="text-white text-[24px] font-outfit font-light tracking-wider mb-8">
                  {desktopShowChangePassword ? 'CHANGE PASSWORD' : desktopShowAccountDetails ? 'ACCOUNT DETAILS' : 'SETTINGS'}
                </h1>

                <div className="space-y-6">
                  {desktopShowChangePassword ? (
                    /* Change Password Form */
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-white/80 text-[14px]">New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordFormError("");
                          }}
                          required
                          placeholder="Enter new password"
                          minLength={6}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80 text-[14px]">Confirm New Password</Label>
                        <Input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => {
                            setConfirmNewPassword(e.target.value);
                            setPasswordFormError("");
                          }}
                          required
                          placeholder="Confirm new password"
                          minLength={6}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                        />
                      </div>
                      {passwordFormError && (
                        <p className="text-red-400 text-[14px]">{passwordFormError}</p>
                      )}
                      <div className="pt-4">
                        <div className="flex gap-3">
                          <button
                            onClick={handleChangePassword}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors disabled:opacity-50 text-[14px]"
                          >
                            {loading ? "Updating..." : "Update Password"}
                          </button>
                          <button
                            onClick={() => {
                              setDesktopShowChangePassword(false);
                              setNewPassword("");
                              setConfirmNewPassword("");
                              setPasswordFormError("");
                            }}
                            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors text-[14px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : desktopShowAccountDetails ? (
                    /* Account Details View */
                    user && userProfile && (
                      <>
                        <div className="space-y-4">
                          <div className="py-4 border-b border-white/10">
                            <span className="text-white/60 text-[14px] block mb-1">Name</span>
                            <span className="text-white text-[18px] font-outfit font-light">
                              {userProfile.name || 'Not set'}
                            </span>
                          </div>
                          <div className="py-4 border-b border-white/10">
                            <span className="text-white/60 text-[14px] block mb-1">Email</span>
                            <span className="text-white text-[18px] font-outfit font-light">
                              {userProfile.email}
                            </span>
                          </div>
                          <div className="py-4 border-b border-white/10">
                            <span className="text-white/60 text-[14px] block mb-1">Username (for blog URL)</span>
                            <div className="flex gap-2 mt-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={username}
                                  onChange={(e) => {
                                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    setUsername(value);
                                    setUsernameAvailable(null);
                                  }}
                                  onBlur={() => checkUsernameAvailability(username)}
                                  placeholder="yourname"
                                  className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-4 py-3 text-[16px] font-outfit pr-10"
                                />
                                {checkingUsername && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <svg className="animate-spin h-5 w-5 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                )}
                                {!checkingUsername && usernameAvailable === true && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                {!checkingUsername && usernameAvailable === false && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  if (username && usernameAvailable && user) {
                                    const { error } = await supabase
                                      .from('profiles')
                                      .update({ username: username.toLowerCase() })
                                      .eq('id', user.id);

                                    if (!error) {
                                      setUserProfile(prev => prev ? { ...prev, username } : null);
                                      toast.success('Username saved');
                                    }
                                  }
                                }}
                                disabled={!usernameAvailable || checkingUsername}
                                className="px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white rounded-[10px] font-outfit text-[14px] transition-colors"
                              >
                                Save
                              </button>
                            </div>
                            {username && (
                              <p className="text-white/40 text-[12px] font-outfit mt-2">
                                Your blog URLs will be: nuron.life/{username}/blogname
                              </p>
                            )}
                          </div>
                          <div className="py-4 border-b border-white/10">
                            <span className="text-white/60 text-[14px] block mb-1">Password</span>
                            <span className="text-white text-[18px] font-outfit font-light">
                              ••••••••
                            </span>
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  setDesktopShowChangePassword(true);
                                  setPasswordFormError("");
                                }}
                                className="text-red-500 hover:text-red-400 text-[14px] transition-colors text-left"
                              >
                                Change Password
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => { handleSignOut(); setDesktopShowSettings(false); }}
                            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors text-[14px]"
                          >
                            Sign Out
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirmDialog(true)}
                            className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-[10px] transition-colors text-[14px]"
                          >
                            Delete Account
                          </button>
                        </div>
                      </>
                    )
                  ) : user && userProfile ? (
                    /* Settings View - logged in */
                    <div className="space-y-6">
                      {/* Account section */}
                      <button
                        onClick={() => setDesktopShowAccountDetails(true)}
                        className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[20px] font-light"
                      >
                        Account Details
                        <img src={accountArrow} alt="" className="w-[24px] h-[24px] opacity-60" />
                      </button>

                      {/* Restore Purchases */}
                      <button onClick={handleRestorePurchases} disabled={isRestoring} className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[18px] font-light disabled:opacity-50">
                        {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-60">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </button>
                      <p className="text-white/60 text-[12px] font-outfit mt-2 px-1">
                        To manage or cancel your subscription, go to Settings → [Your Name] → Subscriptions on your iPhone.
                      </p>

                      {/* View Website */}
                      <button
                        onClick={() => navigate('/welcome')}
                        className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[18px] font-light"
                      >
                        View Website
                        <img src={accountArrow} alt="" className="w-[16px] h-[16px] opacity-60" />
                      </button>

                      {/* Separator line */}
                      <div className="border-t border-white/20 my-6" />

                      {/* Show weather toggle */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-white text-[18px] font-outfit font-light">Show weather on notes</span>
                        <button
                          onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                          className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                        >
                          <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Use mobile colour scheme toggle */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-white text-[18px] font-outfit font-light">Use mobile colour scheme</span>
                        <button
                          onClick={() => setUseMobileColorScheme(!useMobileColorScheme)}
                          className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${useMobileColorScheme ? 'bg-green-500' : 'bg-white/20'}`}
                        >
                          <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-200 ${useMobileColorScheme ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Theme colour */}
                      <div className="space-y-4">
                        <span className="text-white text-[18px] font-outfit font-light">Theme colour</span>
                        <div className="flex gap-4">
                          {(['default', 'green', 'blue', 'pink'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTheme(t)}
                              className="flex flex-col items-center relative"
                              style={{ height: '54px' }}
                            >
                              <img src={desktopThemeIcons[t]} alt={t} className="w-[50px] h-[50px]" />
                              {theme === t && (
                                <div
                                  className="w-[6px] h-[6px] bg-white rounded-full absolute"
                                  style={{ bottom: '-10px' }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : desktopShowSignUp ? (
                    /* Sign Up / Sign In Form */
                    <div className="space-y-6">
                      {!isSignInMode && (
                        <div className="space-y-2">
                          <Label className="text-white/80 text-[14px]">Name</Label>
                          <Input
                            type="text"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              setAuthFormError("");
                            }}
                            required
                            placeholder="Your name"
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-white/80 text-[14px]">Email</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setAuthFormError("");
                          }}
                          required
                          placeholder="you@example.com"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80 text-[14px]">Password</Label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setAuthFormError("");
                          }}
                          required
                          placeholder="••••••••"
                          minLength={8}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                        />
                      </div>
                      {isSignInMode && !resetEmailSent && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-white/60 hover:text-white/80 text-[14px] transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                      {resetEmailSent && (
                        <p className="text-green-400 text-[14px]">
                          If an account exists with this email, you will receive a password reset link.
                        </p>
                      )}
                      {authFormError && (
                        <p className="text-red-400 text-[14px]">{authFormError}</p>
                      )}
                      <button onClick={isSignInMode ? handleSignIn : handleSignUp} disabled={loading} className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors disabled:opacity-50">
                        {loading ? "Loading..." : isSignInMode ? "Sign In" : "Create Account"}
                      </button>
                      <button onClick={() => {
                        setIsSignInMode(!isSignInMode);
                        setAuthFormError("");
                        setResetEmailSent(false);
                      }} className="w-full text-white/60 hover:text-white/80 text-[14px] transition-colors">
                        {isSignInMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                      </button>
                      <button onClick={() => {
                        setDesktopShowSignUp(false);
                        setAuthFormError("");
                      }} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    /* Initial buttons - not logged in */
                    <div className="space-y-6">
                      <button onClick={() => {
                        setDesktopShowSignUp(true);
                        setIsSignInMode(false);
                        setAuthFormError("");
                      }} className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors">
                        Create Account
                      </button>
                      <button onClick={() => {
                        setDesktopShowSignUp(true);
                        setIsSignInMode(true);
                        setAuthFormError("");
                      }} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors">
                        Sign In
                      </button>

                      {/* Separator line */}
                      <div className="border-t border-white/20 my-6" />

                      {/* Show weather toggle */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-white text-[18px] font-outfit font-light">Show weather on notes</span>
                        <button
                          onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                          className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                        >
                          <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Theme colour */}
                      <div className="space-y-4">
                        <span className="text-white text-[18px] font-outfit font-light">Theme colour</span>
                        <div className="flex gap-4">
                          {(['default', 'green', 'blue', 'pink'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTheme(t)}
                              className="flex flex-col items-center relative"
                              style={{ height: '54px' }}
                            >
                              <img src={desktopThemeIcons[t]} alt={t} className="w-[50px] h-[50px]" />
                              {theme === t && (
                                <div
                                  className="w-[6px] h-[6px] bg-white rounded-full absolute"
                                  style={{ bottom: '-10px' }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Folder Options panel - slides in from left */}
            <div
              className={`absolute inset-0 flex flex-col overflow-hidden transition-transform duration-300 ${desktopShowFolderOptions ? 'translate-x-0' : '-translate-x-full'}`}
              style={{ backgroundColor: themeColors[theme] }}
            >
              <div className="h-[50px] flex-shrink-0" style={{ backgroundColor: themeColors[theme] }} />
              <div className="flex-1 overflow-y-auto px-8">
                <button
                  onClick={() => {
                    setDesktopShowFolderOptions(false);
                    setDesktopEditingFolder(null);
                  }}
                  className="mb-6"
                >
                  <img src={backIcon} alt="Back" className="w-[24px] h-[24px]" />
                </button>

                <h1 className="text-white text-[24px] font-outfit font-light tracking-wider mb-8">
                  FOLDER OPTIONS
                </h1>

                {desktopEditingFolder && (
                  <div className="space-y-5">
                    {/* Folder Name */}
                    <div className="space-y-2">
                      <label className="text-white/60 text-[14px] font-outfit">Folder Name</label>
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-4 h-[40px] text-[16px] font-outfit"
                      />
                    </div>

                    {/* View By - inline with buttons on right */}
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 text-[14px] font-outfit">View As</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewFolderDefaultView('collapsed')}
                          className={`px-4 h-[40px] rounded-[10px] font-outfit text-[14px] transition-colors ${newFolderDefaultView === 'collapsed' ? 'bg-white text-journal-header' : 'bg-white/10 text-white'}`}
                        >
                          Date
                        </button>
                        <button
                          onClick={() => setNewFolderDefaultView('compact')}
                          className={`px-4 h-[40px] rounded-[10px] font-outfit text-[14px] transition-colors ${newFolderDefaultView === 'compact' ? 'bg-white text-journal-header' : 'bg-white/10 text-white'}`}
                        >
                          List
                        </button>
                      </div>
                    </div>

                    {/* Sort By - inline with buttons on right */}
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 text-[14px] font-outfit">Sort By</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewFolderSortOrder('desc')}
                          className={`px-4 h-[40px] rounded-[10px] font-outfit text-[14px] transition-colors flex items-center gap-2 ${newFolderSortOrder === 'desc' ? 'bg-white text-journal-header' : 'bg-white/10 text-white'}`}
                        >
                          <img src={sortDownIcon} alt="" style={{ height: '14px', width: 'auto' }} />
                          Newest
                        </button>
                        <button
                          onClick={() => setNewFolderSortOrder('asc')}
                          className={`px-4 h-[40px] rounded-[10px] font-outfit text-[14px] transition-colors flex items-center gap-2 ${newFolderSortOrder === 'asc' ? 'bg-white text-journal-header' : 'bg-white/10 text-white'}`}
                        >
                          <img src={sortUpIcon} alt="" style={{ height: '14px', width: 'auto' }} />
                          Oldest
                        </button>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-white/20 pt-4" />

                    {/* Publish Folder As Blog */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-[14px] font-outfit">Publish Folder online</span>
                      <button
                        onClick={() => setNewFolderIsBlog(!newFolderIsBlog)}
                        className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${newFolderIsBlog ? 'bg-green-500' : 'bg-white/20'}`}
                      >
                        <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-200 ${newFolderIsBlog ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {newFolderIsBlog && (
                      <div className="space-y-4 animate-in fade-in-0 duration-200">
                        {/* Blog Heading */}
                        <div className="space-y-2">
                          <label className="text-white/60 text-[14px] font-outfit">Heading</label>
                          <input
                            type="text"
                            value={newFolderBlogName}
                            onChange={(e) => setNewFolderBlogName(e.target.value)}
                            placeholder="My Travel Adventures"
                            className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-4 h-[40px] text-[16px] font-outfit placeholder:text-white/30"
                          />
                        </div>

                        {/* Blog Sub-heading */}
                        <div className="space-y-2">
                          <label className="text-white/60 text-[14px] font-outfit">Sub-heading (Optional)</label>
                          <input
                            type="text"
                            value={newFolderBlogSubheading}
                            onChange={(e) => setNewFolderBlogSubheading(e.target.value)}
                            placeholder="A collection of my thoughts and experiences"
                            className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-4 h-[40px] text-[16px] font-outfit placeholder:text-white/30"
                          />
                        </div>

                        {/* Header Image */}
                        <div className="space-y-2">
                          <label className="text-white/60 text-[14px] font-outfit">Header Image (Optional)</label>
                          {newFolderBlogHeaderImage ? (
                            <div className="relative">
                              <img
                                src={newFolderBlogHeaderImage}
                                alt="Header preview"
                                className="w-full h-[100px] object-cover rounded-[10px]"
                              />
                              <button
                                onClick={() => setNewFolderBlogHeaderImage('')}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center w-full h-[40px] bg-white/5 border border-white/20 text-white/60 rounded-[10px] cursor-pointer hover:bg-white/10 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !user) return;

                                  setUploadingHeaderImage(true);

                                  // Delete old header image if exists
                                  if (newFolderBlogHeaderImage && newFolderBlogHeaderImage.includes('supabase.co/storage')) {
                                    try {
                                      const urlParts = newFolderBlogHeaderImage.split('/storage/v1/object/public/note-images/');
                                      if (urlParts.length > 1) {
                                        const oldFilePath = urlParts[1];
                                        await supabase.storage.from('note-images').remove([oldFilePath]);
                                      }
                                    } catch (error) {
                                      console.error('Error deleting old header image:', error);
                                    }
                                  }

                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `${user.id}/blog-header-${Date.now()}.${fileExt}`;

                                  const { data, error } = await supabase.storage
                                    .from('note-images')
                                    .upload(fileName, file);

                                  if (!error && data) {
                                    const { data: urlData } = supabase.storage
                                      .from('note-images')
                                      .getPublicUrl(data.path);
                                    setNewFolderBlogHeaderImage(urlData.publicUrl);
                                  }
                                  setUploadingHeaderImage(false);
                                }}
                              />
                              {uploadingHeaderImage ? (
                                <span className="font-outfit text-[14px]">Uploading...</span>
                              ) : (
                                <span className="font-outfit text-[14px]">Choose Image</span>
                              )}
                            </label>
                          )}
                        </div>

                        {/* Web Address */}
                        <div className="space-y-2">
                          <label className="text-white/60 text-[14px] font-outfit">Web Address</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={newFolderBlogSlug}
                              onChange={(e) => {
                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                setNewFolderBlogSlug(value);
                                setBlogSlugAvailable(null);
                              }}
                              onBlur={async () => {
                                if (!newFolderBlogSlug || newFolderBlogSlug.length < 2 || !user) {
                                  setBlogSlugAvailable(null);
                                  return;
                                }
                                const reserved = ['index', 'home', 'contact', 'prices', 'features', 'blog', 'admin', 'settings', 'new', 'edit', 'delete'];
                                if (reserved.includes(newFolderBlogSlug.toLowerCase())) {
                                  setBlogSlugAvailable(false);
                                  return;
                                }
                                setCheckingBlogSlug(true);
                                const { data } = await supabase
                                  .from('folders')
                                  .select('id')
                                  .eq('user_id', user.id)
                                  .eq('blog_slug', newFolderBlogSlug.toLowerCase())
                                  .neq('id', desktopEditingFolder?.id || '')
                                  .maybeSingle();
                                setCheckingBlogSlug(false);
                                setBlogSlugAvailable(!data);
                              }}
                              placeholder="my-travels"
                              className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-4 h-[40px] text-[16px] font-outfit pr-10 placeholder:text-white/30"
                            />
                            {checkingBlogSlug && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="animate-spin h-5 w-5 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                            {!checkingBlogSlug && blogSlugAvailable === true && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {!checkingBlogSlug && blogSlugAvailable === false && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {username && newFolderBlogSlug && (
                            <a
                              href={`https://nuron.life/${username}/${newFolderBlogSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#E56157] text-[16px] font-outfit hover:underline cursor-pointer block mt-2"
                            >
                              nuron.life/{username}/{newFolderBlogSlug}
                            </a>
                          )}
                          {!username && (
                            <p className="text-yellow-400/80 text-[12px] font-outfit">
                              Set your username in Account Details first
                            </p>
                          )}
                        </div>

                        {/* Password (Optional) */}
                        <div className="space-y-2">
                          <label className="text-white/60 text-[14px] font-outfit">Password (Optional)</label>
                          <input
                            type="text"
                            value={newFolderBlogPassword}
                            onChange={(e) => setNewFolderBlogPassword(e.target.value)}
                            placeholder="Leave blank for public access"
                            className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-4 h-[40px] text-[16px] font-outfit placeholder:text-white/30"
                          />
                          <p className="text-white/40 text-[12px] font-outfit">
                            Visitors will need this password to view your blog
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={async () => {
                        if (desktopEditingFolder) {
                          const { error } = await supabase
                            .from('folders')
                            .update({
                              name: newFolderName.trim() || 'Untitled',
                              default_view: newFolderDefaultView,
                              notes_sort_order: newFolderSortOrder,
                              is_blog: newFolderIsBlog,
                              blog_slug: newFolderIsBlog ? newFolderBlogSlug.toLowerCase() : null,
                              blog_name: newFolderIsBlog ? newFolderBlogName : null,
                              blog_subheading: newFolderIsBlog ? newFolderBlogSubheading : null,
                              blog_header_image: newFolderIsBlog ? newFolderBlogHeaderImage : null,
                              blog_password: newFolderIsBlog && newFolderBlogPassword ? newFolderBlogPassword : null,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', desktopEditingFolder.id);

                          if (!error) {
                            // Update local state
                            const updatedFolder = {
                              ...desktopEditingFolder,
                              name: newFolderName.trim() || 'Untitled',
                              default_view: newFolderDefaultView,
                              notes_sort_order: newFolderSortOrder,
                              is_blog: newFolderIsBlog,
                              blog_slug: newFolderIsBlog ? newFolderBlogSlug.toLowerCase() : null,
                              blog_name: newFolderIsBlog ? newFolderBlogName : null,
                              blog_subheading: newFolderIsBlog ? newFolderBlogSubheading : null,
                              blog_header_image: newFolderIsBlog ? newFolderBlogHeaderImage : null,
                              blog_password: newFolderIsBlog && newFolderBlogPassword ? newFolderBlogPassword : null
                            };
                            setFolders(prev => prev.map(f =>
                              f.id === desktopEditingFolder.id ? updatedFolder : f
                            ));

                            // Select the folder
                            setCurrentFolder(updatedFolder);
                            localStorage.setItem('nuron-current-folder-id', updatedFolder.id);
                            setViewMode(updatedFolder.default_view);
                            setSortOrder(updatedFolder.notes_sort_order || 'desc');

                            setDesktopShowFolderOptions(false);
                            setDesktopEditingFolder(null);
                          }
                        }
                      }}
                      className="w-full py-3 bg-white text-journal-header font-medium rounded-[10px] font-outfit"
                    >
                      Save Changes
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        setDesktopShowDeleteFolderConfirm(true);
                      }}
                      className="w-full py-3 bg-red-500/20 text-red-400 rounded-[10px] font-outfit"
                    >
                      Delete Folder
                    </button>

                    {/* Delete Folder Confirmation */}
                    {desktopShowDeleteFolderConfirm && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDesktopShowDeleteFolderConfirm(false)}>
                        <div
                          className="bg-white rounded-[20px] p-6 w-[280px] shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-[18px] font-outfit font-semibold text-center text-[hsl(0,0%,25%)] mb-2">
                            Delete Folder?
                          </h3>
                          <p className="text-[14px] font-outfit text-center text-[hsl(0,0%,50%)] mb-6">
                            Are you sure you want to delete "{desktopEditingFolder?.name}"? Notes in this folder will not be deleted.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setDesktopShowDeleteFolderConfirm(false)}
                              className="flex-1 py-3 bg-[hsl(0,0%,90%)] text-[hsl(0,0%,30%)] rounded-[10px] font-outfit text-[14px]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                if (!desktopEditingFolder) return;

                                const { error } = await supabase
                                  .from('folders')
                                  .delete()
                                  .eq('id', desktopEditingFolder.id);

                                if (!error) {
                                  // Remove folder from list
                                  setFolders(prev => prev.filter(f => f.id !== desktopEditingFolder.id));

                                  // If deleted folder was current, switch to first remaining folder
                                  if (currentFolder?.id === desktopEditingFolder.id) {
                                    const remaining = folders.filter(f => f.id !== desktopEditingFolder.id);
                                    if (remaining.length > 0) {
                                      setCurrentFolder(remaining[0]);
                                      localStorage.setItem('nuron-current-folder-id', remaining[0].id);
                                    } else {
                                      setCurrentFolder(null);
                                    }
                                  }

                                  // Close everything
                                  setDesktopShowDeleteFolderConfirm(false);
                                  setDesktopShowFolderOptions(false);
                                  setDesktopEditingFolder(null);
                                }
                              }}
                              className="flex-1 py-3 bg-red-500 text-white rounded-[10px] font-outfit text-[14px]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider line */}

          <div className="w-[1px] bg-[hsl(0,0%,80%)]" />

          {/* Desktop Move Note Popup */}
          {desktopShowMoveNote && desktopSelectedNoteId && (
            <>
              <div
                className="fixed inset-0 z-50 bg-black/50"
                onClick={() => setDesktopShowMoveNote(false)}
              />
              <div
                className="fixed z-50 rounded-2xl shadow-xl p-5 w-[280px]"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: themeColors[theme],
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <button
                  onClick={() => setDesktopShowMoveNote(false)}
                  className="absolute top-3 right-4 text-white/60 text-xl font-light hover:text-white/80"
                >
                  ×
                </button>

                <h3 className="text-[16px] font-outfit font-medium text-white/90 mb-4">
                  Move Note
                </h3>

                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {folders.map((folder) => {
                    const isCurrentFolder = folder.id === currentFolder?.id;
                    return (
                      <button
                        key={folder.id}
                        disabled={isCurrentFolder}
                        onClick={async () => {
                          if (isCurrentFolder || !desktopSelectedNoteId) return;

                          const { error } = await supabase
                            .from('notes')
                            .update({ folder_id: folder.id })
                            .eq('id', desktopSelectedNoteId);

                          if (!error) {
                            setSavedNotes(prev => prev.filter(n => n.id !== desktopSelectedNoteId));
                            setDesktopSelectedNoteId(null);
                            setDesktopShowMoveNote(false);
                            toast.success(`Note moved to ${folder.name}`);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${isCurrentFolder
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-white/10'
                          }`}
                      >
                        <img src={folderIcon} alt="" className="w-[18px] h-[18px]" />
                        <span className="text-white text-[16px] font-outfit font-light">
                          {folder.name}
                        </span>
                        {isCurrentFolder && (
                          <span className="ml-auto text-[11px] text-white/40">(current)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Column 3: Note view - 50% width */}
          <div
            className="relative flex flex-col"
            style={{ width: '50%', backgroundColor: '#F9F9F6' }}
          >
            {/* Cream header - 50px with 3dots menu */}
            <div className="h-[50px] flex-shrink-0 flex items-center justify-end pr-[20px]" style={{ backgroundColor: '#F9F9F6' }}>
              <button
                onClick={() => desktopSelectedNoteId && setDesktopMenuOpen(!desktopMenuOpen)}
                className={`p-3 m-0 border-0 bg-transparent hover:bg-black/5 rounded-lg transition-colors ${!desktopSelectedNoteId ? 'opacity-30' : ''}`}
              >
                <img
                  src={threeDotsDesktopIcon}
                  alt="Menu"
                  style={{ height: '18px', width: 'auto' }}
                />
              </button>
            </div>

            {/* Desktop 3-dots menu dropdown */}
            {desktopMenuOpen && desktopSelectedNoteId && (
              <>
                {/* Invisible overlay to catch clicks outside menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDesktopMenuOpen(false)}
                />
                <div
                  className="absolute right-4 top-[50px] z-50 bg-white rounded-2xl shadow-lg py-4 w-[250px] animate-in fade-in-0 zoom-in-95 duration-200"
                >
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        const iframe = document.querySelector('iframe');
                        if (iframe?.contentWindow) {
                          iframe.contentWindow.postMessage({ type: 'menu-action', action: 'rewrite' }, '*');
                        }
                        setDesktopMenuOpen(false);
                      }}
                      className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <img src={starIcon} alt="" className="w-6 h-6" />
                      <span className="text-gray-600 font-outfit">AI Rewrite</span>
                    </button>
                    <button
                      onClick={() => {
                        const iframe = document.querySelector('iframe');
                        if (iframe?.contentWindow) {
                          iframe.contentWindow.postMessage({ type: 'menu-action', action: 'image' }, '*');
                        }
                        setDesktopMenuOpen(false);
                      }}
                      className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <img src={addImageIcon} alt="" className="w-6 h-6" />
                      <span className="text-gray-600 font-outfit">Add Image</span>
                    </button>
                    <button
                      onClick={() => {
                        setDesktopShowMoveNote(true);
                        setDesktopMenuOpen(false);
                      }}
                      className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <img src={moveIcon} alt="" className="w-6 h-6" />
                      <span className="text-gray-600 font-outfit">Move Note</span>
                    </button>
                    <button
                      onClick={() => {
                        const iframe = document.querySelector('iframe');
                        if (iframe?.contentWindow) {
                          iframe.contentWindow.postMessage({ type: 'menu-action', action: 'share' }, '*');
                        }
                        setDesktopMenuOpen(false);
                      }}
                      className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <img src={sharedIcon} alt="" className="w-6 h-6" />
                      <span className="text-gray-600 font-outfit">Share Note</span>
                    </button>
                    <button
                      onClick={() => {
                        const iframe = document.querySelector('iframe');
                        if (iframe?.contentWindow) {
                          iframe.contentWindow.postMessage({ type: 'menu-action', action: 'delete' }, '*');
                        }
                        setDesktopMenuOpen(false);
                      }}
                      className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <img src={trashIcon} alt="" className="w-6 h-6" />
                      <span className="text-red-500 font-outfit">Delete Note</span>
                    </button>

                    {/* Publish to Blog - only show if current folder is a blog */}
                    {currentFolder?.is_blog && desktopSelectedNoteId && !desktopSelectedNoteId.startsWith('new-') && (
                      <>
                        <div className="border-t border-gray-100 my-2" />
                        <button
                          onClick={async () => {
                            const selectedNote = savedNotes.find(n => n.id === desktopSelectedNoteId);
                            if (!selectedNote) return;

                            const newPublishState = !selectedNote.is_published;

                            // Update in Supabase
                            const { error } = await supabase
                              .from('notes')
                              .update({ is_published: newPublishState })
                              .eq('id', desktopSelectedNoteId);

                            if (!error) {
                              // Update local state
                              setSavedNotes(prev => prev.map(n =>
                                n.id === desktopSelectedNoteId
                                  ? { ...n, is_published: newPublishState }
                                  : n
                              ));
                            } else {
                              toast.error('Failed to update publish status');
                            }

                            setDesktopMenuOpen(false);
                          }}
                          className="flex items-center gap-8 px-6 py-3 hover:bg-gray-50 transition-colors w-full"
                        >
                          {savedNotes.find(n => n.id === desktopSelectedNoteId)?.is_published ? (
                            <>
                              <img src={unpublishIcon} alt="Unpublish" className="w-6 h-6" />
                              <span className="text-gray-600 font-outfit">Unpublish From Blog</span>
                            </>
                          ) : (
                            <>
                              <img src={publishIcon} alt="Publish" className="w-6 h-6" />
                              <span className="text-gray-600 font-outfit">Publish To Blog</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2" />

                    {/* Stats Section */}
                    {desktopSelectedNoteId && (() => {
                      const selectedNote = savedNotes.find(n => n.id === desktopSelectedNoteId);
                      if (!selectedNote) return null;

                      const noteContent = selectedNote.contentBlocks
                        .filter(b => b.type === 'text')
                        .map(b => (b as { type: 'text'; id: string; content: string }).content)
                        .join('\n\n');

                      const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
                      const characterCount = noteContent.length;
                      const paragraphCount = noteContent.trim() ? noteContent.split(/\n\n+/).filter(p => p.trim()).length : 0;

                      return (
                        <div className="px-6 py-2">
                          <div className="flex items-center gap-8 py-1 text-gray-400 font-outfit">
                            <span className="w-6 text-center">{wordCount}</span>
                            <span>Words</span>
                          </div>
                          <div className="flex items-center gap-8 py-1 text-gray-400 font-outfit">
                            <span className="w-6 text-center">{characterCount}</span>
                            <span>Characters</span>
                          </div>
                          <div className="flex items-center gap-8 py-1 text-gray-400 font-outfit">
                            <span className="w-6 text-center">{paragraphCount}</span>
                            <span>Paragraphs</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            {/* Note content area */}
            <div className="flex-1 overflow-hidden bg-white" style={{ position: 'relative' }}>
              {/* PERSISTENT IFRAME - always mounted, visibility controlled by desktopSelectedNoteId */}
              {/* This prevents message loss when selecting first note after folder switch */}
              <iframe
                id="note-editor-iframe"
                src="/note?desktop=true&embedded=true"
                className="absolute inset-0 w-full h-full border-0 bg-white"
                style={{ display: desktopSelectedNoteId ? 'block' : 'none' }}
                title="Note Editor"
              />
              {!desktopSelectedNoteId && (
                <div className="h-full flex items-center justify-center text-[hsl(0,0%,60%)] font-outfit text-[18px]">
                  Select a note to view
                </div>
              )}
            </div>
          </div>

          {/* Desktop Welcome/Login Popup */}
          {desktopShowWelcomePopup && !user && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setDesktopShowWelcomePopup(false)}
            >
              <div
                className="bg-white rounded-[20px] p-8 shadow-2xl"
                style={{ width: '400px', maxWidth: '90%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <h2 className="text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-2">
                    Welcome to Nuron
                  </h2>
                  <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] leading-relaxed">
                    Sign up or log in to sync your journal across all your devices - phone, tablet, and desktop.
                  </p>
                </div>

                {welcomeError && (
                  <div className="bg-red-50 text-red-600 text-[14px] font-outfit p-3 rounded-lg mb-4 text-center">
                    {welcomeError}
                  </div>
                )}

                <div className="space-y-4">
                  {welcomeIsSignUp && (
                    <input
                      type="text"
                      placeholder="Name"
                      value={welcomeName}
                      onChange={(e) => setWelcomeName(e.target.value)}
                      className="w-full px-4 py-3 rounded-[10px] border border-[hsl(0,0%,85%)] text-[16px] font-outfit focus:outline-none focus:ring-2 focus:ring-[hsl(210,100%,50%)]/50 focus:ring-offset-0 focus:border-[hsl(0,0%,60%)] text-[hsl(0,0%,25%)]"
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={welcomeEmail}
                    onChange={(e) => setWelcomeEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-[10px] border border-[hsl(0,0%,85%)] text-[16px] font-outfit focus:outline-none focus:ring-2 focus:ring-[hsl(210,100%,50%)]/50 focus:ring-offset-0 focus:border-[hsl(0,0%,60%)] text-[hsl(0,0%,25%)]"
                  />
                  <div className="relative">
                    <input
                      type={welcomeShowPassword ? "text" : "password"}
                      placeholder="Password"
                      value={welcomePassword}
                      onChange={(e) => setWelcomePassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-[10px] border border-[hsl(0,0%,85%)] text-[16px] font-outfit focus:outline-none focus:ring-2 focus:ring-[hsl(210,100%,50%)]/50 focus:ring-offset-0 focus:border-[hsl(0,0%,60%)] text-[hsl(0,0%,25%)]"
                    />
                    <button
                      type="button"
                      onClick={() => setWelcomeShowPassword(!welcomeShowPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    >
                      {welcomeShowPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(0,0%,60%)" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(0,0%,60%)" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {!welcomeIsSignUp && !resetEmailSent && (
                    <button
                      type="button"
                      onClick={handleWelcomeForgotPassword}
                      className="w-full text-center text-[14px] font-outfit text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,30%)]"
                    >
                      Forgot password?
                    </button>
                  )}
                  {resetEmailSent && (
                    <p className="text-green-500 text-[14px] font-outfit text-center">
                      If an account exists with this email, you will receive a password reset link.
                    </p>
                  )}

                  <button
                    onClick={async () => {
                      setWelcomeLoading(true);
                      setWelcomeError('');
                      try {
                        if (welcomeIsSignUp) {
                          const { data, error } = await supabase.auth.signUp({
                            email: welcomeEmail,
                            password: welcomePassword,
                            options: { data: { name: welcomeName } }
                          });
                          if (error) throw error;
                          if (data.user) {
                            await supabase.from('profiles').upsert({
                              id: data.user.id,
                              name: welcomeName,
                              email: welcomeEmail
                            });
                          }
                        } else {
                          const { error } = await supabase.auth.signInWithPassword({
                            email: welcomeEmail,
                            password: welcomePassword
                          });
                          if (error) throw error;
                        }
                        localStorage.setItem('nuron-desktop-visited', 'true');
                        setDesktopShowWelcomePopup(false);
                      } catch (err: any) {
                        // Use generic message to prevent email enumeration
                        if (!welcomeIsSignUp) {
                          setWelcomeError("Invalid email or password");
                        } else {
                          setWelcomeError(err.message || 'An error occurred');
                        }
                      } finally {
                        setWelcomeLoading(false);
                      }
                    }}
                    disabled={welcomeLoading}
                    className="w-full py-3 rounded-[10px] text-white font-outfit font-medium text-[16px] disabled:opacity-50"
                    style={{ backgroundColor: themeColors[theme] }}
                  >
                    {welcomeLoading ? 'Please wait...' : welcomeIsSignUp ? 'Sign Up' : 'Log In'}
                  </button>

                  <button
                    onClick={() => {
                      setWelcomeIsSignUp(!welcomeIsSignUp);
                      setResetEmailSent(false);
                    }}
                    className="w-full text-center text-[14px] font-outfit text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,30%)]"
                  >
                    {welcomeIsSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-[hsl(0,0%,90%)]">
                  <button
                    onClick={() => {
                      localStorage.setItem('nuron-desktop-visited', 'true');
                      setDesktopShowWelcomePopup(false);
                    }}
                    className="w-full text-center text-[14px] font-outfit text-[hsl(0,0%,60%)] hover:text-[hsl(0,0%,40%)]"
                  >
                    Use on desktop — sign up later
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    );

  }

  // Show timeline when notes exist
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: themeColors[theme] }}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-600 text-white text-center py-2 text-sm font-outfit shrink-0">
          You're offline. Changes may not be saved.
        </div>
      )}
      {/* Fixed dark header */}
      <header
        className="flex-shrink-0 z-30"
        style={{
          backgroundColor: themeColors[theme],
          paddingTop: `calc(30px + env(safe-area-inset-top))`,
          paddingLeft: `calc(30px + env(safe-area-inset-left))`,
          paddingRight: `calc(30px + env(safe-area-inset-right))`,
          paddingBottom: '30px',
          minHeight: `calc(150px + env(safe-area-inset-top))`
        }}
      >
        <div className="flex items-center justify-between mb-auto -mt-[15px]">
          <div className="relative">
            <button
              onClick={() => {
                if (showChangePassword) {
                  setShowChangePassword(false);
                } else if (showAccountDetails) {
                  setShowAccountDetails(false);
                } else if (showSettings) {
                  setShowSettings(false);
                } else if (showFolders) {
                  setShowFolders(false);
                } else {
                  setShowFolders(true);
                }
              }}
              className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity"
            >
              {showSettings || showAccountDetails || showChangePassword || showFolders ? (
                <img
                  src={backIcon}
                  alt="Back"
                  className="h-[24px] w-[24px]"
                />
              ) : (
                <img src={hamburgerIcon} alt="Menu" className="h-[24px] w-[24px] object-contain" />
              )}
            </button>
          </div>
          <div className="flex-1" />
        </div>
        <div className="relative mt-[41px]">
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px]">
            {showChangePassword ? 'CHANGE PASSWORD' : showAccountDetails ? 'ACCOUNT DETAILS' : showSettings ? 'SETTINGS' : showFolders ? 'FOLDERS' : currentFolder?.name?.toUpperCase() || ''}
          </h1>
          {!showSettings && !showAccountDetails && !showChangePassword && (
            <div
              className="absolute top-[-5px] right-0 flex items-center gap-[30px]"
            >
              {showFolders ? (
                user && (
                  <button
                    onClick={openCreateFolder}
                    className="p-0 m-0 mr-[5px] border-0 bg-transparent"
                    aria-label="Create new folder"
                  >
                    <img src={folderPlusIcon} alt="Add Folder" className="w-[24px] h-[24px]" />
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsSearching(!isSearching);
                      if (isSearching) setSearchQuery("");
                    }}
                    className="p-0 m-0 mr-[20px] border-0 bg-transparent"
                    aria-label="Search notes"
                  >
                    <img src={searchIcon} alt="Search" className="h-[24px] w-auto" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode(prev => prev === 'collapsed' ? 'compact' : 'collapsed');
                      setUserChangedView(true);
                    }}
                    className="p-0 m-0 border-0 bg-transparent"
                    aria-label="Toggle view mode"
                  >
                    <img src={viewMode === 'collapsed' ? condenseIcon : listViewIcon} alt="Menu" className="h-[24px] w-[24px] object-contain" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Folders panel - sits behind the card */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-200 overflow-y-auto ${showFolders && !showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          backgroundColor: themeColors[theme],
          top: `calc(60px + env(safe-area-inset-top))`,
          paddingLeft: `calc(30px + env(safe-area-inset-left))`,
          paddingRight: `calc(32px + env(safe-area-inset-right))`,
          paddingTop: '30px'
        }}
      >
        {/* Folders list */}
        <div className="space-y-1 pt-[70px]">
          {folders.map((folder) => (
            <div
              key={folder.id}
              draggable
              onDragStart={(e) => {
                setDraggedFolder(folder);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggedFolder(null);
                setDragOverFolder(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedFolder && draggedFolder.id !== folder.id) {
                  setDragOverFolder(folder.id);
                }
              }}
              onDragLeave={() => {
                setDragOverFolder(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedFolder && draggedFolder.id !== folder.id) {
                  const newIndex = folders.findIndex(f => f.id === folder.id);
                  updateFolderOrder(draggedFolder.id, newIndex);
                }
                setDraggedFolder(null);
                setDragOverFolder(null);
              }}
              className={`flex items-center gap-3 py-2 transition-all duration-500 ease-out ${currentFolder?.id === folder.id ? 'bg-white/10 mx-[-32px] px-[32px]' : 'px-0'
                } ${draggedFolder?.id === folder.id ? 'opacity-50 scale-[0.98]' : ''
                } ${dragOverFolder === folder.id ? 'border-t-2 border-white/50' : ''
                }`}
              style={{
                cursor: 'grab',
                transition: 'transform 0.5s ease-out, opacity 0.3s ease-out'
              }}
            >
              <img src={folderIcon} alt="Folder" className="w-[20px] h-[20px] mr-4 opacity-70" />
              <button
                onClick={() => selectFolder(folder)}
                className="flex-1 text-left text-white text-[24px] font-outfit font-light"
              >
                {folder.name}
              </button>
              {user && folder.id !== 'local-notes' && (
                <button
                  onClick={() => openEditFolder(folder)}
                  className="p-2 m-0 mr-[20px] border-0 bg-transparent"
                  aria-label="Folder options"
                >
                  <img src={folderSettingsIcon} alt="Options" className="w-[20px] h-auto opacity-70" />
                </button>
              )}
              <button
                onClick={() => selectFolder(folder)}
                className="p-2 m-0 border-0 bg-transparent"
              >
                <img src={folderArrow} alt="Select" className="h-[16px] w-auto opacity-70" />
              </button>
            </div>
          ))}
        </div>

        {/* Settings link at bottom */}
        <div className="absolute left-8" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => {
              setShowFolders(false);
              setShowSettings(true);
            }}
            className="flex items-center gap-3 p-0 m-0 border-0 bg-transparent"
            aria-label="Open settings"
          >
            <img src={settingsIcon} alt="Settings" className="h-[24px] w-auto opacity-70" />
            <span className="text-white text-[18px] font-outfit font-light">Settings</span>
          </button>
        </div>
      </div>

      {/* Settings panel - sits behind the card */}
      <div className={`absolute inset-x-0 top-[150px] bottom-0 px-8 pt-[80px] transition-opacity duration-200 overflow-y-auto ${showSettings || showAccountDetails || showChangePassword ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ backgroundColor: themeColors[theme] }}>
        <div className="text-white font-outfit space-y-6">
          {showChangePassword ? (
            /* Change Password Form */
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-[12px] uppercase tracking-wider">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordFormError("");
                  }}
                  required
                  placeholder="Enter new password"
                  minLength={6}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-[12px] uppercase tracking-wider">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setPasswordFormError("");
                  }}
                  required
                  placeholder="Confirm new password"
                  minLength={6}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                />
              </div>
              {passwordFormError && (
                <p className="text-red-400 text-[14px]">{passwordFormError}</p>
              )}
              <div className="pt-6">
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors disabled:opacity-50 text-[14px]"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setNewPassword("");
                      setConfirmNewPassword("");
                      setPasswordFormError("");
                    }}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors text-[14px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : showAccountDetails ? (
            /* Account Details View */
            user && userProfile && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/60 text-[12px] uppercase tracking-wider">Name</Label>
                    <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px]">
                      {userProfile.name || 'Not set'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-[12px] uppercase tracking-wider">Email</Label>
                    <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px]">
                      {userProfile.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60 text-[12px] uppercase tracking-wider">Password</Label>
                    <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px]">
                      ••••••••
                    </div>
                    <div className="pt-[8px]">
                      <button
                        onClick={() => {
                          setShowChangePassword(true);
                          setPasswordFormError("");
                        }}
                        className="text-red-500 hover:text-red-400 text-[14px] transition-colors text-left"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleSignOut} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors text-[14px]">
                    Sign Out
                  </button>
                  <button onClick={() => setShowDeleteConfirmDialog(true)} className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-[10px] transition-colors text-[14px]">
                    Delete Account
                  </button>
                </div>
              </>
            )
          ) : user && userProfile ? (
            /* Settings View - logged in */
            <div className="space-y-4">
              {/* Account section */}
              <button
                onClick={() => setShowAccountDetails(true)}
                className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[20px] font-light"
              >
                <span>Account Details</span>
                <img src={accountArrow} alt="" className="w-[20px] h-[20px] opacity-60" />
              </button>

              {/* Separator line */}
              <div className="border-t border-white/20 my-[80px]"></div>

              {/* Other settings */}
              <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px] font-light">Show weather on notes</span>
                <button
                  onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Auto-record new note toggle */}
              <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px] font-light">Auto-record on new note</span>
                <button
                  onClick={() => setAutoRecordNewNote(!autoRecordNewNote)}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${autoRecordNewNote ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${autoRecordNewNote ? 'translate-x-[20px]' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px] font-light">Theme colour</span>
                <div className="flex items-center gap-3">
                  {(['default', 'green', 'blue', 'pink'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className="flex flex-col items-center relative"
                      style={{ height: '54px' }}
                    >
                      <img src={mobileThemeIcons[t]} alt={t} className="w-[40px] h-[40px] rounded-[10px]" />
                      {theme === t && (
                        <div
                          className="w-[6px] h-[6px] bg-white rounded-full absolute"
                          style={{ bottom: '0px' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Restore Purchases */}
              <button
                onClick={handleRestorePurchases}
                disabled={isRestoring}
                className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[20px] font-light"
              >
                <span>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </button>
              <p className="text-white/60 text-[12px] font-outfit mt-2">
                To manage or cancel your subscription, go to Settings → [Your Name] → Subscriptions on your iPhone.
              </p>

              {/* View Website */}
              <button
                onClick={() => navigate('/welcome')}
                className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[20px] font-light"
              >
                <span>View Website</span>
                <img src={accountArrow} alt="" className="w-[20px] h-[20px] opacity-60" />
              </button>
            </div>
          ) : showSignUp ? (
            /* Sign Up / Sign In Form */
            <form onSubmit={isSignInMode ? handleSignIn : handleSignUp} className="space-y-4">
              {!isSignInMode && (
                <div className="space-y-2">
                  <Label className="text-white/80 text-[14px]">Name</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setAuthFormError("");
                    }}
                    required
                    placeholder="Your name"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-white/80 text-[14px]">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setAuthFormError("");
                  }}
                  required
                  placeholder="you@example.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80 text-[14px]">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthFormError("");
                  }}
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                />
              </div>
              {isSignInMode && !resetEmailSent && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-white/60 hover:text-white/80 text-[14px] transition-colors"
                >
                  Forgot password?
                </button>
              )}
              {resetEmailSent && (
                <p className="text-green-400 text-[14px]">
                  If an account exists with this email, you will receive a password reset link.
                </p>
              )}
              {authFormError && (
                <p className="text-red-400 text-[14px]">{authFormError}</p>
              )}
              <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors">
                {loading ? "Loading..." : isSignInMode ? "Sign In" : "Create Account"}
              </button>
              <button type="button" onClick={() => {
                setIsSignInMode(!isSignInMode);
                setAuthFormError("");
                setResetEmailSent(false);
              }} className="w-full text-white/60 hover:text-white/80 text-[14px] transition-colors">
                {isSignInMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
              <button type="button" onClick={() => {
                setShowSignUp(false);
                setAuthFormError("");
              }} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors">
                Cancel
              </button>
            </form>
          ) : (
            /* Initial buttons - not logged in */
            <div className="space-y-4">
              {/* Account section */}
              <button onClick={() => {
                setShowSignUp(true);
                setIsSignInMode(false);
                setAuthFormError("");
              }} className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors">
                Create Account
              </button>
              <button onClick={() => {
                setShowSignUp(true);
                setIsSignInMode(true);
                setAuthFormError("");
              }} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors">
                Sign In
              </button>

              {/* Separator line */}
              <div className="border-t border-white/20 my-[80px]"></div>

              {/* Other settings */}
              <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px] font-light">Show weather on notes</span>
                <button
                  onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Auto-record new note toggle */}
              <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px] font-light">Auto-record on new note</span>
                <button
                  onClick={() => setAutoRecordNewNote(!autoRecordNewNote)}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${autoRecordNewNote ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${autoRecordNewNote ? 'translate-x-[20px]' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px] font-light">Theme colour</span>
                <div className="flex items-center gap-3">
                  {(['default', 'green', 'blue', 'pink'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className="flex flex-col items-center relative"
                      style={{ height: '54px' }}
                    >
                      <img src={mobileThemeIcons[t]} alt={t} className="w-[40px] h-[40px] rounded-[10px]" />
                      {theme === t && (
                        <div
                          className="w-[6px] h-[6px] bg-white rounded-full absolute"
                          style={{ bottom: '0px' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        ref={scrollContainerRef}
        className={`notes-list-container flex-1 overflow-y-scroll overflow-x-hidden bg-journal-content rounded-t-[30px] overscroll-y-auto z-40 transition-all duration-200 ${showSettings || showFolders ? 'translate-y-[100%]' : '-mt-[25px]'} ${isInitializing ? 'opacity-0' : 'opacity-100'}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          minHeight: 0
        }}
      >
        <div style={{ minHeight: 'calc(100% + 1px)' }}>
          {isSearching && (
            <div className="px-[30px] pt-[30px] pb-2">
              <div className="flex items-center bg-[#F6F6F6] rounded-full px-4 py-3 border border-[hsl(60,5%,80%)]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search here"
                  autoFocus
                  className="flex-1 bg-transparent outline-none text-[16px] font-outfit text-[hsl(0,0%,30%)] placeholder:text-[#A4A4A4] placeholder:tracking-wider focus:placeholder:opacity-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center ml-2 shadow-sm"
                  >
                    <span className="text-[12px] text-[hsl(0,0%,50%)] font-medium leading-none">×</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {isSearching && searchQuery.trim() !== '' && filteredGroupedNotes.length === 0 && (
            <div className="px-8 py-12 text-center">
              <p className="text-[16px] font-outfit text-[hsl(0,0%,50%)]">No notes found</p>
            </div>
          )}
          {/* Notes list - FLATTENED for sticky to work */}
          <>
            {(isSearching ? filteredGroupedNotes : groupedNotes).map((group, groupIndex, allGroups) => {
              const groupMonthYear = new Date(group.notes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
              const prevGroup = groupIndex > 0 ? allGroups[groupIndex - 1] : null;
              const prevMonthYear = prevGroup ? new Date(prevGroup.notes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : null;
              const showMonthHeader = viewMode !== 'compact' && (groupIndex === 0 || groupMonthYear !== prevMonthYear);

              return (
                <React.Fragment key={group.date}>
                  {showMonthHeader && (
                    <div className="sticky top-0 z-10 bg-[#CACAC2] px-[22px]" style={{ height: '22px', display: 'flex', alignItems: 'center' }}>
                      <span className="text-white text-[18px] font-outfit font-light tracking-wider leading-none">
                        {groupMonthYear}
                      </span>
                    </div>
                  )}
                  {group.notes.map((note, index) => {
                    const noteDate = new Date(note.createdAt);
                    const dayNumber = noteDate.getDate().toString().padStart(2, '0');
                    const dayName = noteDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                    const preview = getNotePreview(note);
                    const firstImage = note.contentBlocks.find(b => b.type === 'image') as { type: 'image'; id: string; url: string; width: number } | undefined;

                    return (
                      <div
                        key={note.id}
                        className="border-b border-[hsl(0,0%,85%)] cursor-pointer"
                        onClick={() => navigate(`/note/${note.id}`)}
                      >
                        <div className={viewMode === 'compact' ? "px-8 pt-[17px] pb-4" : index === 0 ? "px-8 pt-[12px] pb-4" : "px-8 pt-4 pb-4"}>
                          {index === 0 && viewMode !== 'compact' && (
                            <div className="flex items-start gap-4 mb-4">
                              <div className="text-[72px] font-outfit font-bold leading-none text-[hsl(60,1%,66%)]">
                                {dayNumber}
                              </div>
                              <div className="text-[20px] font-outfit font-light tracking-wide text-[hsl(60,1%,66%)] mt-[2px]">
                                {dayName}
                              </div>
                            </div>
                          )}
                          <div className="min-w-0">
                            {viewMode === 'compact' ? (
                              <div className="flex items-center gap-[12px]">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-[20px] font-outfit font-semibold text-[hsl(0,0%,25%)] break-words overflow-wrap-anywhere">
                                    {note.title || 'Untitled'}
                                  </h3>
                                  <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] line-clamp-1 break-words overflow-wrap-anywhere">
                                    {preview || '-'}
                                  </p>
                                </div>
                                {firstImage && (
                                  <img src={firstImage.url} alt="" loading="lazy" className="w-[50px] h-[50px] rounded-[8px] object-cover flex-shrink-0" />
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-[15px]">
                                <div className="flex-1 min-w-0">
                                  <h3 className={`text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-4 break-words overflow-wrap-anywhere ${index === 0 ? '-mt-[10px]' : ''}`}>
                                    {note.title || 'Untitled'}
                                  </h3>
                                  <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] line-clamp-2 -mt-[10px] break-words overflow-wrap-anywhere">
                                    {preview || '-'}
                                  </p>
                                </div>
                                {firstImage && (
                                  <img src={firstImage.url} alt="" loading="lazy" className="w-[70px] h-[70px] rounded-[10px] object-cover flex-shrink-0" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </>
        </div>
      </div>

      {/* Floating add button */}
      {!showSettings && !showFolders && (
        <button
          onClick={() => navigate(autoRecordNewNote ? '/note?autorecord=true' : '/note')}
          className="fixed z-50 cursor-pointer p-0 border-0 bg-transparent"
          style={{
            bottom: `calc(30px + env(safe-area-inset-bottom))`,
            right: `calc(30px + env(safe-area-inset-right))`,
            width: '51px',
            height: '51px'
          }}
        >
          <img
            src={themePlusIcons[theme]}
            alt="Add Note"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
            }}
          />
        </button>
      )}

      {/* Delete account confirmation dialog */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-2">
              Delete Account
            </h3>
            <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] text-center mb-6">
              Deleting the account cannot be undone. Are you sure you want to delete your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmDialog(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-outfit font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge notes dialog */}
      {showMergeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-2">
              Sync Notes
            </h3>
            <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] text-center mb-6">
              You have {localNotesToMerge.length} note{localNotesToMerge.length !== 1 ? 's' : ''} on this device that aren't in your account. Would you like to sync them so all your notes are available on all devices?
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setShowMergeDialog(false);
                  setLocalNotesToMerge([]);
                  // Trigger re-render to reload notes via useEffect
                  if (currentFolder) {
                    setCurrentFolder({ ...currentFolder });
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium"
              >
                Skip
              </button>
              <button
                onClick={() => mergeAndSyncNotes()}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl text-white font-outfit font-medium disabled:opacity-50"
                style={{ backgroundColor: themeColors[theme] }}
              >
                {loading ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribed={() => setShowSubscriptionModal(false)}
      />

      {/* Rate App Dialog */}
      {showRateAppDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-2">
              Enjoying Nuron?
            </h3>
            <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] text-center mb-6">
              If you're enjoying Nuron Journal, we'd love to hear from you! Please consider rating us on the App Store.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDismissRateApp}
                className="flex-1 py-3 px-4 rounded-xl bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium"
              >
                Maybe Later
              </button>
              <button
                onClick={handleRateApp}
                className="flex-1 py-3 px-4 rounded-xl text-white font-outfit font-medium"
                style={{ backgroundColor: themeColors[theme] }}
              >
                Rate App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Create/Edit Popup */}
      {showFolderPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-sm shadow-xl max-h-[85vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowFolderPopup(false);
                setEditingFolder(null);
                setNewFolderName("");
                setNewFolderDefaultView('collapsed');
                setNewFolderSortOrder('desc');
                setNewFolderIsBlog(false);
                setNewFolderBlogSlug('');
                setNewFolderBlogName('');
                setNewFolderBlogSubheading('');
                setNewFolderBlogHeaderImage('');
                setNewFolderBlogPassword('');
              }}
              className="absolute top-4 right-4 text-[hsl(0,0%,60%)] text-xl font-light"
            >
              ×
            </button>

            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-5">
              {editingFolder ? 'Edit Folder' : 'New Folder'}
            </h3>

            <div className="space-y-4">
              {/* Folder Name */}
              <div className="space-y-1">
                <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2.5 rounded-xl border border-[hsl(0,0%,85%)] text-[15px] font-outfit text-black outline-none focus:border-[hsl(0,0%,70%)]"
                />
              </div>

              {/* View As */}
              <div className="space-y-1">
                <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">View As</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewFolderDefaultView('collapsed')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-outfit font-medium text-[13px] ${newFolderDefaultView === 'collapsed'
                        ? 'bg-[hsl(0,0%,25%)] text-white'
                        : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                      }`}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => setNewFolderDefaultView('compact')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-outfit font-medium text-[13px] ${newFolderDefaultView === 'compact'
                        ? 'bg-[hsl(0,0%,25%)] text-white'
                        : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                      }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Sort By</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewFolderSortOrder('desc')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-outfit font-medium text-[13px] ${newFolderSortOrder === 'desc'
                        ? 'bg-[hsl(0,0%,25%)] text-white'
                        : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                      }`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setNewFolderSortOrder('asc')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-outfit font-medium text-[13px] ${newFolderSortOrder === 'asc'
                        ? 'bg-[hsl(0,0%,25%)] text-white'
                        : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                      }`}
                  >
                    Oldest
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-[hsl(0,0%,90%)]" />

              {/* Publish Online Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Publish Folder Online</span>
                <button
                  onClick={() => setNewFolderIsBlog(!newFolderIsBlog)}
                  className={`relative w-[46px] h-[28px] rounded-full transition-colors duration-200 ${newFolderIsBlog ? 'bg-green-500' : 'bg-[hsl(0,0%,85%)]'}`}
                >
                  <span className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform duration-200 ${newFolderIsBlog ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Blog Settings - shown when Publish Online is enabled */}
              {newFolderIsBlog && (
                <div className="space-y-3 animate-in fade-in-0 duration-200">
                  {/* Blog Heading */}
                  <div className="space-y-1">
                    <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Heading</label>
                    <input
                      type="text"
                      value={newFolderBlogName}
                      onChange={(e) => setNewFolderBlogName(e.target.value)}
                      placeholder="My Travel Adventures"
                      className="w-full px-3 py-2.5 rounded-xl border border-[hsl(0,0%,85%)] text-[15px] font-outfit text-black outline-none focus:border-[hsl(0,0%,70%)]"
                    />
                  </div>

                  {/* Sub-heading */}
                  <div className="space-y-1">
                    <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Sub-heading (Optional)</label>
                    <input
                      type="text"
                      value={newFolderBlogSubheading}
                      onChange={(e) => setNewFolderBlogSubheading(e.target.value)}
                      placeholder="A collection of my thoughts"
                      className="w-full px-3 py-2.5 rounded-xl border border-[hsl(0,0%,85%)] text-[15px] font-outfit text-black outline-none focus:border-[hsl(0,0%,70%)]"
                    />
                  </div>

                  {/* Header Image */}
                  <div className="space-y-1">
                    <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Header Image (Optional)</label>
                    {newFolderBlogHeaderImage ? (
                      <div className="relative">
                        <img
                          src={newFolderBlogHeaderImage}
                          alt="Header preview"
                          className="w-full h-[80px] object-cover rounded-xl"
                        />
                        <button
                          onClick={() => setNewFolderBlogHeaderImage('')}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full py-2.5 bg-[hsl(0,0%,96%)] border border-[hsl(0,0%,85%)] text-[hsl(0,0%,50%)] rounded-xl cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !user) return;

                            setUploadingHeaderImage(true);

                            // Delete old header image if exists
                            if (newFolderBlogHeaderImage && newFolderBlogHeaderImage.includes('supabase.co/storage')) {
                              try {
                                const urlParts = newFolderBlogHeaderImage.split('/storage/v1/object/public/note-images/');
                                if (urlParts.length > 1) {
                                  const oldFilePath = urlParts[1];
                                  await supabase.storage.from('note-images').remove([oldFilePath]);
                                }
                              } catch (error) {
                                console.error('Error deleting old header image:', error);
                              }
                            }

                            const fileExt = file.name.split('.').pop();
                            const fileName = `${user.id}/blog-header-${Date.now()}.${fileExt}`;

                            const { data, error } = await supabase.storage
                              .from('note-images')
                              .upload(fileName, file);

                            if (!error && data) {
                              const { data: urlData } = supabase.storage
                                .from('note-images')
                                .getPublicUrl(data.path);
                              setNewFolderBlogHeaderImage(urlData.publicUrl);
                            }
                            setUploadingHeaderImage(false);
                          }}
                        />
                        <span className="font-outfit text-[13px]">
                          {uploadingHeaderImage ? 'Uploading...' : 'Choose Image'}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Web Address */}
                  <div className="space-y-1">
                    <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Web Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newFolderBlogSlug}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setNewFolderBlogSlug(value);
                          setBlogSlugAvailable(null);
                        }}
                        onBlur={async () => {
                          if (!newFolderBlogSlug || newFolderBlogSlug.length < 2 || !user) {
                            setBlogSlugAvailable(null);
                            return;
                          }
                          const reserved = ['index', 'home', 'contact', 'prices', 'features', 'blog', 'admin', 'settings', 'new', 'edit', 'delete'];
                          if (reserved.includes(newFolderBlogSlug.toLowerCase())) {
                            setBlogSlugAvailable(false);
                            return;
                          }
                          setCheckingBlogSlug(true);
                          const { data } = await supabase
                            .from('folders')
                            .select('id')
                            .eq('user_id', user.id)
                            .eq('blog_slug', newFolderBlogSlug.toLowerCase())
                            .neq('id', editingFolder?.id || '')
                            .maybeSingle();
                          setCheckingBlogSlug(false);
                          setBlogSlugAvailable(!data);
                        }}
                        placeholder="my-blog"
                        className="w-full px-3 py-2.5 rounded-xl border border-[hsl(0,0%,85%)] text-[15px] font-outfit text-black outline-none focus:border-[hsl(0,0%,70%)] pr-10"
                      />
                      {checkingBlogSlug && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="animate-spin h-4 w-4 text-[hsl(0,0%,60%)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {!checkingBlogSlug && blogSlugAvailable === true && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!checkingBlogSlug && blogSlugAvailable === false && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {username && newFolderBlogSlug && (
                      <a
                        href={`https://nuron.life/${username}/${newFolderBlogSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-outfit hover:underline block mt-1"
                        style={{ color: themeColors[theme] }}
                      >
                        nuron.life/{username}/{newFolderBlogSlug}
                      </a>
                    )}
                    {!username && (
                      <p className="text-yellow-600 text-[11px] font-outfit mt-1">
                        Set your username in Account Details first
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[hsl(0,0%,40%)] text-[13px] font-outfit">Password (Optional)</label>
                    <input
                      type="text"
                      value={newFolderBlogPassword}
                      onChange={(e) => setNewFolderBlogPassword(e.target.value)}
                      placeholder="Leave blank for public"
                      className="w-full px-3 py-2.5 rounded-xl border border-[hsl(0,0%,85%)] text-[15px] font-outfit text-black outline-none focus:border-[hsl(0,0%,70%)]"
                    />
                    <p className="text-[hsl(0,0%,60%)] text-[11px] font-outfit">
                      Visitors will need this password to view
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowFolderPopup(false);
                  setEditingFolder(null);
                  setNewFolderName("");
                  setNewFolderDefaultView('collapsed');
                  setNewFolderSortOrder('desc');
                  setNewFolderIsBlog(false);
                  setNewFolderBlogSlug('');
                  setNewFolderBlogName('');
                  setNewFolderBlogSubheading('');
                  setNewFolderBlogHeaderImage('');
                  setNewFolderBlogPassword('');
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium text-[14px]"
              >
                Cancel
              </button>
              <button
                onClick={editingFolder ? updateFolder : createFolder}
                className="flex-1 py-2.5 px-4 rounded-full text-white font-outfit font-medium text-[14px]"
                style={{ backgroundColor: themeColors[theme] }}
              >
                {editingFolder ? 'Save' : 'Create'}
              </button>
            </div>

            {/* Delete Folder Button - only when editing */}
            {editingFolder && (
              <button
                onClick={() => {
                  setFolderToDelete({ id: editingFolder.id, name: editingFolder.name });
                  setShowDeleteFolderConfirm(true);
                }}
                className="w-full mt-3 py-2.5 text-[14px] font-outfit font-medium text-red-500"
              >
                Delete Folder
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation */}
      {showDeleteFolderConfirm && folderToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-2">
              Delete Folder
            </h3>
            <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] text-center mb-6">
              Are you sure you want to delete "{folderToDelete.name}"? All notes in this folder will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteFolderConfirm(false);
                  setFolderToDelete(null);
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium text-[15px]"
              >
                Cancel
              </button>
              <button
                onClick={deleteFolder}
                className="flex-1 py-3 px-4 rounded-full bg-red-500 text-white font-outfit font-medium text-[15px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
