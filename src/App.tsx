import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Index from "./pages/Index";
import Note from "./pages/Note";
import Onboarding from "./pages/Onboarding";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import { initializePurchases } from "@/lib/purchases";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Component that decides whether to show landing page or app (WEB ONLY)
const HomeRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowApp, setShouldShowApp] = useState(false);
  const [searchParams] = useSearchParams();
  const isNative = Capacitor.isNativePlatform();
  
  const showAuth = searchParams.get('login') === 'true' || searchParams.get('signup') === 'true';

  useEffect(() => {
    // On native platform, always show app immediately
    if (isNative) {
      setShouldShowApp(true);
      setIsLoading(false);
      return;
    }
    
    const checkAuth = async () => {
      // Check for local notes - with error handling for corrupted localStorage
      let hasNotes = false;
      try {
        const localNotes = localStorage.getItem('nuron-notes');
        hasNotes = localNotes ? JSON.parse(localNotes).length > 0 : false;
      } catch {
        // Invalid JSON in localStorage - clear corrupted data
        localStorage.removeItem('nuron-notes');
      }

      // Check for authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Determine whether to show app or landing page
      setShouldShowApp(!!session || hasNotes || showAuth);
      setIsLoading(false);
    };

    checkAuth();
  }, [showAuth, isNative]);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white/40 font-outfit">Loading...</div>
      </div>
    );
  }

  // Show app or landing page based on check result
  return shouldShowApp ? <Index /> : <LandingPage />;
};

const App = () => {
  useEffect(() => {
    initializePurchases();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/welcome" element={<LandingPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/note/:id?" element={<Note />} />
            <Route path="/:username/:blogSlug" element={<Blog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
