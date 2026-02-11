import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import Index from "./pages/Index";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Picks from "./pages/Picks";
import Parlays from "./pages/Parlays";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import WhatIsAISportsBetting from "./pages/WhatIsAISportsBetting";
import AISportsPicks from "./pages/AISportsPicks";
import BestAIBettingApp from "./pages/BestAIBettingApp";
import FreeAIPredictions from "./pages/FreeAIPredictions";
import AINFLPicks from "./pages/AINFLPicks";
import AIParlayBuilder from "./pages/AIParlayBuilder";
import FAQ from "./pages/FAQ";
import Login from "./pages/Login";

import ResetPassword from "./pages/ResetPassword";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import BetHistory from "./pages/BetHistory";

const queryClient = new QueryClient();

// Analytics wrapper component
const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useGoogleAnalytics();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
          <AnalyticsWrapper>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/what-is-ai-sports-betting" element={<WhatIsAISportsBetting />} />
              <Route path="/ai-sports-picks" element={<AISportsPicks />} />
              <Route path="/best-ai-betting-app" element={<BestAIBettingApp />} />
              <Route path="/free-ai-predictions" element={<FreeAIPredictions />} />
              <Route path="/ai-nfl-picks" element={<AINFLPicks />} />
              <Route path="/ai-parlay-builder" element={<AIParlayBuilder />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/bet-history" element={<BetHistory />} />
              
              {/* Protected routes - require auth + subscription */}
              <Route path="/games" element={<Games />} />
              <Route path="/games/:gameId" element={
                <ProtectedRoute requireSubscription>
                  <GameDetail />
                </ProtectedRoute>
              } />
              <Route path="/picks" element={<Picks />} />
              <Route path="/parlays" element={
                <ProtectedRoute requireSubscription>
                  <Parlays />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute requireSubscription>
                  <Chat />
                </ProtectedRoute>
              } />
              
              {/* Protected routes - require auth only */}
              <Route path="/account" element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalyticsWrapper>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
