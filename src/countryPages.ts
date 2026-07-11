export type CountrySlug = "uk" | "ca" | "au";
export type LanguageSlug =
  | "de"
  | "fr"
  | "it"
  | "es"
  | "pt-br"
  | "hi"
  | "nl"
  | "pl"
  | "sv"
  | "tr"
  | "ja";

export interface CountryPageConfig {
  slug: CountrySlug;
  path: `/${CountrySlug}`;
  hrefLang: string;
  countryName: string;
  adjective: string;
  currency: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  heroEyebrow: string;
  primarySports: string[];
  marketNotes: string[];
  toolModules: Array<{ heading: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  keywords: string;
}

export interface LanguagePageConfig {
  slug: LanguageSlug;
  path: `/${LanguageSlug}`;
  hrefLang: string;
  htmlLang: string;
  languageName: string;
  marketName: string;
  currency: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  heroEyebrow: string;
  primarySports: string[];
  marketNotes: string[];
  toolModules: Array<{ heading: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  keywords: string;
  labels: {
    primaryCta: string;
    secondaryCta: string;
    intentHeading: string;
    sportsHeading: string;
    templateHeading: string;
    faqHeading: string;
    marketSwitcherTitle: string;
  };
}

export const countryPageConfigs: Record<CountrySlug, CountryPageConfig> = {
  uk: {
    slug: "uk",
    path: "/uk",
    hrefLang: "en-GB",
    countryName: "United Kingdom",
    adjective: "UK",
    currency: "GBP",
    seoTitle: "AI Sports Betting UK | ThinkBetAI",
    seoDescription:
      "UK-focused AI sports betting analysis for football, racing, rugby, cricket and US sports, with odds context, risk notes and no guaranteed outcomes.",
    h1: "AI Sports Betting Analysis for the UK",
    intro:
      "ThinkBetAI helps UK sports fans review football, horse racing, rugby, cricket, tennis and US sports with model probabilities, odds context and plain-English risk notes.",
    heroEyebrow: "UK AI Betting Analysis",
    primarySports: ["Football", "Horse racing", "Rugby", "Cricket", "Tennis", "NFL", "NBA", "UFC"],
    marketNotes: [
      "Built around decimal odds language and value-betting workflows UK bettors already understand.",
      "Useful for Premier League, Champions League, racing cards, rugby fixtures and major US sports slates.",
      "ThinkBetAI provides research and probability context only; it is not a bookmaker and does not place bets.",
    ],
    toolModules: [
      {
        heading: "Football and racing context",
        body:
          "UK searches often start with football or racing. This page routes users into AI picks, matchup analysis and parlay tools while keeping the local context clear.",
      },
      {
        heading: "Decimal odds and implied probability",
        body:
          "The platform helps compare model probability with the price on offer so users can review whether a selection appears fairly priced before making their own decision.",
      },
      {
        heading: "Responsible use for UK visitors",
        body:
          "Sports betting involves risk. ThinkBetAI should be treated as informational analysis, not a promise of profit or betting advice.",
      },
    ],
    faqs: [
      {
        question: "Is ThinkBetAI available for UK sports betting research?",
        answer:
          "Yes. UK visitors can use ThinkBetAI for sports analysis and probability research, but they remain responsible for following local betting laws and age requirements.",
      },
      {
        question: "Does the UK page cover football betting analysis?",
        answer:
          "Yes. The UK page is written for football-first users while also linking into racing, rugby, cricket, tennis and US sports analysis.",
      },
      {
        question: "Does ThinkBetAI place bets with UK bookmakers?",
        answer:
          "No. ThinkBetAI is not a bookmaker and does not place bets. It provides analysis, probabilities, matchup context and risk notes.",
      },
    ],
    keywords:
      "AI sports betting UK, AI betting UK, football betting AI, UK betting predictions, AI football predictions",
  },
  ca: {
    slug: "ca",
    path: "/ca",
    hrefLang: "en-CA",
    countryName: "Canada",
    adjective: "Canadian",
    currency: "CAD",
    seoTitle: "AI Sports Betting Canada | ThinkBetAI",
    seoDescription:
      "Canada-focused AI sports betting analysis for NHL, NBA, MLB, CFL and soccer, with odds context, province-aware notes and no guaranteed outcomes.",
    h1: "AI Sports Betting Analysis for Canada",
    intro:
      "ThinkBetAI helps Canadian users review NHL, NBA, MLB, CFL, soccer, tennis and major US sports with model probabilities, odds context and transparent risk notes.",
    heroEyebrow: "Canada AI Betting Analysis",
    primarySports: ["NHL", "CFL", "NBA", "MLB", "Soccer", "Tennis", "NFL", "UFC"],
    marketNotes: [
      "Built for Canadian users around NHL picks, Ontario sports betting, CFL markets and US league coverage.",
      "Supports probability-first analysis for moneylines, spreads, totals, props and parlays when data is available.",
      "Betting rules vary by province, so users should verify local eligibility before acting on any analysis.",
    ],
    toolModules: [
      {
        heading: "NHL-first betting research",
        body:
          "Canadian search demand often centers on hockey. The Canada page gives NHL and cross-border sports context without changing the core ThinkBetAI product.",
      },
      {
        heading: "Province-aware reminders",
        body:
          "Canada has province-specific betting rules. ThinkBetAI keeps the page informational and reminds users to follow the rules where they live.",
      },
      {
        heading: "US and Canadian sports coverage",
        body:
          "Many Canadian bettors follow both domestic and US leagues, so this page connects NHL and CFL intent with NBA, MLB, NFL, soccer and UFC analysis.",
      },
    ],
    faqs: [
      {
        question: "Can Canadian users access ThinkBetAI?",
        answer:
          "Canadian users can read ThinkBetAI analysis, but they are responsible for age, province and local eligibility rules before placing any wager elsewhere.",
      },
      {
        question: "Does ThinkBetAI cover NHL picks for Canada?",
        answer:
          "Yes. NHL and hockey-related questions are a major part of the Canada page, alongside CFL, NBA, MLB, soccer and other sports.",
      },
      {
        question: "Is ThinkBetAI an Ontario sportsbook?",
        answer:
          "No. ThinkBetAI is an analysis platform, not a sportsbook, bookmaker or betting operator.",
      },
    ],
    keywords:
      "AI sports betting Canada, AI betting Canada, Ontario sports betting AI, NHL AI picks Canada, Canadian betting predictions",
  },
  au: {
    slug: "au",
    path: "/au",
    hrefLang: "en-AU",
    countryName: "Australia",
    adjective: "Australian",
    currency: "AUD",
    seoTitle: "AI Sports Betting Australia | ThinkBetAI",
    seoDescription:
      "Australia-focused AI sports betting analysis for AFL, NRL, cricket, rugby, tennis and US sports, with odds context, risk notes and no guarantees.",
    h1: "AI Sports Betting Analysis for Australia",
    intro:
      "ThinkBetAI helps Australian users review AFL, NRL, cricket, rugby, tennis and major US sports with model probabilities, odds context and risk-aware analysis.",
    heroEyebrow: "Australia AI Betting Analysis",
    primarySports: ["AFL", "NRL", "Cricket", "Rugby", "Tennis", "NBA", "NFL", "UFC"],
    marketNotes: [
      "Written for Australian search demand around AFL, NRL, cricket, rugby, tennis and late-night US sports.",
      "Uses probability and odds context to help users evaluate whether a selection is worth further research.",
      "ThinkBetAI is an informational analytics product and does not provide guaranteed outcomes or automated wagering.",
    ],
    toolModules: [
      {
        heading: "AFL, NRL and cricket intent",
        body:
          "The Australia page is not a copied homepage. It focuses on the sports Australian users actually search for while linking into broader AI betting tools.",
      },
      {
        heading: "Market timing and US sports",
        body:
          "Australian users often research US sports at different hours. The page points toward daily picks and analysis tools that refresh around available events.",
      },
      {
        heading: "Risk-first wording",
        body:
          "Australian betting searches can be aggressive, so this page keeps the product positioning grounded in analysis, uncertainty and responsible use.",
      },
    ],
    faqs: [
      {
        question: "Does ThinkBetAI cover Australian sports?",
        answer:
          "The Australia page is built around AFL, NRL, cricket, rugby and tennis questions, with additional coverage for major US sports when data is available.",
      },
      {
        question: "Can ThinkBetAI guarantee AFL or NRL picks?",
        answer:
          "No. ThinkBetAI provides model-based analysis and risk notes. No sports prediction platform can guarantee AFL, NRL or any other result.",
      },
      {
        question: "Is ThinkBetAI an Australian bookmaker?",
        answer:
          "No. ThinkBetAI is an analytics and education platform. It does not operate sportsbook accounts or place wagers.",
      },
    ],
    keywords:
      "AI sports betting Australia, AI betting Australia, AFL AI picks, NRL AI predictions, Australian betting analysis",
  },
};

export const countryPageList = Object.values(countryPageConfigs);

export const languagePageConfigs: Record<LanguageSlug, LanguagePageConfig> = {
  de: {
    slug: "de",
    path: "/de",
    hrefLang: "de-DE",
    htmlLang: "de-DE",
    languageName: "Deutsch",
    marketName: "Deutschland",
    currency: "EUR",
    seoTitle: "KI Sportwetten Analyse | ThinkBetAI",
    seoDescription:
      "Deutschsprachige KI-Sportwetten-Analyse für Fußball, Tennis, Basketball, Eishockey und NFL mit Quotenvergleich und Risikohinweisen.",
    h1: "KI-Sportwetten-Analyse auf Deutsch",
    intro:
      "ThinkBetAI hilft deutschsprachigen Nutzern, Fußball, Tennis, Basketball, Eishockey und US-Sport mit Modellwahrscheinlichkeiten, Quotenvergleich und klaren Risikohinweisen zu prüfen.",
    heroEyebrow: "Deutschsprachige KI-Analyse",
    primarySports: ["Fußball", "Tennis", "Basketball", "Eishockey", "NFL", "Handball", "UFC", "Formel 1"],
    marketNotes: [
      "Deutschland gehört zu den großen europäischen Sportwettenmärkten, mit starker Nachfrage nach Fußball, Tennis und Basketball.",
      "Diese Seite nutzt deutsche Suchbegriffe und erklärt Wahrscheinlichkeit, Quote und Risiko ohne Gewinnversprechen.",
      "ThinkBetAI ist kein Buchmacher und platziert keine Wetten; Nutzer müssen lokale Regeln und Altersgrenzen beachten.",
    ],
    toolModules: [
      {
        heading: "Fußball zuerst",
        body:
          "Die deutsche Seite priorisiert Fußball- und Champions-League-Suchintention, verlinkt aber auch auf Tennis, Basketball, Eishockey und NFL-Analysen.",
      },
      {
        heading: "Quote gegen Modellwahrscheinlichkeit",
        body:
          "Die Analyse vergleicht die implizite Wahrscheinlichkeit einer Quote mit der Modellschätzung, damit Nutzer Wert und Risiko besser einordnen können.",
      },
      {
        heading: "Verantwortungsvolle Nutzung",
        body:
          "Alle Tipps sind Informationsmaterial. Sportwetten bleiben riskant, und kein KI-Modell kann ein Ergebnis garantieren.",
      },
    ],
    faqs: [
      {
        question: "Ist ThinkBetAI ein Buchmacher in Deutschland?",
        answer:
          "Nein. ThinkBetAI ist eine Analyseplattform und kein Buchmacher. Die Seite liefert Wahrscheinlichkeiten, Kontext und Risikohinweise.",
      },
      {
        question: "Deckt ThinkBetAI Fußballwetten auf Deutsch ab?",
        answer:
          "Ja. Die deutsche Seite ist auf Fußball-Suchintention ausgelegt und verbindet sie mit weiteren Sportarten wie Tennis, Basketball, Eishockey und NFL.",
      },
      {
        question: "Garantieren KI-Sportwetten Gewinne?",
        answer:
          "Nein. KI-Analysen können falsch liegen. Sie sollten als Recherche und nicht als sichere Vorhersage genutzt werden.",
      },
    ],
    keywords: "KI Sportwetten, Sportwetten AI, Fußball Prognosen KI, Wettanalyse Deutsch, AI Sportwetten Deutschland",
    labels: {
      primaryCta: "KI-Picks ansehen",
      secondaryCta: "Leitfaden lesen",
      intentHeading: "Für deutschsprachige Wettanalyse gebaut",
      sportsHeading: "Sportarten für diese Sprache",
      templateHeading: "Golden Template für lokale Suche",
      faqHeading: "Häufige Fragen",
      marketSwitcherTitle: "Sprache oder Markt wählen",
    },
  },
  fr: {
    slug: "fr",
    path: "/fr",
    hrefLang: "fr-FR",
    htmlLang: "fr-FR",
    languageName: "Français",
    marketName: "France",
    currency: "EUR",
    seoTitle: "Analyse IA paris sportifs | ThinkBetAI",
    seoDescription:
      "Analyse IA des paris sportifs en français pour football, tennis, basket, rugby et NFL, avec cotes, probabilités et notes de risque.",
    h1: "Analyse IA des paris sportifs en français",
    intro:
      "ThinkBetAI aide les utilisateurs francophones à analyser le football, le tennis, le basket, le rugby et les sports US avec des probabilités de modèle, les cotes et le contexte du match.",
    heroEyebrow: "Analyse IA en français",
    primarySports: ["Football", "Tennis", "Basket", "Rugby", "Cyclisme", "NFL", "NBA", "UFC"],
    marketNotes: [
      "La France est un marché important pour les paris sportifs en ligne, surtout autour du football, du tennis et du rugby.",
      "Cette page cible les recherches en français avec un vocabulaire local et des explications centrées sur la probabilité.",
      "ThinkBetAI fournit une analyse informative; il ne prend pas de paris et ne garantit pas les résultats.",
    ],
    toolModules: [
      {
        heading: "Football, tennis et rugby",
        body:
          "La page française met en avant les sports qui dominent la demande locale tout en reliant les utilisateurs aux outils de picks, d'analyse et de combinés.",
      },
      {
        heading: "Probabilité réelle contre cote proposée",
        body:
          "L'objectif est d'aider les utilisateurs à comparer une cote avec une estimation du modèle avant de décider quoi faire.",
      },
      {
        heading: "Langage de risque clair",
        body:
          "Les paris sportifs comportent un risque financier. La page évite les promesses et présente l'IA comme un outil de recherche.",
      },
    ],
    faqs: [
      {
        question: "ThinkBetAI est-il un bookmaker français ?",
        answer:
          "Non. ThinkBetAI est une plateforme d'analyse sportive et ne gère pas de compte de paris.",
      },
      {
        question: "La page couvre-t-elle le football français ?",
        answer:
          "Oui. Elle cible les recherches liées au football, au tennis, au rugby et aux grands sports internationaux.",
      },
      {
        question: "Les prédictions IA sont-elles garanties ?",
        answer:
          "Non. Les prédictions peuvent perdre. Elles servent à mieux comprendre les probabilités et le risque.",
      },
    ],
    keywords: "IA paris sportifs, pronostics sportifs IA, paris football IA, analyse cotes IA, ThinkBetAI France",
    labels: {
      primaryCta: "Voir les picks IA",
      secondaryCta: "Lire le guide",
      intentHeading: "Conçu pour la recherche sportive francophone",
      sportsHeading: "Sports ciblés par cette page",
      templateHeading: "Golden template pour la recherche locale",
      faqHeading: "Questions fréquentes",
      marketSwitcherTitle: "Choisir une langue ou un marché",
    },
  },
  it: {
    slug: "it",
    path: "/it",
    hrefLang: "it-IT",
    htmlLang: "it-IT",
    languageName: "Italiano",
    marketName: "Italia",
    currency: "EUR",
    seoTitle: "Analisi scommesse sportive AI | ThinkBetAI",
    seoDescription:
      "Analisi AI delle scommesse sportive in italiano per calcio, tennis, basket, MotoGP e NFL con quote, probabilità e rischio.",
    h1: "Analisi AI per scommesse sportive in italiano",
    intro:
      "ThinkBetAI aiuta gli utenti italiani a valutare calcio, tennis, basket, MotoGP e sport americani con probabilità del modello, contesto delle quote e note sul rischio.",
    heroEyebrow: "Analisi AI in italiano",
    primarySports: ["Calcio", "Tennis", "Basket", "MotoGP", "Formula 1", "NFL", "NBA", "UFC"],
    marketNotes: [
      "L'Italia è uno dei mercati di gioco più grandi in Europa, con forte interesse per calcio, tennis e basket.",
      "Questa pagina usa intenti e termini italiani invece di duplicare la homepage inglese.",
      "ThinkBetAI è un prodotto di analisi: non è un bookmaker, non piazza scommesse e non promette profitti.",
    ],
    toolModules: [
      {
        heading: "Calcio al centro",
        body:
          "La pagina italiana mette il calcio al centro della ricerca, ma include anche tennis, basket, motorsport e sport USA.",
      },
      {
        heading: "Quote, probabilità e valore",
        body:
          "Le stime del modello aiutano a confrontare la probabilità reale con la probabilità implicita della quota.",
      },
      {
        heading: "Nessuna promessa di vincita",
        body:
          "Ogni previsione resta incerta. L'analisi serve a informare, non a sostituire il giudizio dell'utente.",
      },
    ],
    faqs: [
      {
        question: "ThinkBetAI è un bookmaker italiano?",
        answer:
          "No. ThinkBetAI è una piattaforma di analisi sportiva e non gestisce conti di gioco o scommesse.",
      },
      {
        question: "Copre pronostici calcio con AI?",
        answer:
          "Sì. La pagina italiana è pensata per chi cerca analisi AI sul calcio e altri sport popolari.",
      },
      {
        question: "Le scommesse AI sono sicure?",
        answer:
          "No. Nessun modello può garantire risultati. Usa l'analisi solo come supporto alla ricerca.",
      },
    ],
    keywords: "scommesse sportive AI, pronostici calcio AI, analisi quote AI, betting AI Italia, ThinkBetAI italiano",
    labels: {
      primaryCta: "Vedi pick AI",
      secondaryCta: "Leggi la guida",
      intentHeading: "Creato per la ricerca italiana sulle scommesse",
      sportsHeading: "Sport target della pagina",
      templateHeading: "Golden template per la ricerca locale",
      faqHeading: "Domande frequenti",
      marketSwitcherTitle: "Scegli lingua o mercato",
    },
  },
  es: {
    slug: "es",
    path: "/es",
    hrefLang: "es-ES",
    htmlLang: "es-ES",
    languageName: "Español",
    marketName: "España y LatAm",
    currency: "EUR",
    seoTitle: "Análisis IA apuestas deportivas | ThinkBetAI",
    seoDescription:
      "Análisis IA de apuestas deportivas en español para fútbol, tenis, baloncesto, béisbol y NFL con cuotas, probabilidad y riesgo.",
    h1: "Análisis IA de apuestas deportivas en español",
    intro:
      "ThinkBetAI ayuda a usuarios hispanohablantes a analizar fútbol, tenis, baloncesto, béisbol y deportes de EE. UU. con probabilidades, cuotas y contexto de riesgo.",
    heroEyebrow: "Análisis IA en español",
    primarySports: ["Fútbol", "Tenis", "Baloncesto", "Béisbol", "Boxeo", "NFL", "NBA", "UFC"],
    marketNotes: [
      "El español cubre España y grandes audiencias de Latinoamérica con fuerte demanda por fútbol y deportes de EE. UU.",
      "Esta página usa términos locales de apuestas, cuotas y pronósticos para evitar una copia de la página principal.",
      "ThinkBetAI no acepta apuestas y no garantiza resultados; muestra análisis y probabilidad para investigación.",
    ],
    toolModules: [
      {
        heading: "Fútbol y deportes globales",
        body:
          "La página española conecta la intención de búsqueda de fútbol con tenis, baloncesto, béisbol, boxeo y deportes estadounidenses.",
      },
      {
        heading: "Cuotas contra probabilidad",
        body:
          "El análisis compara la probabilidad estimada por el modelo con la probabilidad implícita de la cuota disponible.",
      },
      {
        heading: "Uso responsable",
        body:
          "Las apuestas deportivas implican riesgo. La IA ayuda a investigar, pero no convierte una apuesta en segura.",
      },
    ],
    faqs: [
      {
        question: "¿ThinkBetAI es una casa de apuestas?",
        answer:
          "No. ThinkBetAI es una plataforma de análisis y no opera cuentas de apuestas ni maneja fondos.",
      },
      {
        question: "¿La página cubre pronósticos de fútbol con IA?",
        answer:
          "Sí. El fútbol es el enfoque principal junto con tenis, baloncesto, béisbol y deportes de EE. UU.",
      },
      {
        question: "¿La IA garantiza ganancias?",
        answer:
          "No. Ningún modelo puede garantizar resultados. Usa el análisis como una señal de investigación.",
      },
    ],
    keywords: "apuestas deportivas IA, pronósticos fútbol IA, análisis de cuotas IA, betting AI español, apuestas con IA",
    labels: {
      primaryCta: "Ver picks IA",
      secondaryCta: "Leer la guía",
      intentHeading: "Creado para búsquedas de apuestas en español",
      sportsHeading: "Deportes objetivo",
      templateHeading: "Golden template para búsqueda local",
      faqHeading: "Preguntas frecuentes",
      marketSwitcherTitle: "Elegir idioma o mercado",
    },
  },
  "pt-br": {
    slug: "pt-br",
    path: "/pt-br",
    hrefLang: "pt-BR",
    htmlLang: "pt-BR",
    languageName: "Português",
    marketName: "Brasil",
    currency: "BRL",
    seoTitle: "IA para apostas esportivas | ThinkBetAI",
    seoDescription:
      "Análise de apostas esportivas com IA em português para futebol, tênis, basquete, vôlei e NFL, com odds, probabilidades e risco.",
    h1: "Análise de apostas esportivas com IA em português",
    intro:
      "ThinkBetAI ajuda usuários brasileiros a analisar futebol, tênis, basquete, vôlei e esportes americanos com probabilidades de modelo, odds e contexto de risco.",
    heroEyebrow: "IA para apostas no Brasil",
    primarySports: ["Futebol", "Tênis", "Basquete", "Vôlei", "MMA", "NFL", "NBA", "Fórmula 1"],
    marketNotes: [
      "O Brasil tem enorme demanda por futebol e um mercado regulado em desenvolvimento, então a página usa português do Brasil.",
      "A análise foca em odds, probabilidade implícita, valor esperado e risco, sem prometer ganhos.",
      "ThinkBetAI é uma plataforma de análise; não é casa de apostas e não faz apostas pelos usuários.",
    ],
    toolModules: [
      {
        heading: "Futebol brasileiro e europeu",
        body:
          "A página em português prioriza buscas por futebol, mas também inclui tênis, basquete, vôlei, MMA e esportes dos EUA.",
      },
      {
        heading: "Odds e probabilidade",
        body:
          "A IA ajuda a comparar a probabilidade estimada com a probabilidade implícita nas odds antes de qualquer decisão.",
      },
      {
        heading: "Mercado com regras próprias",
        body:
          "Usuários devem verificar as regras locais e usar a análise apenas como informação, nunca como garantia.",
      },
    ],
    faqs: [
      {
        question: "ThinkBetAI é uma casa de apostas no Brasil?",
        answer:
          "Não. ThinkBetAI é uma plataforma de análise esportiva e não opera apostas nem contas de jogo.",
      },
      {
        question: "A página cobre palpites de futebol com IA?",
        answer:
          "Sim. Futebol é o foco principal, junto com outros esportes populares no Brasil e nos EUA.",
      },
      {
        question: "A IA garante lucro?",
        answer:
          "Não. Nenhuma previsão esportiva é garantida. Use a análise como apoio à pesquisa.",
      },
    ],
    keywords: "apostas esportivas IA, palpites futebol IA, análise de odds IA, betting AI Brasil, inteligência artificial apostas",
    labels: {
      primaryCta: "Ver picks de IA",
      secondaryCta: "Ler guia",
      intentHeading: "Criado para buscas brasileiras de apostas",
      sportsHeading: "Esportes desta página",
      templateHeading: "Golden template para busca local",
      faqHeading: "Perguntas frequentes",
      marketSwitcherTitle: "Escolher idioma ou mercado",
    },
  },
  hi: {
    slug: "hi",
    path: "/hi",
    hrefLang: "hi-IN",
    htmlLang: "hi-IN",
    languageName: "हिन्दी",
    marketName: "भारत",
    currency: "INR",
    seoTitle: "AI स्पोर्ट्स बेटिंग हिंदी | ThinkBetAI",
    seoDescription:
      "हिंदी में AI स्पोर्ट्स बेटिंग विश्लेषण: क्रिकेट, फुटबॉल, टेनिस, कबड्डी और NBA के लिए odds, probability और risk notes.",
    h1: "हिंदी में AI स्पोर्ट्स बेटिंग विश्लेषण",
    intro:
      "ThinkBetAI हिंदी उपयोगकर्ताओं को क्रिकेट, फुटबॉल, टेनिस, कबड्डी और अंतरराष्ट्रीय खेलों के लिए model probability, odds context और risk notes समझने में मदद करता है.",
    heroEyebrow: "हिंदी AI Betting Analysis",
    primarySports: ["Cricket", "Football", "Tennis", "Kabaddi", "NBA", "NFL", "UFC", "Badminton"],
    marketNotes: [
      "भारत में क्रिकेट और मोबाइल-first sports content की मांग बहुत बड़ी है, इसलिए यह पेज हिंदी users पर केंद्रित है.",
      "कानूनी स्थिति राज्य और product type के हिसाब से बदल सकती है; उपयोगकर्ता स्थानीय नियम खुद verify करें.",
      "ThinkBetAI केवल analysis देता है. यह bookmaker नहीं है और किसी भी result की guarantee नहीं देता.",
    ],
    toolModules: [
      {
        heading: "Cricket-first intent",
        body:
          "हिंदी पेज cricket betting analysis questions को प्राथमिकता देता है, लेकिन football, tennis, kabaddi और US sports को भी जोड़ता है.",
      },
      {
        heading: "Odds और probability",
        body:
          "AI model implied probability और market odds की तुलना करके risk और value को समझने में मदद करता है.",
      },
      {
        heading: "Responsible research",
        body:
          "Sports betting risky है. AI analysis को research signal की तरह use करें, guaranteed pick की तरह नहीं.",
      },
    ],
    faqs: [
      {
        question: "क्या ThinkBetAI भारत में bookmaker है?",
        answer:
          "नहीं. ThinkBetAI sports analysis platform है. यह bet place नहीं करता और user funds handle नहीं करता.",
      },
      {
        question: "क्या यह cricket betting analysis cover करता है?",
        answer:
          "हाँ. हिंदी पेज cricket-first intent के लिए बनाया गया है, साथ में football, tennis और अन्य sports भी हैं.",
      },
      {
        question: "क्या AI picks guaranteed हैं?",
        answer:
          "नहीं. कोई भी AI model sports results guarantee नहीं कर सकता. इसे केवल research के लिए use करें.",
      },
    ],
    keywords: "AI sports betting Hindi, cricket betting AI, sports prediction Hindi, AI betting India, cricket AI picks",
    labels: {
      primaryCta: "AI picks देखें",
      secondaryCta: "Guide पढ़ें",
      intentHeading: "Hindi sports betting research के लिए बनाया गया",
      sportsHeading: "इस पेज के sports",
      templateHeading: "Local search के लिए golden template",
      faqHeading: "सवाल और जवाब",
      marketSwitcherTitle: "Language या market चुनें",
    },
  },
  nl: {
    slug: "nl",
    path: "/nl",
    hrefLang: "nl-NL",
    htmlLang: "nl-NL",
    languageName: "Nederlands",
    marketName: "Nederland",
    currency: "EUR",
    seoTitle: "AI sportweddenschappen analyse | ThinkBetAI",
    seoDescription:
      "Nederlandse AI-analyse voor sportweddenschappen op voetbal, tennis, darts, wielrennen en NBA met odds, kansen en risiconotities.",
    h1: "AI-analyse voor sportweddenschappen in het Nederlands",
    intro:
      "ThinkBetAI helpt Nederlandstalige gebruikers voetbal, tennis, darts, wielrennen en internationale sporten te analyseren met modelkansen, odds-context en risiconotities.",
    heroEyebrow: "Nederlandse AI-analyse",
    primarySports: ["Voetbal", "Tennis", "Darts", "Wielrennen", "Formule 1", "NBA", "NFL", "UFC"],
    marketNotes: [
      "Nederland heeft sterke online betting-zoekvraag rond voetbal, tennis, darts en live odds.",
      "Deze pagina gebruikt Nederlandse termen en lokale sportcontext in plaats van een kopie van de homepage.",
      "ThinkBetAI is analyse-software en geen bookmaker. Resultaten blijven onzeker.",
    ],
    toolModules: [
      {
        heading: "Voetbal, tennis en darts",
        body:
          "De Nederlandse pagina sluit aan op de sportintentie die gebruikers echt zoeken en linkt daarna naar bredere AI tools.",
      },
      {
        heading: "Odds en modelkans",
        body:
          "De analyse vergelijkt de impliciete kans van odds met de kans die het model inschat.",
      },
      {
        heading: "Geen gegarandeerde winst",
        body:
          "AI kan helpen met onderzoek, maar sport blijft onzeker en financieel riskant.",
      },
    ],
    faqs: [
      {
        question: "Is ThinkBetAI een bookmaker in Nederland?",
        answer:
          "Nee. ThinkBetAI is een analyseplatform en neemt geen weddenschappen aan.",
      },
      {
        question: "Welke sporten staan centraal?",
        answer:
          "Voetbal, tennis, darts, wielrennen, Formule 1 en internationale competities staan centraal.",
      },
      {
        question: "Zijn AI voorspellingen zeker?",
        answer:
          "Nee. AI voorspellingen zijn onderzoekssignalen, geen garantie.",
      },
    ],
    keywords: "AI sportweddenschappen, voetbal voorspellingen AI, betting AI Nederland, odds analyse AI, sport analyse Nederlands",
    labels: {
      primaryCta: "Bekijk AI picks",
      secondaryCta: "Lees de gids",
      intentHeading: "Gebouwd voor Nederlandse betting research",
      sportsHeading: "Sporten voor deze pagina",
      templateHeading: "Golden template voor lokale zoekopdrachten",
      faqHeading: "Veelgestelde vragen",
      marketSwitcherTitle: "Kies taal of markt",
    },
  },
  pl: {
    slug: "pl",
    path: "/pl",
    hrefLang: "pl-PL",
    htmlLang: "pl-PL",
    languageName: "Polski",
    marketName: "Polska",
    currency: "PLN",
    seoTitle: "Analiza zakładów sportowych AI | ThinkBetAI",
    seoDescription:
      "Polska analiza zakładów sportowych AI dla piłki nożnej, tenisa, siatkówki, koszykówki i NFL z kursami, prawdopodobieństwem i ryzykiem.",
    h1: "Analiza zakładów sportowych AI po polsku",
    intro:
      "ThinkBetAI pomaga polskim użytkownikom analizować piłkę nożną, tenis, siatkówkę, koszykówkę i sporty USA za pomocą prawdopodobieństw modelu, kursów i kontekstu ryzyka.",
    heroEyebrow: "Polska analiza AI",
    primarySports: ["Piłka nożna", "Tenis", "Siatkówka", "Koszykówka", "Żużel", "NFL", "NBA", "MMA"],
    marketNotes: [
      "Polskie wyszukiwania sportowe często skupiają się na piłce nożnej, tenisie, siatkówce i kursach bukmacherskich.",
      "Ta strona ma polskie treści, FAQ i linki, a nie prostą kopię angielskiej strony głównej.",
      "ThinkBetAI nie jest bukmacherem i nie gwarantuje wyników. To narzędzie analityczne.",
    ],
    toolModules: [
      {
        heading: "Piłka nożna i tenis",
        body:
          "Polska strona skupia się na najważniejszych lokalnych intencjach wyszukiwania i prowadzi dalej do picks, analiz oraz parlay tools.",
      },
      {
        heading: "Kurs kontra prawdopodobieństwo",
        body:
          "Model pomaga porównać prawdopodobieństwo implikowane przez kurs z szacunkiem AI.",
      },
      {
        heading: "Ryzyko przede wszystkim",
        body:
          "Zakłady sportowe są ryzykowne. Analiza AI nie usuwa niepewności i nie jest poradą finansową.",
      },
    ],
    faqs: [
      {
        question: "Czy ThinkBetAI jest bukmacherem?",
        answer:
          "Nie. ThinkBetAI jest platformą analityczną i nie przyjmuje zakładów ani środków użytkowników.",
      },
      {
        question: "Czy strona obejmuje polskie typy piłkarskie?",
        answer:
          "Strona jest napisana pod polskie wyszukiwania związane z piłką nożną, tenisem, siatkówką i innymi sportami.",
      },
      {
        question: "Czy AI gwarantuje wygraną?",
        answer:
          "Nie. Żaden model AI nie gwarantuje wyników. Używaj go jako wsparcia analizy.",
      },
    ],
    keywords: "zakłady sportowe AI, typy piłka nożna AI, analiza kursów AI, betting AI Polska, typy sportowe AI",
    labels: {
      primaryCta: "Zobacz typy AI",
      secondaryCta: "Czytaj przewodnik",
      intentHeading: "Stworzone dla polskiej analizy zakładów",
      sportsHeading: "Sporty na tej stronie",
      templateHeading: "Lokalny przewodnik ThinkBetAI",
      faqHeading: "Najczęstsze pytania",
      marketSwitcherTitle: "Wybierz język lub rynek",
    },
  },
  sv: {
    slug: "sv",
    path: "/sv",
    hrefLang: "sv-SE",
    htmlLang: "sv-SE",
    languageName: "Svenska",
    marketName: "Sverige",
    currency: "SEK",
    seoTitle: "AI sportspel analys | ThinkBetAI",
    seoDescription:
      "Svensk AI-analys för sportspel på fotboll, ishockey, tennis, trav och NFL med odds, sannolikheter och riskförklaring.",
    h1: "AI-analys för sportspel på svenska",
    intro:
      "ThinkBetAI hjälper svenskspråkiga användare att analysera fotboll, ishockey, tennis, trav och internationella sporter med modellodds, sannolikhet och risk.",
    heroEyebrow: "Svensk AI-analys",
    primarySports: ["Fotboll", "Ishockey", "Tennis", "Trav", "Handboll", "NFL", "NBA", "UFC"],
    marketNotes: [
      "Sverige och Norden har stark digital spelvana, särskilt kring fotboll, ishockey, tennis och trav.",
      "Den här sidan använder svensk terminologi och lokala sportintressen i stället för duplicerat engelskt innehåll.",
      "ThinkBetAI är ett analysverktyg, inte ett spelbolag, och garanterar aldrig resultat.",
    ],
    toolModules: [
      {
        heading: "Nordisk sportintention",
        body:
          "Sidan fokuserar på svensk sökintention kring fotboll, hockey, tennis och trav, men länkar även till bredare AI-verktyg.",
      },
      {
        heading: "Odds och sannolikhet",
        body:
          "Analysen jämför marknadens implicita sannolikhet med modellens egen uppskattning.",
      },
      {
        heading: "Ansvarsfull analys",
        body:
          "Sportspel innebär risk. AI ska användas som research, inte som ett löfte om vinst.",
      },
    ],
    faqs: [
      {
        question: "Är ThinkBetAI ett svenskt spelbolag?",
        answer:
          "Nej. ThinkBetAI är en analysplattform och tar inte emot spel eller insättningar.",
      },
      {
        question: "Vilka sporter passar sidan för?",
        answer:
          "Fotboll, ishockey, tennis, trav och större internationella sporter är huvudfokus.",
      },
      {
        question: "Kan AI garantera vinnande spel?",
        answer:
          "Nej. Ingen AI kan garantera sportresultat eller vinst.",
      },
    ],
    keywords: "AI sportspel, betting AI Sverige, fotboll tips AI, odds analys AI, sportspel analys svenska",
    labels: {
      primaryCta: "Se AI picks",
      secondaryCta: "Läs guiden",
      intentHeading: "Byggd för svensk sportspel-research",
      sportsHeading: "Sportfokus",
      templateHeading: "Golden template för lokal sökning",
      faqHeading: "Vanliga frågor",
      marketSwitcherTitle: "Välj språk eller marknad",
    },
  },
  tr: {
    slug: "tr",
    path: "/tr",
    hrefLang: "tr-TR",
    htmlLang: "tr-TR",
    languageName: "Türkçe",
    marketName: "Türkiye",
    currency: "TRY",
    seoTitle: "Yapay zeka spor bahis analizi | ThinkBetAI",
    seoDescription:
      "Türkçe yapay zeka spor bahis analizi: futbol, basketbol, voleybol, tenis ve NBA için oran, olasılık ve risk notları.",
    h1: "Türkçe yapay zeka spor bahis analizi",
    intro:
      "ThinkBetAI Türkçe kullanıcıların futbol, basketbol, voleybol, tenis ve uluslararası sporları model olasılıkları, oran bağlamı ve risk notlarıyla incelemesine yardım eder.",
    heroEyebrow: "Türkçe AI analiz",
    primarySports: ["Futbol", "Basketbol", "Voleybol", "Tenis", "Formula 1", "NBA", "NFL", "UFC"],
    marketNotes: [
      "Türkçe spor aramaları yoğun olarak futbol, basketbol, canlı oranlar ve tahmin kelimeleri etrafında oluşur.",
      "Yasal kurallar ülkeye ve ürüne göre değişebilir; kullanıcılar kendi yerel durumlarını kontrol etmelidir.",
      "ThinkBetAI bahis oynatmaz, para tutmaz ve sonuç garantisi vermez.",
    ],
    toolModules: [
      {
        heading: "Futbol ve basketbol odağı",
        body:
          "Türkçe sayfa yerel arama niyetini futbol ve basketbol üzerinden yakalar, ardından diğer spor ve analiz araçlarına bağlanır.",
      },
      {
        heading: "Oran ve olasılık",
        body:
          "Model, mevcut oranın ima ettiği olasılıkla kendi tahminini karşılaştırmaya yardımcı olur.",
      },
      {
        heading: "Risk dili net",
        body:
          "Spor bahisleri risklidir. AI analizi garanti değil, araştırma desteğidir.",
      },
    ],
    faqs: [
      {
        question: "ThinkBetAI bahis sitesi mi?",
        answer:
          "Hayır. ThinkBetAI analiz platformudur; bahis almaz, hesap açmaz ve para tutmaz.",
      },
      {
        question: "Türkçe futbol tahminleri var mı?",
        answer:
          "Sayfa futbol ve basketbol arama niyetine göre hazırlanmıştır, ayrıca tenis, voleybol ve global sporları kapsar.",
      },
      {
        question: "AI tahminleri kesin mi?",
        answer:
          "Hayır. Hiçbir model spor sonuçlarını garanti edemez.",
      },
    ],
    keywords: "yapay zeka spor bahis, futbol tahmin AI, oran analizi AI, betting AI Türkiye, AI bahis analizi",
    labels: {
      primaryCta: "AI picks gör",
      secondaryCta: "Rehberi oku",
      intentHeading: "Türkçe spor analizi için tasarlandı",
      sportsHeading: "Bu sayfanın sporları",
      templateHeading: "Yerel arama için golden template",
      faqHeading: "Sık sorulan sorular",
      marketSwitcherTitle: "Dil veya pazar seç",
    },
  },
  ja: {
    slug: "ja",
    path: "/ja",
    hrefLang: "ja-JP",
    htmlLang: "ja-JP",
    languageName: "日本語",
    marketName: "日本",
    currency: "JPY",
    seoTitle: "AIスポーツベッティング分析 | ThinkBetAI",
    seoDescription:
      "日本語のAIスポーツ分析。野球、サッカー、テニス、バスケットボール、格闘技のオッズ、確率、試合状況、リスク、モデル根拠、関連ページを整理し、責任ある判断に役立つ保証ではない調査材料としてThinkBetAIで提供します。",
    h1: "日本語のAIスポーツベッティング分析",
    intro:
      "ThinkBetAIは、日本語ユーザーが野球、サッカー、テニス、バスケットボール、格闘技をモデル確率、オッズ、リスクの文脈で確認できるようにします。",
    heroEyebrow: "日本語AIスポーツ分析",
    primarySports: ["Baseball", "Soccer", "Tennis", "Basketball", "MMA", "NBA", "NFL", "Golf"],
    marketNotes: [
      "日本語ページは野球、サッカー、テニス、バスケットボールなどの検索意図に合わせています。",
      "国や地域によって利用できるサービスやルールは異なるため、ユーザーは必ず現地の規則を確認してください。",
      "ThinkBetAIは分析ツールであり、ブックメーカーではなく、結果を保証しません。",
    ],
    toolModules: [
      {
        heading: "日本語検索向けの構成",
        body:
          "このページは英語ページのコピーではなく、日本語のスポーツ分析キーワードと競技関心に合わせています。",
      },
      {
        heading: "オッズと確率",
        body:
          "AIモデルの推定確率と市場のオッズを比較し、リスクを理解するための材料を提供します。",
      },
      {
        heading: "責任ある利用",
        body:
          "スポーツの結果は不確実です。AI分析は参考情報であり、利益や的中を保証するものではありません。",
      },
    ],
    faqs: [
      {
        question: "ThinkBetAIはブックメーカーですか？",
        answer:
          "いいえ。ThinkBetAIは分析プラットフォームであり、賭けを受け付けたり資金を預かったりしません。",
      },
      {
        question: "日本語で野球やサッカーの分析を見られますか？",
        answer:
          "はい。このページは野球、サッカー、テニス、バスケットボールなどの検索意図に合わせています。",
      },
      {
        question: "AI予測は必ず当たりますか？",
        answer:
          "いいえ。どのAIモデルもスポーツ結果を保証することはできません。",
      },
    ],
    keywords: "AI スポーツベッティング, スポーツ予測 AI, オッズ分析 AI, 日本語 スポーツ分析, ThinkBetAI 日本",
    labels: {
      primaryCta: "AI picksを見る",
      secondaryCta: "ガイドを読む",
      intentHeading: "日本語のスポーツ分析検索向け",
      sportsHeading: "対象スポーツ",
      templateHeading: "ローカル検索向けgolden template",
      faqHeading: "よくある質問",
      marketSwitcherTitle: "言語または市場を選択",
    },
  },
};

export const languagePageList = Object.values(languagePageConfigs);

export const globalMarketAlternates = [
  { hrefLang: "x-default", href: "https://thinkbetai.com/" },
  { hrefLang: "en-US", href: "https://thinkbetai.com/" },
  ...countryPageList.map((page) => ({
    hrefLang: page.hrefLang,
    href: `https://thinkbetai.com${page.path}`,
  })),
  ...languagePageList.map((page) => ({
    hrefLang: page.hrefLang,
    href: `https://thinkbetai.com${page.path}`,
  })),
];

export const englishMarketAlternates = globalMarketAlternates;

export const getCountryPageConfig = (slug: CountrySlug) => countryPageConfigs[slug];
export const getLanguagePageConfig = (slug: LanguageSlug) => languagePageConfigs[slug];
