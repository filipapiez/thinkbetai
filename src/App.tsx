import { lazy, Suspense, useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

// Lazy-load non-critical UI components to reduce initial bundle
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));

// Eagerly load the landing page – it's always needed on first visit and
// lazy-loading it delays FCP / Speed Index because the browser must fetch
// an extra chunk before anything paints.
import Index from "./pages/Index";


// Lazy load all other pages
const Games = lazy(() => import("./pages/Games"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const Picks = lazy(() => import("./pages/Picks"));
const Parlays = lazy(() => import("./pages/Parlays"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Account = lazy(() => import("./pages/Account"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Admin = lazy(() => import("./pages/Admin"));
const Chat = lazy(() => import("./pages/Chat"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const WhatIsAISportsBetting = lazy(() => import("./pages/WhatIsAISportsBetting"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const AISportsPicks = lazy(() => import("./pages/AISportsPicks"));
const BestAIBettingApp = lazy(() => import("./pages/BestAIBettingApp"));
const FreeAIPredictions = lazy(() => import("./pages/FreeAIPredictions"));
const AINFLPicks = lazy(() => import("./pages/AINFLPicks"));
const AIParlayBuilder = lazy(() => import("./pages/AIParlayBuilder"));
const AISportsBetting = lazy(() => import("./pages/AISportsBetting"));
const AIBetAnalyzer = lazy(() => import("./pages/AIBetAnalyzer"));
const BestAISportsBettingTools = lazy(() => import("./pages/BestAISportsBettingTools"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const BetHistory = lazy(() => import("./pages/BetHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OverUnder = lazy(() => import("./pages/OverUnder"));
const PlayerProps = lazy(() => import("./pages/PlayerProps"));

// Localized pages
const LocalizedIndex = lazy(() => import("./pages/localized/LocalizedIndex"));
const LocalizedPricing = lazy(() => import("./pages/localized/LocalizedPricing"));
const LocalizedFAQ = lazy(() => import("./pages/localized/LocalizedFAQ"));
const LocalizedLanding = lazy(() => import("./pages/localized/LocalizedLanding"));

const queryClient = new QueryClient();

const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useGoogleAnalytics();
  return <>{children}</>;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
          <Toaster />
          <Sonner />
          <AnalyticsWrapper>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/what-is-ai-sports-betting" element={<WhatIsAISportsBetting />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/ai-sports-picks" element={<AISportsPicks />} />
                <Route path="/best-ai-betting-app" element={<BestAIBettingApp />} />
                <Route path="/free-ai-predictions" element={<FreeAIPredictions />} />
                <Route path="/ai-nfl-picks" element={<AINFLPicks />} />
                <Route path="/ai-parlay-builder" element={<AIParlayBuilder />} />
                <Route path="/ai-sports-betting" element={<AISportsBetting />} />
                <Route path="/ai-bet-analyzer" element={<AIBetAnalyzer />} />
                <Route path="/best-ai-sports-betting-tools" element={<BestAISportsBettingTools />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/bet-history" element={<BetHistory />} />
                
                {/* Polish locale */}
                <Route path="/pl" element={<LocalizedIndex locale="pl" />} />
                <Route path="/pl/pricing" element={<LocalizedPricing locale="pl" />} />
                <Route path="/pl/faq" element={<LocalizedFAQ locale="pl" />} />
                <Route path="/pl/best-ai-betting-app" element={<LocalizedLanding locale="pl" page="bestAIBettingApp" />} />
                <Route path="/pl/free-ai-predictions" element={<LocalizedLanding locale="pl" page="freeAIPredictions" />} />
                <Route path="/pl/ai-nfl-picks" element={<LocalizedLanding locale="pl" page="aiNFLPicks" />} />
                <Route path="/pl/ai-parlay-builder" element={<LocalizedLanding locale="pl" page="aiParlayBuilder" />} />

                {/* French locale */}
                <Route path="/fr" element={<LocalizedIndex locale="fr" />} />
                <Route path="/fr/pricing" element={<LocalizedPricing locale="fr" />} />
                <Route path="/fr/faq" element={<LocalizedFAQ locale="fr" />} />
                <Route path="/fr/best-ai-betting-app" element={<LocalizedLanding locale="fr" page="bestAIBettingApp" />} />
                <Route path="/fr/free-ai-predictions" element={<LocalizedLanding locale="fr" page="freeAIPredictions" />} />
                <Route path="/fr/ai-nfl-picks" element={<LocalizedLanding locale="fr" page="aiNFLPicks" />} />
                <Route path="/fr/ai-parlay-builder" element={<LocalizedLanding locale="fr" page="aiParlayBuilder" />} />

                {/* German locale */}
                <Route path="/de" element={<LocalizedIndex locale="de" />} />
                <Route path="/de/pricing" element={<LocalizedPricing locale="de" />} />
                <Route path="/de/faq" element={<LocalizedFAQ locale="de" />} />
                <Route path="/de/best-ai-betting-app" element={<LocalizedLanding locale="de" page="bestAIBettingApp" />} />
                <Route path="/de/free-ai-predictions" element={<LocalizedLanding locale="de" page="freeAIPredictions" />} />
                <Route path="/de/ai-nfl-picks" element={<LocalizedLanding locale="de" page="aiNFLPicks" />} />
                <Route path="/de/ai-parlay-builder" element={<LocalizedLanding locale="de" page="aiParlayBuilder" />} />

                {/* Protected routes - require auth + subscription */}
                <Route path="/games" element={<Games />} />
                <Route path="/games/:gameId" element={<GameDetail />} />
                <Route path="/picks" element={<Picks />} />
                <Route path="/player-props" element={<PlayerProps />} />
                <Route path="/parlays" element={<ProtectedRoute requireSubscription><Parlays /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute requireSubscription><Chat /></ProtectedRoute>} />

                {/* Protected routes - require auth only */}
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AnalyticsWrapper>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;