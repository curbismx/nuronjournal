import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import settingsIcon from "@/assets/00settings-4.png";
import newPlusIcon from "@/assets/00plus-3.png";
import textImage from "@/assets/text.png";
import plusIcon from "@/assets/plusbig.png";
import expandIcon from "@/assets/00expand-3.png";
import condenseIcon from "@/assets/00condense-3.png";
import floatingAddButton from "@/assets/bigredbuttonnoshadow.png";
import smallArrow from "@/assets/00notearrow-4.png";
import backIcon from "@/assets/back.png";
import accountArrow from "@/assets/00settingsarrow-2.png";
import searchIcon from "@/assets/00search-3.png";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


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
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [localNotesToMerge, setLocalNotesToMerge] = useState<SavedNote[]>([]);
  const [authFormError, setAuthFormError] = useState("");
  const [passwordFormError, setPasswordFormError] = useState("");

  // Save weather setting to localStorage
  useEffect(() => {
    localStorage.setItem('nuron-show-weather', JSON.stringify(showWeatherOnNotes));
  }, [showWeatherOnNotes]);

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
          supabase
            .from('notes')
            .select('*')
            .eq('user_id', session!.user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) {
                const notes = data.map(note => ({
                  id: note.id,
                  title: note.title || 'Untitled',
                  contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
                  createdAt: note.created_at,
                  updatedAt: note.updated_at,
                  weather: note.weather as SavedNote['weather']
                }));
                setSavedNotes(notes);
                // CACHE TO LOCALSTORAGE
                localStorage.setItem('nuron-notes-cache', JSON.stringify(notes));
              }
            });
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

  // Load notes from Supabase or localStorage based on auth status
  useEffect(() => {
    const loadNotes = async () => {
      // ALWAYS check auth directly
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Logged in - load from Supabase WITH user_id filter
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (data) {
          const notes = data.map(note => ({
            id: note.id,
            title: note.title || 'Untitled',
            contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
            createdAt: note.created_at,
            updatedAt: note.updated_at,
            weather: note.weather as SavedNote['weather']
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
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmed) {
      await supabase.from("notes").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setShowAccountDetails(false);
      setShowSettings(false);
    }
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

  const loadNotesFromSupabase = async (userId: string) => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setSavedNotes(data.map(note => ({
        id: note.id,
        title: note.title || 'Untitled',
        contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        weather: note.weather as SavedNote['weather']
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
          weather: note.weather
        });
      }
      
      // Clear localStorage
      localStorage.removeItem('nuron-notes');
      
      // Reload everything from Supabase
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setSavedNotes(data.map(note => ({
          id: note.id,
          title: note.title || 'Untitled',
          contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          weather: note.weather as SavedNote['weather']
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


  // Show original start page if no notes
  if (savedNotes.length === 0) {
    return (
      <div className="fixed inset-0 bg-journal-header flex flex-col overflow-hidden">
        {/* Header with settings button */}
        <div className="pl-[30px] pt-[30px] z-50">
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
        </div>

        {/* Title for settings/account */}
      {(showSettings || showAccountDetails || showChangePassword) && (
        <div className="px-[30px] mt-[20px]">
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider">
            {showChangePassword ? 'CHANGE PASSWORD' : showAccountDetails ? 'ACCOUNT DETAILS' : 'SETTINGS'}
          </h1>
        </div>
      )}

        {/* Settings panel */}
      <div className={`absolute inset-x-0 top-[120px] bottom-0 bg-journal-header px-8 pt-[80px] overflow-y-auto transition-opacity duration-200 ${showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-white font-outfit space-y-6">
          {showChangePassword ? (
            /* Change Password Form */
            <form onSubmit={handleChangePassword} className="space-y-4">
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
                    <button
                      onClick={() => {
                        setShowChangePassword(true);
                        setPasswordFormError("");
                      }}
                      className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px] text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <span>••••••••</span>
                      <span className="text-white/40">→</span>
                    </button>
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
                <div className="bg-white/5 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                  <span className="text-[20px]">Show weather on notes</span>
                  <button
                    onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                    className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                  >
                    <span 
                      className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`}
                    />
                  </button>
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
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                  />
                </div>
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
                <div className="bg-white/5 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                  <span className="text-[20px]">Show weather on notes</span>
                  <button
                    onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                    className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                  >
                    <span 
                      className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - slides down when settings open */}
        <main className={`flex-1 flex flex-col items-center justify-center px-8 transition-transform duration-300 ${showSettings ? 'translate-y-[100%]' : ''}`}>
          <div className="relative">
            <img src={textImage} alt="Instructions" className="w-full max-w-[320px] mt-[60px]" />
            <button 
              onClick={() => navigate('/note')}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-[15px] hover:scale-105 transition-transform"
            >
              <img src={newPlusIcon} alt="Record" className="w-[70px] h-[70px]" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))' }} />
            </button>
          </div>
        </main>

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
                      const { data } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });
                      
                      if (data) {
                        setSavedNotes(data.map(note => ({
                          id: note.id,
                          title: note.title || 'Untitled',
                          contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
                          createdAt: note.created_at,
                          updatedAt: note.updated_at,
                          weather: note.weather as SavedNote['weather']
                        })));
                      }
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={() => mergeAndSyncNotes()}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-journal-header text-white font-outfit font-medium disabled:opacity-50"
                >
                  {loading ? 'Syncing...' : 'Sync'}
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
    <div className="fixed inset-0 flex flex-col bg-journal-header overflow-hidden">
      {/* Fixed dark header */}
      <header className="flex-shrink-0 bg-journal-header pl-[30px] pt-[30px] pb-[30px] h-[150px] z-30">
        <div className="flex items-center justify-between mb-auto -mt-[15px]">
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
          <div className="flex-1" />
        </div>
        <div className="relative mt-[41px]">
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px]">
            {showChangePassword ? 'CHANGE PASSWORD' : showAccountDetails ? 'ACCOUNT DETAILS' : showSettings ? 'SETTINGS' : headerMonthYear}
          </h1>
          {!showSettings && !showAccountDetails && !showChangePassword && (
            <>
              <button 
                onClick={() => {/* TODO: Add search functionality */}}
                className="absolute right-[110px] top-0"
              >
                <img src={searchIcon} alt="Search" className="h-[24px] w-auto" />
              </button>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="absolute right-[30px] top-0"
              >
                <img src={menuOpen ? condenseIcon : expandIcon} alt="Menu" className="h-[24px] w-auto" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Settings panel - sits behind the card */}
      <div className={`absolute inset-x-0 top-[150px] bottom-0 bg-journal-header px-8 pt-[80px] transition-opacity duration-200 overflow-y-auto ${showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-white font-outfit space-y-6">
          {showChangePassword ? (
            /* Change Password Form */
            <form onSubmit={handleChangePassword} className="space-y-4">
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
                    <button
                      onClick={() => {
                        setShowChangePassword(true);
                        setPasswordFormError("");
                      }}
                      className="w-full bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px] text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <span>••••••••</span>
                      <span className="text-white/40">→</span>
                    </button>
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
              <div className="bg-white/5 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px]">Show weather on notes</span>
                <button
                  onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span 
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`}
                  />
                </button>
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
              <div className="bg-white/5 text-white rounded-[10px] px-4 py-4 flex items-center justify-between">
                <span className="text-[20px]">Show weather on notes</span>
                <button
                  onClick={() => setShowWeatherOnNotes(!showWeatherOnNotes)}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${showWeatherOnNotes ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span 
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ${showWeatherOnNotes ? 'translate-x-[20px]' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div 
        className={`flex-1 overflow-y-scroll bg-journal-content rounded-t-[30px] overscroll-y-auto z-40 transition-transform duration-300 ${showSettings ? 'translate-y-[100%]' : '-mt-[25px]'}`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          minHeight: 0
        }}
      >
        <div style={{ minHeight: 'calc(100% + 1px)' }}>
          {/* Notes list */}
          <div>
            {groupedNotes.map((group) => (
              <div key={group.date}>
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
                      <div className={index === 0 ? "px-8 pt-[12px] pb-4" : "px-8 pt-4 pb-4"}>
                        {/* Only show date for first note of each day */}
                        {index === 0 && (
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
                        <div className="pr-[50px] relative">
                          {/* Arrow icon - always in same position */}
                          <img 
                            src={smallArrow} 
                            alt="" 
                            className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-[20px] h-auto"
                          />

                          {menuOpen ? (
                            /* EXPANDED VIEW - image floats, text wraps around and underneath */
                            <div>
                              <h3 className={`text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-4 ${index === 0 ? '-mt-[10px]' : ''}`}>
                                {note.title || 'Untitled'}
                              </h3>
                              <div className="-mt-[10px]" style={{ maxHeight: '273px', overflow: 'hidden' }}>
                                {firstImage && (
                                  <img 
                                    src={firstImage.url} 
                                    alt=""
                                    className="float-right w-[70px] h-[70px] rounded-[10px] object-cover ml-[15px] mb-[10px]"
                                    style={{ shapeOutside: 'margin-box' }}
                                  />
                                )}
                                <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)]" style={{ display: 'block' }}>
                                  {preview || 'No content'}
                                </p>
                                <div style={{ clear: 'both' }} />
                              </div>
                            </div>
                          ) : (
                            /* COLLAPSED VIEW - image vertically centered with content */
                            <div className="flex items-center gap-[15px]">
                              <div className="flex-1">
                                <h3 className={`text-[24px] font-outfit font-semibold text-[hsl(0,0%,25%)] mb-4 ${index === 0 ? '-mt-[10px]' : ''}`}>
                                  {note.title || 'Untitled'}
                                </h3>
                                <p className="text-[14px] font-outfit text-[hsl(0,0%,50%)] line-clamp-2 -mt-[10px]">
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
            ))}
          </div>
        </div>
      </div>

      {/* Floating add button */}
      {!showSettings && (
        <img 
          src={newPlusIcon} 
          alt="Add Note"
          onClick={() => navigate('/note')}
          className="fixed bottom-[30px] right-[30px] z-50 cursor-pointer w-[70px] h-[70px]"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
          }}
        />
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
                    const { data } = await supabase
                      .from('notes')
                      .select('*')
                      .eq('user_id', user.id)
                      .order('created_at', { ascending: false });
                    
                    if (data) {
                      setSavedNotes(data.map(note => ({
                        id: note.id,
                        title: note.title || 'Untitled',
                        contentBlocks: note.content_blocks as SavedNote['contentBlocks'],
                        createdAt: note.created_at,
                        updatedAt: note.updated_at,
                        weather: note.weather as SavedNote['weather']
                      })));
                    }
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[hsl(0,0%,92%)] text-[hsl(0,0%,25%)] font-outfit font-medium"
              >
                Skip
              </button>
              <button
                onClick={() => mergeAndSyncNotes()}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-journal-header text-white font-outfit font-medium disabled:opacity-50"
              >
                {loading ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
