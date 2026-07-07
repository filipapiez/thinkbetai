import {
  globalMarketAlternates,
  languagePageList,
  LanguagePageConfig,
  LanguageSlug,
} from "./countryPages";

export type LocalizedSeoTopicSlug =
  | "ai-sports-betting"
  | "free-ai-predictions"
  | "ai-sports-picks"
  | "ai-parlay-builder"
  | "ai-bet-analyzer"
  | "best-ai-betting-app"
  | "best-ai-sports-betting-tools"
  | "ai-nfl-picks"
  | "nba-ai-predictions"
  | "mlb-ai-predictions"
  | "nhl-ai-predictions"
  | "soccer-ai-predictions"
  | "ai-player-prop-predictions"
  | "ai-underdog-picks"
  | "ai-against-the-spread-picks"
  | "ai-pick-of-the-day"
  | "free-ai-sports-betting-app"
  | "best-ai-sports-picks"
  | "ai-betting-predictions"
  | "ai-odds-comparison";

interface TopicTerms {
  slug: LocalizedSeoTopicSlug;
  englishLabel: string;
  marketType: string;
  terms: Record<LanguageSlug, string>;
}

interface LocalizedSeoLabels {
  primaryCta: string;
  englishCanonical: string;
  languageHub: string;
  responsibleGambling: string;
  marketSports: string;
  responsibleBadge: string;
  faqHeading: string;
  responsibleText: string;
  relatedBadge: string;
  relatedHeading: string;
  relatedText: string;
  softwareDescription: string;
  offerDescription: string;
}

type LocalizedSeoLabelSource = Omit<LocalizedSeoLabels, "softwareDescription"> & {
  softwareDescription: (term: string) => string;
};

