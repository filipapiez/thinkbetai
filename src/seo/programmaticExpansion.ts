import { platformStats } from "../lib/platformStats";
import type {
  ConversionGoal,
  FAQItem,
  MarketKey,
  SchemaType,
  SearchIntent,
  SeoBlueprint,
  SeoSection,
  TrustMetric,
} from "./blueprints";

type ExpansionContext = {
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent;
  title: string;
  description: string;
  h1: string;
  heroSubheadline: string;
  pageNoun: string;
  audience: string;
  marketContext: string;
  proofAngle: string;
  riskAngle: string;
  uniqueAngle: string;
  tags: string[];
  cluster: string;
  conversionGoal: ConversionGoal;
  markets: MarketKey[];
  faqs: FAQItem[];
  platformName?: string;
};

type LanguageMarket = {
  code: string;
  name: string;
  market: string;
  phrase: string;
  primarySport: string;
};

type LocalizedTopic = {
  slug: string;
  title: string;
  h1: string;
  keyword: string;
  noun: string;
  cluster: string;
  tags: string[];
  markets: MarketKey[];
  conversionGoal: ConversionGoal;
  proofAngle: string;
  riskAngle: string;
};

type SocialPlatform = {
  name: string;
  slug: string;
  audience: string;
  caution: string;
};

type SocialAngle = {
  slug: string;
  title: string;
  h1: string;
  keyword: string;
  context: string;
  noun: string;
  tags: string[];
  markets: MarketKey[];
};

const lastReviewed = "2026-07-11";

const trustMetrics: TrustMetric[] = [
  { label: "Public ledger", value: "CSV" },
  { label: "CLV capture", value: "Tracked" },
  { label: "Qualified win rate", value: platformStats.qualifiedWinRateLabel },
  { label: "Responsible analysis", value: "No guarantees" },
];

const schema: SchemaType[] = ["WebPage", "SoftwareApplication", "FAQPage", "BreadcrumbList"];

