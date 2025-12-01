import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import settingsIcon from "@/assets/settings-new.png";
import newPlusIcon from "@/assets/plus-new.png";
import textImage from "@/assets/text.png";
import plusIcon from "@/assets/plusbig.png";
import expandIcon from "@/assets/expand-new.png";
import condenseIcon from "@/assets/condense-new.png";
import floatingAddButton from "@/assets/bigredbuttonnoshadow.png";
import noteArrow from "@/assets/note-arrow.png";
import backIcon from "@/assets/back-new.png";
import searchIcon from "@/assets/search.png";
import settingsArrow from "@/assets/settings-arrow.png";


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
  const location = useLocation();
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const initialShowSettings = (location.state as any)?.showSettings || false;
  const [showSettings, setShowSettings] = useState(initialShowSettings);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  // Clear navigation state after reading
  useEffect(() => {
    if ((location.state as any)?.showSettings) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Use double requestAnimationFrame to ensure DOM has fully painted
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    });
  }, []);

  // Load notes based on auth status
  useEffect(() => {
    const loadNotes = async () => {
      if (user) {
        // Load from Supabase for authenticated users
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data && !error) {
          setSavedNotes(data.map(note => ({
            id: note.id,
            title: note.title || 'Untitled',
            contentBlocks: note.content_blocks as Array<
              | { type: 'text'; id: string; content: string }
              | { type: 'image'; id: string; url: string; width: number }
            >,
            createdAt: note.created_at,
            updatedAt: note.updated_at,
            weather: note.weather as { temp: number; weatherCode: number } | undefined
          })));
        }
      } else {
        // Load from localStorage for non-authenticated users
        const stored = localStorage.getItem('nuron-notes');
        if (stored) {
          setSavedNotes(JSON.parse(stored));
        }
      }
    };

    loadNotes();
  }, [user]);

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSettings(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete all your notes and data. This action cannot be undone."
    );
    
    if (!confirmed) return;

    try {
      // Delete all user's notes first
      const { error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id);

      if (notesError) throw notesError;

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sign out (Supabase will handle user deletion via cascade)
      await supabase.auth.signOut();
      
      alert("Your account has been deleted successfully.");
      setShowSettings(false);
    } catch (error: any) {
      alert("Error deleting account: " + error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== repeatPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      alert("Account created successfully!");
      setShowSignUp(false);
      setIsSignInMode(false);
      setName("");
      setEmail("");
      setPassword("");
      setRepeatPassword("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      alert("Signed in successfully!");
      setShowSignUp(false);
      setIsSignInMode(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
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
      <div className={`fixed inset-0 bg-journal-header flex flex-col overflow-hidden ${isReady ? 'opacity-100' : 'opacity-0'}`} style={{ transition: 'none' }}>
        {/* Settings Button */}
        <div className="pl-[30px] pt-[30px] z-50">
          <button 
            onClick={() => {
              if (showAccountDetails) {
                setShowAccountDetails(false);
              } else {
                setShowSettings(!showSettings);
              }
            }}
            className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity"
          >
            <img 
              src={showSettings || showAccountDetails ? backIcon : settingsIcon} 
              alt={showSettings || showAccountDetails ? "Back" : "Settings"} 
              className="w-[30px] h-[30px]" 
            />
          </button>
        </div>

        {/* Main Content - Centered */}
        <main className={`flex-1 flex flex-col items-center justify-center px-8 ${isReady ? 'transition-transform duration-300 ease-in-out' : ''} ${showSettings ? 'translate-y-[100%]' : ''}`}>
          {/* Text and Record Button Container */}
          <div className="relative">
            {/* Handwritten Text Image */}
            <img 
              src={textImage} 
              alt="Instructions" 
              className="w-full max-w-[320px] mt-[60px]"
            />
            
            {/* Red Record Button - Overlaid on text */}
            <button 
              onClick={() => navigate('/note')}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-[15px] hover:scale-105 transition-transform"
            >
              <img 
                src={newPlusIcon} 
                alt="Record" 
                className="w-[70px] h-[70px]"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                }}
              />
            </button>
          </div>
        </main>

        {/* Settings panel - same as in notes view */}
        <div className={`absolute inset-x-0 top-[80px] bottom-0 bg-journal-header px-8 pt-8 transition-opacity duration-300 overflow-y-auto ${showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none mb-8">
            {showAccountDetails ? 'ACCOUNT DETAILS' : 'SETTINGS'}
          </h1>
          <div className="text-white font-outfit space-y-6">
            {showAccountDetails ? (
              /* Account Details View */
              <>
                {user && userProfile && (
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
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          setUser(null);
                          setUserProfile(null);
                          setShowAccountDetails(false);
                          setShowSettings(false);
                        }}
                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors text-[14px]"
                      >
                        Sign Out
                      </button>
                      <button
                        onClick={async () => {
                          if (!user) return;
                          const confirmed = window.confirm(
                            "Are you sure you want to delete your account? This action cannot be undone."
                          );
                          if (confirmed) {
                            await supabase.from("notes").delete().eq("user_id", user.id);
                            await supabase.from("profiles").delete().eq("id", user.id);
                            await supabase.auth.signOut();
                            setUser(null);
                            setUserProfile(null);
                            setShowAccountDetails(false);
                            setShowSettings(false);
                          }
                        }}
                        className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-[10px] transition-colors text-[14px]"
                      >
                        Delete Account
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Settings View */
              <>
                {user && userProfile ? (
                  <button
                    onClick={() => setShowAccountDetails(true)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white rounded-[10px] px-4 py-3 flex items-center justify-between transition-colors text-[16px]"
                  >
                    <span>Account Details</span>
                    <img src={settingsArrow} alt="" className="w-[20px] h-auto" />
                  </button>
                ) : showSignUp ? (
                  <form onSubmit={isSignInMode ? handleSignIn : handleSignUp} className="space-y-6">
                    <div className="space-y-4">
                      {!isSignInMode && (
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white/80 text-[14px]">Name</Label>
                          <Input
                            id="name"
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
                        <Label htmlFor="email" className="text-white/80 text-[14px]">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/80 text-[14px]">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          minLength={6}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                        />
                      </div>

                      {!isSignInMode && (
                        <div className="space-y-2">
                          <Label htmlFor="repeat-password" className="text-white/80 text-[14px]">Repeat Password</Label>
                          <Input
                            id="repeat-password"
                            type="password"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-white text-journal-header font-medium rounded-md hover:bg-white/90 transition-colors text-[14px] disabled:opacity-50"
                      >
                        {loading ? (isSignInMode ? "Signing in..." : "Creating...") : (isSignInMode ? "Sign In" : "Create Account")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignUp(false);
                          setIsSignInMode(false);
                        }}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-[14px]"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsSignInMode(!isSignInMode)}
                        className="text-white/60 hover:text-white/80 text-[14px] transition-colors"
                      >
                        {isSignInMode ? "Don't have an account? Create one here" : "Already have an account? Sign in here"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <p className="text-white/80 text-[16px] leading-relaxed">
                      Create an account to save your notes to the cloud<br />
                      and access them from any device.
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setShowSignUp(true);
                          setIsSignInMode(true);
                        }}
                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-[14px]"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setShowSignUp(true);
                          setIsSignInMode(false);
                        }}
                        className="flex-1 px-6 py-3 bg-white text-journal-header font-medium rounded-md hover:bg-white/90 transition-colors text-[14px]"
                      >
                        Set Up Account
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show timeline when notes exist
  return (
    <div className={`fixed inset-0 flex flex-col bg-journal-header overflow-hidden ${isReady ? 'opacity-100' : 'opacity-0'}`} style={{ transition: 'none' }}>
      {/* Fixed dark header */}
      <header className="flex-shrink-0 bg-journal-header pl-[30px] pt-[30px] pb-[30px] h-[150px] z-30">
        <div className="flex items-center justify-between mb-auto -mt-[15px]">
          <button 
            onClick={() => {
              if (showAccountDetails) {
                setShowAccountDetails(false);
              } else {
                setShowSettings(!showSettings);
              }
            }}
            className="p-0 m-0 border-0 bg-transparent hover:opacity-80 transition-opacity"
          >
            <img 
              src={showSettings || showAccountDetails ? backIcon : settingsIcon} 
              alt={showSettings || showAccountDetails ? "Back" : "Settings"} 
              className="w-[30px] h-[30px]" 
            />
          </button>
          <div className="flex-1" />
        </div>
        <div className="relative mt-[41px]">
          <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none pr-[26px]">
            {showAccountDetails ? 'ACCOUNT DETAILS' : showSettings ? 'SETTINGS' : headerMonthYear}
          </h1>
          {!showSettings && !showAccountDetails && (
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
      <div className={`absolute inset-x-0 top-[150px] bottom-0 bg-journal-header px-8 pt-8 transition-opacity duration-300 overflow-y-auto ${showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-white font-outfit space-y-6">
          {showAccountDetails ? (
            /* Account Details View */
            <>
              {user && userProfile && (
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
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setUser(null);
                        setUserProfile(null);
                        setShowAccountDetails(false);
                        setShowSettings(false);
                      }}
                      className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors text-[14px]"
                    >
                      Sign Out
                    </button>
                    <button
                      onClick={async () => {
                        if (!user) return;
                        const confirmed = window.confirm(
                          "Are you sure you want to delete your account? This action cannot be undone."
                        );
                        if (confirmed) {
                          await supabase.from("notes").delete().eq("user_id", user.id);
                          await supabase.from("profiles").delete().eq("id", user.id);
                          await supabase.auth.signOut();
                          setUser(null);
                          setUserProfile(null);
                          setShowAccountDetails(false);
                          setShowSettings(false);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-[10px] transition-colors text-[14px]"
                    >
                      Delete Account
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Settings View */
            <>
              {user && userProfile ? (
                <button
                  onClick={() => setShowAccountDetails(true)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white rounded-[10px] px-4 py-3 flex items-center justify-between transition-colors text-[16px]"
                >
                  <span>Account Details</span>
                  <img src={settingsArrow} alt="" className="w-[20px] h-auto" />
                </button>
              ) : showSignUp ? (
                <form onSubmit={isSignInMode ? handleSignIn : handleSignUp} className="space-y-6">
                  <div className="space-y-4">
                    {!isSignInMode && (
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white/80 text-[14px]">Name</Label>
                        <Input
                          id="name"
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
                      <Label htmlFor="email" className="text-white/80 text-[14px]">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/80 text-[14px]">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                      />
                    </div>

                    {!isSignInMode && (
                      <div className="space-y-2">
                        <Label htmlFor="repeat-password" className="text-white/80 text-[14px]">Repeat Password</Label>
                        <Input
                          id="repeat-password"
                          type="password"
                          value={repeatPassword}
                          onChange={(e) => setRepeatPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          minLength={6}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-[10px]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-white text-journal-header font-medium rounded-md hover:bg-white/90 transition-colors text-[14px] disabled:opacity-50"
                    >
                      {loading ? (isSignInMode ? "Signing in..." : "Creating...") : (isSignInMode ? "Sign In" : "Create Account")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignUp(false);
                        setIsSignInMode(false);
                      }}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-[14px]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignInMode(!isSignInMode)}
                      className="text-white/60 hover:text-white/80 text-[14px] transition-colors"
                    >
                      {isSignInMode ? "Don't have an account? Create one here" : "Already have an account? Sign in here"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <p className="text-white/80 text-[16px] leading-relaxed">
                    Create an account to save your notes to the cloud<br />
                    and access them from any device.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowSignUp(true);
                        setIsSignInMode(true);
                      }}
                      className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-[14px]"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setShowSignUp(true);
                        setIsSignInMode(false);
                      }}
                      className="flex-1 px-6 py-3 bg-white text-journal-header font-medium rounded-md hover:bg-white/90 transition-colors text-[14px]"
                    >
                      Set Up Account
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div 
        className={`flex-1 overflow-y-scroll bg-journal-content rounded-t-[30px] overscroll-y-auto z-40 ${isReady ? 'transition-transform duration-300 ease-in-out' : ''} ${showSettings ? 'translate-y-[100%]' : '-mt-[25px]'}`}
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
                            src={noteArrow} 
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
    </div>
  );
};

export default Index;
