import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { SEO_ALIAS_REDIRECTS } from "@/seoAliases";
import { seoBlueprintRoutes } from "@/seo/blueprintRoutes.generated";
import { localizedMoneyPageList } from "@/localizedSeoPages";
import { NoIndexBoundary } from "@/components/NoIndexBoundary";

// Toast renderers are non-critical and load only after the first paint window.
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
const AuthBoundary = lazy(() => import("@/contexts/AuthBoundary"));
const QueryBoundary = lazy(() => import("@/contexts/QueryBoundary"));

// Lazy load route surfaces so SEO pages do not carry the homepage bundle.
const Index = lazy(() => import("./pages/Index"));
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
const FreeAIPredictions = lazy(() => import("./pages/FreeAIPredictions"));
const AINFLPicks = lazy(() => import("./pages/AINFLPicks"));
const AISportsBetting = lazy(() => import("./pages/AISportsBetting"));
const BestAISportsBettingTools = lazy(() => import("./pages/BestAISportsBettingTools"));
const AIBetAnalyzer = lazy(() => import("./pages/AIBetAnalyzer"));
const AIParlayBuilder = lazy(() => import("./pages/AIParlayBuilder"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const BetHistory = lazy(() => import("./pages/BetHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TrackRecord = lazy(() => import("./pages/TrackRecord"));
const ProofPage = lazy(() => import("./pages/ProofPage"));
const Edges = lazy(() => import("./pages/Edges"));
const ResponsibleGambling = lazy(() => import("./pages/ResponsibleGambling"));
const EditorialPolicy = lazy(() => import("./pages/EditorialPolicy"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Referral = lazy(() => import("./pages/Referral"));
const OverUnder = lazy(() => import("./pages/OverUnder"));
const PlayerProps = lazy(() => import("./pages/PlayerProps"));
const GameTotals = lazy(() => import("./pages/GameTotals"));
const SeoPageView = lazy(() => import("./pages/SeoPageView"));
const SeoLanding = lazy(() => import("./pages/SeoLanding"));
const SeoIndex = lazy(() => import("./pages/SeoIndex"));
const SeoBlueprintPage = lazy(() => import("./pages/SeoBlueprintPage"));
const CountryLanding = lazy(() => import("./pages/CountryLanding"));
const LanguageLanding = lazy(() => import("./pages/LanguageLanding"));
const LocalizedSeoLanding = lazy(() => import("./pages/LocalizedSeoLanding"));

// Localized pages
const LocalizedPricing = lazy(() => import("./pages/localized/LocalizedPricing"));
const LocalizedFAQ = lazy(() => import("./pages/localized/LocalizedFAQ"));
const LocalizedLanding = lazy(() => import("./pages/localized/LocalizedLanding"));

const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useGoogleAnalytics();
  return <>{children}</>;
};

const DeferredToasts = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setReady(true), { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
    </Suspense>
  );
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const promotedSeoFeatureRoutes = new Set(["/ai-bet-analyzer", "/ai-parlay-builder"]);

const App = () => (
      <BrowserRouter>
        <ThemeProvider>
          <DeferredToasts />
          <AnalyticsWrapper>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<QueryBoundary><AuthBoundary><Pricing /></AuthBoundary></QueryBoundary>} />
                <Route path="/about" element={<About />} />
                <Route path="/track-record" element={<QueryBoundary><TrackRecord /></QueryBoundary>} />
                <Route path="/proof" element={<ProofPage />} />
                <Route path="/responsible-gambling" element={<ResponsibleGambling />} />
                <Route path="/editorial-policy" element={<EditorialPolicy />} />
                <Route path="/privacy" element={<LegalPage page="privacy" />} />
                <Route path="/terms" element={<LegalPage page="terms" />} />
                <Route path="/contact" element={<LegalPage page="contact" />} />
                <Route path="/disclaimer" element={<LegalPage page="disclaimer" />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/what-is-ai-sports-betting" element={<WhatIsAISportsBetting />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/ai-bet-analyzer" element={<AIBetAnalyzer />} />
                <Route path="/ai-parlay-builder" element={<AIParlayBuilder />} />
                {seoBlueprintRoutes.filter((path) => !promotedSeoFeatureRoutes.has(path)).map((path) => (
                  <Route
                    key={path}
                    path={path}
                    element={<SeoBlueprintPage slug={path.replace(/^\/+/, "")} />}
                  />
                ))}
                <Route path="/free-ai-predictions" element={<FreeAIPredictions />} />
                <Route path="/ai-nfl-picks" element={<AINFLPicks />} />
                <Route path="/ai-sports-betting" element={<AISportsBetting />} />
                <Route path="/uk" element={<CountryLanding country="uk" />} />
                <Route path="/ca" element={<CountryLanding country="ca" />} />
                <Route path="/au" element={<CountryLanding country="au" />} />
                <Route path="/best-ai-sports-betting-tools" element={<BestAISportsBettingTools />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/login" element={<NoIndexBoundary><AuthBoundary><Login /></AuthBoundary></NoIndexBoundary>} />
                <Route path="/ref/:code" element={<NoIndexBoundary><Referral /></NoIndexBoundary>} />
                <Route path="/reset-password" element={<NoIndexBoundary><ResetPassword /></NoIndexBoundary>} />
                <Route path="/payment-success" element={<NoIndexBoundary><PaymentSuccess /></NoIndexBoundary>} />
                <Route path="/bet-history" element={<NoIndexBoundary><QueryBoundary><BetHistory /></QueryBoundary></NoIndexBoundary>} />
                <Route path="/game-totals" element={<NoIndexBoundary><QueryBoundary><GameTotals /></QueryBoundary></NoIndexBoundary>} />

                {/* Auto-generated SEO pages (live but noindex — see SeoPageView/SeoIndex).
                    Retired for SEO hygiene (Jul 2026): /predictions, /predictions/:slug,
                    /teams, /teams/:slug, /players/:slug, /props/:slug, /matchups/:slug.
                    These now consolidate into indexable public hubs below. */}
                <Route path="/best" element={<NoIndexBoundary><SeoIndex variant="best" /></NoIndexBoundary>} />
                <Route path="/best/:slug" element={<NoIndexBoundary><SeoPageView pageType="best" /></NoIndexBoundary>} />
                <Route path="/leagues/:slug" element={<NoIndexBoundary><SeoPageView pageType="league" /></NoIndexBoundary>} />

                {/* Permanent SEO landing pages (high-intent keyword clusters) */}
                <Route path="/nfl-ai-predictions" element={<SeoLanding slug="nfl-ai-predictions" />} />
                <Route path="/nba-ai-predictions" element={<SeoLanding slug="nba-ai-predictions" />} />
                <Route path="/mlb-ai-predictions" element={<SeoLanding slug="mlb-ai-predictions" />} />
                <Route path="/nhl-ai-predictions" element={<SeoLanding slug="nhl-ai-predictions" />} />
                <Route path="/ufc-ai-predictions" element={<SeoLanding slug="ufc-ai-predictions" />} />
                <Route path="/soccer-ai-predictions" element={<SeoLanding slug="soccer-ai-predictions" />} />
                <Route path="/ai-player-prop-predictions" element={<SeoLanding slug="ai-player-prop-predictions" />} />
                <Route path="/ai-underdog-picks" element={<SeoLanding slug="ai-underdog-picks" />} />
                <Route path="/ai-against-the-spread-picks" element={<SeoLanding slug="ai-against-the-spread-picks" />} />

                {/* Exact-match aliases consolidate into the established GSC winners. */}
                {Object.entries(SEO_ALIAS_REDIRECTS).map(([slug, destination]) => (
                  <Route
                    key={slug}
                    path={`/${slug}`}
                    element={<Navigate to={destination} replace />}
                  />
                ))}

                {/* Retired programmatic URLs consolidate into indexable public hubs.
                    Keep these away from noindex app routes so rendered crawls do not
                    classify old dynamic pages as noindex exclusions. */}
                <Route path="/predictions/*" element={<Navigate to="/ai-sports-picks" replace />} />
                <Route path="/teams/*" element={<Navigate to="/ai-sports-picks" replace />} />
                <Route path="/matchups/*" element={<Navigate to="/ai-sports-picks" replace />} />
                <Route path="/players/*" element={<Navigate to="/ai-player-props" replace />} />
                <Route path="/props/*" element={<Navigate to="/ai-player-props" replace />} />
                
                {/* Indexable language landing pages */}
                <Route path="/de" element={<LanguageLanding language="de" />} />
                <Route path="/fr" element={<LanguageLanding language="fr" />} />
                <Route path="/it" element={<LanguageLanding language="it" />} />
                <Route path="/es" element={<LanguageLanding language="es" />} />
                <Route path="/pt-br" element={<LanguageLanding language="pt-br" />} />
                <Route path="/hi" element={<LanguageLanding language="hi" />} />
                <Route path="/nl" element={<LanguageLanding language="nl" />} />
                <Route path="/pl" element={<LanguageLanding language="pl" />} />
                <Route path="/sv" element={<LanguageLanding language="sv" />} />
                <Route path="/tr" element={<LanguageLanding language="tr" />} />
                <Route path="/ja" element={<LanguageLanding language="ja" />} />
                {localizedMoneyPageList.map((page) => (
                  <Route
                    key={page.path}
                    path={page.path}
                    element={<LocalizedSeoLanding language={page.languageSlug} topic={page.topicSlug} />}
                  />
                ))}

                {/* Polish locale */}
                <Route path="/pl/pricing" element={<QueryBoundary><AuthBoundary><LocalizedPricing locale="pl" /></AuthBoundary></QueryBoundary>} />
                <Route path="/pl/faq" element={<LocalizedFAQ locale="pl" />} />
                <Route path="/pl/best-ai-betting-app" element={<LocalizedLanding locale="pl" page="bestAIBettingApp" />} />
                <Route path="/pl/free-ai-predictions" element={<LocalizedLanding locale="pl" page="freeAIPredictions" />} />
                <Route path="/pl/ai-nfl-picks" element={<LocalizedLanding locale="pl" page="aiNFLPicks" />} />
                <Route path="/pl/ai-parlay-builder" element={<LocalizedLanding locale="pl" page="aiParlayBuilder" />} />

                {/* French locale */}
                <Route path="/fr/pricing" element={<QueryBoundary><AuthBoundary><LocalizedPricing locale="fr" /></AuthBoundary></QueryBoundary>} />
                <Route path="/fr/faq" element={<LocalizedFAQ locale="fr" />} />
                <Route path="/fr/best-ai-betting-app" element={<LocalizedLanding locale="fr" page="bestAIBettingApp" />} />
                <Route path="/fr/free-ai-predictions" element={<LocalizedLanding locale="fr" page="freeAIPredictions" />} />
                <Route path="/fr/ai-nfl-picks" element={<LocalizedLanding locale="fr" page="aiNFLPicks" />} />
                <Route path="/fr/ai-parlay-builder" element={<LocalizedLanding locale="fr" page="aiParlayBuilder" />} />

                {/* German locale */}
                <Route path="/de/pricing" element={<QueryBoundary><AuthBoundary><LocalizedPricing locale="de" /></AuthBoundary></QueryBoundary>} />
                <Route path="/de/faq" element={<LocalizedFAQ locale="de" />} />
                <Route path="/de/best-ai-betting-app" element={<LocalizedLanding locale="de" page="bestAIBettingApp" />} />
                <Route path="/de/free-ai-predictions" element={<LocalizedLanding locale="de" page="freeAIPredictions" />} />
                <Route path="/de/ai-nfl-picks" element={<LocalizedLanding locale="de" page="aiNFLPicks" />} />
                <Route path="/de/ai-parlay-builder" element={<LocalizedLanding locale="de" page="aiParlayBuilder" />} />

                {/* App tool routes */}
                <Route path="/games" element={<NoIndexBoundary><AuthBoundary><Games /></AuthBoundary></NoIndexBoundary>} />
                <Route path="/games/:gameId" element={<NoIndexBoundary><GameDetail /></NoIndexBoundary>} />
                <Route path="/picks" element={<NoIndexBoundary><QueryBoundary><AuthBoundary><Picks /></AuthBoundary></QueryBoundary></NoIndexBoundary>} />
                <Route path="/player-props" element={<NoIndexBoundary><AuthBoundary><PlayerProps /></AuthBoundary></NoIndexBoundary>} />
                <Route path="/edges" element={<NoIndexBoundary><AuthBoundary><Edges /></AuthBoundary></NoIndexBoundary>} />
                <Route path="/parlays" element={<NoIndexBoundary><AuthBoundary><Parlays /></AuthBoundary></NoIndexBoundary>} />
                <Route path="/chat" element={<NoIndexBoundary><AuthBoundary><ProtectedRoute requireSubscription><Chat /></ProtectedRoute></AuthBoundary></NoIndexBoundary>} />

                {/* Protected routes - require auth only */}
                <Route path="/account" element={<NoIndexBoundary><AuthBoundary><ProtectedRoute><Account /></ProtectedRoute></AuthBoundary></NoIndexBoundary>} />
                <Route path="/subscription" element={<NoIndexBoundary><AuthBoundary><ProtectedRoute><Subscription /></ProtectedRoute></AuthBoundary></NoIndexBoundary>} />
                <Route path="/admin" element={<NoIndexBoundary><AuthBoundary><ProtectedRoute><Admin /></ProtectedRoute></AuthBoundary></NoIndexBoundary>} />
                <Route path="/settings" element={<NoIndexBoundary><AuthBoundary><ProtectedRoute><Settings /></ProtectedRoute></AuthBoundary></NoIndexBoundary>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AnalyticsWrapper>
        </ThemeProvider>
      </BrowserRouter>
);

export default App;
