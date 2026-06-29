export interface AppShellPage {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
}

export const APP_SHELL_PAGES: AppShellPage[] = [
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
];

export const APP_SHELL_REWRITES = [
  ...APP_SHELL_PAGES.map((page) => ({
    source: page.path,
    target: `${page.path}.html`,
  })),
  { source: "/games/*", target: "/games.html" },
  { source: "/ref/*", target: "/ref.html" },
];
