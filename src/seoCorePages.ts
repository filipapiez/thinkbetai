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
      { label: "View Today's Games", href: "/ai-sports-picks" },
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
      { label: "View Free Picks", href: "/ai-sports-picks" },
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
      { label: "Open Parlay Tools", href: "/ai-parlay-builder" },
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
    title: "Best AI Sports Betting Tools Compared (2026)",
    description:
      "An evidence-based comparison of ThinkBetAI, Rithmm, IABET, ParlAI, Outlier, Moddy and BetEdge by workflow, pricing and public proof.",
    h1: "Best AI Sports Betting Tools: An Evidence-Based Comparison",
    intro:
      "The best tool depends on the workflow you need. This commercially disclosed guide compares current provider information and links directly to every source.",
    sections: [
      {
        heading: "Compare workflow, evidence and price",
        body: "Rithmm and Moddy emphasize custom models, Outlier emphasizes market research, ParlAI emphasizes screenshot parlays, and ThinkBetAI emphasizes a lower-cost combined web toolkit.",
      },
      {
        heading: "Verify every provider claim",
        body: "Prices, trials and product capabilities change. Review the linked provider source, sample definitions, grading rules and limitations before purchasing.",
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
    title: "Settled Pick Record & Grading Methodology | ThinkBetAI",
    description:
      "Review ThinkBetAI's live settled-record summary, grading rules, sample limitations and methodology. Past performance does not guarantee future outcomes.",
    h1: "Settled Pick Record and Methodology",
    intro:
      "The page calculates its summary from settled database records and explains why aggregate product-reported results still require careful interpretation.",
    sections: [
      {
        heading: "Live settled-record summary",
        body: "Only records marked as a settled win or loss are included. Pushes, pending events and unavailable outcomes are excluded from the displayed calculation.",
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
      { label: "View Games", href: "/ai-sports-picks" },
    ],
  },
  {
    path: "/what-is-ai-sports-betting",
    title: "What Is AI Sports Betting? Complete Guide | ThinkBetAI",
    description:
      "Learn how AI sports betting models analyze statistics, estimate probabilities and compare market odds, including their limitations and risks.",
    h1: "What Is AI Sports Betting?",
    intro:
      "AI sports betting applies statistical and machine-learning methods to sports data in order to estimate probabilities and organize matchup research.",
    sections: [
      {
        heading: "How AI sports analysis works",
        body: "Models transform available team, player, schedule, injury and market information into probability estimates that can be compared with current sportsbook prices.",
      },
      {
        heading: "What AI cannot do",
        body: "Models work with incomplete historical information and cannot predict random events, late news or future outcomes with certainty.",
      },
    ],
    links: [
      { label: "AI Sports Betting Analysis", href: "/ai-sports-betting" },
      { label: "How ThinkBetAI Works", href: "/how-it-works" },
      { label: "AI Sports Picks", href: "/ai-sports-picks" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/how-it-works",
    title: "How ThinkBetAI Works: Models, Odds & Risk",
    description:
      "See how ThinkBetAI organizes sports data, creates probability estimates, compares implied odds and explains matchup factors and uncertainty.",
    h1: "How ThinkBetAI Works",
    intro:
      "ThinkBetAI converts available sports and market information into structured probability analysis with plain-language context and risk notes.",
    sections: [
      {
        heading: "From data to probability",
        body: "Relevant inputs are prepared for sport-specific models, which estimate possible outcomes and compare those estimates with market-implied probability.",
      },
      {
        heading: "Explanation and result tracking",
        body: "Each analysis should explain important factors, expose uncertainty and be graded consistently after the event rather than highlighting only successful examples.",
      },
    ],
    links: [
      { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
      { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
      { label: "Track Record & Methodology", href: "/track-record" },
      { label: "Frequently Asked Questions", href: "/faq" },
    ],
  },
  {
    path: "/pricing",
    title: "ThinkBetAI Plans & Pricing | Compare Features",
    description:
      "Compare ThinkBetAI plans, included sports-analysis features, billing terms and free access before choosing the option that fits your research needs.",
    h1: "ThinkBetAI Plans and Pricing",
    intro:
      "Compare available plans by analysis access, supported tools and billing period. Current prices and terms are shown before checkout.",
    sections: [
      {
        heading: "Compare analysis features",
        body: "Review access to model probabilities, matchup explanations, bet analysis, parlay tools and supported sports before selecting a plan.",
      },
      {
        heading: "Understand the limits",
        body: "A paid plan provides additional analysis features, not guaranteed results. Sports outcomes remain uncertain regardless of subscription level.",
      },
    ],
    links: [
      { label: "Free AI Predictions", href: "/free-ai-predictions" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "AI Sports Betting Tools", href: "/best-ai-sports-betting-tools" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/about",
    title: "About ThinkBetAI | Sports Analysis Methodology",
    description:
      "Learn about ThinkBetAI's purpose, probability-based sports analysis approach, transparency principles and commitment to responsible product design.",
    h1: "About ThinkBetAI",
    intro:
      "ThinkBetAI is a sports-analysis product designed to make model probabilities, market context and uncertainty easier to review.",
    sections: [
      {
        heading: "Our product principles",
        body: "Useful analysis should be understandable, timestamped and honest about uncertainty. Performance claims should include their sample and qualification rules.",
      },
      {
        heading: "Responsible analysis",
        body: "ThinkBetAI is an informational tool. It does not guarantee outcomes and should never replace personal judgment or responsible gambling limits.",
      },
    ],
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Track Record & Methodology", href: "/track-record" },
      { label: "Frequently Asked Questions", href: "/faq" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/faq",
    title: "AI Sports Betting FAQ | ThinkBetAI",
    description:
      "Find answers about AI sports betting models, probability estimates, data inputs, parlays, pricing, account access and responsible use.",
    h1: "AI Sports Betting Frequently Asked Questions",
    intro:
      "These answers explain how ThinkBetAI presents sports-analysis estimates, what the tools include and where their limitations apply.",
    sections: [
      {
        heading: "Understanding model output",
        body: "A probability estimate expresses uncertainty based on available inputs. It is not a guarantee and can change as injuries, lineups or market prices change.",
      },
      {
        heading: "Using the platform responsibly",
        body: "Review the explanation and risk notes, set firm limits and never wager money you cannot afford to lose.",
      },
    ],
    links: [
      { label: "What Is AI Sports Betting?", href: "/what-is-ai-sports-betting" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Plans & Pricing", href: "/pricing" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/editorial-policy",
    title: "Editorial Policy, AI Use & Corrections | ThinkBetAI",
    description:
      "Learn how ThinkBetAI handles data sources, AI-assisted content, performance claims, competitor comparisons, corrections and responsible language.",
    h1: "Editorial Policy, AI Use and Corrections",
    intro:
      "This policy explains how ThinkBetAI verifies factual claims, labels commercial comparisons, handles AI-assisted content and responds to correction requests.",
    sections: [
      {
        heading: "Performance and comparison standards",
        body: "Performance references should define their sample and grading method. Competitor comparisons should disclose our commercial interest, link to provider sources and state when information was checked.",
      },
      {
        heading: "Corrections and responsible language",
        body: "Material errors should be corrected promptly. ThinkBetAI does not promise guaranteed wins or risk-free profit and requires clear discussion of uncertainty.",
      },
    ],
    links: [
      { label: "Track Record & Methodology", href: "/track-record" },
      { label: "About ThinkBetAI", href: "/about" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
      { label: "AI Tools Comparison", href: "/best-ai-sports-betting-tools" },
    ],
  },
  {
    path: "/responsible-gambling",
    title: "Responsible Gambling Resources | ThinkBetAI",
    description:
      "Review responsible gambling guidance, warning signs, age requirements, self-exclusion options and support resources for safer participation.",
    h1: "Responsible Gambling",
    intro:
      "Sports betting involves financial risk. Set limits before participating, recognize warning signs and seek support when gambling stops feeling controlled.",
    sections: [
      {
        heading: "Set practical limits",
        body: "Decide time and spending limits in advance, avoid chasing losses and never use money needed for essential expenses.",
      },
      {
        heading: "Get help early",
        body: "Use self-exclusion and support resources if gambling causes stress, secrecy, debt or difficulty stopping.",
      },
    ],
    links: [
      { label: "How ThinkBetAI Works", href: "/how-it-works" },
      { label: "Frequently Asked Questions", href: "/faq" },
      { label: "About ThinkBetAI", href: "/about" },
      { label: "Track Record & Methodology", href: "/track-record" },
    ],
  },
  {
    path: "/privacy",
    title: "Privacy Policy | ThinkBetAI",
    description:
      "Read how ThinkBetAI handles account data, payments, analytics, cookies, security, user rights and privacy questions for sports analysis tools.",
    h1: "Privacy Policy",
    intro:
      "This page explains what ThinkBetAI may collect, why it is used and how to contact us about privacy questions. The product is a sports analysis platform, not a sportsbook.",
    sections: [
      {
        heading: "What information may be processed",
        body: "Account email, authentication details, subscription status, saved analysis, usage events, analytics data and support messages may be processed to operate and improve the product.",
      },
      {
        heading: "Payments, cookies and security",
        body: "Payments should be handled by a payment provider such as Stripe. Cookies and local storage may support login, preferences, analytics and security. No internet service can promise perfect security.",
      },
    ],
    links: [
      { label: "Contact Support", href: "/contact" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
  {
    path: "/terms",
    title: "Terms of Service | ThinkBetAI",
    description:
      "Review ThinkBetAI terms covering eligibility, subscriptions, acceptable use, AI sports analysis limits, account access and legal responsibilities.",
    h1: "Terms of Service",
    intro:
      "These terms describe the rules for using ThinkBetAI. By using the site or app, you agree to use the product responsibly and understand that sports outcomes are uncertain.",
    sections: [
      {
        heading: "Informational analysis only",
        body: "ThinkBetAI provides model-assisted sports analysis, explanations and research tools. It does not guarantee wins, profits, odds movement, sportsbook acceptance or any specific outcome.",
      },
      {
        heading: "Accounts, subscriptions and acceptable use",
        body: "Users are responsible for account security, subscription review and lawful use. Do not scrape, resell, attack, overload, reverse engineer or misuse the platform.",
      },
    ],
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Contact Support", href: "/contact" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    path: "/contact",
    title: "Contact ThinkBetAI Support",
    description:
      "Contact ThinkBetAI for support, billing questions, corrections, privacy requests, responsible gambling concerns and product feedback.",
    h1: "Contact ThinkBetAI",
    intro:
      "Use this page to reach the right support path. Include the page URL, account email and enough detail for us to understand the issue without guessing.",
    sections: [
      {
        heading: "Support and billing",
        body: "Email support@thinkbetai.com for account access, billing questions, subscription issues, bug reports and product feedback. Do not send full card numbers by email.",
      },
      {
        heading: "Corrections and privacy requests",
        body: "For factual corrections, include the URL, exact claim and a supporting source when available. For privacy requests, email from the account address when possible.",
      },
    ],
    links: [
      { label: "Editorial Policy", href: "/editorial-policy" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Responsible Gambling", href: "/responsible-gambling" },
    ],
  },
  {
    path: "/disclaimer",
    title: "Sports Betting Disclaimer | ThinkBetAI",
    description:
      "Read the ThinkBetAI disclaimer on sports betting risk, AI prediction limits, data accuracy, legal restrictions and no guaranteed outcomes.",
    h1: "Sports Betting Disclaimer",
    intro:
      "ThinkBetAI provides sports analysis and educational information. It does not place bets, hold funds or guarantee betting outcomes.",
    sections: [
      {
        heading: "Sports betting involves financial risk",
        body: "AI picks, probabilities, confidence scores, odds comparisons and matchup notes can be wrong. You can lose money, and past performance does not predict future results.",
      },
      {
        heading: "Data, legal and model limitations",
        body: "Odds, injuries, lineups, weather and market information can change quickly. Betting laws vary by location and age. Users are responsible for following local rules.",
      },
    ],
    links: [
      { label: "Responsible Gambling", href: "/responsible-gambling" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Track Record & Methodology", href: "/track-record" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export const CORE_SEO_PATHS = CORE_SEO_PAGES.map((page) => page.path);
