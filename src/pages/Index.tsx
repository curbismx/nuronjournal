import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import settingsIcon from "@/assets/00settings-4.png";
import newPlusIcon from "@/assets/00plus-3.png";
import plusIconGreen from "@/assets/00plus_green.png";
import plusIconBlue from "@/assets/00plus_blue.png";
import plusIconPink from "@/assets/00plus_pink.png";
import themeIconDark from "@/assets/00dark.png";
import themeIconGreen from "@/assets/00green.png";
import themeIconBlue from "@/assets/00blue.png";
import themeIconPink from "@/assets/00pink.png";
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
import hamburgerIcon from "@/assets/hamburger.png";
import folderIcon from "@/assets/folder_icon.png";
import folderArrow from "@/assets/folder_arrow.png";
import folderSettingsIcon from "@/assets/folder_settings.png";
import folderPlusIcon from "@/assets/folder_plus.png";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Capacitor } from '@capacitor/core';
import { restorePurchases, isTrialExpired } from '@/lib/purchases';
import SubscriptionModal from '@/components/SubscriptionModal';


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
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const navigate = useNavigate();

  // Check if onboarding is complete
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('nuron-onboarding-complete');
    if (!onboardingComplete) {
      navigate('/onboarding');
    }
  }, [navigate]);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>(() => {
    // Try cache first (for logged-in users)
    const cached = localStorage.getItem('nuron-notes-cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fall through
      }
    }
    // Then try local notes (for non-logged-in users)
    const stored = localStorage.getItem('nuron-notes');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [viewMode, setViewMode] = useState<'collapsed' | 'compact'>('collapsed');
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showWeatherOnNotes, setShowWeatherOnNotes] = useState(() => {
    const stored = localStorage.getItem('nuron-show-weather');
    return stored !== null ? JSON.parse(stored) : true; // Default to ON
  });
  const [theme, setTheme] = useState<'default' | 'green' | 'blue' | 'pink'>(() => {
    const stored = localStorage.getItem('nuron-theme');
    return (stored as 'default' | 'green' | 'blue' | 'pink') || 'default';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showRateAppDialog, setShowRateAppDialog] = useState(false);

  // Folder state
  const [showFolders, setShowFolders] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDefaultView, setNewFolderDefaultView] = useState<'collapsed' | 'compact'>('collapsed');
  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);

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
      if (!user) {
        // For non-logged-in users, use a local folder
        const localFolder: Folder = {
          id: 'local-notes',
          user_id: 'local',
          name: 'Notes',
          default_view: 'collapsed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setFolders([localFolder]);
        setCurrentFolder(localFolder);
        return;
      }
      
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (data && !error) {
        if (data.length === 0) {
          // Only create default folder if user has NO folders at all
          const { data: newFolder, error: createError } = await supabase
            .from('folders')
            .insert({ user_id: user.id, name: 'Notes', default_view: 'collapsed' })
            .select()
            .single();
          
          if (newFolder && !createError) {
            const typedFolder: Folder = {
              ...newFolder,
              default_view: (newFolder.default_view || 'collapsed') as 'collapsed' | 'compact'
            };
            setFolders([typedFolder]);
            setCurrentFolder(typedFolder);
            setViewMode(typedFolder.default_view);
            localStorage.setItem('nuron-current-folder-id', typedFolder.id);
          }
        } else {
          const typedFolders = data.map(f => ({
            ...f,
            default_view: (f.default_view || 'collapsed') as 'collapsed' | 'compact'
          }));
          setFolders(typedFolders);
          
          if (!currentFolder) {
            const notesFolder = typedFolders.find(f => f.name === 'Notes') || typedFolders[0];
            setCurrentFolder(notesFolder);
            setViewMode(notesFolder.default_view);
            localStorage.setItem('nuron-current-folder-id', notesFolder.id);
          }
        }
      }
    };
    
    loadFolders();
  }, [user]);

  // Migrate existing notes without folder_id to the default folder
  useEffect(() => {
    const migrateNotes = async () => {
      if (!user || !currentFolder || currentFolder.id === 'local-notes') return;
      
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
            folder_id: note.folder_id
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
    if (currentFolder) {
      localStorage.setItem('nuron-current-folder-id', currentFolder.id);
    }
  }, [currentFolder]);

  // Folder CRUD functions
  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    
    const { data, error } = await supabase
      .from('folders')
      .insert({ 
        user_id: user.id, 
        name: newFolderName.trim(), 
        default_view: newFolderDefaultView 
      })
      .select()
      .single();
    
    if (data && !error) {
      const typedFolder: Folder = {
        ...data,
        default_view: (data.default_view || 'collapsed') as 'collapsed' | 'compact'
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
        updated_at: new Date().toISOString()
      })
      .eq('id', editingFolder.id);
    
    if (!error) {
      setFolders(prev => prev.map(f => 
        f.id === editingFolder.id 
          ? { ...f, name: newFolderName.trim(), default_view: newFolderDefaultView }
          : f
      ));
      if (currentFolder?.id === editingFolder.id) {
        setCurrentFolder({ ...currentFolder, name: newFolderName.trim(), default_view: newFolderDefaultView });
      }
      setShowFolderPopup(false);
      setEditingFolder(null);
      setNewFolderName("");
      setNewFolderDefaultView('collapsed');
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
    setShowFolderPopup(true);
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    setNewFolderName("");
    setNewFolderDefaultView('collapsed');
    setShowFolderPopup(true);
  };

  const selectFolder = (folder: Folder) => {
    setCurrentFolder(folder);
    setViewMode(folder.default_view);
    setShowFolders(false);
    localStorage.setItem('nuron-current-folder-id', folder.id);
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
          
          // Reload notes from Supabase after sign in
          loadNotesForCurrentFolder(session!.user.id);
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

  // Load notes for current folder
  const loadNotesForCurrentFolder = async (userId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = userId || session?.user?.id;
    
    if (uid && currentFolder && currentFolder.id !== 'local-notes') {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', uid)
        .or(`folder_id.eq.${currentFolder.id},folder_id.is.null`)
        .order('created_at', { ascending: false });
      
      if (data) {
        const notes = data.map(note => ({
          id: note.id,
          title: note.title || 'Untitled',
          contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          weather: note.weather as SavedNote['weather'],
          folder_id: note.folder_id
        }));
        setSavedNotes(notes);
        // CACHE TO LOCALSTORAGE
        localStorage.setItem('nuron-notes-cache', JSON.stringify(notes));
      }
    }
  };

  // Reload notes when current folder changes
  useEffect(() => {
    if (currentFolder && user) {
      loadNotesForCurrentFolder();
    }
  }, [currentFolder?.id, user?.id]);

  // Load notes from Supabase or localStorage based on auth status
  useEffect(() => {
    const loadNotes = async () => {
      // ALWAYS check auth directly
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Logged in - load from Supabase WITH user_id filter
        // If we have a current folder, filter by it
        let query = supabase
          .from('notes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (currentFolder && currentFolder.id !== 'local-notes') {
          query = query.or(`folder_id.eq.${currentFolder.id},folder_id.is.null`);
        }
        
        const { data } = await query;
        
        if (data) {
          const notes = data.map(note => ({
            id: note.id,
            title: note.title || 'Untitled',
            contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
            createdAt: note.created_at,
            updatedAt: note.updated_at,
            weather: note.weather as SavedNote['weather'],
            folder_id: note.folder_id
          }));
          setSavedNotes(notes);
          // CACHE TO LOCALSTORAGE for instant load next time
          localStorage.setItem('nuron-notes-cache', JSON.stringify(notes));
        }
      } else {
        // Not logged in - load from localStorage
        const stored = localStorage.getItem('nuron-notes');
        setSavedNotes(stored ? JSON.parse(stored) : []);
      }
    };

    loadNotes();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();
    
    if (data) {
      setUserProfile(data);
    }
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
      setAuthFormError(error.message);
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
    await supabase.from("notes").delete().eq("user_id", user.id);
    await supabase.from("folders").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setShowAccountDetails(false);
    setShowSettings(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFormError("");
    
    if (newPassword !== confirmNewPassword) {
      setPasswordFormError("Passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordFormError("Password must be at least 6 characters");
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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      setPasswordFormError(error.message);
    } finally {
      setLoading(false);
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
        folder_id: note.folder_id
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
          folder_id: note.folder_id
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

  // Filter notes based on search
  const filteredNotes = searchQuery.trim() === '' 
    ? savedNotes 
    : savedNotes.filter(note => {
        const query = searchQuery.toLowerCase();
        const titleMatch = note.title.toLowerCase().includes(query);
        const contentMatch = note.contentBlocks
          .filter(b => b.type === 'text')
          .some(b => (b as { type: 'text'; id: string; content: string }).content.toLowerCase().includes(query));
        return titleMatch || contentMatch;
      });

  const filteredGroupedNotes: GroupedNotes[] = filteredNotes.reduce((groups: GroupedNotes[], note) => {
    const dateKey = new Date(note.createdAt).toLocaleDateString('en-US');
    const existingGroup = groups.find(g => g.date === dateKey);
    if (existingGroup) {
      existingGroup.notes.push(note);
    } else {
      groups.push({ date: dateKey, notes: [note] });
    }
    return groups;
  }, []);

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
  const getNotePreview = (note: SavedNote): string => {
    return note.contentBlocks
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; id: string; content: string }).content)
      .join('\n\n');
  };


  // Show original start page only for logged-out users with no notes
  if (savedNotes.length === 0 && !user) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: themeColors[theme] }}>
        {/* Header with settings button */}
        <div 
          className="z-50"
          style={{
            paddingTop: `calc(30px + env(safe-area-inset-top))`,
            paddingLeft: `calc(30px + env(safe-area-inset-left))`
          }}
        >
        <div className="relative">
          <button 
            onClick={() => {
              if (showChangePassword) {
                setShowChangePassword(false);
              } else if (showAccountDetails) {
                setShowAccountDetails(false);
              } else {
                setShowSettings(!showSettings);
              }
            }}
            className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity"
          >
            <img 
              src={showSettings || showAccountDetails || showChangePassword ? backIcon : settingsIcon}
              alt={showSettings || showAccountDetails || showChangePassword ? "Back" : "Settings"}
              className="w-[30px] h-[30px]"
            />
          </button>
          {!showSettings && !showAccountDetails && !showChangePassword && !user && (
             <div className="absolute top-[30px] left-[40px]">
             <img 
               src={text3Image} 
               alt="Set up account" 
               className="h-auto"
               style={{ maxWidth: '400px' }}
             />
           </div>
          )}
        </div>
        </div>

      {/* Title for settings/account */}
      {(showSettings || showAccountDetails || showChangePassword) && (
        <div 
          className="mt-[20px]"
          style={{
            paddingLeft: `calc(30px + env(safe-area-inset-left))`,
            paddingRight: `calc(30px + env(safe-area-inset-right))`
          }}
        >
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider">
            {showChangePassword ? 'CHANGE PASSWORD' : showAccountDetails ? 'ACCOUNT DETAILS' : 'SETTINGS'}
          </h1>
        </div>
      )}


        {/* Settings panel */}
      <div 
        className={`absolute inset-x-0 bottom-0 px-8 pt-[80px] overflow-y-auto transition-opacity duration-200 ${showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        style={{ 
          backgroundColor: themeColors[theme],
          top: `calc(120px + env(safe-area-inset-top))`,
          paddingLeft: `calc(32px + env(safe-area-inset-left))`,
          paddingRight: `calc(32px + env(safe-area-inset-right))`
        }}
      >
        <div className="text-white font-outfit space-y-6">
          {showChangePassword ? (
            /* Change Password Form */
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80 text-[14px] uppercase tracking-wider">New Password</Label>
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
                <Label className="text-white/80 text-[14px] uppercase tracking-wider">Confirm New Password</Label>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors disabled:opacity-50"
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
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors"
              >
                Cancel
              </button>
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
                    <button onClick={handleDeleteAccount} className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-[10px] transition-colors text-[14px]">
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
                  className="w-full bg-white/5 hover:bg-white/10 text-white rounded-[10px] px-4 py-4 flex items-center justify-between transition-colors text-[20px]"
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

                {/* Theme selector */}
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
                        <img 
                          src={themeSettingsIcons[t]} 
                          alt={t} 
                          className="w-[40px] h-[40px]"
                        />
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
            ) : showSignUp ? (
              /* Sign Up / Sign In Form */
              <form onSubmit={isSignInMode ? handleSignIn : handleSignUp} className="space-y-4">
                {!isSignInMode && (
                  <div className="space-y-2">
                    <Label className="text-white/80 text-[14px]">Name</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                    minLength={6}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                  />
                </div>
                {authFormError && (
                  <p className="text-red-400 text-[14px]">{authFormError}</p>
                )}
                <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors">
                  {loading ? "Loading..." : isSignInMode ? "Sign In" : "Create Account"}
                </button>
                <button type="button" onClick={() => setIsSignInMode(!isSignInMode)} className="w-full text-white/60 hover:text-white/80 text-[14px] transition-colors">
                  {isSignInMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
                <button type="button" onClick={() => setShowSignUp(false)} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors">
                  Cancel
                </button>
              </form>
            ) : (
              /* Initial buttons - not logged in */
              <div className="space-y-4">
                {/* Account section */}
                <button onClick={() => { setShowSignUp(true); setIsSignInMode(false); }} className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors">
                  Create Account
                </button>
                <button onClick={() => { setShowSignUp(true); setIsSignInMode(true); }} className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors">
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
                        <img 
                          src={themeSettingsIcons[t]} 
                          alt={t} 
                          className="w-[40px] h-[40px]"
                        />
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

        {/* Main Content - slides down when settings open */}
        <main className={`flex-1 flex flex-col transition-transform duration-300 ${showSettings ? 'translate-y-[100%]' : ''}`} style={{ minHeight: 0 }}>
          {/* Center section with textImage and plus button */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative flex items-center justify-center" style={{ marginTop: '150px' }}>
              <img src={textImage} alt="Instructions" style={{ width: '320px', maxWidth: '90vw' }} />
              <button 
                onClick={() => navigate('/note')}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-[15px] hover:scale-105 transition-transform"
              >
                <img src={themePlusIcons[theme]} alt="Record" className="w-[51px] h-[51px]" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))' }} />
              </button>
            </div>
          </div>
          {/* Bottom section with text2Image */}
          {!showSettings && (
            <div className="w-full flex justify-center px-8 pb-[320px]">
              <img src={text2Image} alt="Instructions" className="w-full max-w-[300px]" />
            </div>
          )}
        </main>

        {/* Merge notes dialog */}
        {showMergeDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
              <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-2">
                Sync Notes
              </h3>
              <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] text-center mb-6">
                You have {localNotesToMerge.length} note{localNotesToMerge.length !== 1 ? 's' : ''} on this device. Would you like to sync them to your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMergeDialog(false);
                    setLocalNotesToMerge([]);
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

        {/* Folder Create/Edit Popup */}
        {showFolderPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl relative">
              <button
                onClick={() => {
                  setShowFolderPopup(false);
                  setEditingFolder(null);
                  setNewFolderName("");
                  setNewFolderDefaultView('collapsed');
                }}
                className="absolute top-4 right-4 text-[hsl(0,0%,60%)] text-xl font-light"
              >
                ×
              </button>
              
              <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-6">
                {editingFolder ? 'Edit Folder' : 'New Folder'}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(0,0%,40%)] text-[14px]">Folder Name</Label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="w-full px-4 py-3 rounded-xl border border-[hsl(0,0%,85%)] text-[16px] font-outfit outline-none focus:border-[hsl(0,0%,70%)]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[hsl(0,0%,40%)] text-[14px]">Default View</Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewFolderDefaultView('collapsed')}
                      className={`flex-1 py-3 px-4 rounded-xl font-outfit font-medium text-[14px] ${
                        newFolderDefaultView === 'collapsed' 
                          ? 'bg-[hsl(0,0%,25%)] text-white' 
                          : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                      }`}
                    >
                      Date View
                    </button>
                    <button
                      onClick={() => setNewFolderDefaultView('compact')}
                      className={`flex-1 py-3 px-4 rounded-xl font-outfit font-medium text-[14px] ${
                        newFolderDefaultView === 'compact' 
                          ? 'bg-[hsl(0,0%,25%)] text-white' 
                          : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                      }`}
                    >
                      List View
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowFolderPopup(false);
                    setEditingFolder(null);
                    setNewFolderName("");
                    setNewFolderDefaultView('collapsed');
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium text-[15px]"
                >
                  Cancel
                </button>
                <button
                  onClick={editingFolder ? updateFolder : createFolder}
                  className="flex-1 py-3 px-4 rounded-full text-white font-outfit font-medium text-[15px]"
                  style={{ backgroundColor: themeColors[theme] }}
                >
                  {editingFolder ? 'Save' : 'Create'}
                </button>
              </div>
              
              {editingFolder && (
                <button
                  onClick={() => {
                    setFolderToDelete({ id: editingFolder.id, name: editingFolder.name });
                    setShowDeleteFolderConfirm(true);
                  }}
                  className="w-full mt-4 py-3 text-[15px] font-outfit font-medium text-red-500"
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
  }

  // Show timeline when notes exist
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: themeColors[theme] }}>
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
                  setShowFolders(true);
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
                  >
                    <img src={searchIcon} alt="Search" className="h-[24px] w-auto" />
                  </button>
                  <button 
                    onClick={() => setViewMode(prev => prev === 'collapsed' ? 'compact' : 'collapsed')}
                    className="p-0 m-0 border-0 bg-transparent"
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
          top: `calc(150px + env(safe-area-inset-top))`,
          paddingLeft: `calc(30px + env(safe-area-inset-left))`,
          paddingRight: `calc(32px + env(safe-area-inset-right))`,
          paddingTop: '30px'
        }}
      >
        {/* Folders list */}
        <div className="space-y-4 pt-[70px]">
          {folders.map((folder) => (
            <div 
              key={folder.id}
              className={`flex items-center gap-3 py-3 ${currentFolder?.id === folder.id ? 'bg-[#353434] mx-[-32px] px-[48px]' : 'px-4'}`}
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
                      <img 
                        src={themeSettingsIcons[t]} 
                        alt={t} 
                        className="w-[40px] h-[40px]"
                      />
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
                  minLength={6}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                />
              </div>
              {authFormError && (
                <p className="text-red-400 text-[14px]">{authFormError}</p>
              )}
              <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-white text-journal-header font-medium rounded-[10px] hover:bg-white/90 transition-colors">
                {loading ? "Loading..." : isSignInMode ? "Sign In" : "Create Account"}
              </button>
              <button type="button" onClick={() => {
                setIsSignInMode(!isSignInMode);
                setAuthFormError("");
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
                      <img 
                        src={themeSettingsIcons[t]} 
                        alt={t} 
                        className="w-[40px] h-[40px]"
                      />
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
        className={`flex-1 overflow-y-scroll overflow-x-hidden bg-journal-content rounded-t-[30px] overscroll-y-auto z-40 transition-transform duration-300 ${showSettings || showFolders ? 'translate-y-[100%]' : '-mt-[25px]'}`}
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
          {/* Notes list */}
          <div>
            {(isSearching ? filteredGroupedNotes : groupedNotes).map((group, groupIndex, allGroups) => {
              const groupMonthYear = new Date(group.notes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
              const prevGroup = groupIndex > 0 ? allGroups[groupIndex - 1] : null;
              const prevMonthYear = prevGroup ? new Date(prevGroup.notes[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : null;
              const showMonthHeader = viewMode !== 'compact' && (groupIndex === 0 || groupMonthYear !== prevMonthYear);
              
              return (
                <div 
                  key={group.date}
                  data-month-year={groupMonthYear}
                  ref={(el) => {
                    if (el) dateGroupRefs.current.set(group.date, el);
                    else dateGroupRefs.current.delete(group.date);
                  }}
                >
                  {showMonthHeader && (
                    <div className="sticky top-0 z-10 bg-[#CACAC2] px-8 py-[3px]">
                      <span className="text-white text-[20px] font-outfit font-light tracking-wider leading-tight">
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
                          {/* Only show date for first note of each day - HIDDEN in compact view */}
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
                          
                {/* Title and Body Container */}
                <div className="min-w-0">
                  {viewMode === 'compact' ? (
                    /* COMPACT VIEW - no date, smaller layout */
                    <div className="flex items-center gap-[12px]">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[20px] font-outfit font-semibold text-[hsl(0,0%,25%)] break-words overflow-wrap-anywhere">
                          {note.title || 'Untitled'}
                        </h3>
                        <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] line-clamp-1 break-words overflow-wrap-anywhere">
                          {preview || 'No content'}
                        </p>
                      </div>
                      {firstImage && (
                        <img 
                          src={firstImage.url} 
                          alt=""
                          className="w-[50px] h-[50px] rounded-[8px] object-cover flex-shrink-0"
                        />
                      )}
                    </div>
                  ) : (
                    /* COLLAPSED VIEW (default) */
                    <div className="flex items-center gap-[15px]">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-4 break-words overflow-wrap-anywhere ${index === 0 ? '-mt-[10px]' : ''}`}>
                          {note.title || 'Untitled'}
                        </h3>
                        <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] line-clamp-2 -mt-[10px] break-words overflow-wrap-anywhere">
                          {preview || 'No content'}
                        </p>
                      </div>
                      {firstImage && (
                        <img 
                          src={firstImage.url} 
                          alt=""
                          className="w-[70px] h-[70px] rounded-[10px] object-cover flex-shrink-0"
                        />
                      )}
                    </div>
                  )}
                </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating add button */}
      {!showSettings && !showFolders && (
        <button
          onClick={() => navigate('/note')}
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
                  // Just load from Supabase, keep local notes in localStorage for now
                  if (user) {
                    loadNotesForCurrentFolder(user.id);
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
          <div className="bg-white rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl relative">
            <button
              onClick={() => {
                setShowFolderPopup(false);
                setEditingFolder(null);
                setNewFolderName("");
                setNewFolderDefaultView('collapsed');
              }}
              className="absolute top-4 right-4 text-[hsl(0,0%,60%)] text-xl font-light"
            >
              ×
            </button>
            
            <h3 className="text-[18px] font-outfit font-semibold text-[hsl(0,0%,25%)] text-center mb-6">
              {editingFolder ? 'Edit Folder' : 'New Folder'}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[hsl(0,0%,40%)] text-[14px]">Folder Name</Label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-4 py-3 rounded-xl border border-[hsl(0,0%,85%)] text-[16px] font-outfit text-black outline-none focus:border-[hsl(0,0%,70%)]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[hsl(0,0%,40%)] text-[14px]">Default View</Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewFolderDefaultView('collapsed')}
                    className={`flex-1 py-3 px-4 rounded-xl font-outfit font-medium text-[14px] ${
                      newFolderDefaultView === 'collapsed' 
                        ? 'bg-[hsl(0,0%,25%)] text-white' 
                        : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                    }`}
                  >
                    Date View
                  </button>
                  <button
                    onClick={() => setNewFolderDefaultView('compact')}
                    className={`flex-1 py-3 px-4 rounded-xl font-outfit font-medium text-[14px] ${
                      newFolderDefaultView === 'compact' 
                        ? 'bg-[hsl(0,0%,25%)] text-white' 
                        : 'bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)]'
                    }`}
                  >
                    List View
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFolderPopup(false);
                  setEditingFolder(null);
                  setNewFolderName("");
                  setNewFolderDefaultView('collapsed');
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium text-[15px]"
              >
                Cancel
              </button>
              <button
                onClick={editingFolder ? updateFolder : createFolder}
                className="flex-1 py-3 px-4 rounded-full text-white font-outfit font-medium text-[15px]"
                style={{ backgroundColor: themeColors[theme] }}
              >
                {editingFolder ? 'Save' : 'Create'}
              </button>
            </div>
            
            {editingFolder && (
              <button
                onClick={() => {
                  setFolderToDelete({ id: editingFolder.id, name: editingFolder.name });
                  setShowDeleteFolderConfirm(true);
                }}
                className="w-full mt-4 py-3 text-[15px] font-outfit font-medium text-red-500"
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
