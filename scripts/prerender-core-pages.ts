/**
 * Writes crawler-readable HTML snapshots for the core URLs already earning
 * Search Console impressions. The browser still loads the normal React app,
 * but the first HTML response includes a lightweight visible shell so mobile
 * users and crawlers do not wait on React before seeing meaningful content.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { CORE_SEO_PAGES, type CoreSeoPage } from "../src/seoCorePages";
import { countryPageList, languagePageList } from "../src/countryPages";
import {
  getLocalizedMoneyPageAlternates,
  localizedMoneyPageList,
  localizedMoneyPageRedirects,
} from "../src/localizedSeoPages";
import { seoBlueprints } from "../src/seo/blueprints";

const BASE = "https://thinkbetai.com";
const DIST = resolve("dist");
const indexPath = join(DIST, "index.html");
const promotedFeaturePaths = new Set(["/ai-bet-analyzer", "/ai-parlay-builder"]);
const blueprintPaths = new Set(
  seoBlueprints
    .map((blueprint) => blueprint.canonical)
    .filter((path) => !promotedFeaturePaths.has(path)),
);

if (!existsSync(indexPath)) {
  console.warn("[prerender-core] dist/index.html missing — skipping.");
  process.exit(0);
}

const baseHtml = readFileSync(indexPath, "utf8");
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type CoreLink = CoreSeoPage["links"][number];
type CoreFaq = { question: string; answer: string };
type CoreModule = {
  heading: string;
  body: string;
  bullets?: string[];
};
type CorePageUpgrade = {
  eyebrow: string;
  primaryKeyword: string;
  heroHeadline: string;
  heroSubheadline: string;
  primaryCTA: CoreLink;
  secondaryCTA: CoreLink;
  statCards: Array<{ label: string; value: string; detail: string }>;
  marketFocus: string[];
  modules: CoreModule[];
  faqs: CoreFaq[];
  relatedTools?: CoreLink[];
  relatedSports?: CoreLink[];
  relatedGuides?: CoreLink[];
  softwareSchema?: boolean;
};

const defaultRelatedTools: CoreLink[] = [
  { label: "AI Betting Predictions", href: "/ai-betting-predictions" },
  { label: "AI Sports Picks", href: "/ai-sports-picks" },
  { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
  { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
  { label: "AI Moneyline Picks", href: "/ai-moneyline-picks" },
  { label: "AI Player Props", href: "/ai-player-props" },
  { label: "Free AI Predictions", href: "/free-ai-predictions" },
  { label: "Plans and Pricing", href: "/pricing" },
];

const defaultRelatedSports: CoreLink[] = [
  { label: "NFL AI Predictions", href: "/nfl-ai-predictions" },
  { label: "NBA AI Predictions", href: "/nba-ai-predictions" },
  { label: "MLB AI Predictions", href: "/mlb-ai-predictions" },
  { label: "NHL AI Predictions", href: "/nhl-ai-predictions" },
  { label: "UFC AI Predictions", href: "/ufc-ai-predictions" },
  { label: "Soccer AI Predictions", href: "/soccer-ai-predictions" },
  { label: "WNBA AI Predictions", href: "/wnba-ai-predictions" },
  { label: "Tennis AI Predictions", href: "/tennis-ai-predictions" },
];

const defaultRelatedGuides: CoreLink[] = [
  { label: "What Is AI Sports Betting?", href: "/what-is-ai-sports-betting" },
  { label: "How ThinkBetAI Works", href: "/how-it-works" },
  { label: "Track Record and Methodology", href: "/track-record" },
  { label: "Best AI Sports Betting Tools", href: "/best-ai-sports-betting-tools" },
  { label: "AI Sports Betting FAQ", href: "/faq" },
  { label: "Responsible Gambling", href: "/responsible-gambling" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Contact Support", href: "/contact" },
];

const defaultStatCards = [
  {
    label: "Model Inputs",
    value: "Odds, injuries, form",
    detail: "Market context, team metrics, player availability and recent performance are reviewed together.",
  },
  {
    label: "Bet Types",
    value: "ML, spreads, totals",
    detail: "Moneylines, point spreads, over/unders, props and parlays each get risk-specific analysis.",
  },
  {
    label: "Decision Support",
    value: "Probability first",
    detail: "Every recommendation is framed as research with uncertainty, not a guaranteed outcome.",
  },
];

const commonFaqs: CoreFaq[] = [
  {
    question: "Does ThinkBetAI guarantee winning bets?",
    answer:
      "No. ThinkBetAI provides sports analysis, probability estimates and risk context. Sports outcomes are uncertain, and no model or betting tool can guarantee profit.",
  },
  {
    question: "Do I need an account to read this page?",
    answer:
      "No. The educational page, related links and public previews are available without logging in. Some deeper tools, saved analysis and full product workflows may require an account.",
  },
  {
    question: "How should I use AI sports betting analysis?",
    answer:
      "Use it as one research input. Compare model probability with the current sportsbook price, review injuries and late news, set limits and make your own decision.",
  },
  {
    question: "Which sports and markets can AI analysis cover?",
    answer:
      "ThinkBetAI focuses on major sports such as NFL, NBA, MLB, NHL, soccer, UFC, WNBA, tennis and more, with market coverage across moneylines, spreads, totals, props and parlays when data is available.",
  },
];

const countryPageUpgrades: Record<string, CorePageUpgrade> = Object.fromEntries(
  countryPageList.map((page): [string, CorePageUpgrade] => [
    page.path,
    {
      eyebrow: page.heroEyebrow,
      primaryKeyword: page.keywords.split(",")[0],
      heroHeadline: `${page.h1} with local sports context`,
      heroSubheadline: page.intro,
      primaryCTA: { label: "View AI Sports Picks", href: "/ai-sports-picks" },
      secondaryCTA: { label: "Read the AI Betting Guide", href: "/ai-sports-betting" },
      statCards: [
        {
          label: "Market",
          value: page.countryName,
          detail: `This page targets ${page.adjective} search intent instead of reusing the generic US homepage.`,
        },
        {
          label: "Sports Focus",
          value: page.primarySports.slice(0, 3).join(", "),
          detail: `Primary coverage cues include ${page.primarySports.join(", ")}.`,
        },
        {
          label: "Currency Context",
          value: page.currency,
          detail: "Pricing and product references can use local currency context where applicable.",
        },
      ],
      marketFocus: [
        `${page.adjective} AI betting analysis`,
        ...page.primarySports.slice(0, 6),
        "Probability estimates",
        "Responsible analysis",
      ],
      softwareSchema: true,
      modules: [
        ...page.toolModules,
        {
          heading: "Why this regional page is indexable",
          body:
            "This page has its own title, description, canonical URL, hreflang alternate links, local sports focus, market-specific FAQs and internal links. That makes it a regional English variant rather than a copied homepage.",
          bullets: [
            "The United States remains the main site at thinkbetai.com.",
            `${page.countryName} gets a dedicated country route at ${page.path}.`,
            "The page links back into the core product and responsible gambling cluster.",
          ],
        },
        {
          heading: "How to use ThinkBetAI in this market",
          body:
            "Start with public analysis, compare model probability with available odds, review current injury and matchup context, and make independent decisions only where sports betting is legal for you.",
        },
      ],
      faqs: page.faqs,
      relatedGuides: [
        { label: "US Main Site", href: "/" },
        ...countryPageList.map((candidate) => ({
          label:
            candidate.path === page.path
              ? `${candidate.countryName} AI Betting`
              : `AI Betting ${candidate.countryName}`,
          href: candidate.path,
        })),
        { label: "AI Sports Betting Guide", href: "/ai-sports-betting" },
        { label: "Responsible Gambling", href: "/responsible-gambling" },
      ],
      relatedTools: [
        { label: "AI Sports Picks", href: "/ai-sports-picks" },
        { label: "Free AI Predictions", href: "/free-ai-predictions" },
        { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
        { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
      ],
    },
  ]),
);

const languagePageUpgrades: Record<string, CorePageUpgrade> = Object.fromEntries(
  languagePageList.map((page): [string, CorePageUpgrade] => [
    page.path,
    {
      eyebrow: page.heroEyebrow,
      primaryKeyword: page.keywords.split(",")[0],
      heroHeadline: `${page.h1} with localized sports intent`,
      heroSubheadline: page.intro,
      primaryCTA: { label: page.labels.primaryCta, href: "/ai-sports-picks" },
      secondaryCTA: { label: page.labels.secondaryCta, href: "/ai-sports-betting" },
      statCards: [
        {
          label: "Language",
          value: page.languageName,
          detail: `This page targets ${page.languageName} search intent with localized copy, FAQs and sports context.`,
        },
        {
          label: "Market",
          value: page.marketName,
          detail: `Primary market signal: ${page.marketName}. Users still need to follow local rules.`,
        },
        {
          label: "Sports Focus",
          value: page.primarySports.slice(0, 3).join(", "),
          detail: `Coverage cues include ${page.primarySports.join(", ")}.`,
        },
      ],
      marketFocus: [
        `${page.languageName} AI sports analysis`,
        ...page.primarySports.slice(0, 6),
        "Odds context",
        "Responsible analysis",
      ],
      softwareSchema: true,
      modules: [
        ...page.toolModules,
        {
          heading: page.labels.templateHeading,
          body:
            "This page uses the same SEO golden template as the English market pages: localized title, description, H1, search-intent sections, FAQ schema, internal links, self-canonical URL and hreflang alternates.",
          bullets: [
            "The page is indexable and included in sitemap.xml.",
            "The copy is localized for search intent instead of being a direct English duplicate.",
            "The page links back into ThinkBetAI's core product and trust pages.",
          ],
        },
        {
          heading: "Responsible AI sports analysis",
          body:
            "ThinkBetAI provides informational analysis only. It is not a sportsbook, does not place wagers and does not guarantee outcomes. Users should verify local laws and treat model output as research.",
        },
      ],
      faqs: [...page.faqs, ...commonFaqs],
      relatedGuides: [
        { label: "US Main Site", href: "/" },
        ...countryPageList.map((candidate) => ({
          label: `AI Betting ${candidate.countryName}`,
          href: candidate.path,
        })),
        ...languagePageList.map((candidate) => ({
          label: candidate.languageName,
          href: candidate.path,
        })),
        { label: "AI Sports Betting Guide", href: "/ai-sports-betting" },
        { label: "Responsible Gambling", href: "/responsible-gambling" },
      ],
      relatedTools: [
        { label: "AI Sports Picks", href: "/ai-sports-picks" },
        { label: "Free AI Predictions", href: "/free-ai-predictions" },
        { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
        { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
      ],
    },
  ]),
);

const localizedMoneyPageUpgrades: Record<string, CorePageUpgrade> = Object.fromEntries(
  localizedMoneyPageList.map((page): [string, CorePageUpgrade] => [
    page.path,
    {
      eyebrow: `${page.languageName} · ${page.marketType}`,
      primaryKeyword: page.term,
      heroHeadline: page.h1,
      heroSubheadline: page.intro,
      primaryCTA: { label: page.labels.primaryCta, href: "/ai-sports-picks" },
      secondaryCTA: { label: page.labels.englishCanonical, href: page.englishPath },
      statCards: [
        {
          label: page.labels.languageHub,
          value: page.languageName,
          detail: page.intro,
        },
        {
          label: page.labels.marketSports,
          value: page.marketName,
          detail: page.modules[0]?.body ?? page.intro,
        },
        {
          label: page.labels.relatedBadge,
          value: page.marketType,
          detail: page.labels.relatedText,
        },
      ],
      marketFocus: [
        page.term,
        ...page.primarySports.slice(0, 6),
        page.labels.responsibleGambling,
      ],
      softwareSchema: true,
      modules: [
        ...page.modules,
        {
          heading: page.labels.relatedHeading,
          body: page.labels.relatedText,
          bullets: [
            `${page.term}: ${page.path}.`,
            `${page.labels.englishCanonical}: ${page.englishPath}.`,
            page.labels.responsibleGambling,
          ],
        },
        {
          heading: page.labels.responsibleBadge,
          body: page.labels.responsibleText,
        },
        {
          heading: page.labels.faqHeading,
          body: `${page.labels.relatedText} ${page.labels.responsibleText} ${page.intro}`,
        },
      ],
      faqs: page.faqs,
      relatedTools: page.links.slice(0, 10),
      relatedGuides: [
        { label: page.labels.languageHub, href: `/${page.languageSlug}` },
        { label: page.labels.englishCanonical, href: page.englishPath },
        { label: page.labels.responsibleGambling, href: "/responsible-gambling" },
        ...localizedMoneyPageList
          .filter((candidate) => candidate.languageSlug === page.languageSlug && candidate.path !== page.path)
          .slice(0, 8)
          .map((candidate) => ({ label: candidate.term, href: candidate.path })),
      ],
    },
  ]),
);

const corePageUpgrades: Record<string, CorePageUpgrade> = {
  "/": {
    eyebrow: "AI Sports Betting Platform",
    primaryKeyword: "AI sports betting analytics",
    heroHeadline: "AI sports betting analysis for picks, parlays and matchups",
    heroSubheadline:
      "Use probability-based sports analysis to review today's games, compare model estimates with market prices and understand the risk behind each pick.",
    primaryCTA: { label: "View Today's Games", href: "/games" },
    secondaryCTA: { label: "See How It Works", href: "/how-it-works" },
    statCards: defaultStatCards,
    marketFocus: ["Free AI picks", "Bet analysis", "Parlay builder", "Live odds", "Player props"],
    softwareSchema: true,
    modules: [
      {
        heading: "Start with useful analysis before login",
        body:
          "ThinkBetAI is built to give search visitors real value before asking them to create an account. Public pages explain how the models work, show related tools and point users toward current game analysis so the first click is informative instead of gated.",
        bullets: [
          "Review game-level probability context before deciding what to do next.",
          "Use evergreen guides to understand odds, value, props, parlays and risk.",
          "Move into account-only tools only when you want deeper saved analysis.",
        ],
      },
      {
        heading: "A hub for the full AI betting topic cluster",
        body:
          "The homepage connects the core product pages, sport-specific prediction pages, market pages and educational guides. That structure helps users move naturally from broad research into specific tools like AI picks, bet analysis, player props or parlay generation.",
      },
    ],
    faqs: commonFaqs,
  },
  ...countryPageUpgrades,
  ...languagePageUpgrades,
  ...localizedMoneyPageUpgrades,
  "/ai-sports-betting": {
    eyebrow: "Core Guide",
    primaryKeyword: "AI sports betting",
    heroHeadline: "AI sports betting analysis built around probability, odds and risk",
    heroSubheadline:
      "Learn how ThinkBetAI turns odds, injuries, matchup data, player trends and market movement into clear sports betting analysis for today's games.",
    primaryCTA: { label: "View Today's Predictions", href: "/games" },
    secondaryCTA: { label: "Analyze a Bet", href: "/ai-bet-analyzer" },
    statCards: defaultStatCards,
    marketFocus: ["AI betting predictions", "AI picks", "Bet analyzer", "Parlay builder", "Sportsbook AI"],
    softwareSchema: true,
    modules: [
      {
        heading: "Today's AI betting workflow",
        body:
          "A strong AI betting workflow starts with the current slate, not a generic pick list. ThinkBetAI reviews game availability, sportsbook prices, recent team form, player availability and market movement, then presents the analysis as probability, confidence and risk context.",
        bullets: [
          "Compare model probability with the sportsbook's implied probability.",
          "Check injury, lineup, weather and schedule context before kickoff.",
          "Use confidence and risk notes to separate research from certainty.",
        ],
      },
      {
        heading: "How ThinkBetAI generates sports betting analysis",
        body:
          "The system organizes inputs such as odds, injuries, line movement, historical results, recent performance, player props and sport-specific metrics. The output is a plain-language explanation that helps users understand why a side, total, prop or parlay leg may be worth reviewing.",
      },
      {
        heading: "Why this page links into the full topic cluster",
        body:
          "AI sports betting is a broad head term. A single page cannot satisfy every search intent, so this guide links into dedicated pages for free predictions, AI sports picks, parlay builders, bet analyzers, sport pages and market-specific picks.",
      },
    ],
    faqs: [
      {
        question: "What is AI sports betting?",
        answer:
          "AI sports betting uses statistical models and machine-learning methods to organize sports data, estimate probabilities and compare those estimates with sportsbook prices.",
      },
      {
        question: "Is AI sports betting better than traditional handicapping?",
        answer:
          "AI can process more variables quickly and consistently, but it does not remove uncertainty. The best use is to combine model output with current context and personal risk discipline.",
      },
      {
        question: "Can I see AI betting predictions without logging in?",
        answer:
          "Public pages and selected prediction previews are available without an account. Deeper analysis, saved bet slips and full product workflows may require login.",
      },
      ...commonFaqs,
    ],
  },
  "/free-ai-predictions": {
    eyebrow: "Free Picks",
    primaryKeyword: "free AI sports betting predictions",
    heroHeadline: "Free AI sports betting predictions for today's games",
    heroSubheadline:
      "Review free AI predictions with matchup context, model probability, confidence notes and responsible-use reminders before making your own decision.",
    primaryCTA: { label: "View Free Picks", href: "/games" },
    secondaryCTA: { label: "Compare Pricing", href: "/pricing" },
    statCards: defaultStatCards,
    marketFocus: ["Free predictions", "Today's games", "AI picks", "Moneylines", "Spreads"],
    softwareSchema: true,
    modules: [
      {
        heading: "What free AI predictions should include",
        body:
          "A useful free prediction should explain the matchup, the model estimate, the current betting price and the major risk factors. Thin free-pick pages often hide the method; ThinkBetAI keeps the framing clear so users can understand what is being suggested.",
        bullets: [
          "Model probability and implied odds comparison.",
          "Plain-language matchup factors and injury context.",
          "Clear reminder that free analysis is not a guaranteed outcome.",
        ],
      },
      {
        heading: "How free predictions connect to deeper tools",
        body:
          "Free predictions introduce the workflow. Users can move from a public pick into the AI bet analyzer, AI sports picks, parlay builder, sport-specific pages or pricing if they want broader access across more games and markets.",
      },
    ],
    faqs: [
      {
        question: "Are the free AI predictions random picks?",
        answer:
          "No. Free predictions should be generated from the same probability-focused workflow as the rest of the platform, with fewer available picks than paid or account-based tools.",
      },
      {
        question: "Do free predictions require a credit card?",
        answer:
          "The public page and selected previews do not require a credit card. Account-only product features may require signup, and paid plans are optional.",
      },
      ...commonFaqs,
    ],
  },
  "/best-ai-sports-betting-tools": {
    eyebrow: "Commercial Comparison",
    primaryKeyword: "best AI sports betting tools",
    heroHeadline: "Best AI sports betting tools to compare before choosing a platform",
    heroSubheadline:
      "Compare AI betting tools by workflow, pricing, supported sports, explainability, risk controls and how clearly each product defines its performance claims.",
    primaryCTA: { label: "Try ThinkBetAI", href: "/games" },
    secondaryCTA: { label: "See Pricing", href: "/pricing" },
    statCards: [
      {
        label: "Compare",
        value: "Workflow + proof",
        detail: "Judge tools by inputs, explanations, pricing, coverage and claim transparency.",
      },
      {
        label: "Avoid",
        value: "Guarantees",
        detail: "Legitimate tools explain uncertainty instead of promising risk-free wins.",
      },
      {
        label: "Choose",
        value: "Fit by use case",
        detail: "Picks, props, parlays, odds research and chat workflows solve different problems.",
      },
    ],
    marketFocus: ["AI betting tools", "AI betting app", "Bet analyzer", "AI picks", "Parlay software"],
    softwareSchema: true,
    modules: [
      {
        heading: "How to compare AI betting tools",
        body:
          "The strongest comparison pages separate product claims from verifiable features. Users should look for supported sports, market coverage, pricing, update frequency, model explanations, settled-result definitions and responsible-use language.",
        bullets: [
          "Does the product explain probability and risk, or only show picks?",
          "Are historical results defined by sample, grading rules and date range?",
          "Can the tool support the markets you actually bet: spreads, totals, props or parlays?",
        ],
      },
      {
        heading: "Why ThinkBetAI fits the broad toolkit category",
        body:
          "ThinkBetAI is positioned as a combined sports analysis toolkit rather than a single-purpose pick feed. The related pages below connect users to free predictions, AI sports picks, bet analysis, parlay tools and sport-specific landing pages.",
      },
    ],
    faqs: [
      {
        question: "What makes an AI betting tool trustworthy?",
        answer:
          "A trustworthy tool explains its methodology, avoids guaranteed-win claims, defines historical performance carefully and makes uncertainty visible.",
      },
      {
        question: "Should I choose a picks app or a research tool?",
        answer:
          "Choose based on workflow. A picks app is faster, while a research tool is better if you want to compare odds, analyze props, build parlays and understand why a model likes a side.",
      },
      ...commonFaqs,
    ],
  },
  "/ai-nfl-picks": {
    eyebrow: "NFL Picks",
    primaryKeyword: "AI NFL picks",
    heroHeadline: "AI NFL picks and football predictions with matchup context",
    heroSubheadline:
      "Review NFL moneylines, spreads, totals and player props with model probability, weather context, injury notes and line-movement awareness.",
    primaryCTA: { label: "View NFL Games", href: "/games?sport=americanfootball_nfl" },
    secondaryCTA: { label: "Open AI Sports Picks", href: "/ai-sports-picks" },
    statCards: defaultStatCards,
    marketFocus: ["NFL spreads", "NFL totals", "NFL moneylines", "NFL player props", "NFL parlays"],
    softwareSchema: true,
    relatedSports: [
      { label: "NFL AI Predictions", href: "/nfl-ai-predictions" },
      { label: "NCAAF AI Predictions", href: "/ncaaf-ai-predictions" },
      { label: "NBA AI Predictions", href: "/nba-ai-predictions" },
      { label: "UFC AI Predictions", href: "/ufc-ai-predictions" },
    ],
    modules: [
      {
        heading: "What NFL AI picks need to account for",
        body:
          "NFL markets move quickly because injury reports, weather, offensive-line availability and quarterback news can change the real probability of a bet. AI analysis should be refreshed near kickoff and reviewed against the latest price.",
        bullets: [
          "Quarterback, offensive-line and defensive injury impact.",
          "Weather, wind and field conditions for totals and passing props.",
          "Divisional familiarity, rest gaps, travel and late line movement.",
        ],
      },
      {
        heading: "NFL markets this page connects to",
        body:
          "NFL users often search for point spread picks, moneyline picks, totals, player props, anytime touchdown picks and parlays. This page points into the broader ThinkBetAI market cluster instead of trying to cover every football intent on one page.",
      },
    ],
    faqs: [
      {
        question: "When should NFL AI picks be refreshed?",
        answer:
          "NFL analysis should be checked after major injury updates, weather changes, inactive reports and meaningful line movement, especially close to kickoff.",
      },
      {
        question: "Does AI cover NFL player props?",
        answer:
          "Yes, when data is available, AI analysis can review props such as passing yards, rushing yards, receiving yards, receptions and touchdown markets.",
      },
      ...commonFaqs,
    ],
  },
  "/track-record": {
    eyebrow: "Methodology",
    primaryKeyword: "AI betting track record",
    heroHeadline: "Settled pick record, grading rules and methodology",
    heroSubheadline:
      "Understand how ThinkBetAI frames performance, what gets included in settled records and why past results do not guarantee future outcomes.",
    primaryCTA: { label: "See How It Works", href: "/how-it-works" },
    secondaryCTA: { label: "View Today's Games", href: "/games" },
    statCards: [
      {
        label: "Included",
        value: "Settled results",
        detail: "Only records with a settled win/loss outcome should count in a displayed record.",
      },
      {
        label: "Excluded",
        value: "Pending + pushes",
        detail: "Pending events, voids and pushes need separate treatment from wins and losses.",
      },
      {
        label: "Context",
        value: "Sample matters",
        detail: "Sport, market, date range and price selection can materially change interpretation.",
      },
    ],
    marketFocus: ["Win rate", "Grading rules", "ROI", "Units", "Settled picks"],
    modules: [
      {
        heading: "How to read any betting track record",
        body:
          "A useful performance page should define the sample, grading rules, date range and markets included. A headline win rate alone can be misleading if it excludes losses, ignores price, mixes markets or includes cherry-picked examples.",
        bullets: [
          "Look for settled wins and losses, not pending picks.",
          "Separate win rate from profitability, ROI and unit size.",
          "Understand which sports and markets are included in the sample.",
        ],
      },
      {
        heading: "Why transparency helps users",
        body:
          "Transparent methodology makes it easier for users to decide whether a tool fits their risk tolerance. ThinkBetAI pages should explain limitations clearly and avoid presenting historical outcomes as future guarantees.",
      },
      {
        heading: "What users should check before trusting any record",
        body:
          "A record page should make the uncomfortable details easy to find: whether odds were available at the time, whether the pick was posted before the event, whether pushes were removed, whether stale lines were excluded and whether the same rules apply to winning and losing picks. Those details matter more than a single headline percentage.",
      },
    ],
    faqs: [
      {
        question: "Does a high win rate guarantee future results?",
        answer:
          "No. Past performance is historical information only. Future results can change because prices, injuries, market conditions and variance change.",
      },
      {
        question: "What should be included in a fair track record?",
        answer:
          "A fair record should define settled wins and losses, pushes, voids, date range, markets, odds, unit sizing and whether results are backtested or live.",
      },
      ...commonFaqs.slice(0, 2),
    ],
  },
  "/what-is-ai-sports-betting": {
    eyebrow: "Educational Guide",
    primaryKeyword: "what is AI sports betting",
    heroHeadline: "What is AI sports betting and how does it work?",
    heroSubheadline:
      "A plain-English guide to sports betting models, probability estimates, implied odds, data inputs and the limits of machine-learning predictions.",
    primaryCTA: { label: "Read How It Works", href: "/how-it-works" },
    secondaryCTA: { label: "Explore AI Sports Betting", href: "/ai-sports-betting" },
    statCards: defaultStatCards,
    marketFocus: ["Machine learning", "Implied probability", "Expected value", "Sports data", "Risk"],
    modules: [
      {
        heading: "AI sports betting in plain English",
        body:
          "AI sports betting means using statistical models to estimate the probability of sports outcomes. The model does not know the future; it organizes available information so users can compare an estimated probability with the price offered by a sportsbook.",
        bullets: [
          "Sports data becomes model inputs.",
          "Model outputs become probability estimates.",
          "Users compare those estimates with market odds and risk limits.",
        ],
      },
      {
        heading: "Where AI helps and where it cannot",
        body:
          "AI helps with scale, consistency and pattern detection. It cannot fully capture late-breaking news, randomness, officiating decisions, coaching surprises or the emotional discipline required to bet responsibly.",
      },
    ],
    faqs: [
      {
        question: "Is AI sports betting the same as a guaranteed pick service?",
        answer:
          "No. AI sports betting should be treated as probability-based research, not a promise that a specific bet will win.",
      },
      {
        question: "What is implied probability?",
        answer:
          "Implied probability is the probability suggested by sportsbook odds after converting the price into a percentage. AI analysis compares model probability with that market-implied number.",
      },
      ...commonFaqs,
    ],
  },
  "/how-it-works": {
    eyebrow: "Product Methodology",
    primaryKeyword: "how ThinkBetAI works",
    heroHeadline: "How ThinkBetAI works from live data to betting analysis",
    heroSubheadline:
      "See how odds, injuries, player trends, historical performance and model estimates become readable sports betting analysis.",
    primaryCTA: { label: "Analyze Today's Games", href: "/games" },
    secondaryCTA: { label: "Open Bet Analyzer", href: "/ai-bet-analyzer" },
    statCards: defaultStatCards,
    marketFocus: ["Data inputs", "Model probability", "Odds comparison", "Risk notes", "Result tracking"],
    softwareSchema: true,
    modules: [
      {
        heading: "The ThinkBetAI analysis loop",
        body:
          "The platform starts with available game, player and market information, converts it into structured inputs, estimates outcome probabilities and explains the most important factors in plain language. Results should then be graded consistently after events settle.",
        bullets: [
          "Collect and normalize sports and market inputs.",
          "Estimate probabilities with sport-aware models.",
          "Explain the recommendation, risk level and major assumptions.",
          "Track settled outcomes using consistent grading rules.",
        ],
      },
      {
        heading: "Why explanations matter",
        body:
          "A probability number is more useful when users understand why it changed. Injuries, line movement, rest, player usage, weather and matchup style can all move an estimate, and those factors should be visible next to the pick.",
      },
    ],
    faqs: [
      {
        question: "What data does ThinkBetAI use?",
        answer:
          "The public pages describe inputs such as odds, injuries, recent form, schedule context, team and player statistics, market movement and sport-specific factors when available.",
      },
      {
        question: "Why do probabilities change?",
        answer:
          "Probabilities can change when prices move, injuries update, lineups change, weather shifts or new information changes the model's view of the matchup.",
      },
      ...commonFaqs,
    ],
  },
  "/pricing": {
    eyebrow: "Plans",
    primaryKeyword: "ThinkBetAI pricing",
    heroHeadline: "ThinkBetAI plans and pricing for AI sports analysis",
    heroSubheadline:
      "Compare free access, account-based tools and paid analysis features before choosing the workflow that fits your sports research.",
    primaryCTA: { label: "Compare Plans", href: "/pricing" },
    secondaryCTA: { label: "Try Free Predictions", href: "/free-ai-predictions" },
    statCards: defaultStatCards,
    marketFocus: ["Free picks", "Unlimited analysis", "Bet analyzer", "Parlay builder", "AI chat"],
    softwareSchema: true,
    modules: [
      {
        heading: "What pricing pages should clarify",
        body:
          "A strong pricing page should clearly distinguish free previews, account features, paid access, billing periods and product limitations. Paying for analysis should unlock workflow depth, not imply guaranteed profit.",
        bullets: [
          "Review which sports, markets and tools are included.",
          "Check billing cadence and cancellation terms before checkout.",
          "Use free content first if you are evaluating product fit.",
        ],
      },
      {
        heading: "How pricing connects to the product journey",
        body:
          "Users often arrive from AI picks, free predictions, comparison pages or tool pages. The pricing page should link back into those contexts so users can understand exactly what they are upgrading from.",
      },
      {
        heading: "Free versus paid access",
        body:
          "The cleanest pricing journey lets users learn first, preview public analysis second and upgrade only when the extra workflow is useful. Free pages should help users evaluate quality, while paid features should be positioned around convenience, volume, saved analysis and deeper tools rather than guaranteed results.",
      },
    ],
    faqs: [
      {
        question: "Does a paid plan guarantee better results?",
        answer:
          "No. A paid plan can provide more analysis access and deeper tools, but sports outcomes remain uncertain and results are not guaranteed.",
      },
      {
        question: "Can I start with free AI predictions?",
        answer:
          "Yes. Free public pages and selected previews are designed to help users evaluate the product before paying.",
      },
      ...commonFaqs.slice(0, 2),
    ],
  },
  "/about": {
    eyebrow: "Company",
    primaryKeyword: "ThinkBetAI methodology",
    heroHeadline: "About ThinkBetAI and probability-based sports analysis",
    heroSubheadline:
      "Learn the product principles behind ThinkBetAI: explainable analysis, transparent limitations and responsible sports betting research.",
    primaryCTA: { label: "See How It Works", href: "/how-it-works" },
    secondaryCTA: { label: "Review Methodology", href: "/track-record" },
    statCards: defaultStatCards,
    marketFocus: ["Transparency", "Methodology", "Responsible design", "AI analysis", "Sports data"],
    modules: [
      {
        heading: "Product principles",
        body:
          "ThinkBetAI is designed around explainability, useful context and honest uncertainty. Users should be able to see what a model is reviewing, why a recommendation appears and what limitations still apply.",
        bullets: [
          "Make probability and uncertainty visible.",
          "Avoid guaranteed-win framing.",
          "Connect product pages to responsible-use guidance.",
        ],
      },
      {
        heading: "Why trust pages still matter for SEO",
        body:
          "About, methodology, FAQ and responsible gambling pages support topical credibility. They help users and search engines understand the product, its limitations and the standards behind performance and comparison claims.",
      },
      {
        heading: "How ThinkBetAI should earn trust",
        body:
          "Trust is built by showing the work: explaining model inputs, linking to methodology, making risk language visible, keeping comparison pages current and avoiding exaggerated claims. That foundation matters especially in sports betting, where users need clarity before they evaluate a tool or create an account.",
      },
    ],
    faqs: commonFaqs,
  },
  "/faq": {
    eyebrow: "FAQ",
    primaryKeyword: "AI sports betting FAQ",
    heroHeadline: "AI sports betting FAQ for ThinkBetAI users",
    heroSubheadline:
      "Answers about AI picks, probability estimates, data inputs, pricing, account access, parlays, props and responsible use.",
    primaryCTA: { label: "Explore AI Betting", href: "/ai-sports-betting" },
    secondaryCTA: { label: "Try Free Predictions", href: "/free-ai-predictions" },
    statCards: defaultStatCards,
    marketFocus: ["AI picks", "Pricing", "Probability", "Parlays", "Responsible use"],
    modules: [
      {
        heading: "How to use this FAQ",
        body:
          "The FAQ works as a bridge between broad educational searches and product-specific pages. Users can quickly understand the basics, then move into deeper guides, tools, pricing or responsible-use resources.",
      },
      {
        heading: "Most common AI betting questions",
        body:
          "Most users want to know whether AI can guarantee outcomes, what data it uses, how predictions change, whether free picks exist and how to think about risk. Those questions should be answered directly and linked to more detailed pages.",
      },
    ],
    faqs: [
      {
        question: "What is the fastest way to try ThinkBetAI?",
        answer:
          "Start with the free prediction and game pages, then use account-based tools if you want saved analysis, bet slip review or broader market coverage.",
      },
      {
        question: "Why are there many AI betting pages?",
        answer:
          "Each page targets a distinct search intent: broad AI betting education, free predictions, sport pages, market pages, tools, comparisons and responsible-use guidance.",
      },
      ...commonFaqs,
    ],
  },
  "/responsible-gambling": {
    eyebrow: "Responsible Use",
    primaryKeyword: "responsible gambling resources",
    heroHeadline: "Responsible gambling guidance for sports bettors",
    heroSubheadline:
      "Set limits, understand warning signs and use AI sports analysis as information rather than a reason to take financial risks you cannot afford.",
    primaryCTA: { label: "Read FAQ", href: "/faq" },
    secondaryCTA: { label: "How ThinkBetAI Works", href: "/how-it-works" },
    statCards: [
      {
        label: "Rule",
        value: "Set limits first",
        detail: "Time, stake and deposit boundaries should be decided before any betting activity.",
      },
      {
        label: "Avoid",
        value: "Chasing losses",
        detail: "Do not increase risk because of a loss, streak or model confidence score.",
      },
      {
        label: "Help",
        value: "Act early",
        detail: "Use support resources when gambling feels stressful, secretive or difficult to stop.",
      },
    ],
    marketFocus: ["Limits", "Warning signs", "Self-exclusion", "Support", "Risk"],
    modules: [
      {
        heading: "Responsible use comes before any pick",
        body:
          "AI analysis can make sports research easier, but it cannot make betting risk-free. Users should set limits before participating and avoid betting when stressed, impaired, chasing losses or using money needed for essentials.",
      },
      {
        heading: "How ThinkBetAI pages should frame risk",
        body:
          "Every SEO and product page should avoid guaranteed outcomes, explain uncertainty and link users toward responsible gambling resources. This keeps conversion goals aligned with user safety.",
      },
      {
        heading: "Warning signs to take seriously",
        body:
          "Users should pause immediately if betting starts to feel urgent, secretive or necessary to recover losses. Other warning signs include borrowing to bet, hiding activity, ignoring limits, betting while upset or feeling unable to enjoy sports without a wager attached.",
      },
      {
        heading: "How AI analysis should be used responsibly",
        body:
          "A confidence score is not a reason to increase risk beyond a pre-set limit. AI analysis should help users understand a matchup, not pressure them into action. The healthiest workflow is to decide budget and time boundaries first, then review picks only inside those boundaries.",
      },
    ],
    faqs: [
      {
        question: "Can AI sports picks remove gambling risk?",
        answer:
          "No. AI analysis cannot remove variance, incomplete information or the risk of financial loss.",
      },
      {
        question: "When should someone stop betting?",
        answer:
          "A person should stop and seek support if gambling causes stress, secrecy, debt, chasing losses, conflict or difficulty stopping.",
      },
    ],
  },
  "/editorial-policy": {
    eyebrow: "Editorial Standards",
    primaryKeyword: "ThinkBetAI editorial policy",
    heroHeadline: "Editorial policy, AI use and correction standards",
    heroSubheadline:
      "How ThinkBetAI handles AI-assisted content, performance claims, competitor comparisons, corrections and responsible betting language.",
    primaryCTA: { label: "Review Methodology", href: "/track-record" },
    secondaryCTA: { label: "About ThinkBetAI", href: "/about" },
    statCards: [
      {
        label: "Claims",
        value: "Define samples",
        detail: "Performance references should describe grading rules, time period and limitations.",
      },
      {
        label: "Comparisons",
        value: "Disclose context",
        detail: "Commercial comparisons should explain criteria and link to source pages when relevant.",
      },
      {
        label: "Corrections",
        value: "Fix material errors",
        detail: "Material factual issues should be corrected promptly and clearly.",
      },
    ],
    marketFocus: ["Methodology", "Corrections", "AI content", "Comparisons", "Responsible language"],
    modules: [
      {
        heading: "Standards for SEO content",
        body:
          "Scaled SEO pages need editorial guardrails. ThinkBetAI pages should avoid thin claims, cite limitations, define performance language and keep commercial comparison pages useful rather than purely promotional.",
      },
      {
        heading: "How corrections should work",
        body:
          "When a factual error appears in a guide, comparison or product explanation, it should be corrected promptly. Time-sensitive information such as pricing, product features and provider claims should be reviewed periodically.",
      },
      {
        heading: "AI-assisted content standards",
        body:
          "Scaled content can use templates and AI assistance, but every page still needs a distinct search intent, useful structure and claim-safe language. Pages should not imply guaranteed betting outcomes, fabricate data, overstate model performance or hide important limitations behind vague marketing copy.",
      },
      {
        heading: "Comparison-page standards",
        body:
          "Commercial comparison pages should focus on criteria users can verify: price, trial availability, supported sports, product workflow, public methodology and responsible-use language. When information is uncertain or likely to change, the page should say so instead of presenting stale details as permanent facts.",
      },
    ],
    faqs: [
      {
        question: "Does ThinkBetAI use AI-assisted content?",
        answer:
          "AI may assist with drafting, structuring or scaling content, but claims should be reviewed for accuracy, responsible language and user usefulness.",
      },
      {
        question: "How should competitor pages be handled?",
        answer:
          "Comparison pages should disclose commercial context, focus on verifiable criteria and avoid unsupported claims about competitors.",
      },
    ],
  },
  "/privacy": {
    eyebrow: "Privacy and Data Use",
    primaryKeyword: "ThinkBetAI privacy policy",
    heroHeadline: "Privacy policy for account, analytics and support data",
    heroSubheadline:
      "Understand what ThinkBetAI may collect, why it is used, how payment data is handled and how to contact support about privacy questions.",
    primaryCTA: { label: "Contact Support", href: "/contact" },
    secondaryCTA: { label: "Read Terms", href: "/terms" },
    statCards: [
      {
        label: "Account Data",
        value: "Email + settings",
        detail: "Account, authentication, saved analysis and product preferences support the user experience.",
      },
      {
        label: "Payments",
        value: "Provider handled",
        detail: "Payment flows should be handled by a payment provider rather than storing full card data locally.",
      },
      {
        label: "Requests",
        value: "Email support",
        detail: "Privacy questions and account data requests can be sent to support@thinkbetai.com.",
      },
    ],
    marketFocus: ["Privacy", "Account data", "Analytics", "Payments", "Security"],
    modules: [
      {
        heading: "Why a real privacy page matters",
        body:
          "A betting-adjacent product needs visible trust infrastructure. A privacy page helps users understand how account data, payment flows, analytics events and support messages may be handled before they create an account or subscribe.",
        bullets: [
          "Explain what data is needed to operate the product.",
          "Separate payment-provider handling from product account data.",
          "Give users a direct privacy request channel.",
        ],
      },
      {
        heading: "How data supports product functionality",
        body:
          "ThinkBetAI may use account and usage information to authenticate users, maintain subscriptions, load saved analysis, improve app reliability, investigate abuse and answer support requests. The page should avoid vague claims and describe practical uses clearly.",
      },
      {
        heading: "Security and retention language",
        body:
          "Privacy language should be honest about security limits. No internet product can promise perfect protection, so this page should explain that reasonable safeguards are used while also stating that information may be retained for product, legal, accounting, security or support needs.",
      },
      {
        heading: "Where privacy fits in the trust cluster",
        body:
          "Privacy, terms, disclaimer, responsible gambling and editorial policy pages work together. They show users that the product understands data handling, legal limits, gambling risk and corrections instead of only publishing conversion pages.",
      },
    ],
    faqs: [
      {
        question: "Does ThinkBetAI place bets for users?",
        answer:
          "No. ThinkBetAI is a sports analysis platform. It does not place bets or hold user betting funds.",
      },
      {
        question: "How can someone make a privacy request?",
        answer:
          "Email support@thinkbetai.com from the account email when possible and describe the access, deletion or correction request.",
      },
      {
        question: "Does ThinkBetAI store full card numbers?",
        answer:
          "Payment flows should be handled by a payment provider such as Stripe. ThinkBetAI should not store full card numbers on its own servers.",
      },
      ...commonFaqs,
    ],
  },
  "/terms": {
    eyebrow: "Terms of Service",
    primaryKeyword: "ThinkBetAI terms of service",
    heroHeadline: "Terms for eligibility, subscriptions and acceptable use",
    heroSubheadline:
      "Review the core rules for using ThinkBetAI, including account responsibility, AI analysis limits, subscriptions and lawful use.",
    primaryCTA: { label: "Read Privacy Policy", href: "/privacy" },
    secondaryCTA: { label: "Read Disclaimer", href: "/disclaimer" },
    statCards: [
      {
        label: "Eligibility",
        value: "Legal use only",
        detail: "Users are responsible for age, location and legal requirements where they live.",
      },
      {
        label: "Analysis",
        value: "No guarantees",
        detail: "Picks, probabilities and confidence scores are informational, not promised outcomes.",
      },
      {
        label: "Use",
        value: "No abuse",
        detail: "Scraping, resale, attacks, overload and reverse engineering are not acceptable.",
      },
    ],
    marketFocus: ["Terms", "Eligibility", "Subscriptions", "Acceptable use", "No guarantees"],
    modules: [
      {
        heading: "Clear terms reduce user confusion",
        body:
          "Terms should make the product boundary obvious. ThinkBetAI provides research and analysis, not a sportsbook account, financial advice, guaranteed profit system or replacement for user judgment.",
        bullets: [
          "Users remain responsible for decisions and local legal compliance.",
          "Subscription access and pricing should be reviewed before checkout.",
          "Product availability, sports coverage and data sources can change.",
        ],
      },
      {
        heading: "Why the no-guarantee language is important",
        body:
          "Sports betting claims are high risk. Terms should state plainly that model output can be wrong, that no prediction removes variance and that users should not rely on any page as a promise of profit.",
      },
      {
        heading: "Account and subscription responsibilities",
        body:
          "Users should keep credentials secure, review plan details before paying and understand that access can change when a subscription is canceled, payment fails or the service changes its coverage.",
      },
      {
        heading: "Acceptable platform use",
        body:
          "A clean terms page should prohibit scraping, resale, attacks, reverse engineering, abuse of account systems and misuse of content. This protects the product and sets expectations for automated or commercial use.",
      },
    ],
    faqs: [
      {
        question: "Are ThinkBetAI picks guaranteed?",
        answer:
          "No. ThinkBetAI provides informational sports analysis. No pick, confidence score or model output is guaranteed.",
      },
      {
        question: "Can anyone use ThinkBetAI?",
        answer:
          "Users are responsible for being old enough and legally allowed to view betting-related analysis in their location.",
      },
      {
        question: "Can subscription features change?",
        answer:
          "Yes. Features, sports coverage, data sources, prices and availability may change over time.",
      },
      ...commonFaqs,
    ],
  },
  "/contact": {
    eyebrow: "Contact and Support",
    primaryKeyword: "contact ThinkBetAI support",
    heroHeadline: "Contact ThinkBetAI for support, billing and corrections",
    heroSubheadline:
      "Reach support for account issues, billing questions, product feedback, privacy requests, corrections and responsible-gambling concerns.",
    primaryCTA: { label: "Email Support", href: "mailto:support@thinkbetai.com" },
    secondaryCTA: { label: "Read Editorial Policy", href: "/editorial-policy" },
    statCards: [
      {
        label: "Support",
        value: "Account + billing",
        detail: "Account access, subscription questions and product bugs should include enough detail to reproduce the issue.",
      },
      {
        label: "Corrections",
        value: "URL + source",
        detail: "Correction requests should include the page URL, exact claim and supporting source when available.",
      },
      {
        label: "Privacy",
        value: "Account email",
        detail: "Privacy requests are easier to verify when sent from the account email address.",
      },
    ],
    marketFocus: ["Support", "Billing", "Corrections", "Privacy requests", "Feedback"],
    modules: [
      {
        heading: "What to include in a support request",
        body:
          "Support is faster when users include the account email, relevant page URL, browser or device, screenshots when useful and a short description of what they expected versus what happened.",
        bullets: [
          "For billing, include the account email and approximate payment date.",
          "For bugs, include steps to reproduce the issue.",
          "For corrections, include a supporting source when available.",
        ],
      },
      {
        heading: "Corrections and trust signals",
        body:
          "A contact page is not just a support utility. It gives users and search engines a visible way to challenge factual claims, request updates and report issues with pricing, legal, responsible gambling or product information.",
      },
      {
        heading: "Privacy and safety requests",
        body:
          "Privacy requests should come from the account email when possible. Responsible-gambling or immediate safety concerns should be directed to qualified support organizations because ThinkBetAI support is not an emergency service.",
      },
      {
        heading: "Commercial and editorial messages",
        body:
          "Media, SEO, partnership and editorial requests should explain the context clearly. That keeps support from guessing whether a message is about product support, correction handling, partnership outreach or commercial comparison content.",
      },
    ],
    faqs: [
      {
        question: "What is the support email?",
        answer: "The support email is support@thinkbetai.com.",
      },
      {
        question: "What should a correction request include?",
        answer:
          "Include the page URL, exact statement, why it is wrong and a supporting source when available.",
      },
      {
        question: "Should users send card numbers by email?",
        answer: "No. Users should never send full card numbers or sensitive payment details by email.",
      },
      ...commonFaqs,
    ],
  },
  "/disclaimer": {
    eyebrow: "Risk and Limitations",
    primaryKeyword: "sports betting disclaimer",
    heroHeadline: "Sports betting disclaimer for AI predictions and analysis",
    heroSubheadline:
      "Understand the limits of AI picks, probability estimates, data freshness, legal restrictions and financial risk before using any sports analysis.",
    primaryCTA: { label: "Responsible Gambling", href: "/responsible-gambling" },
    secondaryCTA: { label: "How It Works", href: "/how-it-works" },
    statCards: [
      {
        label: "Risk",
        value: "You can lose",
        detail: "Sports betting involves financial risk and should never use money needed for essentials.",
      },
      {
        label: "Models",
        value: "Can be wrong",
        detail: "AI estimates depend on data, assumptions and timing. They cannot predict every event.",
      },
      {
        label: "Legal",
        value: "Rules vary",
        detail: "Age, state, province and country rules differ. Users must follow local law.",
      },
    ],
    marketFocus: ["Risk", "No guarantees", "AI limitations", "Data freshness", "Legal restrictions"],
    modules: [
      {
        heading: "Why the disclaimer must be explicit",
        body:
          "Betting content should never blur analysis with certainty. A disclaimer page gives users direct language about financial risk, data limitations, legal restrictions and the fact that AI predictions can lose.",
        bullets: [
          "No pick or probability estimate guarantees a result.",
          "Late injuries, weather, lineups and odds movement can change analysis.",
          "Users are responsible for legal compliance and bankroll decisions.",
        ],
      },
      {
        heading: "Model and data limitations",
        body:
          "AI models depend on available inputs and assumptions. They cannot fully account for random events, officiating decisions, late scratches, coaching changes, bad data, market suspension or every sportsbook price movement.",
      },
      {
        heading: "No financial, legal or betting advice",
        body:
          "ThinkBetAI pages should be read as informational sports analysis and education. They are not financial, investment, tax, legal or professional gambling advice.",
      },
      {
        heading: "How users should act on analysis",
        body:
          "The responsible workflow is to set limits first, review analysis as one input, compare current prices, avoid chasing losses and stop when betting feels stressful, secretive or difficult to control.",
      },
    ],
    faqs: [
      {
        question: "Can AI predictions guarantee wins?",
        answer:
          "No. AI predictions can be wrong and cannot guarantee profit, wins or future sportsbook prices.",
      },
      {
        question: "Is ThinkBetAI financial advice?",
        answer:
          "No. ThinkBetAI provides informational sports analysis and educational content, not financial or legal advice.",
      },
      {
        question: "Why can sports data become stale?",
        answer:
          "Odds, lineups, injuries, weather and market information can change quickly, especially close to game time.",
      },
      ...commonFaqs,
    ],
  },
};

function uniqueLinks(...groups: Array<CoreLink[] | undefined>) {
  const seen = new Set<string>();
  return groups
    .flatMap((group) => group ?? [])
    .filter((link) => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    });
}

function structuredData(page: CoreSeoPage, upgrade: CorePageUpgrade) {
  const url = `${BASE}${page.path === "/" ? "" : page.path}`;
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE}/#organization`,
    name: "ThinkBetAI",
    url: BASE,
    logo: `${BASE}/thinkbetai-logo-v2.png`,
  };
  const webPage = {
    "@context": "https://schema.org",
    "@type": page.path === "/" ? "WebSite" : "WebPage",
    name: page.h1,
    description: page.description,
    url,
    inLanguage: page.lang ?? "en",
    isPartOf: { "@id": `${BASE}/#website` },
    publisher: { "@id": `${BASE}/#organization` },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      ...(page.path === "/"
        ? []
        : [{ "@type": "ListItem", position: 2, name: page.h1, item: url }]),
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: upgrade.faqs.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ThinkBetAI",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    url: BASE,
    description:
      "AI-powered sports betting analysis platform for probability estimates, picks, parlays and matchup research.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free public previews and optional paid plans are available.",
    },
  };
  const nodes = [
    organization,
    webPage,
    breadcrumb,
    faq,
    ...(upgrade.softwareSchema ? [software] : []),
  ].map((data) => {
    const node = { ...data };
    delete node["@context"];
    return node;
  });
  return `<script id="thinkbetai-page-schema" type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  })}</script>`;
}

const globalMarketPaths = new Set([
  "/",
  ...countryPageList.map((page) => page.path),
  ...languagePageList.map((page) => page.path),
  ...localizedMoneyPageList.map((page) => page.path),
]);

function renderAlternateLinks(path: string) {
  if (!globalMarketPaths.has(path)) return "";
  return getLocalizedMoneyPageAlternates(path)
    .map(
      (entry) =>
        `<link rel="alternate" hreflang="${escapeHtml(entry.hrefLang)}" href="${escapeHtml(entry.href)}" />`,
    )
    .join("\n");
}

function renderLinkGrid(heading: string, links: CoreLink[]) {
  return `<section>
      <h2>${escapeHtml(heading)}</h2>
      <ul class="seo-link-grid">
        ${links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join("")}
      </ul>
    </section>`;
}

function renderBody(page: CoreSeoPage) {
  const upgrade = corePageUpgrades[page.path] ?? corePageUpgrades["/"];
  const sectionModules: CoreModule[] = [
    ...page.sections.map((section) => ({ heading: section.heading, body: section.body })),
    ...upgrade.modules,
    {
      heading: "Search intent this page supports",
      body: `This page is built around the search intent behind ${upgrade.primaryKeyword}. It should answer the core question directly, show what ThinkBetAI can do next, and link users into more specific pages when their intent becomes clearer. That keeps older core URLs useful while the newer sport, tool and market pages handle narrower searches.`,
      bullets: [
        "Broad visitors get a complete answer without being forced into login first.",
        "Commercial visitors can compare tools, pricing and product workflows.",
        "Search engines see a connected cluster instead of isolated thin pages.",
      ],
    },
    {
      heading: "How to use this page",
      body:
        "Start with the explanation, review the related tools, then move into the sport or market page that matches your search intent. ThinkBetAI pages are designed as a connected topic cluster so users can go from broad education to specific betting workflows without hitting a login wall immediately.",
      bullets: [
        "Use free public pages for research and context.",
        "Open prediction, analyzer or parlay tools when you need a specific workflow.",
        "Keep the responsible gambling guidance in mind before acting on any analysis.",
      ],
    },
  ];

  const sections = sectionModules
    .map((section) => {
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
        : "";
      return `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p>${bullets}</section>`;
    })
    .join("\n");

  const statCards = upgrade.statCards
    .map(
      (card) => `<li>
        <strong>${escapeHtml(card.value)}</strong>
        <span>${escapeHtml(card.label)}</span>
        <p>${escapeHtml(card.detail)}</p>
      </li>`,
    )
    .join("");

  const focusList = upgrade.marketFocus
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  const faq = upgrade.faqs
    .map(
      (entry) => `<details>
        <summary>${escapeHtml(entry.question)}</summary>
        <p>${escapeHtml(entry.answer)}</p>
      </details>`,
    )
    .join("");

  const relatedTools = uniqueLinks(upgrade.relatedTools, defaultRelatedTools).slice(0, 10);
  const relatedSports = uniqueLinks(upgrade.relatedSports, defaultRelatedSports).slice(0, 10);
  const relatedGuides = uniqueLinks(upgrade.relatedGuides, page.links, defaultRelatedGuides).slice(0, 10);

  return `<div id="root"><div id="seo-prerender">
  <style>
    #seo-prerender{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#07111f;color:#e5edf8;line-height:1.65;min-height:100vh}
    #seo-prerender a{color:#2dd4bf;text-decoration:none}
    #seo-prerender a:hover{text-decoration:underline}
    #seo-prerender header,#seo-prerender main{max-width:72rem;margin:0 auto;padding-left:1rem;padding-right:1rem}
    #seo-prerender header{padding-top:1.25rem;padding-bottom:1.25rem}
    #seo-prerender main{padding-top:2rem;padding-bottom:4rem}
    #seo-prerender nav{font-size:.9rem;color:#94a3b8;margin-bottom:1.25rem}
    #seo-prerender .seo-eyebrow{display:inline-flex;border:1px solid rgba(45,212,191,.35);border-radius:999px;padding:.35rem .75rem;color:#5eead4;background:rgba(20,184,166,.08);font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.08em}
    #seo-prerender h1{max-width:58rem;font-size:clamp(2.3rem,5vw,4.75rem);line-height:1.02;margin:.9rem 0 1rem;letter-spacing:0}
    #seo-prerender h2{font-size:clamp(1.45rem,2vw,2rem);line-height:1.2;margin:2.5rem 0 .75rem}
    #seo-prerender h3{font-size:1.1rem;margin:1rem 0 .35rem}
    #seo-prerender p{color:#b6c4d6;max-width:62rem}
    #seo-prerender .seo-hero-copy{font-size:1.18rem;max-width:52rem}
    #seo-prerender .seo-cta-row{display:flex;flex-wrap:wrap;gap:.75rem;margin:1.5rem 0 2rem}
    #seo-prerender .seo-button{display:inline-flex;align-items:center;justify-content:center;border-radius:.75rem;padding:.78rem 1rem;font-weight:800;background:#2dd4bf;color:#04111f}
    #seo-prerender .seo-button-secondary{background:rgba(148,163,184,.08);color:#e5edf8;border:1px solid rgba(148,163,184,.26)}
    #seo-prerender .seo-stat-grid,.seo-link-grid,.seo-focus-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.85rem;list-style:none;padding:0;margin:1.25rem 0}
    #seo-prerender .seo-stat-grid li,#seo-prerender .seo-link-grid li,#seo-prerender .seo-focus-list li{border:1px solid rgba(148,163,184,.18);border-radius:.9rem;background:rgba(15,23,42,.62);padding:1rem}
    #seo-prerender .seo-stat-grid strong{display:block;font-size:1.2rem;color:#f8fafc}
    #seo-prerender .seo-stat-grid span{display:block;color:#5eead4;font-size:.86rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
    #seo-prerender .seo-stat-grid p{font-size:.92rem;margin:.4rem 0 0}
    #seo-prerender section{border-top:1px solid rgba(148,163,184,.14);padding-top:1.35rem}
    #seo-prerender ul{color:#b6c4d6}
    #seo-prerender details{border:1px solid rgba(148,163,184,.2);border-radius:.85rem;background:rgba(15,23,42,.52);padding:1rem;margin:.7rem 0}
    #seo-prerender summary{cursor:pointer;font-weight:800;color:#f8fafc}
    #seo-prerender aside{border:1px solid rgba(251,191,36,.32);border-radius:.9rem;background:rgba(251,191,36,.08);padding:1rem;margin-top:2rem}
  </style>
  <header><a href="/" aria-label="ThinkBetAI home"><strong>ThinkBetAI</strong></a></header>
  <main>
    ${page.path === "/" ? "" : `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <span>${escapeHtml(page.h1)}</span></nav>`}
    <span class="seo-eyebrow">${escapeHtml(upgrade.eyebrow)}</span>
    <h1>${escapeHtml(page.h1)}</h1>
    <p class="seo-hero-copy">${escapeHtml(upgrade.heroSubheadline || page.intro)}</p>
    <div class="seo-cta-row">
      <a class="seo-button" href="${escapeHtml(upgrade.primaryCTA.href)}">${escapeHtml(upgrade.primaryCTA.label)}</a>
      <a class="seo-button seo-button-secondary" href="${escapeHtml(upgrade.secondaryCTA.href)}">${escapeHtml(upgrade.secondaryCTA.label)}</a>
    </div>
    <ul class="seo-stat-grid">${statCards}</ul>
    <section>
      <h2>${escapeHtml(upgrade.heroHeadline)}</h2>
      <p>${escapeHtml(page.intro)}</p>
      <ul class="seo-focus-list">${focusList}</ul>
    </section>
    ${sections}
    ${renderLinkGrid("Related AI Betting Tools", relatedTools)}
    ${renderLinkGrid("Related Sports", relatedSports)}
    ${renderLinkGrid("Related Guides and Trust Pages", relatedGuides)}
    <section>
      <h2>Frequently Asked Questions</h2>
      ${faq}
    </section>
    <section>
      <h2>Next step</h2>
      <p>Use this page as the starting point, then choose the tool or sport page that matches what you are researching today. The best conversion path is gradual: read the page, see useful public analysis, then log in only when deeper analysis is worth it.</p>
      <div class="seo-cta-row">
        <a class="seo-button" href="${escapeHtml(upgrade.primaryCTA.href)}">${escapeHtml(upgrade.primaryCTA.label)}</a>
        <a class="seo-button seo-button-secondary" href="${escapeHtml(upgrade.secondaryCTA.href)}">${escapeHtml(upgrade.secondaryCTA.label)}</a>
      </div>
    </section>
    <aside><p><strong>Important:</strong> Sports betting involves risk. ThinkBetAI provides informational analysis, not guaranteed outcomes or financial advice. Only participate where legal and never wager more than you can afford to lose.</p></aside>
  </main>
</div></div>`;
}

function build(page: CoreSeoPage) {
  const url = `${BASE}${page.path === "/" ? "/" : page.path}`;
  const upgrade = corePageUpgrades[page.path] ?? corePageUpgrades["/"];
  let html = baseHtml;
  if (page.lang) {
    html = html.replace(/<html\s+lang="[^"]*">/, `<html lang="${escapeHtml(page.lang)}">`);
  }
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = html.replace(
    /<meta\s+name="title"[^>]*>/,
    `<meta name="title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
  );
  html = html.replace(
    /<meta\s+name="robots"[^>]*>/,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
  );
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:url"[^>]*>/,
    `<meta name="twitter:url" content="${escapeHtml(url)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
  );

  // Replace generic base schema with page-specific, claim-safe schema.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  const alternateLinks = renderAlternateLinks(page.path);
  html = html.replace(
    "</head>",
    `${alternateLinks ? `${alternateLinks}\n` : ""}<link rel="canonical" href="${escapeHtml(url)}" />\n${structuredData(page, upgrade)}\n</head>`,
  );
  html = html.replace(/<div id="root"><\/div>/, renderBody(page));
  return html;
}

function redirectHtml(source: string, target: string) {
  const sourceUrl = `${BASE}${source}`;
  const targetUrl = `${BASE}${target}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, follow" />
  <link rel="canonical" href="${escapeHtml(targetUrl)}" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(target)}" />
  <title>Redirecting to localized ThinkBetAI page</title>
  <script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <main>
    <h1>Redirecting</h1>
    <p>This legacy URL has moved to <a href="${escapeHtml(target)}">${escapeHtml(targetUrl)}</a>.</p>
    <p>Source: ${escapeHtml(sourceUrl)}</p>
  </main>
</body>
</html>`;
}

let written = 0;
let skippedBlueprintOwned = 0;
let writtenLegacyRedirects = 0;

for (const page of CORE_SEO_PAGES) {
  if (page.path !== "/" && blueprintPaths.has(page.path)) {
    skippedBlueprintOwned++;
    continue;
  }

  const html = build(page);
  if (page.path === "/") {
    writeFileSync(indexPath, html);
    written++;
    continue;
  }
  const slug = page.path.slice(1);
  writeFileSync(join(DIST, `${slug}.html`), html);
  const nested = join(DIST, slug, "index.html");
  mkdirSync(dirname(nested), { recursive: true });
  writeFileSync(nested, html);
  written++;
}

for (const { source, target } of localizedMoneyPageRedirects) {
  const html = redirectHtml(source, target);
  const slug = source.slice(1);
  writeFileSync(join(DIST, `${slug}.html`), html);
  const nested = join(DIST, slug, "index.html");
  mkdirSync(dirname(nested), { recursive: true });
  writeFileSync(nested, html);
  writtenLegacyRedirects++;
}

console.log(
  `✓ prerendered ${written} core SEO pages and ${writtenLegacyRedirects} legacy localized redirects${skippedBlueprintOwned ? ` (${skippedBlueprintOwned} blueprint-owned core paths skipped)` : ""}`,
);
