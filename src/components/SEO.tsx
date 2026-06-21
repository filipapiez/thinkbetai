import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  canonical?: string;
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
  type = 'website',
  author,
  publishedTime,
  structuredData,
  noIndex,
}: SEOProps) => {
  const fullTitle = title ? (title.includes('ThinkBetAI') ? title : `${title} | ThinkBetAI`) : defaultTitle;
  const toAbsoluteUrl = (value: string) =>
    /^https?:\/\//i.test(value)
      ? value
      : `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
  const fullUrl = url ? toAbsoluteUrl(url) : `${siteUrl}/`;
  const canonicalUrl = canonical ? toAbsoluteUrl(canonical) : fullUrl;
  const structuredDataJson = structuredData ? JSON.stringify(structuredData) : '';

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
    upsertMeta('name', 'title', fullTitle);
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);
    upsertMeta(
      'name',
      'robots',
      noIndex
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

    const schemaId = 'thinkbetai-page-schema';
    const existingSchema = document.head.querySelector<HTMLScriptElement>(`#${schemaId}`);
    if (structuredDataJson) {
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
    canonicalUrl,
    description,
    fullTitle,
    fullUrl,
    image,
    keywords,
    noIndex,
    publishedTime,
    structuredDataJson,
    type,
  ]);

  return null;
};
