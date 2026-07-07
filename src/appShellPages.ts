import { localizedMoneyPagePaths, localizedMoneyPageRedirects } from "./localizedSeoPages";

export interface AppShellPage {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
}

const RAW_APP_SHELL_PAGES: AppShellPage[] = [
  {
    path: "/login",
    title: "Sign In | ThinkBetAI",
    description: "Sign in to ThinkBetAI to access your sports betting analysis workspace.",
    h1: "Sign in to ThinkBetAI",
    intro: "Loading the secure sign-in experience.",
  },
  {
    path: "/account",
    title: "Account | ThinkBetAI",
    description: "Manage your ThinkBetAI account, subscription and sports analysis settings.",
    h1: "Your ThinkBetAI Account",
    intro: "Loading your account dashboard.",
  },
  {
    path: "/games",
    title: "Live Games | ThinkBetAI",
    description: "Review live game analysis, AI probabilities and sports betting context inside ThinkBetAI.",
    h1: "Live Game Analysis",
    intro: "Loading current games and AI matchup analysis.",
  },
  {
    path: "/picks",
    title: "Picks | ThinkBetAI",
    description: "Access personalized AI sports picks and analysis inside ThinkBetAI.",
    h1: "Your AI Sports Picks",
    intro: "Loading your picks workspace.",
  },
  {
    path: "/player-props",
    title: "Player Props | ThinkBetAI",
    description: "Analyze player props with AI-assisted probability context inside ThinkBetAI.",
    h1: "AI Player Prop Analysis",
    intro: "Loading player prop analysis.",
  },
  {
    path: "/parlays",
    title: "Parlays | ThinkBetAI",
    description: "Build and review AI-assisted parlays inside ThinkBetAI.",
    h1: "AI Parlay Workspace",
    intro: "Loading parlay tools.",
  },
  {
    path: "/chat",
    title: "AI Chat | ThinkBetAI",
    description: "Chat with ThinkBetAI for sports betting research and analysis.",
    h1: "ThinkBetAI Chat",
    intro: "Loading the AI chat workspace.",
  },
  {
    path: "/subscription",
    title: "Subscription | ThinkBetAI",
    description: "Manage your ThinkBetAI subscription and billing access.",
    h1: "Subscription Settings",
    intro: "Loading subscription details.",
  },
  {
    path: "/admin",
    title: "Admin | ThinkBetAI",
    description: "ThinkBetAI admin workspace.",
    h1: "Admin Workspace",
    intro: "Loading admin tools.",
  },
  {
    path: "/settings",
    title: "Settings | ThinkBetAI",
    description: "Manage ThinkBetAI profile and notification settings.",
    h1: "Settings",
    intro: "Loading settings.",
  },
  {
    path: "/bet-history",
    title: "Bet History | ThinkBetAI",
    description: "Review settled picks and bet history inside ThinkBetAI.",
    h1: "Bet History",
    intro: "Loading historical results.",
  },
  {
    path: "/game-totals",
    title: "Game Totals | ThinkBetAI",
    description: "Analyze over-under and game total markets inside ThinkBetAI.",
    h1: "Game Totals Analysis",
    intro: "Loading totals analysis.",
  },
  {
    path: "/reset-password",
    title: "Reset Password | ThinkBetAI",
    description: "Reset your ThinkBetAI account password.",
    h1: "Reset Your Password",
    intro: "Loading secure password reset.",
  },
  {
    path: "/payment-success",
    title: "Payment Success | ThinkBetAI",
    description: "Confirm your ThinkBetAI payment and subscription access.",
    h1: "Payment Confirmed",
    intro: "Loading your subscription confirmation.",
  },
  {
    path: "/ref",
    title: "Referral | ThinkBetAI",
    description: "Open a ThinkBetAI referral link and continue to account creation.",
    h1: "ThinkBetAI Referral",
    intro: "Loading referral details.",
  },
  {
    path: "/best",
    title: "Best Bets Hub | ThinkBetAI",
    description: "Open ThinkBetAI noindex best-bets hub pages and daily sports analysis views.",
    h1: "Best Bets Hub",
    intro: "Loading the daily best-bets hub.",
  },
  {
    path: "/leagues",
    title: "League Analysis | ThinkBetAI",
    description: "Open ThinkBetAI noindex league analysis pages for supported sports.",
    h1: "League Analysis",
    intro: "Loading league analysis.",
  },
  {
    path: "/pl/pricing",
    title: "Cennik | ThinkBetAI",
    description: "Open the Polish ThinkBetAI pricing page.",
    h1: "Cennik ThinkBetAI",
    intro: "Loading localized pricing.",
  },
  {
    path: "/pl/faq",
    title: "FAQ | ThinkBetAI Polska",
    description: "Open the Polish ThinkBetAI FAQ page.",
    h1: "FAQ ThinkBetAI",
    intro: "Loading localized FAQ.",
  },
  {
    path: "/pl/best-ai-betting-app",
    title: "Najlepsza Aplikacja AI Betting | ThinkBetAI",
    description: "Open the Polish localized best AI betting app page.",
    h1: "Najlepsza Aplikacja AI Betting",
    intro: "Loading localized AI betting app content.",
  },
  {
    path: "/pl/free-ai-predictions",
    title: "Darmowe Predykcje AI | ThinkBetAI",
    description: "Open the Polish localized free AI predictions page.",
    h1: "Darmowe Predykcje AI",
    intro: "Loading localized prediction content.",
  },
  {
    path: "/pl/ai-nfl-picks",
    title: "AI NFL Picks | ThinkBetAI Polska",
    description: "Open the Polish localized AI NFL picks page.",
    h1: "AI NFL Picks",
    intro: "Loading localized NFL picks content.",
  },
  {
    path: "/pl/ai-parlay-builder",
    title: "AI Parlay Builder | ThinkBetAI Polska",
    description: "Open the Polish localized AI parlay builder page.",
    h1: "AI Parlay Builder",
    intro: "Loading localized parlay content.",
  },
  {
    path: "/fr/pricing",
    title: "Tarifs | ThinkBetAI",
    description: "Open the French ThinkBetAI pricing page.",
    h1: "Tarifs ThinkBetAI",
    intro: "Loading localized pricing.",
  },
  {
    path: "/fr/faq",
    title: "FAQ | ThinkBetAI France",
    description: "Open the French ThinkBetAI FAQ page.",
    h1: "FAQ ThinkBetAI",
    intro: "Loading localized FAQ.",
  },
  {
    path: "/fr/best-ai-betting-app",
    title: "Meilleure App AI Betting | ThinkBetAI",
    description: "Open the French localized best AI betting app page.",
    h1: "Meilleure App AI Betting",
    intro: "Loading localized AI betting app content.",
  },
  {
    path: "/fr/free-ai-predictions",
    title: "Predictions AI Gratuites | ThinkBetAI",
    description: "Open the French localized free AI predictions page.",
    h1: "Predictions AI Gratuites",
    intro: "Loading localized prediction content.",
  },
  {
    path: "/fr/ai-nfl-picks",
    title: "AI NFL Picks | ThinkBetAI France",
    description: "Open the French localized AI NFL picks page.",
    h1: "AI NFL Picks",
    intro: "Loading localized NFL picks content.",
  },
  {
    path: "/fr/ai-parlay-builder",
    title: "AI Parlay Builder | ThinkBetAI France",
    description: "Open the French localized AI parlay builder page.",
    h1: "AI Parlay Builder",
    intro: "Loading localized parlay content.",
  },
  {
    path: "/de/pricing",
    title: "Preise | ThinkBetAI",
    description: "Open the German ThinkBetAI pricing page.",
    h1: "Preise ThinkBetAI",
    intro: "Loading localized pricing.",
  },
  {
    path: "/de/faq",
    title: "FAQ | ThinkBetAI Deutschland",
    description: "Open the German ThinkBetAI FAQ page.",
    h1: "FAQ ThinkBetAI",
    intro: "Loading localized FAQ.",
  },
  {
    path: "/de/best-ai-betting-app",
    title: "Beste AI Betting App | ThinkBetAI",
    description: "Open the German localized best AI betting app page.",
    h1: "Beste AI Betting App",
    intro: "Loading localized AI betting app content.",
  },
  {
    path: "/de/free-ai-predictions",
    title: "Kostenlose AI Prognosen | ThinkBetAI",
    description: "Open the German localized free AI predictions page.",
    h1: "Kostenlose AI Prognosen",
    intro: "Loading localized prediction content.",
  },
  {
    path: "/de/ai-nfl-picks",
    title: "AI NFL Picks | ThinkBetAI Deutschland",
    description: "Open the German localized AI NFL picks page.",
    h1: "AI NFL Picks",
    intro: "Loading localized NFL picks content.",
  },
  {
    path: "/de/ai-parlay-builder",
    title: "AI Parlay Builder | ThinkBetAI Deutschland",
    description: "Open the German localized AI parlay builder page.",
    h1: "AI Parlay Builder",
    intro: "Loading localized parlay content.",
  },
];

const localizedMoneyPageLegacyPaths = new Set(localizedMoneyPageRedirects.map((redirect) => redirect.source));

export const APP_SHELL_PAGES = RAW_APP_SHELL_PAGES.filter(
  (page) => !localizedMoneyPagePaths.has(page.path) && !localizedMoneyPageLegacyPaths.has(page.path),
);

export const APP_SHELL_REWRITES = [
  ...APP_SHELL_PAGES.map((page) => ({
    source: page.path,
    target: `${page.path}.html`,
  })),
  { source: "/games/*", target: "/games.html" },
  { source: "/ref/*", target: "/ref.html" },
  { source: "/best/*", target: "/best.html" },
  { source: "/leagues/*", target: "/leagues.html" },
];