export interface LocalizedSeoPage {
  languageSlug: LanguageSlug;
  topicSlug: LocalizedSeoTopicSlug;
  localizedSlug: string;
  path: `/${LanguageSlug}/${string}`;
  legacyPath: `/${LanguageSlug}/${LocalizedSeoTopicSlug}`;
  englishPath: `/${LocalizedSeoTopicSlug}`;
  hrefLang: string;
  htmlLang: string;
  languageName: string;
  marketName: string;
  currency: string;
  term: string;
  englishLabel: string;
  marketType: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  keywords: string;
  primarySports: string[];
  modules: Array<{ heading: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  links: Array<{ label: string; href: string }>;
  alternates: Array<{ hrefLang: string; href: string }>;
  labels: LocalizedSeoLabels;
}

const BASE = "https://thinkbetai.com";

const localizedUiLabels: Record<LanguageSlug, LocalizedSeoLabelSource> = {
  de: {
    primaryCta: "KI Sport Tipps ansehen",
    englishCanonical: "Englische Hauptseite",
    languageHub: "Deutscher Hub",
    responsibleGambling: "Verantwortungsvolle Nutzung",
    marketSports: "Sportarten im Markt",
    responsibleBadge: "Verantwortungsvolle Analyse",
    faqHeading: "Häufige Fragen",
    responsibleText:
      "ThinkBetAI bietet Sportanalyse und Bildung. Es führt keine Wettkonten, hält keine Gelder, platziert keine Wetten und garantiert keine Ergebnisse.",
    relatedBadge: "Verwandte Seiten",
    relatedHeading: "Weiter in diesem Markt recherchieren",
    relatedText:
      "Diese Links verbinden die Seite mit dem englischen Themencluster, dem deutschen Hub, wichtigen Tools und Seiten zur verantwortungsvollen Nutzung.",
    softwareDescription: (term) =>
      `${term} mit KI-gestützten Wahrscheinlichkeiten, Quotenvergleich und Risikohinweisen.`,
    offerDescription: "Kostenlose öffentliche Vorschauen und optionale kostenpflichtige Pläne sind verfügbar.",
  },
  fr: {
    primaryCta: "Voir les picks IA",
    englishCanonical: "Page anglaise principale",
    languageHub: "Hub français",
    responsibleGambling: "Jeu responsable",
    marketSports: "Sports du marché",
    responsibleBadge: "Analyse responsable",
    faqHeading: "Questions fréquentes",
    responsibleText:
      "ThinkBetAI fournit de l'analyse sportive et du contenu éducatif. Il ne gère pas de compte bookmaker, ne détient pas de fonds, ne place pas de paris et ne garantit pas de résultats.",
    relatedBadge: "Pages liées",
    relatedHeading: "Continuer la recherche sur ce marché",
    relatedText:
      "Ces liens relient cette page au cluster anglais, au hub français, aux outils importants et aux pages de jeu responsable.",
    softwareDescription: (term) =>
      `${term} avec probabilités assistées par IA, contexte des cotes et notes de risque.`,
    offerDescription: "Des aperçus publics gratuits et des plans payants optionnels sont disponibles.",
  },
  it: {
    primaryCta: "Vedi pick AI",
    englishCanonical: "Pagina inglese principale",
    languageHub: "Hub italiano",
    responsibleGambling: "Gioco responsabile",
    marketSports: "Sport del mercato",
    responsibleBadge: "Analisi responsabile",
    faqHeading: "Domande frequenti",
    responsibleText:
      "ThinkBetAI offre analisi sportive e contenuti educativi. Non gestisce conti bookmaker, non custodisce fondi, non piazza scommesse e non garantisce risultati.",
    relatedBadge: "Pagine correlate",
    relatedHeading: "Continua la ricerca su questo mercato",
    relatedText:
      "Questi link collegano la pagina al cluster inglese, all'hub italiano, agli strumenti principali e alle pagine di uso responsabile.",
    softwareDescription: (term) =>
      `${term} con probabilità assistite dall'AI, contesto quote e note di rischio.`,
    offerDescription: "Sono disponibili anteprime pubbliche gratuite e piani opzionali a pagamento.",
  },
  es: {
    primaryCta: "Ver picks IA",
    englishCanonical: "Página principal en inglés",
    languageHub: "Hub en español",
    responsibleGambling: "Juego responsable",
    marketSports: "Deportes del mercado",
    responsibleBadge: "Análisis responsable",
    faqHeading: "Preguntas frecuentes",
    responsibleText:
      "ThinkBetAI ofrece análisis deportivo y educación. No opera cuentas de apuestas, no guarda fondos, no realiza apuestas y no garantiza resultados.",
    relatedBadge: "Páginas relacionadas",
    relatedHeading: "Seguir investigando este mercado",
    relatedText:
      "Estos enlaces conectan la página con el cluster inglés, el hub en español, herramientas clave y páginas de uso responsable.",
    softwareDescription: (term) =>
      `${term} con probabilidades asistidas por IA, contexto de cuotas y notas de riesgo.`,
    offerDescription: "Hay vistas públicas gratuitas y planes pagos opcionales disponibles.",
  },
  "pt-br": {
    primaryCta: "Ver picks com IA",
    englishCanonical: "Página principal em inglês",
    languageHub: "Hub em português",
    responsibleGambling: "Jogo responsável",
    marketSports: "Esportes do mercado",
    responsibleBadge: "Análise responsável",
    faqHeading: "Perguntas frequentes",
    responsibleText:
      "ThinkBetAI oferece análise esportiva e educação. Não opera contas de apostas, não guarda fundos, não faz apostas e não garante resultados.",
    relatedBadge: "Páginas relacionadas",
    relatedHeading: "Continue pesquisando este mercado",
    relatedText:
      "Esses links conectam a página ao cluster em inglês, ao hub em português, às ferramentas importantes e às páginas de uso responsável.",
    softwareDescription: (term) =>
      `${term} com probabilidades assistidas por IA, contexto de odds e notas de risco.`,
    offerDescription: "Prévias públicas gratuitas e planos pagos opcionais estão disponíveis.",
  },
  hi: {
    primaryCta: "AI picks देखें",
    englishCanonical: "अंग्रेज़ी मुख्य पेज",
    languageHub: "हिंदी हब",
    responsibleGambling: "जिम्मेदार उपयोग",
    marketSports: "बाजार के खेल",
    responsibleBadge: "जिम्मेदार विश्लेषण",
    faqHeading: "अक्सर पूछे जाने वाले सवाल",
    responsibleText:
      "ThinkBetAI खेल विश्लेषण और शिक्षा देता है. यह bookmaker account नहीं चलाता, funds नहीं रखता, bets place नहीं करता और results guarantee नहीं करता.",
    relatedBadge: "संबंधित पेज",
    relatedHeading: "इस market पर आगे research करें",
    relatedText:
      "ये links पेज को English topic cluster, हिंदी hub, जरूरी tools और responsible-use pages से जोड़ते हैं.",
    softwareDescription: (term) =>
      `${term} के लिए AI-assisted probabilities, odds context और risk notes.`,
    offerDescription: "Free public previews और optional paid plans उपलब्ध हैं.",
  },
  nl: {
    primaryCta: "AI picks bekijken",
    englishCanonical: "Engelse hoofdpagina",
    languageHub: "Nederlandse hub",
    responsibleGambling: "Verantwoord spelen",
    marketSports: "Sporten in deze markt",
    responsibleBadge: "Verantwoorde analyse",
    faqHeading: "Veelgestelde vragen",
    responsibleText:
      "ThinkBetAI biedt sportanalyse en educatie. Het beheert geen bookmakeraccounts, houdt geen geld vast, plaatst geen weddenschappen en garandeert geen resultaten.",
    relatedBadge: "Gerelateerde pagina's",
    relatedHeading: "Verder onderzoek doen in deze markt",
    relatedText:
      "Deze links verbinden de pagina met de Engelse topiccluster, de Nederlandse hub, belangrijke tools en pagina's voor verantwoord gebruik.",
    softwareDescription: (term) =>
      `${term} met AI-ondersteunde kansen, odds-context en risiconotities.`,
    offerDescription: "Gratis openbare previews en optionele betaalde plannen zijn beschikbaar.",
  },
  pl: {
    primaryCta: "Zobacz typy AI",
    englishCanonical: "Główna strona angielska",
    languageHub: "Polski hub",
    responsibleGambling: "Odpowiedzialna gra",
    marketSports: "Sporty w tym rynku",
    responsibleBadge: "Odpowiedzialna analiza",
    faqHeading: "Najczęstsze pytania",
    responsibleText:
      "ThinkBetAI dostarcza analizę sportową i edukację. Nie prowadzi kont bukmacherskich, nie przechowuje środków, nie zawiera zakładów i nie gwarantuje wyników.",
    relatedBadge: "Powiązane strony",
    relatedHeading: "Kontynuuj research tego rynku",
    relatedText:
      "Te linki łączą stronę z angielskim klastrem tematycznym, polskim hubem, ważnymi narzędziami i stronami odpowiedzialnej gry.",
    softwareDescription: (term) =>
      `${term} z prawdopodobieństwami AI, kontekstem kursów i notatkami o ryzyku.`,
    offerDescription: "Dostępne są darmowe publiczne podglądy i opcjonalne płatne plany.",
  },
  sv: {
    primaryCta: "Se AI picks",
    englishCanonical: "Engelsk huvudsida",
    languageHub: "Svensk hubb",
    responsibleGambling: "Ansvarsfullt spelande",
    marketSports: "Sporter i marknaden",
    responsibleBadge: "Ansvarsfull analys",
    faqHeading: "Vanliga frågor",
    responsibleText:
      "ThinkBetAI erbjuder sportanalys och utbildning. Det driver inga spelkonton, håller inga pengar, placerar inga spel och garanterar inga resultat.",
    relatedBadge: "Relaterade sidor",
    relatedHeading: "Fortsätt undersöka denna marknad",
    relatedText:
      "Dessa länkar kopplar sidan till det engelska ämnesklustret, den svenska hubben, viktiga verktyg och sidor för ansvarsfull användning.",
    softwareDescription: (term) =>
      `${term} med AI-stödda sannolikheter, oddskontext och risknotiser.`,
    offerDescription: "Gratis offentliga förhandsvisningar och valfria betalda planer finns tillgängliga.",
  },
  tr: {
    primaryCta: "AI tahminlerini gör",
    englishCanonical: "İngilizce ana sayfa",
    languageHub: "Türkçe merkez",
    responsibleGambling: "Sorumlu kullanım",
    marketSports: "Bu pazardaki sporlar",
    responsibleBadge: "Sorumlu analiz",
    faqHeading: "Sık sorulan sorular",
    responsibleText:
      "ThinkBetAI spor analizi ve eğitim sunar. Bahis hesabı işletmez, para tutmaz, bahis yapmaz ve sonuç garantisi vermez.",
    relatedBadge: "İlgili sayfalar",
    relatedHeading: "Bu pazarı araştırmaya devam et",
    relatedText:
      "Bu linkler sayfayı İngilizce konu kümesine, Türkçe merkeze, önemli araçlara ve sorumlu kullanım sayfalarına bağlar.",
    softwareDescription: (term) =>
      `${term} için AI destekli olasılıklar, oran bağlamı ve risk notları.`,
    offerDescription: "Ücretsiz herkese açık önizlemeler ve isteğe bağlı ücretli planlar mevcuttur.",
  },
  ja: {
    primaryCta: "AIピックを見る",
    englishCanonical: "英語の主要ページ",
    languageHub: "日本語ハブ",
    responsibleGambling: "責任ある利用",
    marketSports: "対象スポーツ",
    responsibleBadge: "責任ある分析",
    faqHeading: "よくある質問",
    responsibleText:
      "ThinkBetAIはスポーツ分析と教育情報を提供します。ブックメーカー口座を運営せず、資金を預からず、賭けを行わず、結果を保証しません。",
    relatedBadge: "関連ページ",
    relatedHeading: "この市場の調査を続ける",
    relatedText:
      "これらのリンクは、英語のトピッククラスター、日本語ハブ、主要ツール、責任ある利用ページにつながります。",
    softwareDescription: (term) =>
      `${term}のAI確率、オッズ文脈、リスク説明を整理します。`,
    offerDescription: "無料の公開プレビューと任意の有料プランを利用できます。",
  },
};

export const localizedSeoTopics: TopicTerms[] = [
  {
    slug: "ai-sports-betting",
    englishLabel: "AI sports betting",
    marketType: "Core guide",
    terms: {
      de: "KI Sportwetten",
      fr: "Paris sportifs IA",
      it: "Scommesse sportive AI",
      es: "Apuestas deportivas IA",
      "pt-br": "Apostas esportivas com IA",
      hi: "AI स्पोर्ट्स बेटिंग",
      nl: "AI sportweddenschappen",
      pl: "Zakłady sportowe AI",
      sv: "AI sportspel",
      tr: "Yapay zeka spor bahis",
      ja: "AIスポーツベッティング",
    },
  },
  {
    slug: "free-ai-predictions",
    englishLabel: "free AI predictions",
    marketType: "Free predictions",
    terms: {
      de: "Kostenlose KI Prognosen",
      fr: "Pronostics IA gratuits",
      it: "Pronostici AI gratis",
      es: "Pronósticos IA gratis",
      "pt-br": "Palpites grátis com IA",
      hi: "मुफ्त AI भविष्यवाणियां",
      nl: "Gratis AI voorspellingen",
      pl: "Darmowe typy AI",
      sv: "Gratis AI tips",
      tr: "Ücretsiz AI tahminleri",
      ja: "無料AI予測",
    },
  },
  {
    slug: "ai-sports-picks",
    englishLabel: "AI sports picks",
    marketType: "Daily picks",
    terms: {
      de: "KI Sport Tipps",
      fr: "Picks sportifs IA",
      it: "Pick sportivi AI",
      es: "Picks deportivos IA",
      "pt-br": "Picks esportivos com IA",
      hi: "AI स्पोर्ट्स picks",
      nl: "AI sport picks",
      pl: "Typy sportowe AI",
      sv: "AI sport picks",
      tr: "AI spor picks",
      ja: "AIスポーツピック",
    },
  },
  {
    slug: "ai-parlay-builder",
    englishLabel: "AI parlay builder",
    marketType: "Parlay tool",
    terms: {
      de: "KI Kombiwetten Builder",
      fr: "Constructeur de combinés IA",
      it: "Builder multiple AI",
      es: "Constructor de combinadas IA",
      "pt-br": "Construtor de múltiplas com IA",
      hi: "AI parlay builder",
      nl: "AI combi builder",
      pl: "Builder kuponów AI",
      sv: "AI kombinationsbyggare",
      tr: "AI kupon oluşturucu",
      ja: "AIパーレービルダー",
    },
  },
  {
    slug: "ai-bet-analyzer",
    englishLabel: "AI bet analyzer",
    marketType: "Bet analyzer",
    terms: {
      de: "KI Wettanalyse",
      fr: "Analyseur de pari IA",
      it: "Analizzatore scommesse AI",
      es: "Analizador de apuestas IA",
      "pt-br": "Analisador de apostas com IA",
      hi: "AI bet analyzer",
      nl: "AI bet analyzer",
      pl: "Analizator zakładów AI",
      sv: "AI spelanalys",
      tr: "AI bahis analiz aracı",
      ja: "AIベット分析",
    },
  },
  {
    slug: "best-ai-betting-app",
    englishLabel: "best AI betting app",
    marketType: "Commercial comparison",
    terms: {
      de: "Beste KI Wett App",
      fr: "Meilleure app de paris IA",
      it: "Migliore app betting AI",
      es: "Mejor app apuestas IA",
      "pt-br": "Melhor app de apostas com IA",
      hi: "सबसे अच्छी AI betting app",
      nl: "Beste AI betting app",
      pl: "Najlepsza aplikacja AI",
      sv: "Bästa AI betting app",
      tr: "En iyi AI bahis uygulaması",
      ja: "最高のAIベッティングアプリ",
    },
  },
  {
    slug: "best-ai-sports-betting-tools",
    englishLabel: "best AI sports betting tools",
    marketType: "Tool comparison",
    terms: {
      de: "Beste KI Sportwetten Tools",
      fr: "Meilleurs outils IA de paris sportifs",
      it: "Migliori tool AI scommesse",
      es: "Mejores herramientas IA apuestas",
      "pt-br": "Melhores ferramentas IA para apostas",
      hi: "सबसे अच्छे AI betting tools",
      nl: "Beste AI betting tools",
      pl: "Najlepsze narzędzia AI do zakładów",
      sv: "Bästa AI betting verktyg",
      tr: "En iyi AI spor bahis araçları",
      ja: "最高のAIスポーツ分析ツール",
    },
  },
  {
    slug: "ai-nfl-picks",
    englishLabel: "AI NFL picks",
    marketType: "NFL",
    terms: {
      de: "KI NFL Tipps",
      fr: "Picks NFL IA",
      it: "Pick NFL AI",
      es: "Picks NFL IA",
      "pt-br": "Picks NFL com IA",
      hi: "AI NFL picks",
      nl: "AI NFL picks",
      pl: "Typy NFL AI",
      sv: "AI NFL picks",
      tr: "AI NFL tahminleri",
      ja: "AI NFLピック",
    },
  },
  {
    slug: "nba-ai-predictions",
    englishLabel: "NBA AI predictions",
    marketType: "NBA",
    terms: {
      de: "NBA KI Prognosen",
      fr: "Pronostics NBA IA",
      it: "Pronostici NBA AI",
      es: "Pronósticos NBA IA",
      "pt-br": "Palpites NBA com IA",
      hi: "NBA AI भविष्यवाणियां",
      nl: "NBA AI voorspellingen",
      pl: "Prognozy NBA AI",
      sv: "NBA AI prognoser",
      tr: "NBA AI tahminleri",
      ja: "NBA AI予測",
    },
  },
  {
    slug: "mlb-ai-predictions",
    englishLabel: "MLB AI predictions",
    marketType: "MLB",
    terms: {
      de: "MLB KI Prognosen",
      fr: "Pronostics MLB IA",
      it: "Pronostici MLB AI",
      es: "Pronósticos MLB IA",
      "pt-br": "Palpites MLB com IA",
      hi: "MLB AI भविष्यवाणियां",
      nl: "MLB AI voorspellingen",
      pl: "Prognozy MLB AI",
      sv: "MLB AI prognoser",
      tr: "MLB AI tahminleri",
      ja: "MLB AI予測",
    },
  },
  {
    slug: "nhl-ai-predictions",
    englishLabel: "NHL AI predictions",
    marketType: "NHL",
    terms: {
      de: "NHL KI Prognosen",
      fr: "Pronostics NHL IA",
      it: "Pronostici NHL AI",
      es: "Pronósticos NHL IA",
      "pt-br": "Palpites NHL com IA",
      hi: "NHL AI भविष्यवाणियां",
      nl: "NHL AI voorspellingen",
      pl: "Prognozy NHL AI",
      sv: "NHL AI prognoser",
      tr: "NHL AI tahminleri",
      ja: "NHL AI予測",
    },
  },
  {
    slug: "soccer-ai-predictions",
    englishLabel: "soccer AI predictions",
    marketType: "Soccer",
    terms: {
      de: "Fußball KI Prognosen",
      fr: "Pronostics football IA",
      it: "Pronostici calcio AI",
      es: "Pronósticos fútbol IA",
      "pt-br": "Palpites futebol com IA",
      hi: "football AI भविष्यवाणियां",
      nl: "Voetbal AI voorspellingen",
      pl: "Prognozy piłkarskie AI",
      sv: "Fotboll AI prognoser",
      tr: "Futbol AI tahminleri",
      ja: "サッカーAI予測",
    },
  },
  {
    slug: "ai-player-prop-predictions",
    englishLabel: "AI player prop predictions",
    marketType: "Player props",
    terms: {
      de: "KI Spieler Props",
      fr: "Props joueurs IA",
      it: "Player prop AI",
      es: "Props de jugadores IA",
      "pt-br": "Props de jogadores com IA",
      hi: "AI player prop भविष्यवाणियां",
      nl: "AI player props",
      pl: "Player props AI",
      sv: "AI spelarprops",
      tr: "AI oyuncu prop tahminleri",
      ja: "AI選手プロップ予測",
    },
  },
  {
    slug: "ai-underdog-picks",
    englishLabel: "AI underdog picks",
    marketType: "Underdogs",
    terms: {
      de: "KI Außenseiter Tipps",
      fr: "Picks outsiders IA",
      it: "Pick underdog AI",
      es: "Picks underdog IA",
      "pt-br": "Picks zebra com IA",
      hi: "AI underdog picks",
      nl: "AI underdog picks",
      pl: "Typy underdog AI",
      sv: "AI underdog picks",
      tr: "AI sürpriz bahis tahminleri",
      ja: "AIアンダードッグピック",
    },
  },
  {
    slug: "ai-against-the-spread-picks",
    englishLabel: "AI against the spread picks",
    marketType: "Spread picks",
    terms: {
      de: "KI Spread Tipps",
      fr: "Picks spread IA",
      it: "Pick spread AI",
      es: "Picks spread IA",
      "pt-br": "Picks spread com IA",
      hi: "AI spread picks",
      nl: "AI spread picks",
      pl: "Typy spread AI",
      sv: "AI spread picks",
      tr: "AI spread tahminleri",
      ja: "AIスプレッドピック",
    },
  },
  {
    slug: "ai-pick-of-the-day",
    englishLabel: "AI pick of the day",
    marketType: "Pick of the day",
    terms: {
      de: "KI Tipp des Tages",
      fr: "Pick IA du jour",
      it: "Pick AI del giorno",
      es: "Pick IA del día",
      "pt-br": "Pick de IA do dia",
      hi: "आज का AI pick",
      nl: "AI pick van de dag",
      pl: "Typ AI dnia",
      sv: "Dagens AI pick",
      tr: "Günün AI tahmini",
      ja: "今日のAIピック",
    },
  },
  {
    slug: "free-ai-sports-betting-app",
    englishLabel: "free AI sports betting app",
    marketType: "Free app",
    terms: {
      de: "Kostenlose KI Sportwetten App",
      fr: "App gratuite de paris IA",
      it: "App betting AI gratuita",
      es: "App gratis apuestas IA",
      "pt-br": "App grátis de apostas com IA",
      hi: "मुफ्त AI sports betting app",
      nl: "Gratis AI betting app",
      pl: "Darmowa aplikacja AI",
      sv: "Gratis AI betting app",
      tr: "Ücretsiz AI bahis uygulaması",
      ja: "無料AIスポーツ分析アプリ",
    },
  },
  {
    slug: "best-ai-sports-picks",
    englishLabel: "best AI sports picks",
    marketType: "Best picks",
    terms: {
      de: "Beste KI Sport Tipps",
      fr: "Meilleurs picks sportifs IA",
      it: "Migliori pick sportivi AI",
      es: "Mejores picks deportivos IA",
      "pt-br": "Melhores picks esportivos com IA",
      hi: "सबसे अच्छे AI sports picks",
      nl: "Beste AI sport picks",
      pl: "Najlepsze typy sportowe AI",
      sv: "Bästa AI sport picks",
      tr: "En iyi AI spor tahminleri",
      ja: "最高のAIスポーツピック",
    },
  },
  {
    slug: "ai-betting-predictions",
    englishLabel: "AI betting predictions",
    marketType: "Betting predictions",
    terms: {
      de: "KI Wettprognosen",
      fr: "Prédictions de paris IA",
      it: "Previsioni betting AI",
      es: "Predicciones apuestas IA",
      "pt-br": "Previsões de apostas com IA",
      hi: "AI betting भविष्यवाणियां",
      nl: "AI betting voorspellingen",
      pl: "Prognozy zakładów AI",
      sv: "AI betting prognoser",
      tr: "AI bahis tahminleri",
      ja: "AIベッティング予測",
    },
  },
  {
    slug: "ai-odds-comparison",
    englishLabel: "AI odds comparison",
    marketType: "Odds comparison",
    terms: {
      de: "KI Quotenvergleich",
      fr: "Comparaison de cotes IA",
      it: "Confronto quote AI",
      es: "Comparación de cuotas IA",
      "pt-br": "Comparação de odds com IA",
      hi: "AI odds तुलना",
      nl: "AI odds vergelijking",
      pl: "Porównanie kursów AI",
      sv: "AI oddsjämförelse",
      tr: "AI oran karşılaştırması",
      ja: "AIオッズ比較",
    },
  },
];

const localizedTopicSlugs: Record<LocalizedSeoTopicSlug, Record<LanguageSlug, string>> = {
  "ai-sports-betting": {
    de: "ki-sportwetten",
    fr: "paris-sportifs-ia",
    it: "scommesse-sportive-ai",
    es: "apuestas-deportivas-ia",
    "pt-br": "apostas-esportivas-ia",
    hi: "ai-khel-satta",
    nl: "ai-sportweddenschappen",
    pl: "zaklady-sportowe-ai",
    sv: "ai-sportspel",
    tr: "yapay-zeka-spor-bahis",
    ja: "ai-sports-bettingu",
  },
  "free-ai-predictions": {
    de: "kostenlose-ki-prognosen",
    fr: "pronostics-ia-gratuits",
    it: "pronostici-ai-gratis",
    es: "pronosticos-ia-gratis",
    "pt-br": "palpites-gratis-ia",
    hi: "muft-ai-bhavishyavani",
    nl: "gratis-ai-voorspellingen",
    pl: "darmowe-typy-ai",
    sv: "gratis-ai-tips",
    tr: "ucretsiz-ai-tahminleri",
    ja: "muryo-ai-yosoku",
  },
  "ai-sports-picks": {
    de: "ki-sport-tipps",
    fr: "picks-sportifs-ia",
    it: "pick-sportivi-ai",
    es: "picks-deportivos-ia",
    "pt-br": "picks-esportivos-ia",
    hi: "ai-khel-picks",
    nl: "ai-sport-picks",
    pl: "typy-sportowe-ai",
    sv: "ai-sport-picks",
    tr: "ai-spor-pickleri",
    ja: "ai-sports-pikku",
  },
  "ai-parlay-builder": {
    de: "ki-kombiwetten-builder",
    fr: "constructeur-combines-ia",
    it: "builder-multiple-ai",
    es: "constructor-combinadas-ia",
    "pt-br": "construtor-multiplas-ia",
    hi: "ai-parlay-nirmata",
    nl: "ai-combi-builder",
    pl: "builder-kuponow-ai",
    sv: "ai-kombinationsbyggare",
    tr: "ai-kupon-olusturucu",
    ja: "ai-parlay-sakusei",
  },
  "ai-bet-analyzer": {
    de: "ki-wettanalyse",
    fr: "analyseur-pari-ia",
    it: "analizzatore-scommesse-ai",
    es: "analizador-apuestas-ia",
    "pt-br": "analisador-apostas-ia",
    hi: "ai-bet-vishleshak",
    nl: "ai-weddenschap-analyse",
    pl: "analizator-zakladow-ai",
    sv: "ai-spelanalys",
    tr: "ai-bahis-analiz-araci",
    ja: "ai-bet-bunseki",
  },
  "best-ai-betting-app": {
    de: "beste-ki-wett-app",
    fr: "meilleure-app-paris-ia",
    it: "migliore-app-betting-ai",
    es: "mejor-app-apuestas-ia",
    "pt-br": "melhor-app-apostas-ia",
    hi: "sabse-accha-ai-betting-app",
    nl: "beste-ai-wedapp",
    pl: "najlepsza-aplikacja-ai",
    sv: "basta-ai-betting-app",
    tr: "en-iyi-ai-bahis-uygulamasi",
    ja: "saiko-ai-betting-app",
  },
  "best-ai-sports-betting-tools": {
    de: "beste-ki-sportwetten-tools",
    fr: "meilleurs-outils-paris-sportifs-ia",
    it: "migliori-tool-scommesse-ai",
    es: "mejores-herramientas-apuestas-ia",
    "pt-br": "melhores-ferramentas-apostas-ia",
    hi: "sabse-acche-ai-betting-tools",
    nl: "beste-ai-wedtools",
    pl: "najlepsze-narzedzia-ai-do-zakladow",
    sv: "basta-ai-betting-verktyg",
    tr: "en-iyi-ai-spor-bahis-araclari",
    ja: "saiko-ai-sports-bunseki-tools",
  },
  "ai-nfl-picks": {
    de: "ki-nfl-tipps",
    fr: "picks-nfl-ia",
    it: "pick-nfl-ai",
    es: "picks-nfl-ia",
    "pt-br": "picks-nfl-ia",
    hi: "ai-nfl-tips-hindi",
    nl: "ai-nfl-voorspellingen",
    pl: "typy-nfl-ai",
    sv: "ai-nfl-tips",
    tr: "ai-nfl-tahminleri",
    ja: "ai-nfl-pikku",
  },
  "nba-ai-predictions": {
    de: "nba-ki-prognosen",
    fr: "pronostics-nba-ia",
    it: "pronostici-nba-ai",
    es: "pronosticos-nba-ia",
    "pt-br": "palpites-nba-ia",
    hi: "nba-ai-bhavishyavani",
    nl: "nba-ai-voorspellingen",
    pl: "prognozy-nba-ai",
    sv: "nba-ai-prognoser",
    tr: "nba-ai-tahminleri",
    ja: "nba-ai-yosoku",
  },
  "mlb-ai-predictions": {
    de: "mlb-ki-prognosen",
    fr: "pronostics-mlb-ia",
    it: "pronostici-mlb-ai",
    es: "pronosticos-mlb-ia",
    "pt-br": "palpites-mlb-ia",
    hi: "mlb-ai-bhavishyavani",
    nl: "mlb-ai-voorspellingen",
    pl: "prognozy-mlb-ai",
    sv: "mlb-ai-prognoser",
    tr: "mlb-ai-tahminleri",
    ja: "mlb-ai-yosoku",
  },
  "nhl-ai-predictions": {
    de: "nhl-ki-prognosen",
    fr: "pronostics-nhl-ia",
    it: "pronostici-nhl-ai",
    es: "pronosticos-nhl-ia",
    "pt-br": "palpites-nhl-ia",
    hi: "nhl-ai-bhavishyavani",
    nl: "nhl-ai-voorspellingen",
    pl: "prognozy-nhl-ai",
    sv: "nhl-ai-prognoser",
    tr: "nhl-ai-tahminleri",
    ja: "nhl-ai-yosoku",
  },
  "soccer-ai-predictions": {
    de: "fussball-ki-prognosen",
    fr: "pronostics-football-ia",
    it: "pronostici-calcio-ai",
    es: "pronosticos-futbol-ia",
    "pt-br": "palpites-futebol-ia",
    hi: "football-ai-bhavishyavani",
    nl: "voetbal-ai-voorspellingen",
    pl: "prognozy-pilkarskie-ai",
    sv: "fotboll-ai-prognoser",
    tr: "futbol-ai-tahminleri",
    ja: "soccer-ai-yosoku",
  },
  "ai-player-prop-predictions": {
    de: "ki-spieler-props",
    fr: "props-joueurs-ia",
    it: "player-prop-ai",
    es: "props-jugadores-ia",
    "pt-br": "props-jogadores-ia",
    hi: "ai-player-prop-bhavishyavani",
    nl: "ai-player-props",
    pl: "typy-na-zawodnikow-ai",
    sv: "ai-spelarprops",
    tr: "ai-oyuncu-prop-tahminleri",
    ja: "ai-senshu-prop-yosoku",
  },
  "ai-underdog-picks": {
    de: "ki-aussenseiter-tipps",
    fr: "picks-outsiders-ia",
    it: "pick-underdog-ai",
    es: "picks-underdog-ia",
    "pt-br": "picks-zebra-ia",
    hi: "ai-underdog-tips",
    nl: "ai-underdog-tips",
    pl: "typy-underdog-ai",
    sv: "ai-underdog-tips",
    tr: "ai-surpriz-bahis-tahminleri",
    ja: "ai-underdog-pikku",
  },
  "ai-against-the-spread-picks": {
    de: "ki-spread-tipps",
    fr: "picks-spread-ia",
    it: "pick-spread-ai",
    es: "picks-spread-ia",
    "pt-br": "picks-spread-ia",
    hi: "ai-spread-picks",
    nl: "ai-spread-picks",
    pl: "typy-spread-ai",
    sv: "ai-spread-picks",
    tr: "ai-spread-tahminleri",
    ja: "ai-spread-pikku",
  },
  "ai-pick-of-the-day": {
    de: "ki-tipp-des-tages",
    fr: "pick-ia-du-jour",
    it: "pick-ai-del-giorno",
    es: "pick-ia-del-dia",
    "pt-br": "pick-ia-do-dia",
    hi: "aaj-ka-ai-pick",
    nl: "ai-pick-van-de-dag",
    pl: "typ-ai-dnia",
    sv: "dagens-ai-pick",
    tr: "gunun-ai-tahmini",
    ja: "kyo-no-ai-pikku",
  },
  "free-ai-sports-betting-app": {
    de: "kostenlose-ki-sportwetten-app",
    fr: "app-gratuite-paris-ia",
    it: "app-betting-ai-gratuita",
    es: "app-gratis-apuestas-ia",
    "pt-br": "app-gratis-apostas-ia",
    hi: "muft-ai-sports-betting-app",
    nl: "gratis-ai-betting-app",
    pl: "darmowa-aplikacja-ai",
    sv: "gratis-ai-betting-app",
    tr: "ucretsiz-ai-bahis-uygulamasi",
    ja: "muryo-ai-sports-bunseki-app",
  },
  "best-ai-sports-picks": {
    de: "beste-ki-sport-tipps",
    fr: "meilleurs-picks-sportifs-ia",
    it: "migliori-pick-sportivi-ai",
    es: "mejores-picks-deportivos-ia",
    "pt-br": "melhores-picks-esportivos-ia",
    hi: "sabse-acche-ai-sports-picks",
    nl: "beste-ai-sport-picks",
    pl: "najlepsze-typy-sportowe-ai",
    sv: "basta-ai-sport-picks",
    tr: "en-iyi-ai-spor-tahminleri",
    ja: "saiko-ai-sports-pikku",
  },
  "ai-betting-predictions": {
    de: "ki-wettprognosen",
    fr: "predictions-paris-ia",
    it: "previsioni-betting-ai",
    es: "predicciones-apuestas-ia",
    "pt-br": "previsoes-apostas-ia",
    hi: "ai-betting-bhavishyavani",
    nl: "ai-betting-voorspellingen",
    pl: "prognozy-zakladow-ai",
    sv: "ai-betting-prognoser",
    tr: "ai-bahis-tahminleri",
    ja: "ai-betting-yosoku",
  },
  "ai-odds-comparison": {
    de: "ki-quotenvergleich",
    fr: "comparaison-cotes-ia",
    it: "confronto-quote-ai",
    es: "comparacion-cuotas-ia",
    "pt-br": "comparacao-odds-ia",
    hi: "ai-odds-tulna",
    nl: "ai-odds-vergelijking",
    pl: "porownanie-kursow-ai",
    sv: "ai-oddsjamforelse",
    tr: "ai-oran-karsilastirmasi",
    ja: "ai-odds-hikaku",
  },
};

const copy = {
  de: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} mit ThinkBetAI`,
    description: (term: string) =>
      `${term} für Sportwetten: KI-Analyse mit Quotenvergleich, Modellwahrscheinlichkeit, FAQ und klaren Risikohinweisen ohne Gewinnversprechen.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} für ${lang.marketName}: ThinkBetAI verbindet lokale Sportnachfrage, Quoten, Modellwahrscheinlichkeiten und Risikoerklärungen in einer indexierbaren deutschen SEO-Seite.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} für ${lang.marketName}`,
        body: `${term} wird mit den wichtigsten lokalen Sportarten wie ${lang.primarySports.slice(0, 4).join(", ")} verbunden, damit die Seite mehr ist als eine direkte Übersetzung.`,
      },
      {
        heading: "Quoten, Wahrscheinlichkeit und Risiko",
        body: "Die Analyse vergleicht Marktpreise mit Modellwahrscheinlichkeit und erklärt Unsicherheit, statt sichere Gewinne zu versprechen.",
      },
      {
        heading: "Interne SEO-Verknüpfung",
        body: "Die Seite verlinkt auf den englischen Canonical-Cluster, lokale Sprachseiten, Picks, Parlay Tools und verantwortungsvolle Nutzung.",
      },
    ],
    faqs: (term: string) => [
      { question: `Was ist ${term}?`, answer: `${term} ist eine KI-gestützte Analyse-Seite für Sportrecherche, Quotenvergleich und Risikokontext.` },
      { question: "Garantiert ThinkBetAI Gewinne?", answer: "Nein. ThinkBetAI liefert Analyse und Wahrscheinlichkeiten, aber keine garantierten Sportergebnisse." },
      { question: "Ist ThinkBetAI ein Buchmacher?", answer: "Nein. ThinkBetAI platziert keine Wetten, hält keine Einsätze und betreibt kein Wettkonto." },
    ],
  },
  fr: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} avec ThinkBetAI`,
    description: (term: string) =>
      `${term} pour paris sportifs: analyse IA avec cotes, probabilité du modèle, FAQ, contexte local et notes de risque sans promesse de gain.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} pour ${lang.marketName}: ThinkBetAI combine demande sportive locale, cotes, probabilités de modèle et explications du risque dans une page SEO en français.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} pour ${lang.marketName}`,
        body: `${term} est relié aux sports locaux comme ${lang.primarySports.slice(0, 4).join(", ")} afin de créer une vraie page de recherche, pas une copie générique.`,
      },
      {
        heading: "Cotes, probabilité et risque",
        body: "La page compare les prix du marché avec l'estimation du modèle et explique l'incertitude sans promettre de résultat.",
      },
      {
        heading: "Maillage SEO interne",
        body: "La page renvoie vers le cluster anglais, les pages linguistiques, les picks IA, les outils de combinés et les pages de confiance.",
      },
    ],
    faqs: (term: string) => [
      { question: `Qu'est-ce que ${term} ?`, answer: `${term} est une page d'analyse IA pour comprendre les probabilités, les cotes et le risque sportif.` },
      { question: "ThinkBetAI garantit-il des gains ?", answer: "Non. Les prédictions peuvent perdre et doivent rester un outil de recherche." },
      { question: "ThinkBetAI est-il un bookmaker ?", answer: "Non. ThinkBetAI ne prend pas de paris et ne détient pas de fonds utilisateur." },
    ],
  },
  it: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} con ThinkBetAI`,
    description: (term: string) =>
      `${term} per scommesse sportive: analisi AI con quote, probabilità del modello, FAQ, contesto locale e note di rischio senza garanzie.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} per ${lang.marketName}: ThinkBetAI unisce sport locali, quote, probabilità del modello e spiegazioni del rischio in una pagina SEO italiana.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} per ${lang.marketName}`,
        body: `${term} viene collegato a sport come ${lang.primarySports.slice(0, 4).join(", ")} per intercettare ricerca locale reale.`,
      },
      {
        heading: "Quote, probabilità e rischio",
        body: "La pagina confronta quota di mercato e probabilità AI, chiarendo sempre che non esistono risultati garantiti.",
      },
      {
        heading: "Cluster SEO interno",
        body: "I link portano verso guide, pick, parlay builder, confronto strumenti e pagine di responsabilità.",
      },
    ],
    faqs: (term: string) => [
      { question: `Che cos'è ${term}?`, answer: `${term} è una pagina di analisi AI per leggere quote, probabilità e rischio prima di decidere.` },
      { question: "ThinkBetAI garantisce vincite?", answer: "No. L'analisi AI può sbagliare e non garantisce profitti." },
      { question: "ThinkBetAI è un bookmaker?", answer: "No. ThinkBetAI non accetta scommesse e non gestisce fondi." },
    ],
  },
  es: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} con ThinkBetAI`,
    description: (term: string) =>
      `${term} para apuestas deportivas: análisis IA con cuotas, probabilidad del modelo, FAQ, contexto local y notas de riesgo sin garantías.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} para ${lang.marketName}: ThinkBetAI combina deportes locales, cuotas, probabilidad del modelo y riesgo en una página SEO en español.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} para ${lang.marketName}`,
        body: `${term} se conecta con deportes como ${lang.primarySports.slice(0, 4).join(", ")} para responder búsquedas reales del mercado.`,
      },
      {
        heading: "Cuotas, probabilidad y riesgo",
        body: "La página compara la cuota del mercado con la probabilidad estimada por el modelo y evita promesas de ganancia.",
      },
      {
        heading: "Enlaces SEO internos",
        body: "El contenido enlaza a guías, picks, herramientas de parlay, comparaciones y páginas de juego responsable.",
      },
    ],
    faqs: (term: string) => [
      { question: `¿Qué es ${term}?`, answer: `${term} es una página de análisis IA para revisar cuotas, probabilidad y riesgo deportivo.` },
      { question: "¿ThinkBetAI garantiza ganancias?", answer: "No. Ningún modelo puede garantizar resultados deportivos o beneficios." },
      { question: "¿ThinkBetAI es una casa de apuestas?", answer: "No. ThinkBetAI no acepta apuestas ni maneja fondos de usuarios." },
    ],
  },
  "pt-br": {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} com ThinkBetAI`,
    description: (term: string) =>
      `${term} para apostas esportivas: análise com IA, odds, probabilidade do modelo, FAQ, contexto local e notas de risco sem garantia.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} para ${lang.marketName}: ThinkBetAI junta esportes locais, odds, probabilidade do modelo e risco em uma página SEO em português.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} para ${lang.marketName}`,
        body: `${term} é conectado a esportes como ${lang.primarySports.slice(0, 4).join(", ")} para cobrir intenção local de busca.`,
      },
      {
        heading: "Odds, probabilidade e risco",
        body: "A página compara odds de mercado com a estimativa do modelo e deixa claro que não há resultado garantido.",
      },
      {
        heading: "Cluster interno de SEO",
        body: "Os links levam para guias, picks, parlay builder, comparações e páginas de uso responsável.",
      },
    ],
    faqs: (term: string) => [
      { question: `O que é ${term}?`, answer: `${term} é uma página de análise com IA para revisar odds, probabilidade e risco esportivo.` },
      { question: "ThinkBetAI garante lucro?", answer: "Não. A análise pode errar e não garante resultado." },
      { question: "ThinkBetAI é casa de apostas?", answer: "Não. ThinkBetAI não aceita apostas nem guarda dinheiro de usuários." },
    ],
  },
  hi: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} ThinkBetAI के साथ`,
    description: (term: string) =>
      `${term} हिंदी में: odds context, model probability, local sports, FAQ और साफ risk notes के साथ AI sports analysis, बिना result guarantee.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} ${lang.marketName} के लिए: ThinkBetAI cricket-first demand, odds, model probability और risk notes को हिंदी SEO पेज में जोड़ता है.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} - ${lang.marketName}`,
        body: `${term} को ${lang.primarySports.slice(0, 4).join(", ")} जैसे sports से जोड़ा गया है ताकि पेज real local search intent target करे.`,
      },
      {
        heading: "Odds, probability और risk",
        body: "यह पेज market odds को model probability से compare करता है और जीत का वादा किए बिना risk समझाता है.",
      },
      {
        heading: "Internal SEO cluster",
        body: "Content guides, picks, parlay tools, comparison pages और responsible-use resources से link करता है.",
      },
    ],
    faqs: (term: string) => [
      { question: `${term} क्या है?`, answer: `${term} sports odds, probability और risk context के लिए AI analysis page है.` },
      { question: "क्या ThinkBetAI results guarantee करता है?", answer: "नहीं. AI analysis गलत हो सकता है और इसे सिर्फ research की तरह use करना चाहिए." },
      { question: "क्या ThinkBetAI bookmaker है?", answer: "नहीं. ThinkBetAI bets accept नहीं करता, funds hold नहीं करता और betting accounts operate नहीं करता." },
    ],
  },
  nl: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} met ThinkBetAI`,
    description: (term: string) =>
      `${term} voor sportweddenschappen: AI analyse met odds, modelkansen, FAQ, lokale sportcontext en risiconotities zonder garantie.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} voor ${lang.marketName}: ThinkBetAI combineert lokale sporten, odds, modelkansen en risico in een Nederlandse SEO-pagina.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} voor ${lang.marketName}`,
        body: `${term} wordt gekoppeld aan sporten zoals ${lang.primarySports.slice(0, 4).join(", ")} voor echte lokale zoekintentie.`,
      },
      {
        heading: "Odds, kans en risico",
        body: "De pagina vergelijkt marktkansen met modelkansen en belooft geen gegarandeerde winst.",
      },
      {
        heading: "Interne SEO-cluster",
        body: "Links verbinden deze pagina met guides, picks, parlay tools, vergelijkingen en verantwoord gebruik.",
      },
    ],
    faqs: (term: string) => [
      { question: `Wat is ${term}?`, answer: `${term} is een AI-analysepagina voor odds, kansinschatting en sportrisico.` },
      { question: "Garandeert ThinkBetAI winst?", answer: "Nee. AI-analyse is onderzoek en geen garantie." },
      { question: "Is ThinkBetAI een bookmaker?", answer: "Nee. ThinkBetAI neemt geen weddenschappen aan en houdt geen geld vast." },
    ],
  },
  pl: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} z ThinkBetAI`,
    description: (term: string) =>
      `${term} dla zakładów sportowych: analiza AI, kursy, prawdopodobieństwo modelu, FAQ, lokalny kontekst i ryzyko bez gwarancji.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} dla ${lang.marketName}: ThinkBetAI łączy lokalne sporty, kursy, prawdopodobieństwo modelu i ryzyko w polskiej stronie SEO.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} dla ${lang.marketName}`,
        body: `${term} jest połączone ze sportami takimi jak ${lang.primarySports.slice(0, 4).join(", ")}, aby odpowiadać na lokalne intencje wyszukiwania.`,
      },
      {
        heading: "Kursy, prawdopodobieństwo i ryzyko",
        body: "Strona porównuje kursy rynkowe z prawdopodobieństwem modelu i nie obiecuje wygranych.",
      },
      {
        heading: "Wewnętrzny klaster SEO",
        body: "Linki prowadzą do przewodników, typów, narzędzi parlay, porównań i odpowiedzialnej gry.",
      },
    ],
    faqs: (term: string) => [
      { question: `Czym jest ${term}?`, answer: `${term} to strona analizy AI dla kursów, prawdopodobieństwa i ryzyka sportowego.` },
      { question: "Czy ThinkBetAI gwarantuje wygraną?", answer: "Nie. Analiza AI może się mylić i nie gwarantuje wyników." },
      { question: "Czy ThinkBetAI jest bukmacherem?", answer: "Nie. ThinkBetAI nie przyjmuje zakładów ani środków użytkowników." },
    ],
  },
  sv: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} med ThinkBetAI`,
    description: (term: string) =>
      `${term} för sportspel: AI analys med odds, modellens sannolikhet, FAQ, lokal sportkontext och risknotiser utan vinstgaranti.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} för ${lang.marketName}: ThinkBetAI kombinerar lokala sporter, odds, modellens sannolikhet och risk i en svensk SEO-sida.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} för ${lang.marketName}`,
        body: `${term} kopplas till sporter som ${lang.primarySports.slice(0, 4).join(", ")} för att möta verklig lokal sökintention.`,
      },
      {
        heading: "Odds, sannolikhet och risk",
        body: "Sidan jämför marknadsodds med modellens sannolikhet och lovar aldrig säkra vinster.",
      },
      {
        heading: "Intern SEO-kluster",
        body: "Länkar leder till guider, picks, parlay-verktyg, jämförelser och ansvarstagande användning.",
      },
    ],
    faqs: (term: string) => [
      { question: `Vad är ${term}?`, answer: `${term} är en AI-analys för odds, sannolikhet och sportrisk.` },
      { question: "Garanterar ThinkBetAI vinst?", answer: "Nej. AI-analys är research och ingen garanti." },
      { question: "Är ThinkBetAI ett spelbolag?", answer: "Nej. ThinkBetAI tar inte emot spel och håller inga pengar." },
    ],
  },
  tr: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term} ve ThinkBetAI`,
    description: (term: string) =>
      `${term} için yapay zeka spor analizi: oranlar, model olasılığı, SSS, yerel spor bağlamı ve risk notları, garanti yok.`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term} için ${lang.marketName}: ThinkBetAI yerel sporları, oranları, model olasılığını ve riski Türkçe SEO sayfasında birleştirir.`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType} - ${lang.marketName}`,
        body: `${term}, ${lang.primarySports.slice(0, 4).join(", ")} gibi sporlarla bağlanarak yerel arama niyetini hedefler.`,
      },
      {
        heading: "Oran, olasılık ve risk",
        body: "Sayfa piyasa oranlarını model olasılığıyla karşılaştırır ve kesin kazanç vadetmez.",
      },
      {
        heading: "İç SEO kümesi",
        body: "Linkler rehberlere, pick sayfalarına, parlay araçlarına, karşılaştırmalara ve sorumlu kullanım kaynaklarına gider.",
      },
    ],
    faqs: (term: string) => [
      { question: `${term} nedir?`, answer: `${term}, oran, olasılık ve spor riski için AI analiz sayfasıdır.` },
      { question: "ThinkBetAI kazanç garantiler mi?", answer: "Hayır. AI analizi yanılabilir ve garanti değildir." },
      { question: "ThinkBetAI bahis sitesi mi?", answer: "Hayır. ThinkBetAI bahis kabul etmez ve para tutmaz." },
    ],
  },
  ja: {
    title: (term: string) => `${term} | ThinkBetAI`,
    h1: (term: string) => `${term}とThinkBetAI`,
    description: (term: string) =>
      `${term}の日本語AIスポーツ分析。オッズ、モデル確率、FAQ、地域スポーツ文脈、リスク説明を整理し、結果保証ではない調査材料を提供します。`,
    intro: (term: string, lang: LanguagePageConfig) =>
      `${term}を${lang.marketName}向けに整理し、ThinkBetAIがスポーツ関心、オッズ、モデル確率、リスク説明を日本語SEOページとして提供します。`,
    modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => [
      {
        heading: `${topic.marketType}と${lang.marketName}`,
        body: `${term}を${lang.primarySports.slice(0, 4).join("、")}などのスポーツ文脈に結び付け、実際の検索意図に合わせます。`,
      },
      {
        heading: "オッズ、確率、リスク",
        body: "市場オッズとモデル確率を比較し、的中や利益を保証せずに不確実性を説明します。",
      },
      {
        heading: "内部SEOクラスター",
        body: "ガイド、AIピック、パーレーツール、比較ページ、責任ある利用ページへ自然にリンクします。",
      },
    ],
    faqs: (term: string) => [
      { question: `${term}とは何ですか？`, answer: `${term}はオッズ、確率、スポーツリスクを整理するAI分析ページです。` },
      { question: "ThinkBetAIは結果を保証しますか？", answer: "いいえ。AI分析は調査材料であり、結果を保証しません。" },
      { question: "ThinkBetAIはブックメーカーですか？", answer: "いいえ。ThinkBetAIは賭けを受け付けず、資金も預かりません。" },
    ],
  },
} satisfies Record<LanguageSlug, {
  title: (term: string) => string;
  h1: (term: string) => string;
  description: (term: string) => string;
  intro: (term: string, lang: LanguagePageConfig) => string;
  modules: (term: string, topic: TopicTerms, lang: LanguagePageConfig) => Array<{ heading: string; body: string }>;
  faqs: (term: string) => Array<{ question: string; answer: string }>;
}>;

const cleanDescription = (value: string) => {
  if (value.length <= 158) return value;
  return `${value.slice(0, 155).replace(/\s+\S*$/, "")}.`;
};

const buildPage = (language: LanguagePageConfig, topic: TopicTerms): LocalizedSeoPage => {
  const term = topic.terms[language.slug];
  const languageCopy = copy[language.slug];
  const localizedTopic = { ...topic, marketType: term };
  const localizedSlug = localizedTopicSlugs[topic.slug][language.slug];
  const path = `/${language.slug}/${localizedSlug}` as const;
  const legacyPath = `/${language.slug}/${topic.slug}` as const;
  const labelSource = localizedUiLabels[language.slug];
  const labels: LocalizedSeoLabels = {
    ...labelSource,
    softwareDescription: labelSource.softwareDescription(term),
  };
  const relatedTopics = localizedSeoTopics
    .filter((candidate) => candidate.slug !== topic.slug)
    .slice(0, 12)
    .map((candidate) => ({
      label: candidate.terms[language.slug],
      href: `/${language.slug}/${localizedTopicSlugs[candidate.slug][language.slug]}`,
    }));

  return {
    languageSlug: language.slug,
    topicSlug: topic.slug,
    localizedSlug,
    path,
    legacyPath,
    englishPath: `/${topic.slug}`,
    hrefLang: language.hrefLang,
    htmlLang: language.htmlLang,
    languageName: language.languageName,
    marketName: language.marketName,
    currency: language.currency,
    term,
    englishLabel: topic.englishLabel,
    marketType: localizedTopic.marketType,
    title: `${term} ${language.marketName} | ThinkBetAI`,
    description: cleanDescription(languageCopy.description(term)),
    h1: languageCopy.h1(term),
    intro: languageCopy.intro(term, language),
    keywords: `${language.keywords}, ${term}, ${topic.englishLabel}`,
    primarySports: language.primarySports,
    modules: languageCopy.modules(term, localizedTopic, language),
    faqs: languageCopy.faqs(term),
    links: [
      { label: labels.englishCanonical, href: `/${topic.slug}` },
      { label: labels.languageHub, href: language.path },
      { label: labels.primaryCta, href: "/ai-sports-picks" },
      { label: language.labels.secondaryCta, href: "/ai-sports-betting" },
      { label: labels.responsibleGambling, href: "/responsible-gambling" },
      ...relatedTopics,
    ],
    alternates: [
      { hrefLang: "x-default", href: `${BASE}/${topic.slug}` },
      { hrefLang: "en-US", href: `${BASE}/${topic.slug}` },
      ...languagePageList.map((entry) => ({
        hrefLang: entry.hrefLang,
        href: `${BASE}/${entry.slug}/${localizedTopicSlugs[topic.slug][entry.slug]}`,
      })),
    ],
    labels,
  };
};

export const localizedMoneyPageList: LocalizedSeoPage[] = languagePageList.flatMap((language) =>
  localizedSeoTopics.map((topic) => buildPage(language, topic)),
);

export const localizedMoneyPagePaths: Set<string> = new Set(localizedMoneyPageList.map((page) => page.path));

export const localizedMoneyPageRedirects = localizedMoneyPageList
  .filter((page) => page.legacyPath !== page.path)
  .map((page) => ({
    source: page.legacyPath,
    target: page.path,
  }));

export const getLocalizedMoneyPage = (
  languageSlug: LanguageSlug,
  topicSlug: LocalizedSeoTopicSlug,
) => localizedMoneyPageList.find(
  (page) => page.languageSlug === languageSlug && page.topicSlug === topicSlug,
);

export const getLocalizedMoneyPageAlternates = (path: string) =>
  localizedMoneyPageList.find((page) => page.path === path)?.alternates ?? globalMarketAlternates;
