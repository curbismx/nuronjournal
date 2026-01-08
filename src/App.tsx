import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import Index from "./pages/Index";
import Note from "./pages/Note";
import Onboarding from "./pages/Onboarding";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import { initializePurchases } from "@/lib/purchases";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Component that decides whether to show landing page or app
const HomeRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLocalNotes, setHasLocalNotes] = useState(false);
  const [searchParams] = useSearchParams();

  // Check if login or signup is requested via query params
  const showAuth = searchParams.get('login') === 'true' || searchParams.get('signup') === 'true';

  useEffect(() => {
    const checkAuth = async () => {
      // Check for local notes
      const localNotes = localStorage.getItem('nuron-notes');
      const hasNotes = localNotes && JSON.parse(localNotes).length > 0;
      setHasLocalNotes(hasNotes || false);

      // Check for authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show nothing while checking auth (prevents flash)
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white/40 font-outfit">Loading...</div>
      </div>
    );
  }

  // Show app if logged in OR has local notes OR auth is requested
  if (isAuthenticated || hasLocalNotes || showAuth) {
    return <Index />;
  }

  // Show landing page for new/logged-out users
  return <LandingPage />;
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