const languageMarkets: LanguageMarket[] = [
  { code: "es", name: "Spanish", market: "Spain and Latin America", phrase: "apuestas deportivas con IA", primarySport: "soccer" },
  { code: "fr", name: "French", market: "France and francophone markets", phrase: "paris sportifs IA", primarySport: "soccer" },
  { code: "de", name: "German", market: "Germany, Austria and Switzerland", phrase: "KI Sportwetten", primarySport: "soccer" },
  { code: "it", name: "Italian", market: "Italy", phrase: "scommesse sportive IA", primarySport: "soccer" },
  { code: "pt-br", name: "Portuguese", market: "Brazil and Portugal", phrase: "apostas esportivas com IA", primarySport: "soccer" },
  { code: "nl", name: "Dutch", market: "Netherlands and Belgium", phrase: "AI sportweddenschappen", primarySport: "soccer" },
  { code: "pl", name: "Polish", market: "Poland", phrase: "typy sportowe AI", primarySport: "soccer" },
  { code: "sv", name: "Swedish", market: "Sweden", phrase: "AI sportspel", primarySport: "soccer" },
  { code: "tr", name: "Turkish", market: "Turkey", phrase: "AI spor bahis analizi", primarySport: "soccer" },
  { code: "ja", name: "Japanese", market: "Japan", phrase: "AI sports betting analysis", primarySport: "baseball" },
  { code: "ko", name: "Korean", market: "South Korea", phrase: "AI sports betting analysis", primarySport: "baseball" },
  { code: "zh-hans", name: "Chinese Simplified", market: "Chinese-speaking markets", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "zh-hant", name: "Chinese Traditional", market: "Traditional Chinese markets", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "ar", name: "Arabic", market: "Arabic-speaking markets", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "hi", name: "Hindi", market: "India", phrase: "AI sports analysis", primarySport: "cricket" },
  { code: "id", name: "Indonesian", market: "Indonesia", phrase: "analisis taruhan olahraga AI", primarySport: "soccer" },
  { code: "vi", name: "Vietnamese", market: "Vietnam", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "th", name: "Thai", market: "Thailand", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "ru", name: "Russian", market: "Russian-speaking markets", phrase: "AI sports betting analysis", primarySport: "hockey" },
  { code: "uk", name: "Ukrainian", market: "Ukraine", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "ro", name: "Romanian", market: "Romania", phrase: "analiza pariurilor sportive AI", primarySport: "soccer" },
  { code: "cs", name: "Czech", market: "Czechia", phrase: "AI sportovni sazky", primarySport: "hockey" },
  { code: "el", name: "Greek", market: "Greece", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "he", name: "Hebrew", market: "Israel", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "da", name: "Danish", market: "Denmark", phrase: "AI sportsbetting analyse", primarySport: "soccer" },
  { code: "fi", name: "Finnish", market: "Finland", phrase: "AI urheiluvedonlyonti", primarySport: "hockey" },
  { code: "no", name: "Norwegian", market: "Norway", phrase: "AI sportstipping", primarySport: "soccer" },
  { code: "hu", name: "Hungarian", market: "Hungary", phrase: "AI sportfogadas elemzes", primarySport: "soccer" },
  { code: "bg", name: "Bulgarian", market: "Bulgaria", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "hr", name: "Croatian", market: "Croatia", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "sk", name: "Slovak", market: "Slovakia", phrase: "AI sports betting analysis", primarySport: "hockey" },
  { code: "sl", name: "Slovenian", market: "Slovenia", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "lt", name: "Lithuanian", market: "Lithuania", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "lv", name: "Latvian", market: "Latvia", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "et", name: "Estonian", market: "Estonia", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "ms", name: "Malay", market: "Malaysia", phrase: "analisis sukan AI", primarySport: "soccer" },
  { code: "fil", name: "Filipino", market: "Philippines", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "sw", name: "Swahili", market: "East Africa", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "af", name: "Afrikaans", market: "South Africa", phrase: "AI sports betting analysis", primarySport: "rugby" },
  { code: "is", name: "Icelandic", market: "Iceland", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "ga", name: "Irish", market: "Ireland", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "cy", name: "Welsh", market: "Wales", phrase: "AI sports betting analysis", primarySport: "rugby" },
  { code: "ca", name: "Catalan", market: "Catalonia", phrase: "apostes esportives amb IA", primarySport: "soccer" },
  { code: "eu", name: "Basque", market: "Basque Country", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "gl", name: "Galician", market: "Galicia", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "sr", name: "Serbian", market: "Serbia", phrase: "AI sports betting analysis", primarySport: "basketball" },
  { code: "mk", name: "Macedonian", market: "North Macedonia", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "sq", name: "Albanian", market: "Albania and Kosovo", phrase: "AI sports betting analysis", primarySport: "soccer" },
  { code: "bn", name: "Bengali", market: "Bangladesh and Bengal", phrase: "AI sports analysis", primarySport: "cricket" },
  { code: "ur", name: "Urdu", market: "Pakistan and Urdu-speaking markets", phrase: "AI sports analysis", primarySport: "cricket" },
];

