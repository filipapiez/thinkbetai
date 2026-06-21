export interface CoreSeoPage {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
  links: Array<{ label: string; href: string }>;
}

export const CORE_SEO_PAGES: CoreSeoPage[] = [
  {
    path: "/",
    title: "ThinkBetAI — AI Sports Betting Analytics & Predictions",
    description:
      "AI-powered sports betting analytics for picks, parlays and matchup research across NFL, NBA, MLB, NHL, UFC and soccer. Results are not guaranteed.",
    h1: "AI Sports Betting Analysis for Picks, Parlays and Matchups",
    intro:
      "ThinkBetAI organizes probability estimates, matchup data, market context and risk factors into sports analysis you can review before making your own decision.",
    sections: [
      {
        heading: "Explore AI betting tools",
        body: "Review free AI sports picks, analyze a specific wager, compare multiple parlay legs or learn how probability-based sports models work.",
      },
      {
        heading: "Use analysis responsibly",
        body: "Sports outcomes are uncertain. Model output is informational, past performance does not guarantee future results and no pick should be treated as a promise.",
      },
    ],
    links: [
      { label: "AI Sports Betting", href: "/ai-sports-betting" },
      { label: "Free AI Sports Picks", href: "/ai-sports-picks" },
      { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/ai-sports-betting",
    title: "AI Sports Betting: Free AI Picks & Analysis | ThinkBetAI",
    description:
      "Explore AI sports betting analysis, free AI picks, probability estimates and matchup context for NFL, NBA, MLB, NHL, UFC and soccer.",
    h1: "AI Sports Betting Analysis and Free AI Picks",
    intro:
      "ThinkBetAI uses statistical models to organize sports data, estimate probabilities and explain the factors behind each AI-assisted pick.",
    sections: [
      {
        heading: "What AI betting can analyze",
        body: "Models can compare recent form, injuries, schedule context, market prices and historical matchups. They cannot eliminate uncertainty or guarantee a result.",
      },
      {
        heading: "From probability to a decision",
        body: "Each analysis should be compared with the sportsbook's implied probability, current information and your own risk limits before any wager is considered.",
      },
    ],
    links: [
      { label: "Free AI Predictions", href: "/free-ai-predictions" },
      { label: "AI Sports Picks", href: "/ai-sports-picks" },
      { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
      { label: "Track Record & Methodology", href: "/track-record" },
    ],
  },
  {
    path: "/ai-sports-picks",
    title: "Free AI Sports Picks Today | ThinkBetAI",
    description:
      "Review free AI sports picks and probability-based predictions for today's NFL, NBA, MLB, NHL, UFC and soccer matchups, with risk context.",
    h1: "Free AI Sports Picks and Predictions Today",
    intro:
      "Browse AI-assisted sports picks with matchup context, confidence indicators and plain-language explanations. Availability depends on the current slate.",
    sections: [
      {
        heading: "How AI sports picks are formed",
        body: "The analysis compares available team, player and market information to estimate outcome probabilities and identify where the model differs from the posted price.",
      },
      {
        heading: "How to read a pick",
        body: "Confidence is not certainty. Review the recommendation, implied probability, model estimate, injury context and risk notes together.",
      },
    ],
    links: [
      { label: "View Today's Games", href: "/games" },
      { label: "Free AI Predictions", href: "/free-ai-predictions" },
      { label: "AI NFL Picks", href: "/ai-nfl-picks" },
      { label: "AI Sports Betting Guide", href: "/ai-sports-betting" },
    ],
  },
  {
    path: "/free-ai-predictions",
    title: "Free AI Sports Betting Predictions Today | ThinkBetAI",
    description:
      "See free AI sports betting predictions for today's games, including model probabilities, matchup context and risk notes. No outcome is guaranteed.",
    h1: "Free AI Sports Betting Predictions",
    intro:
      "ThinkBetAI provides a limited selection of free sports predictions generated with the same probability-based analysis used across the platform.",
    sections: [
      {
        heading: "What is included",
        body: "Available free analysis can include game probabilities, a recommended side, important matchup factors and a risk classification for selected events.",
      },
      {
        heading: "What free predictions cannot promise",
        body: "Sports contain randomness and incomplete information. Free or paid analysis should be treated as research, never as a guaranteed outcome.",
      },
    ],
    links: [
      { label: "View Free Picks", href: "/games" },
      { label: "AI Sports Picks", href: "/ai-sports-picks" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/ai-parlay-builder",
    title: "Free AI Parlay Builder & Parlay Generator | ThinkBetAI",
    description:
      "Use an AI parlay builder to compare leg probabilities, identify correlation and review risk before combining NFL, NBA, MLB or NHL picks.",
    h1: "Free AI Parlay Builder and Parlay Generator",
    intro:
      "The ThinkBetAI parlay builder helps compare multiple selections, estimate combined probability and flag correlation or concentration risk.",
    sections: [
      {
        heading: "Why correlation matters",
        body: "Parlay legs are not always independent. Shared game conditions, team outcomes and player usage can change the combined probability substantially.",
      },
      {
        heading: "Parlays remain high variance",
        body: "Adding legs generally reduces the chance of the complete ticket winning. Use the probability estimate and risk notes as analysis, not a promise.",
      },
    ],
    links: [
      { label: "Open Parlay Tools", href: "/parlays" },
      { label: "AI Sports Picks", href: "/ai-sports-picks" },
      { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/ai-bet-analyzer",
    title: "AI Bet Analyzer: Probability, Value & Risk | ThinkBetAI",
    description:
      "Analyze a sports bet with AI-assisted probability estimates, implied-odds comparison and risk context for moneylines, spreads, totals and props.",
    h1: "AI Bet Analyzer for Probability, Value and Risk",
    intro:
      "Enter a potential wager to compare the sportsbook's implied probability with model estimates and review the factors that can increase uncertainty.",
    sections: [
      {
        heading: "Probability and expected value",
        body: "The analyzer converts the market price into implied probability, compares it with model output and shows the size of the difference without guaranteeing that the bet will win.",
      },
      {
        heading: "Risk context",
        body: "Injuries, limited samples, volatile markets and late information can reduce confidence. Risk notes are presented alongside the estimate.",
      },
    ],
    links: [
      { label: "Start Analysis", href: "/login" },
      { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
      { label: "AI Sports Betting", href: "/ai-sports-betting" },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    path: "/best-ai-sports-betting-tools",
    title: "Best AI Sports Betting Tools: What to Compare (2026)",
    description:
      "Compare AI sports betting tools by data transparency, probability output, pricing, sport coverage, parlay analysis and responsible-use safeguards.",
    h1: "Best AI Sports Betting Tools: What to Compare in 2026",
    intro:
      "The best tool depends on the sport, market and analysis you need. This guide explains the criteria to inspect before choosing any AI betting platform.",
    sections: [
      {
        heading: "Prioritize transparency",
        body: "Look for clear probability output, methodology, sample definitions, timestamped results and direct explanations of what the model does not know.",
      },
      {
        heading: "Compare the complete product",
        body: "Sport coverage, pricing, data freshness, parlay support, account controls and responsible-use information matter alongside model performance.",
      },
    ],
    links: [
      { label: "Best AI Betting App", href: "/best-ai-betting-app" },
      { label: "Track Record & Methodology", href: "/track-record" },
      { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    path: "/best-ai-betting-app",
    title: "Best AI Betting App: Features to Compare in 2026",
    description:
      "Compare AI betting apps by probability analysis, sport coverage, free access, pricing, transparency and responsible-use features before choosing one.",
    h1: "Best AI Betting App: Features to Compare",
    intro:
      "A useful AI betting app should explain its estimates, show relevant context and make uncertainty visible rather than relying on unverifiable promises.",
    sections: [
      {
        heading: "Core comparison criteria",
        body: "Review supported sports, market types, data update frequency, explanations, parlay tools, pricing and whether historical results are defined clearly.",
      },
      {
        heading: "Avoid guaranteed-win language",
        body: "No legitimate sports model can guarantee profits or remove variance. Responsible products state limitations clearly and encourage user judgment.",
      },
    ],
    links: [
      { label: "AI Sports Betting Tools Guide", href: "/best-ai-sports-betting-tools" },
      { label: "Try Free Predictions", href: "/free-ai-predictions" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    path: "/ai-nfl-picks",
    title: "AI NFL Picks & Football Predictions | ThinkBetAI",
    description:
      "Review AI NFL picks with matchup data, probability estimates and risk context for moneylines, spreads, totals and player props.",
    h1: "AI NFL Picks and Football Predictions",
    intro:
      "ThinkBetAI combines schedule, team, player, injury and market context to create probability-based NFL analysis.",
    sections: [
      {
        heading: "NFL information changes quickly",
        body: "Inactive lists, weather, offensive-line changes and late market movement can materially affect an estimate, so analysis should be refreshed near kickoff.",
      },
      {
        heading: "Review the full market",
        body: "Moneylines, spreads, totals and player props behave differently. Compare each model estimate with the current price and available information.",
      },
    ],
    links: [
      { label: "NFL Predictions", href: "/nfl-ai-predictions" },
      { label: "AI Sports Picks", href: "/ai-sports-picks" },
      { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/track-record",
    title: "Track Record & Methodology | ThinkBetAI",
    description:
      "Review how ThinkBetAI defines qualified picks, grades results and communicates the limits of historical model performance.",
    h1: "ThinkBetAI Track Record and Methodology",
    intro:
      "Performance figures only make sense when the sample, date range, qualification rules and grading process are stated clearly.",
    sections: [
      {
        heading: "Qualified-pick criteria",
        body: "A qualified pick must meet the documented confidence, data availability and market-price requirements before the event begins.",
      },
      {
        heading: "Historical results have limits",
        body: "Past performance does not guarantee future outcomes. Sport, market, price and sample selection can all change the result a user experiences.",
      },
    ],
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "AI Sports Betting", href: "/ai-sports-betting" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
      { label: "View Games", href: "/games" },
    ],
  },
];

export const CORE_SEO_PATHS = CORE_SEO_PAGES.map((page) => page.path);
