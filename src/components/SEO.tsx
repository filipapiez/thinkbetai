import { useContext, useEffect } from 'react';
import { NoIndexContext } from '@/contexts/NoIndexContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  canonical?: string;
  alternates?: Array<{ hrefLang: string; href: string }>;
  htmlLang?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  structuredData?: Record<string, unknown>;
  noIndex?: boolean;
}

const defaultTitle = 'ThinkBetAI — AI Sports Betting Analytics & Predictions';
const defaultDescription = 'AI-powered sports betting analytics with a transparent track record. Model-driven picks and matchup context for NFL, NBA, MLB, NHL, UFC and soccer. Not financial advice.';
const defaultKeywords = 'AI sports betting, AI betting analytics, AI sports predictions, sports betting model, AI picks';
const defaultImage = 'https://thinkbetai.com/og-image.png';
const siteUrl = 'https://thinkbetai.com';

export const SEO = ({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  image = defaultImage,
  url,
  canonical,
  alternates,
  htmlLang,
  type = 'website',
  author,
  publishedTime,
  structuredData,
  noIndex,
}: SEOProps) => {
  const inheritedNoIndex = useContext(NoIndexContext);
  const effectiveNoIndex = noIndex || inheritedNoIndex;
  const fullTitle = title ? (title.includes('ThinkBetAI') ? title : `${title} | ThinkBetAI`) : defaultTitle;
  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value)
      ? value
      : `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
  const fullUrl = url ? toAbsoluteUrl(url) : `${siteUrl}/`;
  const canonicalUrl = canonical ? toAbsoluteUrl(canonical) : fullUrl;
  const alternateEntries = (alternates ?? []).map((entry) => ({
    hrefLang: entry.hrefLang,
    href: toAbsoluteUrl(entry.href),
  }));
  const alternateEntriesJson = JSON.stringify(alternateEntries);
  const fallbackStructuredData: Record<string, unknown> | undefined = effectiveNoIndex
    ? undefined
    : {
        '@context': 'https://schema.org',
        '@type': fullUrl === `${siteUrl}/` ? 'WebSite' : type === 'article' ? 'Article' : 'WebPage',
        name: fullTitle,
        headline: type === 'article' ? fullTitle : undefined,
        description,
        url: canonicalUrl,
        mainEntityOfPage: type === 'article' ? canonicalUrl : undefined,
        author: type === 'article' && author ? { '@type': 'Organization', name: author } : undefined,
        datePublished: type === 'article' ? publishedTime : undefined,
        isPartOf: type !== 'article' ? { '@type': 'WebSite', name: 'ThinkBetAI', url: `${siteUrl}/` } : undefined,
      };
  const structuredDataJson = JSON.stringify(structuredData ?? fallbackStructuredData ?? '');

  useEffect(() => {
    const upsertMeta = (attribute: 'name' | 'property', key: string, content?: string) => {
      const selector = `meta[${attribute}="${key}"]`;
      const existing = document.head.querySelector<HTMLMetaElement>(selector);

      if (!content) {
        existing?.remove();
        return;
      }

      const meta = existing ?? document.createElement('meta');
      meta.setAttribute(attribute, key);
      meta.content = content;
      if (!existing) document.head.appendChild(meta);
    };

    document.title = fullTitle;
    document.documentElement.lang = htmlLang || 'en';
    upsertMeta('name', 'title', fullTitle);
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);
    upsertMeta(
      'name',
      'robots',
      effectiveNoIndex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', fullUrl);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:site_name', 'ThinkBetAI');

    upsertMeta('property', 'twitter:card', 'summary_large_image');
    upsertMeta('property', 'twitter:url', fullUrl);
    upsertMeta('property', 'twitter:title', fullTitle);
    upsertMeta('property', 'twitter:description', description);
    upsertMeta('property', 'twitter:image', image);

    upsertMeta('property', 'article:author', type === 'article' ? author : undefined);
    upsertMeta('property', 'article:published_time', type === 'article' ? publishedTime : undefined);

    const existingCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonicalLink = existingCanonical ?? document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonicalUrl;
    if (!existingCanonical) document.head.appendChild(canonicalLink);

    document.head
      .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][data-thinkbetai-alternate="true"]')
      .forEach((link) => link.remove());

    const parsedAlternateEntries = JSON.parse(alternateEntriesJson) as Array<{ hrefLang: string; href: string }>;

    for (const entry of parsedAlternateEntries) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = entry.hrefLang;
      link.href = entry.href;
      link.dataset.thinkbetaiAlternate = 'true';
      document.head.appendChild(link);
    }

    const schemaId = 'thinkbetai-page-schema';
    const existingSchema = document.head.querySelector<HTMLScriptElement>(`#${schemaId}`);
    if (structuredDataJson && structuredDataJson !== '""') {
      const schema = existingSchema ?? document.createElement('script');
      schema.id = schemaId;
      schema.type = 'application/ld+json';
      schema.textContent = structuredDataJson;
      if (!existingSchema) document.head.appendChild(schema);
    } else {
      existingSchema?.remove();
    }
  }, [
    author,
    alternateEntriesJson,
    canonicalUrl,
    description,
    fullTitle,
    fullUrl,
    htmlLang,
    image,
    keywords,
    effectiveNoIndex,
    publishedTime,
    structuredDataJson,
    type,
  ]);

  return null;
};