const localizedTopics: LocalizedTopic[] = [
  {
    slug: "ai-betting-app",
    title: "AI Betting App",
    h1: "AI Betting App",
    keyword: "AI betting app",
    noun: "AI betting app research",
    cluster: "localized-app",
    tags: ["app", "mobile", "software"],
    markets: ["moneyline", "spread", "total", "props"],
    conversionGoal: "signup",
    proofAngle: "public ledger and review capture",
    riskAngle: "app users need clear billing, self-serve cancellation and responsible-use copy",
  },
  {
    slug: "ai-sports-picks",
    title: "AI Sports Picks",
    h1: "AI Sports Picks",
    keyword: "AI sports picks",
    noun: "AI sports pick research",
    cluster: "localized-picks",
    tags: ["picks", "predictions", "sports"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "view_predictions",
    proofAngle: "settled pick rows and full CSV export",
    riskAngle: "picks should be treated as research, not guaranteed betting advice",
  },
  {
    slug: "ai-parlay-builder",
    title: "AI Parlay Builder",
    h1: "AI Parlay Builder",
    keyword: "AI parlay builder",
    noun: "AI parlay builder analysis",
    cluster: "localized-parlays",
    tags: ["parlay", "builder", "correlation"],
    markets: ["moneyline", "spread", "total", "props", "parlay"],
    conversionGoal: "analyze_bet",
    proofAngle: "leg-level confidence and correlation notes",
    riskAngle: "parlays carry compounding risk and should show combined probability",
  },
  {
    slug: "ai-bet-analyzer",
    title: "AI Bet Analyzer",
    h1: "AI Bet Analyzer",
    keyword: "AI bet analyzer",
    noun: "AI bet analyzer workflow",
    cluster: "localized-analyzer",
    tags: ["analyzer", "ev", "odds"],
    markets: ["moneyline", "spread", "total", "props"],
    conversionGoal: "analyze_bet",
    proofAngle: "break-even probability, fair odds and EV notes",
    riskAngle: "bet slips need price checks before any decision",
  },
  {
    slug: "free-ai-predictions",
    title: "Free AI Predictions",
    h1: "Free AI Predictions",
    keyword: "free AI predictions",
    noun: "free AI prediction previews",
    cluster: "localized-free",
    tags: ["free", "predictions", "preview"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "view_predictions",
    proofAngle: "public previews with limitations stated clearly",
    riskAngle: "free previews should avoid exaggerated profit claims",
  },
  {
    slug: "sports-betting-model",
    title: "Sports Betting Model",
    h1: "Sports Betting Model",
    keyword: "sports betting model",
    noun: "sports betting model education",
    cluster: "localized-models",
    tags: ["model", "probability", "education"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "analyze_bet",
    proofAngle: "model probability compared with market implied probability",
    riskAngle: "model outputs need data quality and sample-size warnings",
  },
  {
    slug: "closing-line-value-tracker",
    title: "Closing Line Value Tracker",
    h1: "Closing Line Value Tracker",
    keyword: "closing line value tracker",
    noun: "closing line value tracking",
    cluster: "localized-clv",
    tags: ["clv", "odds", "ledger"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "analyze_bet",
    proofAngle: "closing price capture before event settlement",
    riskAngle: "CLV is evidence of price quality, not a guarantee of profit",
  },
  {
    slug: "odds-comparison-tool",
    title: "Odds Comparison Tool",
    h1: "Odds Comparison Tool",
    keyword: "odds comparison tool",
    noun: "odds comparison workflow",
    cluster: "localized-odds",
    tags: ["odds", "comparison", "books"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "analyze_bet",
    proofAngle: "bookmaker-by-bookmaker prices and best-line fields",
    riskAngle: "prices move quickly and availability can vary by jurisdiction",
  },
  {
    slug: "player-prop-ai",
    title: "Player Prop AI",
    h1: "Player Prop AI",
    keyword: "player prop AI",
    noun: "player prop AI analysis",
    cluster: "localized-props",
    tags: ["props", "players", "usage"],
    markets: ["props", "total"],
    conversionGoal: "analyze_bet",
    proofAngle: "usage, minutes and matchup inputs",
    riskAngle: "late lineups and role changes can change player prop value",
  },
  {
    slug: "nfl-ai-picks",
    title: "NFL AI Picks",
    h1: "NFL AI Picks",
    keyword: "NFL AI picks",
    noun: "NFL AI pick research",
    cluster: "localized-nfl",
    tags: ["nfl", "football", "picks"],
    markets: ["moneyline", "spread", "total", "props"],
    conversionGoal: "view_predictions",
    proofAngle: "spread, total and injury-context reporting",
    riskAngle: "football markets can react sharply to injury news",
  },
  {
    slug: "nba-ai-predictions",
    title: "NBA AI Predictions",
    h1: "NBA AI Predictions",
    keyword: "NBA AI predictions",
    noun: "NBA AI prediction analysis",
    cluster: "localized-nba",
    tags: ["nba", "basketball", "predictions"],
    markets: ["moneyline", "spread", "total", "props"],
    conversionGoal: "view_predictions",
    proofAngle: "pace, usage and injury context",
    riskAngle: "NBA lines can change quickly after rest and lineup news",
  },
  {
    slug: "soccer-ai-predictions",
    title: "Soccer AI Predictions",
    h1: "Soccer AI Predictions",
    keyword: "soccer AI predictions",
    noun: "soccer AI prediction analysis",
    cluster: "localized-soccer",
    tags: ["soccer", "football", "predictions"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "view_predictions",
    proofAngle: "match-result, total and both-teams-score context",
    riskAngle: "draw probability and league context need to be visible",
  },
  {
    slug: "tennis-ai-predictions",
    title: "Tennis AI Predictions",
    h1: "Tennis AI Predictions",
    keyword: "tennis AI predictions",
    noun: "tennis AI prediction analysis",
    cluster: "localized-tennis",
    tags: ["tennis", "predictions", "matchups"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "view_predictions",
    proofAngle: "surface, form and matchup style context",
    riskAngle: "retirement rules and market terms can differ by book",
  },
  {
    slug: "betting-analytics-software",
    title: "Betting Analytics Software",
    h1: "Betting Analytics Software",
    keyword: "betting analytics software",
    noun: "betting analytics software comparison",
    cluster: "localized-software",
    tags: ["software", "analytics", "tools"],
    markets: ["moneyline", "spread", "total", "props"],
    conversionGoal: "pricing",
    proofAngle: "feature comparison, public ledger and transparent billing",
    riskAngle: "software should explain limitations before asking for payment",
  },
  {
    slug: "sports-betting-education",
    title: "Sports Betting Education",
    h1: "Sports Betting Education",
    keyword: "sports betting education",
    noun: "sports betting education",
    cluster: "localized-education",
    tags: ["education", "responsible", "guide"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "signup",
    proofAngle: "plain-English explanation of probability, EV and CLV",
    riskAngle: "education pages need strong responsible-use reminders",
  },
  {
    slug: "probability-calculator",
    title: "Bet Probability Calculator",
    h1: "Bet Probability Calculator",
    keyword: "bet probability calculator",
    noun: "bet probability calculator education",
    cluster: "localized-calculators",
    tags: ["calculator", "probability", "odds"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "analyze_bet",
    proofAngle: "break-even probability and fair-odds comparison",
    riskAngle: "probability math does not remove outcome variance",
  },
  {
    slug: "bankroll-risk-guide",
    title: "Bankroll Risk Guide",
    h1: "Bankroll Risk Guide",
    keyword: "bankroll risk guide",
    noun: "bankroll risk education",
    cluster: "localized-risk",
    tags: ["bankroll", "risk", "responsible"],
    markets: ["moneyline", "spread", "total"],
    conversionGoal: "signup",
    proofAngle: "risk labels beside every analysis flow",
    riskAngle: "users should set limits and avoid chasing losses",
  },
  {
    slug: "public-pick-ledger",
    title: "Public Pick Ledger",
    h1: "Public Pick Ledger",
    keyword: "public pick ledger",
    noun: "public pick ledger proof",
    cluster: "localized-ledger",
    tags: ["ledger", "proof", "track-record"],
    markets: ["moneyline", "spread", "total", "props"],
    conversionGoal: "view_predictions",
    proofAngle: "full CSV export, pick price, closing price and result rows",
    riskAngle: "performance records still need sample-size and grading context",
  },
  {
    slug: "ai-betting-tools",
    title: "AI Betting Tools",
    h1: "AI Betting Tools",
    keyword: "AI betting tools",
    noun: "AI betting tool comparison",
    cluster: "localized-tools",
    tags: ["tools", "comparison", "software"],
    markets: ["moneyline", "spread", "total", "props", "parlay"],
    conversionGoal: "pricing",
    proofAngle: "feature pages, comparisons, reviews and public methodology",
    riskAngle: "tool pages should avoid guaranteed-profit wording",
  },
];

const socialPlatforms: SocialPlatform[] = [
  {
    name: "LinkedIn",
    slug: "linkedin",
    audience: "professional sports analytics conversations",
    caution: "career and business audiences expect careful claims and visible methodology",
  },
  {
    name: "Reddit",
    slug: "reddit",
    audience: "community discussions about picks, models and bankroll discipline",
    caution: "community users challenge vague claims and ask for public proof",
  },
  {
    name: "Facebook",
    slug: "facebook",
    audience: "group discussions where bettors compare tools and public picks",
    caution: "group posts need plain-language risk notes and no guaranteed-profit claims",
  },
  {
    name: "Instagram",
    slug: "instagram",
    audience: "short-form sports betting education and visual pick breakdowns",
    caution: "visual content should not oversimplify risk or hide sample limitations",
  },
];

const socialAngles: SocialAngle[] = [
  { slug: "discussions", title: "AI Betting Discussions", h1: "AI Betting Discussions", keyword: "AI betting discussions", context: "discussion threads", noun: "AI betting discussion guide", tags: ["discussions", "community"], markets: ["moneyline", "spread", "total"] },
  { slug: "communities", title: "Sports Betting Communities", h1: "Sports Betting Communities", keyword: "sports betting communities", context: "community research", noun: "sports betting community guide", tags: ["community", "education"], markets: ["moneyline", "spread", "total"] },
  { slug: "picks-conversation", title: "AI Picks Conversation", h1: "AI Picks Conversation", keyword: "AI picks conversation", context: "pick-discussion posts", noun: "AI picks conversation guide", tags: ["picks", "conversation"], markets: ["moneyline", "spread", "total"] },
  { slug: "model-tracking", title: "Model Tracking Guide", h1: "Model Tracking Guide", keyword: "model tracking guide", context: "model performance posts", noun: "model tracking guide", tags: ["model", "tracking"], markets: ["moneyline", "spread", "total"] },
  { slug: "parlay-research", title: "Parlay Research Guide", h1: "Parlay Research Guide", keyword: "parlay research guide", context: "parlay research content", noun: "parlay research guide", tags: ["parlay", "research"], markets: ["moneyline", "spread", "total", "props", "parlay"] },
  { slug: "odds-comparison", title: "Odds Comparison Guide", h1: "Odds Comparison Guide", keyword: "odds comparison guide", context: "line-shopping conversations", noun: "odds comparison guide", tags: ["odds", "comparison"], markets: ["moneyline", "spread", "total"] },
  { slug: "betting-analytics", title: "Betting Analytics Guide", h1: "Betting Analytics Guide", keyword: "betting analytics guide", context: "sports analytics posts", noun: "betting analytics guide", tags: ["analytics", "software"], markets: ["moneyline", "spread", "total", "props"] },
  { slug: "public-ledger", title: "Public Ledger Guide", h1: "Public Ledger Guide", keyword: "public betting ledger", context: "track-record conversations", noun: "public ledger guide", tags: ["ledger", "proof"], markets: ["moneyline", "spread", "total"] },
  { slug: "closing-line-value", title: "Closing Line Value Guide", h1: "Closing Line Value Guide", keyword: "closing line value guide", context: "CLV education posts", noun: "closing line value guide", tags: ["clv", "odds"], markets: ["moneyline", "spread", "total"] },
  { slug: "player-props", title: "Player Props Guide", h1: "Player Props Guide", keyword: "AI player props guide", context: "player prop research", noun: "player props guide", tags: ["props", "players"], markets: ["props", "total"] },
  { slug: "nfl-picks", title: "NFL AI Picks Guide", h1: "NFL AI Picks Guide", keyword: "NFL AI picks guide", context: "football pick discussions", noun: "NFL AI picks guide", tags: ["nfl", "football"], markets: ["moneyline", "spread", "total", "props"] },
  { slug: "nba-predictions", title: "NBA AI Predictions Guide", h1: "NBA AI Predictions Guide", keyword: "NBA AI predictions guide", context: "basketball prediction posts", noun: "NBA AI predictions guide", tags: ["nba", "basketball"], markets: ["moneyline", "spread", "total", "props"] },
  { slug: "responsible-betting", title: "Responsible Betting Guide", h1: "Responsible Betting Guide", keyword: "responsible betting guide", context: "risk and bankroll conversations", noun: "responsible betting guide", tags: ["responsible", "risk"], markets: ["moneyline", "spread", "total"] },
];

const buildSections = (context: ExpansionContext): SeoSection[] => [
  {
    type: "predictions_widget",
    heading: `${context.h1} Preview`,
    subheading: `A public preview for ${context.audience}, showing model probability, fair odds, market price and risk notes before any paid workflow.`,
    limit: 6,
  },
  {
    type: "market_stats",
    heading: "Live Sports Betting Coverage",
    subheading: `Track ${context.marketContext} with moneylines, spreads, totals, props and parlay research when reliable data is available.`,
  },
  {
    type: "intro_explainer",
    eyebrow: "User need",
    heading: `Why this ${context.pageNoun} page exists`,
    body: [
      `${context.h1} is a specific research need, not a reason to show the same generic betting page. This page explains the audience, market, proof standard and risk notes that matter for ${context.primaryKeyword}.`,
      `ThinkBetAI connects ${context.pageNoun} to product surfaces users can inspect: public pick rows, odds comparison, fair-odds math, CLV tracking, bet analysis and responsible-use reminders.`,
      `The page is useful when it answers the query directly, gives enough context to evaluate risk and points users toward deeper proof instead of forcing them through vague marketing copy.`,
    ],
    bullets: [
      `Audience: ${context.audience}.`,
      `Proof angle: ${context.proofAngle}.`,
      `Risk angle: ${context.riskAngle}.`,
      `Context angle: ${context.uniqueAngle}.`,
    ],
  },
  {
    type: "product_report_preview",
    heading: "Inside the ThinkBetAI Report",
    subheading: `See how the report explains confidence, edge, expected value, best available odds and matchup risk for ${context.primaryKeyword}.`,
  },
  {
    type: "intro_explainer",
    eyebrow: "Methodology",
    heading: "How the analysis is different from a pick list",
    body: [
      "A pick list only tells users what side someone likes. A useful analytics page shows the price, the model number, the break-even probability and the uncertainty around the data.",
      `For ${context.pageNoun}, ThinkBetAI emphasizes explainable probability, line shopping, public ledger context and no-guarantee language so users understand the limits of the model.`,
    ],
    bullets: [
      "Compare sportsbook odds with model fair odds.",
      "Review injury, lineup, pace, usage and matchup notes.",
      "Check public ledger rows and closing-line fields when available.",
      "Treat AI output as research, not financial advice.",
    ],
  },
  {
    type: "how_ai_works",
    heading: "How ThinkBetAI Processes the Board",
    subheading: `The workflow turns odds movement, injuries, form and matchup data into a probability estimate for ${context.marketContext}.`,
  },
  {
    type: "recent_performance",
    heading: "Public Performance Context",
    subheading: "A useful public page should connect claims to settled rows, sample rules, timestamps and closing-line value rather than a headline win rate alone.",
  },
  {
    type: "bet_analyzer_preview",
    heading: "Analyze a Bet Before You Place It",
    subheading: `Use the bet analyzer to check fair odds, implied probability and risk context for ${context.primaryKeyword}.`,
    placeholder: "Example: team moneyline +145, $25 stake",
  },
  {
    type: "comparison_table",
    heading: "Manual Research vs AI-Assisted Analysis",
    subheading: `Compare manual handicapping with a repeatable AI workflow that is designed for ${context.audience}.`,
  },
  {
    type: "how_to_use",
    heading: `How to Use ${context.h1}`,
    subheading: "Start with the public preview, compare the price, read the reasoning, check the ledger and decide within your own limits.",
  },
  {
    type: "intro_explainer",
    eyebrow: "Quality control",
    heading: "Why this is not a guaranteed-win page",
    body: [
      `Sports outcomes remain uncertain even when ${context.primaryKeyword} looks strong. Variance, late news, market movement and user price availability can all change the result.`,
      `That is why this page uses responsible wording and links to deeper proof surfaces. The goal is to help users evaluate ${context.pageNoun}, not to claim the model can remove risk.`,
    ],
  },
  {
    type: "supported_sports",
    heading: "Supported Sports and Markets",
    subheading: "Move from this page into sport-specific AI predictions, player props, parlays, totals and line-shopping workflows.",
  },
  {
    type: "related_pages",
    heading: "Related AI Betting Tools",
    subheading: "Continue into the analyzer, parlay builder, track record, best tools comparison and responsible gambling pages.",
  },
  { type: "faq", heading: "Frequently Asked Questions" },
  {
    type: "final_cta",
    heading: `Ready to Review ${context.h1}?`,
    subheading: "Start with public analysis, then use the deeper product workflow only when you want more context.",
  },
];

const commonFaqs = (context: ExpansionContext): FAQItem[] => [
  {
    question: `Is ${context.primaryKeyword} a guaranteed betting system?`,
    answer:
      "No. ThinkBetAI provides educational sports analysis, probability estimates and research tools. It does not guarantee outcomes or profit.",
  },
  {
    question: `What makes this ${context.pageNoun} page useful?`,
    answer: `It explains the specific audience, market, proof angle and risk notes behind ${context.primaryKeyword}, then links into tools users can inspect.`,
  },
  {
    question: "How does ThinkBetAI show proof?",
    answer:
      "The product supports a public pick ledger, CSV export, pick price fields, closing-line value fields and verified review capture when the related data is available.",
  },
  {
    question: "Can I compare odds across sportsbooks?",
    answer:
      "ThinkBetAI's odds plumbing supports per-book bookmaker data and best-line fields where the connected odds provider returns that information.",
  },
  {
    question: "Should I use this page before betting?",
    answer:
      "Use it as research only. Check the current price, late injury news, local laws, bankroll limits and the full analysis before making any decision.",
  },
  {
    question: "Does this page replace responsible gambling guidance?",
    answer:
      "No. Responsible gambling guidance, local legal rules and personal limits are still necessary. Never risk money you cannot afford to lose.",
  },
];

const createBlueprint = (context: ExpansionContext): SeoBlueprint => ({
  slug: context.slug,
  canonical: `/${context.slug}`,
  primaryKeyword: context.primaryKeyword,
  secondaryKeywords: context.secondaryKeywords,
  intent: context.intent,
  title: context.title,
  description: context.description,
  h1: context.h1,
  heroHeadline: context.h1,
  heroSubheadline: context.heroSubheadline,
  heroTrust: trustMetrics,
  primaryCTA: { label: "Analyze a Bet", href: "/ai-bet-analyzer" },
  secondaryCTA: { label: "View Track Record", href: "/track-record" },
  intro: [
    `${context.h1} should answer a focused research job instead of repeating a broad betting homepage. This page explains ${context.primaryKeyword} for ${context.audience} and connects the topic to real ThinkBetAI workflows.`,
    `The useful version of ${context.pageNoun} combines market context, fair-odds math, public proof, risk notes and internal links. It should help users understand what the model can and cannot do before they open the product.`,
  ],
  sections: buildSections(context),
  dynamicData: {
    markets: context.markets,
    showTopPredictions: true,
    showRecentPerformance: true,
    showProps: context.markets.includes("props"),
  },
  faq: context.faqs,
  schema,
  tags: context.tags,
  cluster: context.cluster,
  priority: 2,
  conversionGoal: context.conversionGoal,
  estimatedWordCount: 1800,
  lastReviewed,
});

const createLocalizedContext = (language: LanguageMarket, topic: LocalizedTopic): ExpansionContext => ({
  slug: `${language.code}/ai-betting/${topic.slug}`,
  primaryKeyword: `${topic.keyword} ${language.name}`,
  secondaryKeywords: [
    `${language.name} ${topic.keyword}`,
    `${topic.keyword} ${language.market}`,
    `${language.phrase} ${topic.slug.replace(/-/g, " ")}`,
    `${language.primarySport} AI betting ${language.name}`,
  ],
  intent: topic.slug.includes("calculator") || topic.slug.includes("tracker") || topic.slug.includes("tool") ? "tool" : "commercial",
  title: `${topic.title} in ${language.name}`,
  description: `${language.name} guide to ${topic.title.toLowerCase()} for ${language.market}. Compare model probability, odds context, public ledger proof and risk notes.`,
  h1: `${topic.h1} for ${language.name} Bettors`,
  heroSubheadline: `A localized ${language.name} guide for ${language.phrase}, built around ${topic.noun}, ${language.primarySport} context, odds education and responsible analysis.`,
  pageNoun: topic.noun,
  audience: `${language.name} readers in ${language.market}`,
  marketContext: `${language.market}, especially ${language.primarySport} and major global sports`,
  proofAngle: topic.proofAngle,
  riskAngle: topic.riskAngle,
  uniqueAngle: `${language.name} language intent, ${language.primarySport} market context and ${topic.title.toLowerCase()}`,
  tags: ["ai", "betting", "localized", language.code, language.primarySport, ...topic.tags],
  cluster: topic.cluster,
  conversionGoal: topic.conversionGoal,
  markets: topic.markets,
  faqs: [
    ...commonFaqs({
      slug: "",
      primaryKeyword: `${topic.keyword} ${language.name}`,
      secondaryKeywords: [],
      intent: "commercial",
      title: "",
      description: "",
      h1: `${topic.h1} for ${language.name} Bettors`,
      heroSubheadline: "",
      pageNoun: topic.noun,
      audience: `${language.name} readers in ${language.market}`,
      marketContext: language.market,
      proofAngle: topic.proofAngle,
      riskAngle: topic.riskAngle,
      uniqueAngle: language.phrase,
      tags: [],
      cluster: topic.cluster,
      conversionGoal: topic.conversionGoal,
      markets: topic.markets,
      faqs: [],
    }),
    {
      question: `Why is there a ${language.name} page for ${topic.keyword}?`,
      answer: `Searchers in ${language.market} may use different language, sports examples and market expectations. This page localizes the intent around ${language.phrase} while linking back to the main ThinkBetAI tools.`,
    },
  ].slice(0, 7),
});

const socialContexts: ExpansionContext[] = socialPlatforms
  .flatMap((platform) =>
    socialAngles.map((angle) => ({
      slug: `ai-sports-betting-${platform.slug}-${angle.slug}`,
      primaryKeyword: `${platform.name} ${angle.keyword}`,
      secondaryKeywords: [
        `${angle.keyword} ${platform.name}`,
        `AI sports betting ${platform.name}`,
        `${platform.name} sports betting analytics`,
        `${platform.name} betting model discussions`,
      ],
      intent: "informational" as const,
      title: `${platform.name} ${angle.title}`,
      description: `Independent guide to using AI sports betting research in ${platform.name} ${angle.context}. Compare odds, risk, public ledger proof and ThinkBetAI tools.`,
      h1: `${platform.name} ${angle.h1}`,
      heroSubheadline: `A non-affiliated guide for ${platform.audience}, showing how to discuss AI betting tools, ledger proof, odds comparison and risk responsibly.`,
      pageNoun: angle.noun,
      audience: platform.audience,
      marketContext: `${platform.name} ${angle.context}`,
      proofAngle: "public pick ledger, CLV fields, odds comparison and verified review capture",
      riskAngle: platform.caution,
      uniqueAngle: `${platform.name} context for ${angle.keyword}`,
      tags: ["ai", "betting", "social", platform.slug, ...angle.tags],
      cluster: `social-${platform.slug}`,
      conversionGoal: "analyze_bet" as const,
      markets: angle.markets,
      platformName: platform.name,
      faqs: [
        {
          question: `Is ThinkBetAI affiliated with ${platform.name}?`,
          answer: `No. This is an independent educational page about discussing AI sports betting research on or around ${platform.name}. It is not sponsored by, endorsed by or affiliated with ${platform.name}.`,
        },
        ...commonFaqs({
          slug: "",
          primaryKeyword: `${platform.name} ${angle.keyword}`,
          secondaryKeywords: [],
          intent: "informational",
          title: "",
          description: "",
          h1: `${platform.name} ${angle.h1}`,
          heroSubheadline: "",
          pageNoun: angle.noun,
          audience: platform.audience,
          marketContext: platform.name,
          proofAngle: "public pick ledger",
          riskAngle: platform.caution,
          uniqueAngle: angle.context,
          tags: [],
          cluster: `social-${platform.slug}`,
          conversionGoal: "analyze_bet",
          markets: angle.markets,
          faqs: [],
        }),
      ].slice(0, 7),
    })),
  )
  .slice(0, 50);

const localizedContexts: ExpansionContext[] = languageMarkets.flatMap((language) =>
  localizedTopics.map((topic) => createLocalizedContext(language, topic)),
);

if (socialContexts.length !== 50) {
  throw new Error(`Expected 50 social-platform SEO contexts, got ${socialContexts.length}`);
}

if (localizedContexts.length !== 950) {
  throw new Error(`Expected 950 multilingual SEO contexts, got ${localizedContexts.length}`);
}

export const programmaticExpansionBlueprints: SeoBlueprint[] = [
  ...socialContexts,
  ...localizedContexts,
].map(createBlueprint);

if (programmaticExpansionBlueprints.length !== 1000) {
  throw new Error(`Expected 1000 programmatic expansion pages, got ${programmaticExpansionBlueprints.length}`);
}
