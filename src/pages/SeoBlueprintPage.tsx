import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { SeoBlueprintRenderer } from "@/components/seo/SeoBlueprintRenderer";
import { getSeoBlueprint, type SeoBlueprint } from "@/seo/blueprints";

const SITE_URL = "https://thinkbetai.com";

const buildStructuredData = (blueprint: SeoBlueprint) => {
  const url = `${SITE_URL}${blueprint.canonical}`;
  const graph = [
    {
      "@type": "WebPage",
      name: blueprint.h1,
      headline: blueprint.heroHeadline,
      description: blueprint.description,
      url,
      mainEntityOfPage: url,
      keywords: [blueprint.primaryKeyword, ...blueprint.secondaryKeywords].join(", "),
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "SoftwareApplication",
      name: "ThinkBetAI",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "AI sports betting analysis platform for predictions, picks, bet analysis and parlay research.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free prediction previews with account upgrade options",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: blueprint.faq.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: blueprint.h1, item: url },
      ],
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
};

interface SeoBlueprintPageProps {
  slug: string;
}

const SeoBlueprintPage = ({ slug }: SeoBlueprintPageProps) => {
  const blueprint = getSeoBlueprint(slug);

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20">
          <h1 className="text-3xl font-bold">SEO page not found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={blueprint.title}
        description={blueprint.description}
        keywords={[blueprint.primaryKeyword, ...blueprint.secondaryKeywords].join(", ")}
        url={blueprint.canonical}
        canonical={blueprint.canonical}
        structuredData={buildStructuredData(blueprint)}
      />
      <Header />
      <main>
        <SeoBlueprintRenderer blueprint={blueprint} />
      </main>
      <Footer />
    </div>
  );
};

export default SeoBlueprintPage;
