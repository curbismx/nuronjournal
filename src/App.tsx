import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Note from "./pages/Note";
import Onboarding from "./pages/Onboarding";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import { initializePurchases } from "@/lib/purchases";

const queryClient = new QueryClient();

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
            <Route path="/" element={<Index />} />
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
