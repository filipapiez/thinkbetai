export type Locale = 'en' | 'pl' | 'fr' | 'de';

export interface NavTranslations {
  games: string;
  parlays: string;
  betHistory: string;
  askAI: string;
  pricing: string;
  about: string;
  blog: string;
  settings: string;
  account: string;
  searchGames: string;
}

export interface FooterTranslations {
  platform: string;
  learn: string;
  resources: string;
  contact: string;
  description: string;
  gamblingHelp: string;
  gaResources: string;
  disclaimer: string;
  copyright: string;
  ageRestriction: string;
  aiSportsPicks: string;
  searchGames: string;
  aiParlayBuilder: string;
  aiNFLPicks: string;
  freeAIPredictions: string;
  pricing: string;
  bestAIBettingApp: string;
  blog: string;
  faq: string;
}

export interface HomepageTranslations {
  liveBadge: string;
  winRate: string;
  gameStreak: string;
  headline1: string;
  headline2: string;
  subheadline: string;
  dataPoints: string;
  highValuePicks: string;
  badgeUpdated: string;
  badgeWinningPicks: string;
  badgeGuarantee: string;
  ctaPrimary: string;
  ctaSecondary: string;
  joinedThisWeek: string;
  fromReviews: string;
  statWinRate: string;
  statUserWinnings: string;
  statWinStreak: string;
  statSports: string;
  statOnQualified: string;
  statTrackedYear: string;
  statAndCounting: string;
  statCoveredDaily: string;
  liveViewers: string;
  usersViewingNow: string;
  howItWorksBadge: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  sportsCoverageBadge: string;
  sportsCoverageTitle: string;
  sportsCoverageSubtitle: string;
  featuresBadge: string;
  featuresTitle: string;
  featuresSubtitle: string;
  featureAIPicks: string;
  featureAIPicksDesc: string;
  featureParlayBuilder: string;
  featureParlayBuilderDesc: string;
  featureInjury: string;
  featureInjuryDesc: string;
  featureRisk: string;
  featureRiskDesc: string;
  performanceBadge: string;
  performanceTitle: string;
  performanceSubtitle: string;
  stepsTitle: string;
  stepsSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  stepsCTA: string;
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  finalCtaBadge: string;
  finalCtaTitle1: string;
  finalCtaTitle2: string;
  finalCtaSubtitle: string;
  finalCtaJoin: string;
  finalCtaCTA: string;
  finalCtaCancel: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

export interface PricingTranslations {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  trustedBadge: string;
  headline1: string;
  headline2: string;
  subtitle: string;
  cancelAnytime: string;
  winRateLabel: string;
  verifiedPicks: string;
  moneyBack: string;
  save70: string;
  perMonth: string;
  alreadySubscribed: string;
  secureCheckout: string;
  instantAccess: string;
  support247: string;
  faqTitle1: string;
  faqTitle2: string;
  faq1Q: string;
  faq1A: string;
  faq2Q: string;
  faq2A: string;
  faq3Q: string;
  faq3A: string;
  faq4Q: string;
  faq4A: string;
  learnMoreTitle: string;
  basicName: string;
  basicDesc: string;
  proName: string;
  proDesc: string;
  insiderName: string;
  insiderDesc: string;
  mostPopular: string;
  bestValue: string;
  mostPopularChoice: string;
  moneyBackGuarantee: string;
  // Plan features
  basicFeatures: string[];
  proFeatures: string[];
  insiderFeatures: string[];
  basicCTA: string;
  proCTA: string;
  insiderCTA: string;
}

export interface FAQTranslations {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  helpCenter: string;
  title1: string;
  title2: string;
  subtitle: string;
  aiAccuracy: string;
  sportsCovered: string;
  gamesAnalyzed: string;
  aiUpdates: string;
  stillHaveQuestions: string;
  stillHaveQuestionsSubtitle: string;
  askAIChat: string;
  viewGames: string;
  joinSmartBettors: string;
  categories: Record<string, string>;
  faqs: Array<{ category: string; question: string; answer: string }>;
}

export interface LandingTranslations {
  bestAIBettingApp: {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    badge: string;
    headline: string;
    subtitle: string;
    winnerBadge: string;
    winnerTitle: string;
    winnerDesc: string;
    tryCTA: string;
    featuresTitle: string;
    contentTitle1: string;
    contentBody1: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  freeAIPredictions: {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    badge: string;
    headline: string;
    subtitle: string;
    ctaPrimary: string;
    benefitsTitle: string;
    benefits: Array<{ title: string; description: string }>;
    ctaBottomTitle: string;
    ctaBottomSubtitle: string;
    viewPicks: string;
    unlockUnlimited: string;
  };
  aiNFLPicks: {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    badge: string;
    headline: string;
    subtitle: string;
    ctaPrimary: string;
    featuresTitle: string;
    ctaBottomTitle: string;
    ctaBottomSubtitle: string;
  };
  aiParlayBuilder: {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    badge: string;
    headline: string;
    subtitle: string;
    ctaPrimary: string;
    featuresTitle: string;
    ctaBottomTitle: string;
    ctaBottomSubtitle: string;
  };
}

export interface LocaleTranslations {
  nav: NavTranslations;
  footer: FooterTranslations;
  homepage: HomepageTranslations;
  pricing: PricingTranslations;
  faq: FAQTranslations;
  landing: LandingTranslations;
}
